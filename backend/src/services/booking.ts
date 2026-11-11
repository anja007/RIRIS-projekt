import mongoose, { type ClientSession, type Types } from 'mongoose';
import { Appointment } from '../models/Appointment';
import { Hairdresser } from '../models/Hairdresser';
import { Service } from '../models/Service';
import { HttpError } from '../lib/errors';
import { bookableHairdressers, freeSlots, type BookableHairdresser } from './availability';

export const SLOT_TAKEN = 'Ta termin je bil pravkar zaseden. Izberite drugo uro.';

class SlotTakenError extends Error {}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function minutesOfDay(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

/** Ali je `startsAt` še prosta začetna ura pri frizerju (preverjeno znotraj transakcije). */
async function isStillFree(options: {
  hairdresser: BookableHairdresser;
  startsAt: Date;
  durationMin: number;
  session: ClientSession;
  excludeAppointmentId?: Types.ObjectId;
}) {
  const slots = await freeSlots({
    hairdressers: [options.hairdresser],
    day: startOfDay(options.startsAt),
    durationMin: options.durationMin,
    session: options.session,
    excludeAppointmentId: options.excludeAppointmentId,
  });
  return slots.some((s) => s.minutes === minutesOfDay(options.startsAt));
}

/**
 * Izvede `work` v transakciji in hkrati poveča bookingVersion frizerja.
 * Dve hkratni rezervaciji pri istem frizerju tako pišeta v isti dokument:
 * ena dobi napako WriteConflict, MongoDB jo ponovi, ponovljena pa že vidi
 * drugi termin in vrne 409 (ADR-0009).
 */
async function inBookingTransaction<T>(hairdresserId: Types.ObjectId, work: (session: ClientSession) => Promise<T>) {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
      await Hairdresser.updateOne({ _id: hairdresserId }, { $inc: { bookingVersion: 1 } }, { session });
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}

/** Število nepreklicanih terminov frizerja na dan (za »Kdorkoli prost«, US-08 kriterij 5). */
async function countForDay(hairdresserId: Types.ObjectId, day: Date) {
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return Appointment.countDocuments({ hairdresserId, status: { $ne: 'CANCELLED' }, startsAt: { $gte: day, $lt: next } });
}

/** US-08: rezervacija termina brez prekrivanja. */
export async function bookAppointment(input: {
  clientId: Types.ObjectId;
  serviceId: string;
  hairdresserId: string; // id ali 'any'
  startsAt: Date;
  clientNote: string;
}) {
  const service = await Service.findOne({ _id: input.serviceId, active: true }).lean();
  if (!service) throw new HttpError(404, 'Storitev ne obstaja');
  if (input.startsAt.getTime() <= Date.now()) throw new HttpError(409, SLOT_TAKEN);

  let candidates = (await bookableHairdressers(service._id)) as unknown as BookableHairdresser[];
  if (input.hairdresserId !== 'any') {
    candidates = candidates.filter((h) => String(h._id) === input.hairdresserId);
    if (candidates.length === 0) throw new HttpError(400, 'Izbrani frizer te storitve ne opravlja');
  } else {
    // ustrezen frizer z najmanj termini na ta dan
    const day = startOfDay(input.startsAt);
    const counts = await Promise.all(candidates.map((h) => countForDay(h._id, day)));
    candidates = candidates
      .map((h, i) => ({ h, count: counts[i] }))
      .sort((a, b) => a.count - b.count)
      .map((x) => x.h);
  }

  const endsAt = new Date(input.startsAt.getTime() + service.durationMin * 60000);

  for (const candidate of candidates) {
    try {
      const appointment = await inBookingTransaction(candidate._id, async (session) => {
        const free = await isStillFree({
          hairdresser: candidate,
          startsAt: input.startsAt,
          durationMin: service.durationMin,
          session,
        });
        if (!free) throw new SlotTakenError();

        const [created] = await Appointment.create(
          [
            {
              clientId: input.clientId,
              hairdresserId: candidate._id,
              serviceId: service._id,
              startsAt: input.startsAt,
              endsAt,
              price: service.price, // cena ob rezervaciji
              status: 'CONFIRMED',
              clientNote: input.clientNote,
            },
          ],
          { session },
        );
        return created;
      });
      return appointment;
    } catch (err) {
      if (err instanceof SlotTakenError) continue; // pri »any« poskusi naslednjega frizerja
      throw err;
    }
  }
  throw new HttpError(409, SLOT_TAKEN);
}

/** US-09: prestavitev spremeni čas istega termina pri istem frizerju. */
export async function rescheduleAppointment(appointmentId: Types.ObjectId, startsAt: Date) {
  const appointment = await Appointment.findById(appointmentId).lean();
  if (!appointment) throw new HttpError(404, 'Termin ne obstaja');
  if (startsAt.getTime() <= Date.now()) throw new HttpError(409, SLOT_TAKEN);

  const hairdresser = (await Hairdresser.findById(appointment.hairdresserId).lean()) as unknown as BookableHairdresser | null;
  if (!hairdresser) throw new HttpError(404, 'Frizer ne obstaja');

  // termin obdrži svojo dolžino (US-04, kriterij 2)
  const durationMin = (appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000;
  const endsAt = new Date(startsAt.getTime() + durationMin * 60000);

  try {
    return await inBookingTransaction(hairdresser._id, async (session) => {
      const free = await isStillFree({
        hairdresser,
        startsAt,
        durationMin,
        session,
        excludeAppointmentId: appointment._id,
      });
      if (!free) throw new SlotTakenError();
      return Appointment.findOneAndUpdate(
        { _id: appointment._id, status: 'CONFIRMED' },
        { startsAt, endsAt },
        { new: true, session },
      );
    });
  } catch (err) {
    if (err instanceof SlotTakenError) throw new HttpError(409, SLOT_TAKEN);
    throw err;
  }
}
