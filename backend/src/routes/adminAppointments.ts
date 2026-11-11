import { Router } from 'express';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment';
import { Client } from '../models/Client';
import { asyncHandler, HttpError } from '../lib/errors';
import { objectId } from '../lib/validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminAppointmentsRouter = Router();
adminAppointmentsRouter.use(requireAuth, requireRole('ADMIN'));

// Termini, označeni kot neprihod (za popravek, US-11 kriterij 4).
adminAppointmentsRouter.get(
  '/no-shows',
  asyncHandler(async (_req, res) => {
    const list = await Appointment.find({ status: 'NO_SHOW' })
      .sort({ startsAt: -1 })
      .limit(100)
      .populate([
        { path: 'serviceId', select: 'name' },
        { path: 'clientId', select: 'userId noShowCount', populate: { path: 'userId', select: 'firstName lastName phone' } },
        { path: 'hairdresserId', select: 'userId', populate: { path: 'userId', select: 'firstName lastName' } },
      ])
      .lean();
    res.json(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list.map((a: any) => ({
        id: String(a._id),
        startsAt: a.startsAt,
        serviceName: a.serviceId?.name ?? '',
        clientName: a.clientId?.userId ? `${a.clientId.userId.firstName} ${a.clientId.userId.lastName}` : '',
        clientPhone: a.clientId?.userId?.phone ?? '',
        noShowCount: a.clientId?.noShowCount ?? 0,
        hairdresserName: a.hairdresserId?.userId ? `${a.hairdresserId.userId.firstName} ${a.hairdresserId.userId.lastName}` : '',
      })),
    );
  }),
);

// US-11, kriterij 4: samo administrator lahko neprihod popravi v zaključen termin.
adminAppointmentsRouter.post(
  '/:id/mark-completed',
  asyncHandler(async (req, res) => {
    const id = objectId.parse(req.params.id);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const appointment = await Appointment.findOneAndUpdate(
          { _id: id, status: 'NO_SHOW' },
          { status: 'COMPLETED' },
          { session },
        );
        if (!appointment) throw new HttpError(409, 'Termin ni označen kot neprihod');
        await Client.updateOne(
          { _id: appointment.clientId, noShowCount: { $gt: 0 } },
          { $inc: { noShowCount: -1 } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    res.json({ id, status: 'COMPLETED' });
  }),
);
