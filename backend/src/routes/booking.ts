import { Router, type Request } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment';
import { Hairdresser } from '../models/Hairdresser';
import { Service } from '../models/Service';
import { asyncHandler, HttpError } from '../lib/errors';
import { currentClient } from '../lib/current';
import { addDays, parseDateKey, toDateKey } from '../lib/time';
import { minutesToTime } from '../lib/slots';
import { dateString, objectId } from '../lib/validation';
import { optionalAuth } from '../middleware/auth';
import { bookableHairdressers, freeSlots, workingIntervalsFor, type BookableHairdresser } from '../services/availability';

// Podatki za čarovnik za rezervacijo (US-07). Javno: gost vidi proste termine,
// za potrditev rezervacije (POST /api/appointments) pa se mora prijaviti (US-07, kriterij 6).
export const bookingRouter = Router();
bookingRouter.use(optionalAuth);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nameOf = (h: any) => `${h.userId?.firstName ?? ''} ${h.userId?.lastName ?? ''}`.trim();

// Aktivni frizerji z delovnim časom; »offers« pove, ali izbrano storitev opravljajo.
// Čarovnik prikaže tudi ostale, a onemogočene (US-05, kriterij 3; US-07, kriterij 1).
bookingRouter.get(
  '/hairdressers',
  asyncHandler(async (req, res) => {
    const serviceId = objectId.parse(req.query.serviceId);
    const list = await Hairdresser.find({ active: true, 'workingHours.0': { $exists: true } })
      .populate('userId', 'firstName lastName')
      .lean();
    res.json(
      list
        .map((h) => ({
          id: String(h._id),
          name: nameOf(h),
          offers: (h.serviceIds ?? []).some((id) => String(id) === serviceId),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'sl')),
    );
  }),
);

const querySchema = z.object({
  serviceId: objectId.optional(),
  hairdresserId: z.union([z.literal('any'), objectId]).optional(),
  // pri prestavitvi: termin, ki ga prestavljamo (isti frizer, ista dolžina)
  appointmentId: objectId.optional(),
});

/**
 * Določi frizerje in trajanje za izračun.
 * - nova rezervacija: storitev + frizer ali »any«,
 * - prestavitev: frizer in dolžina obstoječega termina, ta termin se ne šteje kot zaseden.
 */
async function resolveContext(req: Request) {
  const q = querySchema.parse(req.query);

  if (q.appointmentId) {
    // prestavitev je mogoča samo za lastni termin prijavljene stranke
    if (!req.user) throw new HttpError(401, 'Prijavite se');
    if (req.user.role !== 'CLIENT') throw new HttpError(403, 'Dostop ni dovoljen');
    const client = await currentClient(req);
    const appointment = await Appointment.findById(q.appointmentId).lean();
    if (!appointment) throw new HttpError(404, 'Termin ne obstaja');
    if (String(appointment.clientId) !== String(client._id)) throw new HttpError(403, 'Dostop ni dovoljen');
    const hairdresser = await Hairdresser.findById(appointment.hairdresserId).lean();
    if (!hairdresser) throw new HttpError(404, 'Frizer ne obstaja');
    return {
      hairdressers: [hairdresser as unknown as BookableHairdresser],
      durationMin: (appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000,
      excludeAppointmentId: appointment._id,
    };
  }

  if (!q.serviceId) throw new HttpError(400, 'Izberite storitev');
  const service = await Service.findOne({ _id: q.serviceId, active: true }).lean();
  if (!service) throw new HttpError(404, 'Storitev ne obstaja');

  let hairdressers = (await bookableHairdressers(q.serviceId)) as unknown as BookableHairdresser[];
  if (q.hairdresserId && q.hairdresserId !== 'any') {
    hairdressers = hairdressers.filter((h) => String(h._id) === q.hairdresserId);
    if (hairdressers.length === 0) throw new HttpError(400, 'Izbrani frizer te storitve ne opravlja');
  }
  return { hairdressers, durationMin: service.durationMin, excludeAppointmentId: undefined };
}

// Dnevi v izbirniku: število prostih ur; dan brez proste ure je onemogočen (US-07, kriterij 5).
bookingRouter.get(
  '/days',
  asyncHandler(async (req, res) => {
    const ctx = await resolveContext(req);
    const from = parseDateKey(dateString.parse(req.query.from ?? toDateKey(new Date())));
    const count = Math.min(Number(req.query.days ?? 14) || 14, 31);

    const days: { date: string; working: boolean; slots: number }[] = [];
    for (let i = 0; i < count; i++) {
      const day = addDays(from, i);
      const slots = await freeSlots({ ...ctx, day });
      // »working«: vsaj en frizer ta dan dela (sicer je dan »prosto«, ne »polno«)
      const working = ctx.hairdressers.some((h) => workingIntervalsFor(h, day).length > 0);
      days.push({ date: toDateKey(day), working, slots: slots.length });
    }
    res.json(days);
  }),
);

// Proste začetne ure za izbran dan (US-07, kriteriji 2–4).
bookingRouter.get(
  '/slots',
  asyncHandler(async (req, res) => {
    const ctx = await resolveContext(req);
    const day = parseDateKey(dateString.parse(req.query.date));
    const slots = await freeSlots({ ...ctx, day });
    res.json(
      slots.map((s) => ({
        time: minutesToTime(s.minutes),
        startsAt: s.startsAt.toISOString(),
        hairdresserIds: s.hairdresserIds,
      })),
    );
  }),
);
