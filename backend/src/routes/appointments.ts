import { Router } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment';
import { asyncHandler } from '../lib/errors';
import { currentClient } from '../lib/current';
import { objectId } from '../lib/validation';
import { requireAuth, requireRole } from '../middleware/auth';
import { bookAppointment } from '../services/booking';

export const appointmentsRouter = Router();
appointmentsRouter.use(requireAuth, requireRole('CLIENT'));

export const CHANGE_DEADLINE_HOURS = 24;

function canChange(a: { status: string; startsAt: Date }, now = new Date()) {
  return a.status === 'CONFIRMED' && a.startsAt.getTime() - now.getTime() >= CHANGE_DEADLINE_HOURS * 3600 * 1000;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function appointmentDto(a: any) {
  return {
    id: String(a._id),
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    price: a.price,
    clientNote: a.clientNote ?? '',
    cancellationReason: a.cancellationReason ?? '',
    serviceId: String(a.serviceId?._id ?? a.serviceId),
    serviceName: a.serviceId?.name ?? '',
    hairdresserId: String(a.hairdresserId?._id ?? a.hairdresserId),
    hairdresserName: a.hairdresserId?.userId
      ? `${a.hairdresserId.userId.firstName} ${a.hairdresserId.userId.lastName}`
      : '',
    canChange: canChange(a),
  };
}

const populateAll = [
  { path: 'serviceId', select: 'name' },
  { path: 'hairdresserId', select: 'userId', populate: { path: 'userId', select: 'firstName lastName' } },
];

async function loadDto(id: unknown) {
  const a = await Appointment.findById(id).populate(populateAll).lean();
  return appointmentDto(a);
}

// US-08: rezervacija
const bookSchema = z.object({
  serviceId: objectId,
  hairdresserId: z.union([z.literal('any'), objectId]),
  startsAt: z.coerce.date({ invalid_type_error: 'Neveljaven čas začetka' }),
  clientNote: z.string().trim().max(300).optional().default(''),
});

appointmentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = bookSchema.parse(req.body);
    const client = await currentClient(req);
    const appointment = await bookAppointment({ ...data, clientId: client._id });
    res.status(201).json(await loadDto(appointment._id));
  }),
);
