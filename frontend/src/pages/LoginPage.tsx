import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError, type User } from '../api';
import { homePathFor, useAuth } from '../auth';
import { Alert, Button, Field, Panel } from '../components/ui';

/** WF-01: prijava levo, registracija stranke desno (US-01, US-02). */
export default function LoginPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  function onLoggedIn(u: User) {
    setUser(u);
    navigate(homePathFor(u.role));
  }

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-10 md:grid-cols-2">
      <div>
        <h1 className="mb-5 text-4xl">Dobrodošli nazaj</h1>
        <LoginForm onDone={onLoggedIn} />
      </div>
      <div>
        <h1 className="mb-5 text-4xl">Prvič v Salonku?</h1>
        <RegisterForm onDone={onLoggedIn} />
      </div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.post<{ user: User }>('/auth/login', { email, password });
      onDone(data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Prijava ni uspela');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Prijava">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="E-pošta" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Geslo" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" variant="primary" disabled={busy} className="w-full">
          Prijava
        </Button>
        <p className="text-sm text-muted">
          Po prijavi: stranka → Rezervacija
          <br />
          frizer → Moj urnik
          <br />
          administrator → Frizerji
        </p>
      </form>
    </Panel>
  );
}

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', password: '' };

function RegisterForm({ onDone }: { onDone: (u: User) => void }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError('');
    try {
      const data = await api.post<{ user: User }>('/auth/register', form);
      onDone(data.user);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else {
        setError(err instanceof ApiError ? err.message : 'Registracija ni uspela');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Ustvari račun stranke">
      {/* noValidate: preverjanje in sporočila prihajajo z zaledja (US-01) */}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ime" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
          <Field label="Priimek" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
        </div>
        <Field label="E-pošta" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field label="Telefon" type="tel" autoComplete="tel" placeholder="+386 40 123 456" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Field label="Geslo" type="password" autoComplete="new-password" placeholder="Vsaj 6 znakov" value={form.password} onChange={set('password')} error={errors.password} />
        <Button type="submit" variant="primary" disabled={busy} className="w-full">
          Ustvari račun
        </Button>
        <p className="text-sm text-muted">
          Telefon: 6–20 števk, presledkov in + ( ) -
          <br />
          Geslo: vsaj 6 znakov
        </p>
      </form>
    </Panel>
  );
}
