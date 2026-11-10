import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type Service } from '../../api';
import { Alert, Button, Field, PageTitle, Panel, type Message } from '../../components/ui';
import { euro } from '../../format';

interface FormState {
  id?: string;
  name: string;
  description: string;
  durationMin: string;
  price: string; // v evrih, npr. "18,50"
  active: boolean;
}

const EMPTY: FormState = { name: '', description: '', durationMin: '', price: '', active: true };

function toForm(s: Service): FormState {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: String(s.durationMin),
    price: (s.price / 100).toFixed(2).replace('.', ','),
    active: s.active,
  };
}

/** "18,50" -> 1850 centov; neveljaven vnos -> NaN, zaledje vrne napako */
function toCents(value: string) {
  const n = Number(value.replace(',', '.').trim());
  return value.trim() === '' ? NaN : Math.round(n * 100);
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Message>(null);

  const load = () => api.get<Service[]>('/admin/services').then(setServices);
  useEffect(() => {
    load();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErrors({});
    const body = {
      name: form.name,
      description: form.description,
      durationMin: form.durationMin.trim() === '' ? NaN : Number(form.durationMin),
      price: toCents(form.price),
      active: form.active,
    };
    try {
      if (form.id) await api.put(`/admin/services/${form.id}`, body);
      else await api.post('/admin/services', body);
      setForm(null);
      setMessage({ kind: 'ok', text: 'Storitev je shranjena.' });
      load();
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...err.fieldErrors, _: err.message });
    }
  }

  async function remove(s: Service) {
    if (!confirm(`Izbrišem storitev »${s.name}«?`)) return;
    try {
      await api.delete(`/admin/services/${s.id}`);
      setMessage({ kind: 'ok', text: 'Storitev je izbrisana.' });
      load();
    } catch (err) {
      setMessage({ kind: 'bad', text: err instanceof ApiError ? err.message : 'Brisanje ni uspelo' });
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle actions={<Button variant="primary" onClick={() => { setForm(EMPTY); setErrors({}); }}>+ Nova storitev</Button>}>
        Storitve
      </PageTitle>
      <p className="-mt-4 text-sm text-muted">Trajanje določa dolžino termina. Spremenjena cena ali trajanje velja le za nove rezervacije.</p>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}

      {form && (
        <Panel title={form.id ? 'Uredi storitev' : 'Nova storitev'}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
            {errors._ && <div className="sm:col-span-2"><Alert>{errors._}</Alert></div>}
            <Field label="Naziv" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Field label="Opis (neobvezno)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Field label="Trajanje (minute)" inputMode="numeric" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} error={errors.durationMin} />
            <Field label="Cena (€)" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} error={errors.price} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Aktivna (prikazana v ceniku in pri rezervaciji)
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary">Shrani</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Prekliči</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <table className="w-full text-left">
          <thead className="cap">
            <tr>
              <th className="py-2">Naziv</th>
              <th>Trajanje</th>
              <th>Cena</th>
              <th>Stanje</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="py-2">{s.name}</td>
                <td>{s.durationMin} min</td>
                <td>{euro(s.price)}</td>
                <td>{s.active ? 'aktivna' : <span className="text-muted">deaktivirana</span>}</td>
                <td className="space-x-2 text-right">
                  <Button small onClick={() => { setForm(toForm(s)); setErrors({}); }}>Uredi</Button>
                  <Button small variant="danger" onClick={() => remove(s)}>Izbriši</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
