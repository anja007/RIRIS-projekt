import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Appointment } from '../models/Appointment';
import { Client } from '../models/Client';
import { Service } from '../models/Service';
import { asyncHandler, HttpError } from '../lib/errors';
import { currentHairdresser } from '../lib/current';
import { addDays, isoWeekday, parseDateKey, toDateKey } from '../lib/time';
import { dateString, objectId } from '../lib/validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const hairdresserRouter = Router();
hairdresserRouter.use(requireAuth, requireRole('HAIRDRESSER'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scheduleDto(a: any) {
  const user = a.clientId?.userId;
  return {
    id: String(a._id),
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    clientName: user ? `${user.firstName} ${user.lastName}` : '',
    clientPhone: user?.phone ?? '',
    clientNoShowCount: a.clientId?.noShowCount ?? 0,
    serviceName: a.serviceId?.name ?? '',
    clientNote: a.clientNote ?? '',
    cancellationReason: a.cancellationReason ?? '',
  };
}

/** Termin prijavljenega frizerja; tuj termin vrne 403 (US-10, kriterij 4). */
async function ownAppointment(req: Parameters<typeof currentHairdresser>[0]) {
  const hairdresser = await currentHairdresser(req);
  const id = objectId.parse(req.params.id);
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new HttpError(404, 'Termin ne obstaja');
  if (String(appointment.hairdresserId) !== String(hairdresser._id)) throw new HttpError(403, 'Dostop ni dovoljen');
  return appointment;
}

// Frizer vidi svoj delovni čas in storitve, ne more pa jih spreminjati (US-06, kriterij 5).
hairdresserRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const hairdresser = await currentHairdresser(req);
    const services = await Service.find({ _id: { $in: hairdresser.serviceIds } }).sort({ name: 1 }).lean();
    res.json({
      workingHours: hairdresser.workingHours.map((w) => ({ weekday: w.weekday, startTime: w.startTime, endTime: w.endTime })),
      services: services.map((s) => ({ id: String(s._id), name: s.name, durationMin: s.durationMin })),
    });
  }),
);

// US-11: dnevni urnik
hairdresserRouter.get(
  '/schedule',
  asyncHandler(async (req, res) => {
    const hairdresser = await currentHairdresser(req);
    const date = dateString.parse(req.query.date ?? toDateKey(new Date()));
    const day = parseDateKey(date);
    const appointments = await Appointment.find({
      hairdresserId: hairdresser._id,
      startsAt: { $gte: day, $lt: addDays(day, 1) },
    })
      .sort({ startsAt: 1 })
      .populate([
        { path: 'serviceId', select: 'name' },
        { path: 'clientId', select: 'userId noShowCount', populate: { path: 'userId', select: 'firstName lastName phone' } },
      ])
      .lean();

    const weekday = isoWeekday(day);
    res.json({
      date,
      workingHours: hairdresser.workingHours
        .filter((w) => w.weekday === weekday)
        .map((w) => ({ startTime: w.startTime, endTime: w.endTime })),
      appointments: appointments.map(scheduleDto),
    });
  }),
);

// US-10: preklic s strani frizerja, z obveznim razlogom, tudi manj kot 24 ur prej
const cancelSchema = z.object({
  reason: z.string({ required_error: 'Vnesite razlog' }).trim().min(1, 'Vnesite razlog'),
});

hairdresserRouter.post(
  '/appointments/:id/cancel',
  asyncHandler(async (req, res) => {
    const { reason } = cancelSchema.parse(req.body);
    const appointment = await ownAppointment(req);
    if (appointment.status !== 'CONFIRMED') throw new HttpError(409, 'Preklicati je mogoče samo potrjen termin');
    if (appointment.startsAt.getTime() <= Date.now()) throw new HttpError(409, 'Preklicati je mogoče samo prihodnji termin');
    appointment.status = 'CANCELLED';
    appointment.cancellationReason = reason;
    await appointment.save();
    res.json({ id: String(appointment._id), status: appointment.status, cancellationReason: reason });
  }),
);

// US-11: izid termina; »Neprihod« poveča noShowCount stranke
const outcomeSchema = z.object({
  status: z.enum(['COMPLETED', 'NO_SHOW'], { errorMap: () => ({ message: 'Izberite »Zaključen« ali »Neprihod«' }) }),
});

hairdresserRouter.post(
  '/appointments/:id/outcome',
  asyncHandler(async (req, res) => {
    const { status } = outcomeSchema.parse(req.body);
    const appointment = await ownAppointment(req);
    if (appointment.startsAt.getTime() > Date.now()) {
      throw new HttpError(409, 'Izid lahko označite šele, ko se termin začne');
    }
    if (appointment.status !== 'CONFIRMED') {
      throw new HttpError(409, 'Izid je že nastavljen');
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // pogoj status: CONFIRMED prepreči dvojno označevanje
        const updated = await Appointment.updateOne({ _id: appointment._id, status: 'CONFIRMED' }, { status }, { session });
        if (updated.modifiedCount !== 1) throw new HttpError(409, 'Izid je že nastavljen');
        if (status === 'NO_SHOW') {
          await Client.updateOne({ _id: appointment.clientId }, { $inc: { noShowCount: 1 } }, { session });
        }
      });
    } finally {
      await session.endSession();
    }
    res.json({ id: String(appointment._id), status });
  }),
);
