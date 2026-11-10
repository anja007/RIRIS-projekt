import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User';
import { Hairdresser } from '../models/Hairdresser';
import { Service } from '../models/Service';
import { asyncHandler, HttpError } from '../lib/errors';
import { objectId, personSchema, timeString } from '../lib/validation';
import { toMinutes } from '../lib/time';
import { requireAuth, requireRole } from '../middleware/auth';
import { EMAIL_TAKEN } from './auth';

export const adminHairdressersRouter = Router();
adminHairdressersRouter.use(requireAuth, requireRole('ADMIN'));

async function loadDto(hairdresserId: unknown) {
  const h = await Hairdresser.findById(hairdresserId).populate('userId').lean();
  if (!h) throw new HttpError(404, 'Frizer ne obstaja');
  return toDto(h);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDto(h: any) {
  return {
    id: String(h._id),
    active: h.active,
    firstName: h.userId?.firstName ?? '',
    lastName: h.userId?.lastName ?? '',
    email: h.userId?.email ?? '',
    phone: h.userId?.phone ?? '',
    serviceIds: (h.serviceIds ?? []).map(String),
    workingHours: (h.workingHours ?? []).map((w: { weekday: number; startTime: string; endTime: string }) => ({
      weekday: w.weekday,
      startTime: w.startTime,
      endTime: w.endTime,
    })),
  };
}

adminHairdressersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const list = await Hairdresser.find().populate('userId').lean();
    res.json(list.map(toDto).sort((a, b) => a.firstName.localeCompare(b.firstName, 'sl')));
  }),
);

// US-03: administrator ustvari račun frizerja; users in hairdressers v eni transakciji.
adminHairdressersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = personSchema.parse(req.body);
    if (await User.exists({ email: data.email })) {
      throw new HttpError(409, EMAIL_TAKEN, { email: EMAIL_TAKEN });
    }
    const passwordHash = await bcrypt.hash(data.password, 10);

    const session = await mongoose.startSession();
    let hairdresserId: unknown;
    try {
      await session.withTransaction(async () => {
        const [user] = await User.create(
          [
            {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              passwordHash,
              role: 'HAIRDRESSER',
            },
          ],
          { session },
        );
        const [hairdresser] = await Hairdresser.create([{ userId: user._id, active: true }], { session });
        hairdresserId = hairdresser._id;
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json(await loadDto(hairdresserId));
  }),
);

// US-05: storitve, ki jih frizer opravlja.
const servicesSchema = z.object({
  serviceIds: z.array(objectId).min(1, 'Obkljukajte vsaj eno storitev'),
});

adminHairdressersRouter.put(
  '/:id/services',
  asyncHandler(async (req, res) => {
    const id = objectId.parse(req.params.id);
    const { serviceIds } = servicesSchema.parse(req.body);
    const unique = [...new Set(serviceIds)];
    const found = await Service.countDocuments({ _id: { $in: unique } });
    if (found !== unique.length) throw new HttpError(400, 'Ena od izbranih storitev ne obstaja');

    // Obstoječi termini ostanejo nespremenjeni (US-05, kriterij 4).
    const updated = await Hairdresser.findByIdAndUpdate(id, { serviceIds: unique });
    if (!updated) throw new HttpError(404, 'Frizer ne obstaja');
    res.json(await loadDto(id));
  }),
);

// US-06: tedenski delovni čas z več intervali na dan.
const workingHoursSchema = z.object({
  workingHours: z.array(
    z.object({
      weekday: z.number().int().min(1).max(7),
      startTime: timeString,
      endTime: timeString,
    }),
  ),
});

const DAY_NAMES = ['', 'ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

export function validateWorkingHours(hours: { weekday: number; startTime: string; endTime: string }[]) {
  for (let day = 1; day <= 7; day++) {
    const intervals = hours
      .filter((w) => w.weekday === day)
      .map((w) => ({ start: toMinutes(w.startTime), end: toMinutes(w.endTime), label: `${w.startTime}–${w.endTime}` }))
      .sort((a, b) => a.start - b.start);

    for (const i of intervals) {
      if (i.end <= i.start) {
        throw new HttpError(400, `${DAY_NAMES[day]}: interval ${i.label} se mora končati po začetku`);
      }
    }
    for (let k = 1; k < intervals.length; k++) {
      if (intervals[k].start < intervals[k - 1].end) {
        throw new HttpError(400, `${DAY_NAMES[day]}: intervala ${intervals[k - 1].label} in ${intervals[k].label} se prekrivata`);
      }
    }
  }
}

adminHairdressersRouter.put(
  '/:id/working-hours',
  asyncHandler(async (req, res) => {
    const id = objectId.parse(req.params.id);
    const { workingHours } = workingHoursSchema.parse(req.body);
    validateWorkingHours(workingHours);

    // Obstoječi termini se ne prestavijo in ne prekličejo (US-06, kriterij 4).
    const sorted = [...workingHours].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
    const updated = await Hairdresser.findByIdAndUpdate(id, { workingHours: sorted });
    if (!updated) throw new HttpError(404, 'Frizer ne obstaja');
    res.json(await loadDto(id));
  }),
);
