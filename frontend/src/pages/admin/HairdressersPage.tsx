import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type AdminHairdresser, type Service, type WorkingHours } from '../../api';
import { Alert, Button, Field, PageTitle, Panel, type Message } from '../../components/ui';
import { DAY_NAMES as DAYS } from '../../format';

/** Delovni čas dneva kot besedilo, npr. "09:00-13:00, 14:00-18:00" */
function dayText(hours: WorkingHours[], weekday: number) {
  return hours
    .filter((w) => w.weekday === weekday)
    .map((w) => `${w.startTime}-${w.endTime}`)
    .join(', ');
}

/** Besedilo po dnevih -> seznam intervalov; vrne napako, če oblika ni prava. */
function parseHours(texts: string[]): { hours: WorkingHours[]; error?: string } {
  const hours: WorkingHours[] = [];
  for (let i = 0; i < 7; i++) {
    const text = texts[i].trim();
    if (text === '' || text.toLowerCase() === 'prosto') continue;
    for (const part of text.split(',')) {
      const match = part.trim().match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
      if (!match) return { hours, error: `${DAYS[i]}: »${part.trim()}« ni v obliki 09:00-13:00` };
      const pad = (t: string) => t.padStart(5, '0');
      hours.push({ weekday: i + 1, startTime: pad(match[1]), endTime: pad(match[2]) });
    }
  }
  return { hours };
}

export default function HairdressersPage() {
  const [hairdressers, setHairdressers] = useState<AdminHairdresser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showNew, setShowNew] = useState(false);

  const load = () => api.get<AdminHairdresser[]>('/admin/hairdressers').then(setHairdressers);
  useEffect(() => {
    load();
    api.get<Service[]>('/services').then(setServices);
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle actions={<Button variant="primary" onClick={() => setShowNew(true)}>+ Nov frizer</Button>}>Frizerji</PageTitle>
      <p className="-mt-4 text-sm text-muted">
        Obkljukajte storitve, ki jih opravlja posamezen frizer, in nastavite tedenski delovni čas. Obstoječe rezervacije se ne premaknejo.
      </p>

      {showNew && (
        <NewHairdresserForm
          onDone={() => {
            setShowNew(false);
            load();
          }}
          onCancel={() => setShowNew(false)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {hairdressers.map((h) => (
          <HairdresserCard key={h.id} hairdresser={h} services={services} onSaved={load} />
        ))}
      </div>
    </div>
  );
}

function HairdresserCard({ hairdresser, services, onSaved }: { hairdresser: AdminHairdresser; services: Service[]; onSaved: () => void }) {
  const [selected, setSelected] = useState<string[]>(hairdresser.serviceIds);
  const [texts, setTexts] = useState<string[]>(DAYS.map((_, i) => dayText(hairdresser.workingHours, i + 1)));
  const [message, setMessage] = useState<Message>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setMessage(null);
    if (selected.length === 0) {
      setMessage({ kind: 'bad', text: 'Obkljukajte vsaj eno storitev' });
      return;
    }
    const { hours, error } = parseHours(texts);
    if (error) {
      setMessage({ kind: 'bad', text: error });
      return;
    }
    try {
      await api.put(`/admin/hairdressers/${hairdresser.id}/services`, { serviceIds: selected });
      await api.put(`/admin/hairdressers/${hairdresser.id}/working-hours`, { workingHours: hours });
      setMessage({ kind: 'ok', text: 'Shranjeno.' });
      onSaved();
    } catch (err) {
      setMessage({ kind: 'bad', text: err instanceof ApiError ? err.message : 'Shranjevanje ni uspelo' });
    }
  }

  return (
    <Panel title={`${hairdresser.firstName} ${hairdresser.lastName}`} actions={<Button small onClick={save}>Shrani</Button>}>
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 font-medium">Storitve</h3>
          <div className="space-y-1">
            {services.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                {s.name}
              </label>
            ))}
          </div>
          {message && <div className="mt-3"><Alert kind={message.kind}>{message.text}</Alert></div>}
        </div>
        <div>
          <h3 className="mb-2 font-medium">Delovni čas</h3>
          <div className="space-y-2">
            {DAYS.map((day, i) => (
              <label key={day} className="flex items-center gap-3">
                <span className="w-8 text-muted">{day}</span>
                <input
                  className="font-mono text-sm"
                  placeholder="prosto"
                  value={texts[i]}
                  onChange={(e) => setTexts(texts.map((t, k) => (k === i ? e.target.value : t)))}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', password: '' };

function NewHairdresserForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await api.post('/admin/hairdressers', form);
      onDone();
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...err.fieldErrors, _: err.message });
    }
  }

  const field = (key: keyof typeof EMPTY, label: string, type = 'text') => (
    <Field label={label} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} error={errors[key]} />
  );

  return (
    <Panel title="Nov frizer">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        {errors._ && <div className="sm:col-span-2"><Alert>{errors._}</Alert></div>}
        {field('firstName', 'Ime')}
        {field('lastName', 'Priimek')}
        {field('email', 'E-pošta', 'email')}
        {field('phone', 'Telefon')}
        {field('password', 'Začetno geslo', 'password')}
        <div className="flex items-end gap-2">
          <Button type="submit" variant="primary">Ustvari račun</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Prekliči</Button>
        </div>
      </form>
    </Panel>
  );
}
