import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type HairdresserProfile, type Schedule, type ScheduleAppointment } from '../../api';
import { Alert, Button, Panel, StatusPill, type Message } from '../../components/ui';
import { addDays, DAY_NAMES, duration, fromDateKey, hhmm, time, toDateKey, toMinutes } from '../../format';

const minOf = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

/** Proste vrzeli v delovnem času med nepreklicanimi termini. */
function gaps(schedule: Schedule) {
  const busy = schedule.appointments
    .filter((a) => a.status !== 'CANCELLED')
    .map((a) => ({ start: minOf(a.startsAt), end: minOf(a.endsAt) }));
  const result: { start: number; end: number }[] = [];
  for (const w of schedule.workingHours) {
    let cursor = toMinutes(w.startTime);
    const end = toMinutes(w.endTime);
    for (const b of busy.filter((x) => x.end > cursor && x.start < end).sort((x, y) => x.start - y.start)) {
      if (b.start > cursor) result.push({ start: cursor, end: b.start });
      cursor = Math.max(cursor, b.end);
    }
    if (cursor < end) result.push({ start: cursor, end });
  }
  return result;
}

/** Zaporedni dnevi z enakim delovnim časom v eni vrstici, npr. »Pon–Pet  09:00–13:00, 14:00–18:00«. */
function groupedHours(profile: HairdresserProfile) {
  const rows: { days: string; text: string }[] = [];
  let start = 0;
  const textFor = (i: number) =>
    profile.workingHours
      .filter((w) => w.weekday === i + 1)
      .map((w) => `${w.startTime}–${w.endTime}`)
      .join(', ') || 'prosto';
  for (let i = 1; i <= 7; i++) {
    if (i === 7 || textFor(i) !== textFor(start)) {
      rows.push({
        days: start === i - 1 ? DAY_NAMES[start] : `${DAY_NAMES[start]}–${DAY_NAMES[i - 1]}`,
        text: textFor(start),
      });
      start = i;
    }
  }
  return rows;
}

/** WF-04: dnevni urnik frizerja (US-11) in preklic z razlogom (US-10). */
export default function SchedulePage() {
  const [date, setDate] = useState(toDateKey(new Date()));
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [profile, setProfile] = useState<HairdresserProfile | null>(null);
  const [cancelling, setCancelling] = useState<ScheduleAppointment | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const load = () => api.get<Schedule>(`/hairdresser/schedule?date=${date}`).then(setSchedule);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  useEffect(() => {
    api.get<HairdresserProfile>('/hairdresser/me').then(setProfile);
  }, []);

  async function setOutcome(a: ScheduleAppointment, status: 'COMPLETED' | 'NO_SHOW') {
    setMessage(null);
    try {
      await api.post(`/hairdresser/appointments/${a.id}/outcome`, { status });
      setMessage({ kind: 'ok', text: status === 'COMPLETED' ? 'Termin je zaključen.' : 'Neprihod je zabeležen.' });
    } catch (err) {
      setMessage({ kind: 'bad', text: err instanceof ApiError ? err.message : 'Shranjevanje ni uspelo' });
    }
    load();
  }

  const now = Date.now();
  const active = schedule?.appointments.filter((a) => a.status !== 'CANCELLED') ?? [];
  const workMinutes = schedule?.workingHours.reduce((sum, w) => sum + toMinutes(w.endTime) - toMinutes(w.startTime), 0) ?? 0;
  const busyMinutes = active.reduce((sum, a) => sum + minOf(a.endsAt) - minOf(a.startsAt), 0);
  const toMark = active.filter((a) => a.status === 'CONFIRMED' && new Date(a.startsAt).getTime() <= now).length;

  const rows = schedule
    ? [
        ...schedule.appointments.map((a) => ({ kind: 'appointment' as const, start: minOf(a.startsAt), a })),
        ...gaps(schedule).map((g) => ({ kind: 'gap' as const, start: g.start, end: g.end })),
      ].sort((x, y) => x.start - y.start)
    : [];

  const heading = fromDateKey(date).toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button aria-label="Prejšnji dan" onClick={() => setDate(addDays(date, -1))}>
            ←
          </Button>
          <h1 className="text-3xl first-letter:uppercase">{heading}</h1>
          <Button aria-label="Naslednji dan" onClick={() => setDate(addDays(date, 1))}>
            →
          </Button>
          <Button onClick={() => setDate(toDateKey(new Date()))}>Danes</Button>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Delovni čas" value={schedule?.workingHours.map((w) => `${w.startTime}–${w.endTime}`).join(', ') || 'prosto'} />
          <Stat label="Termini" value={String(active.length)} />
          <Stat label="Zasedeno" value={workMinutes ? `${Math.round((busyMinutes / workMinutes) * 100)} %` : '—'} />
          <Stat label="Za označiti" value={String(toMark)} />
        </dl>

        {message && <Alert kind={message.kind}>{message.text}</Alert>}

        {schedule && rows.length === 0 && <p className="text-muted">Ta dan ne delate in nimate terminov.</p>}

        <ul className="space-y-3">
          {rows.map((row) =>
            row.kind === 'gap' ? (
              <li key={`gap-${row.start}`} className="grid grid-cols-[7rem_1fr] items-center gap-4">
                <span className="font-mono text-sm text-muted">{hhmm(row.start)}</span>
                <div className="note">
                  Prosto do {hhmm(row.end)} · {duration(row.end - row.start)}
                </div>
              </li>
            ) : (
              <li key={row.a.id} className="grid grid-cols-[7rem_1fr] items-start gap-4">
                <span className="pt-4 font-mono text-sm text-muted">
                  {time(row.a.startsAt)}–{time(row.a.endsAt)}
                </span>
                <AppointmentCard
                  a={row.a}
                  now={now}
                  onOutcome={(s) => setOutcome(row.a, s)}
                  onCancel={() => setCancelling(row.a)}
                />
              </li>
            ),
          )}
        </ul>
      </div>

      <div className="space-y-5 lg:sticky lg:top-6">
        {profile && (
          <Panel title="Moj delovni čas">
            <dl className="divide-y divide-line">
              {groupedHours(profile).map((r) => (
                <div key={r.days} className="grid grid-cols-[5.5rem_1fr] py-2">
                  <dt>{r.days}</dt>
                  <dd className={r.text === 'prosto' ? 'text-muted' : 'font-mono text-sm'}>{r.text}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-5 mb-2 font-medium">Moje storitve</h3>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s) => (
                <span key={s.id} className="rounded-lg border border-line px-3 py-1 text-sm">
                  {s.name}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">Delovni čas in storitve lahko spreminja samo administrator.</p>
          </Panel>
        )}
        {cancelling && (
          <CancelForm
            a={cancelling}
            onClose={() => setCancelling(null)}
            onDone={() => {
              setCancelling(null);
              setMessage({ kind: 'ok', text: 'Termin je preklican. Stranka vidi razlog v »Moji termini«.' });
              load();
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-mono text-lg">{value}</dd>
    </div>
  );
}

function AppointmentCard({
  a,
  now,
  onOutcome,
  onCancel,
}: {
  a: ScheduleAppointment;
  now: number;
  onOutcome: (status: 'COMPLETED' | 'NO_SHOW') => void;
  onCancel: () => void;
}) {
  const started = new Date(a.startsAt).getTime() <= now;
  const details = [a.serviceName, a.clientPhone];
  if (a.clientNote) details.push(`»${a.clientNote}«`);

  return (
    <div
      className={`panel border-l-4 ${a.status === 'CANCELLED' ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: a.status === 'CONFIRMED' ? 'var(--accent)' : 'var(--line)' }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg">{a.clientName}</span>
        <StatusPill status={a.status} />
        {a.clientNoShowCount > 0 && (
          <span className="text-sm text-muted">
            {a.clientNoShowCount} {a.clientNoShowCount === 1 ? 'neprihod' : 'neprihodi'}
          </span>
        )}
      </div>
      <div className="text-sm text-muted">{details.join(' · ')}</div>
      {a.cancellationReason && <div className="mt-1 text-sm">Razlog preklica: {a.cancellationReason}</div>}

      {a.status === 'CONFIRMED' && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {started ? (
            // US-11, kriterij 2: izid šele po začetku termina
            <>
              <Button variant="ok" onClick={() => onOutcome('COMPLETED')}>
                Zaključen
              </Button>
              <Button variant="danger" onClick={() => onOutcome('NO_SHOW')}>
                Neprihod
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted">Izid lahko označite po {time(a.startsAt)}</span>
              <Button onClick={onCancel}>Prekliči …</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CancelForm({ a, onClose, onDone }: { a: ScheduleAppointment; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/hairdresser/appointments/${a.id}/cancel`, { reason });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Preklic ni uspel');
    }
  }

  return (
    <Panel title="Prekliči termin">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-muted">
          {time(a.startsAt)} · {a.clientName} · {a.serviceName}
        </p>
        {error && <Alert>{error}</Alert>}
        <label className="block">
          <span className="field-label">Razlog, ki ga vidi stranka</span>
          <input placeholder="npr. frizerka bolna" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </label>
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            Prekliči termin
          </Button>
          <Button type="button" onClick={onClose}>
            Obdrži
          </Button>
        </div>
      </form>
    </Panel>
  );
}
