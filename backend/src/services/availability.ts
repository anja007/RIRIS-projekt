import type { ClientSession, Types } from 'mongoose';
import { Appointment } from '../models/Appointment';
import { Hairdresser } from '../models/Hairdresser';
import { addDays, atMinutes, isoWeekday, toMinutes } from '../lib/time';
import { freeStartMinutes, type Interval } from '../lib/slots';

type Id = Types.ObjectId | string;

export interface WorkingHoursEntry {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface BookableHairdresser {
  _id: Types.ObjectId;
  workingHours: WorkingHoursEntry[];
}

/**
 * Frizerji, ki se lahko ponudijo za storitev: aktivni, storitev opravljajo
 * in imajo nastavljen delovni čas (US-03, kriterij 4; US-07, kriterij 1).
 */
export async function bookableHairdressers(serviceId: Id, session?: ClientSession) {
  return Hairdresser.find({
    active: true,
    serviceIds: serviceId,
    'workingHours.0': { $exists: true },
  })
    .populate('userId', 'firstName lastName')
    .session(session ?? null)
    .lean();
}

/** Zasedeni intervali (v minutah od polnoči) za frizerje na izbrani dan. Preklicani termini ne zasedajo časa. */
export async function busyByHairdresser(
  hairdresserIds: Id[],
  day: Date,
  options: { session?: ClientSession; excludeAppointmentId?: Id } = {},
): Promise<Map<string, Interval[]>> {
  const dayStart = day;
  const dayEnd = addDays(day, 1);
  const filter: Record<string, unknown> = {
    hairdresserId: { $in: hairdresserIds },
    status: { $ne: 'CANCELLED' },
    startsAt: { $lt: dayEnd },
    endsAt: { $gt: dayStart },
  };
  if (options.excludeAppointmentId) filter._id = { $ne: options.excludeAppointmentId };

  const appointments = await Appointment.find(filter).session(options.session ?? null).lean();
  const map = new Map<string, Interval[]>();
  for (const a of appointments) {
    const key = String(a.hairdresserId);
    const start = Math.max(0, (a.startsAt.getTime() - dayStart.getTime()) / 60000);
    const end = Math.min(24 * 60, (a.endsAt.getTime() - dayStart.getTime()) / 60000);
    map.set(key, [...(map.get(key) ?? []), { start, end }]);
  }
  return map;
}

export function workingIntervalsFor(hairdresser: BookableHairdresser, day: Date): Interval[] {
  const weekday = isoWeekday(day);
  return hairdresser.workingHours
    .filter((w) => w.weekday === weekday)
    .map((w) => ({ start: toMinutes(w.startTime), end: toMinutes(w.endTime) }));
}

/** Najzgodnejša dovoljena minuta: pretekli dnevi nimajo ur, danes šele po trenutnem času. */
function minStartFor(day: Date, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day.getTime() < today.getTime()) return Number.POSITIVE_INFINITY;
  if (day.getTime() > today.getTime()) return 0;
  return now.getHours() * 60 + now.getMinutes() + 1;
}

/**
 * Proste začetne ure za več frizerjev na en dan.
 * Vrne seznam { minutes, startsAt, hairdresserIds } – pri »Kdorkoli prost«
 * je ura na seznamu, če je prost vsaj en frizer (US-07, kriterij 4).
 */
export async function freeSlots(options: {
  hairdressers: BookableHairdresser[];
  day: Date;
  durationMin: number;
  now?: Date;
  session?: ClientSession;
  excludeAppointmentId?: Id;
}) {
  const { hairdressers, day, durationMin, now = new Date(), session, excludeAppointmentId } = options;
  const busy = await busyByHairdresser(
    hairdressers.map((h) => h._id),
    day,
    { session, excludeAppointmentId },
  );
  const minStart = minStartFor(day, now);

  const byMinute = new Map<number, string[]>();
  for (const h of hairdressers) {
    const minutes = freeStartMinutes({
      workingIntervals: workingIntervalsFor(h, day),
      busy: busy.get(String(h._id)) ?? [],
      durationMin,
      minStart,
    });
    for (const m of minutes) byMinute.set(m, [...(byMinute.get(m) ?? []), String(h._id)]);
  }

  return [...byMinute.entries()]
    .sort(([a], [b]) => a - b)
    .map(([minutes, hairdresserIds]) => ({ minutes, startsAt: atMinutes(day, minutes), hairdresserIds }));
}
