import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  api,
  ApiError,
  type Appointment,
  type BookingDay,
  type BookingHairdresser,
  type Service,
  type Slot,
} from '../../api';
import { Alert, Button, Note, PageTitle, Panel } from '../../components/ui';
import { dateShort, dateWords, euro, freeCount, fromDateKey, time, toDateKey, toMinutes } from '../../format';

const ANY = 'any';

/** Skupine začetnih ur kot v WF-02. */
const SLOT_GROUPS = [
  { label: 'Dopoldne', from: 0, to: 11 * 60 },
  { label: 'Pozno dopoldne', from: 11 * 60, to: 13 * 60 },
  { label: 'Popoldne', from: 13 * 60, to: 24 * 60 },
];

/** WF-02: čarovnik za rezervacijo (US-07, US-08) in prestavitev termina (US-09). */
export default function BookingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rescheduleId = params.get('reschedule');

  const [services, setServices] = useState<Service[]>([]);
  const [hairdressers, setHairdressers] = useState<BookingHairdresser[]>([]);
  const [days, setDays] = useState<BookingDay[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [original, setOriginal] = useState<Appointment | null>(null);

  const [serviceId, setServiceId] = useState('');
  const [hairdresserId, setHairdresserId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const service = services.find((s) => s.id === serviceId);

  // Parametri za /booking/days in /booking/slots
  const query = useMemo(() => {
    if (rescheduleId) return `appointmentId=${rescheduleId}`;
    if (!serviceId || !hairdresserId) return '';
    return `serviceId=${serviceId}&hairdresserId=${hairdresserId}`;
  }, [rescheduleId, serviceId, hairdresserId]);

  useEffect(() => {
    api.get<Service[]>('/services').then(setServices);
  }, []);

  // Prestavitev: ista storitev in frizer, začnemo pri izbiri dneva.
  useEffect(() => {
    if (!rescheduleId) return;
    api.get<Appointment[]>('/appointments/mine').then((list) => {
      const a = list.find((x) => x.id === rescheduleId) ?? null;
      setOriginal(a);
      if (a) {
        setServiceId(a.serviceId);
        setHairdresserId(a.hairdresserId);
      }
    });
  }, [rescheduleId]);

  useEffect(() => {
    if (!serviceId || rescheduleId) return;
    setHairdressers([]);
    api.get<BookingHairdresser[]>(`/booking/hairdressers?serviceId=${serviceId}`).then(setHairdressers);
  }, [serviceId, rescheduleId]);

  useEffect(() => {
    setDays([]);
    setDate('');
    if (!query) return;
    api.get<BookingDay[]>(`/booking/days?${query}&days=14`).then(setDays);
  }, [query]);

  function loadSlots() {
    setSlot(null);
    setSlots([]);
    if (!query || !date) return Promise.resolve();
    return api.get<Slot[]>(`/booking/slots?${query}&date=${date}`).then(setSlots);
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, date]);

  function chooseService(id: string) {
    setServiceId(id);
    setHairdresserId('');
    setError('');
  }

  const offering = hairdressers.filter((h) => h.offers);
  const notOffering = hairdressers.filter((h) => !h.offers);

  const durationMin = original
    ? (new Date(original.endsAt).getTime() - new Date(original.startsAt).getTime()) / 60000
    : service?.durationMin ?? 0;
  const endsAt = slot ? new Date(new Date(slot.startsAt).getTime() + durationMin * 60000) : null;
  const freeCancelUntil = slot ? new Date(new Date(slot.startsAt).getTime() - 24 * 3600 * 1000) : null;
  const hairdresserName = original
    ? original.hairdresserName
    : hairdresserId === ANY
      ? 'Kdorkoli prost'
      : hairdressers.find((h) => h.id === hairdresserId)?.name ?? '';

  async function confirm() {
    if (!slot) return;
    setBusy(true);
    setError('');
    try {
      if (rescheduleId) {
        await api.put(`/appointments/${rescheduleId}/reschedule`, { startsAt: slot.startsAt });
      } else {
        await api.post('/appointments', { serviceId, hairdresserId, startsAt: slot.startsAt, clientNote: note });
      }
      navigate('/my-appointments', { state: { message: rescheduleId ? 'Termin je prestavljen.' : 'Termin je rezerviran.' } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // US-08, kriterij 2: sporočilo in osvežen seznam ur
        setError(err.message);
        await loadSlots();
      } else {
        setError(err instanceof ApiError ? err.message : 'Rezervacija ni uspela');
      }
    } finally {
      setBusy(false);
    }
  }

  // Pri prestavitvi sta koraka 1 in 2 že izbrana.
  const dayStep = rescheduleId ? 1 : 3;

  return (
    <div>
      <PageTitle>{rescheduleId ? 'Prestavitev termina' : 'Rezervacija termina'}</PageTitle>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          {original && (
            <Alert kind="info">
              Prestavljate termin {original.serviceName} ({original.hairdresserName}), {dateShort(original.startsAt)} ob{' '}
              {time(original.startsAt)}. Izberite nov dan in uro.
            </Alert>
          )}

          {!rescheduleId && (
            <Panel title="Storitev" step={1}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    className="choice px-4 py-3"
                    aria-pressed={s.id === serviceId}
                    onClick={() => chooseService(s.id)}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted">
                      {s.durationMin} min · {euro(s.price)}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {!rescheduleId && serviceId && (
            <Panel title="Frizer" step={2}>
              <div className="flex flex-wrap gap-2">
                <button
                  className="choice choice-solid px-4 py-2"
                  aria-pressed={hairdresserId === ANY}
                  disabled={offering.length === 0}
                  onClick={() => setHairdresserId(ANY)}
                >
                  Kdorkoli prost
                </button>
                {hairdressers.map((h) => (
                  <button
                    key={h.id}
                    className="choice choice-solid px-4 py-2"
                    aria-pressed={h.id === hairdresserId}
                    disabled={!h.offers}
                    onClick={() => setHairdresserId(h.id)}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                {offering.length === 0
                  ? 'Te storitve trenutno ne opravlja noben frizer.'
                  : `Storitev opravlja: ${offering.map((h) => h.name).join(', ')}.`}
                {notOffering.length > 0 && ` Te storitve ne opravlja: ${notOffering.map((h) => h.name).join(', ')}.`}
              </p>
            </Panel>
          )}

          {query && (
            <Panel title="Dan" step={dayStep}>
              <div className="flex flex-wrap gap-2">
                {days.map((d, i) => {
                  const day = fromDateKey(d.date);
                  const label = i === 0 && d.date === toDateKey(new Date())
                    ? 'Danes'
                    : day.toLocaleDateString('sl-SI', { weekday: 'short' }).replace('.', '');
                  return (
                    <button
                      key={d.date}
                      className="choice choice-solid w-20 px-2 py-2 text-center"
                      aria-pressed={d.date === date}
                      disabled={d.slots === 0}
                      onClick={() => setDate(d.date)}
                    >
                      <div className="text-xs capitalize">{label}</div>
                      <div className="font-mono text-xl">{day.getDate()}</div>
                      <div className="text-xs">{!d.working ? 'prosto' : d.slots === 0 ? 'polno' : freeCount(d.slots)}</div>
                    </button>
                  );
                })}
              </div>
              {days.length > 0 && days.every((d) => d.slots === 0) && (
                <p className="mt-3 text-sm text-muted">V naslednjih 14 dneh ni prostih terminov.</p>
              )}
            </Panel>
          )}

          {date && (
            <Panel title={`Začetna ura · ${dateWords(fromDateKey(date))}`} step={dayStep + 1}>
              {slots.length === 0 ? (
                <p className="text-sm text-muted">Ta dan ni prostih ur.</p>
              ) : (
                <div className="space-y-4">
                  {SLOT_GROUPS.map((g) => {
                    const inGroup = slots.filter((s) => toMinutes(s.time) >= g.from && toMinutes(s.time) < g.to);
                    if (inGroup.length === 0) return null;
                    return (
                      <div key={g.label}>
                        <div className="mb-2 text-sm text-muted">{g.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {inGroup.map((s) => (
                            <button
                              key={s.startsAt}
                              className="choice choice-solid w-20 px-2 py-1.5 text-center font-mono"
                              aria-pressed={slot?.startsAt === s.startsAt}
                              onClick={() => setSlot(s)}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Panel title="Povzetek" step={dayStep + 2}>
            <dl className="grid grid-cols-[6rem_1fr] gap-y-2">
              <dt className="text-muted">Storitev</dt>
              <dd>{original?.serviceName ?? service?.name ?? '—'}</dd>
              <dt className="text-muted">Kdaj</dt>
              <dd>{slot && endsAt ? `${dateShort(slot.startsAt)}, ${time(slot.startsAt)}–${time(endsAt)}` : '—'}</dd>
              <dt className="text-muted">Frizer</dt>
              <dd>{hairdresserName || '—'}</dd>
              <dt className="text-muted">Cena</dt>
              <dd>{original ? euro(original.price) : service ? euro(service.price) : '—'}</dd>
            </dl>
            {!rescheduleId && (
              <label className="mt-4 block">
                <span className="field-label">Opomba za frizerja (neobvezno)</span>
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="npr. občutljivo lasišče"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            )}
            {error && (
              <div className="mt-4">
                <Alert>{error}</Alert>
              </div>
            )}
            <Button variant="primary" className="mt-4 w-full" onClick={confirm} disabled={!slot || busy}>
              {rescheduleId ? 'Potrdi prestavitev' : 'Potrdi rezervacijo'}
            </Button>
            {freeCancelUntil && (
              <p className="mt-3 text-sm text-muted">
                Brezplačen preklic do {dateShort(freeCancelUntil)}, {time(freeCancelUntil)}
              </p>
            )}
          </Panel>
          {hairdresserId === ANY && (
            <Note>Pri »Kdorkoli prost« termin ob potrditvi dobi frizer z najmanj termini na ta dan.</Note>
          )}
        </div>
      </div>
    </div>
  );
}
