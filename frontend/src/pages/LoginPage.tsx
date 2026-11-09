import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError, type User } from '../api';
import { homePathFor, useAuth } from '../auth';
import { Alert, Button, Card, Field } from '../components/ui';

export default function LoginPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  function onLoggedIn(u: User) {
    setUser(u);
    navigate(homePathFor(u.role));
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <LoginForm onDone={onLoggedIn} />
      <RegisterForm onDone={onLoggedIn} />
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
    <Card title="Prijava">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="E-pošta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Geslo" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" disabled={busy} className="w-full">
          Prijava
        </Button>
      </form>
    </Card>
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
    <Card title="Nov račun stranke">
      {/* noValidate: preverjanje in sporočila prihajajo z zaledja (US-01) */}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ime" value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
          <Field label="Priimek" value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
        </div>
        <Field label="E-pošta" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field label="Telefon" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Field label="Geslo (vsaj 6 znakov)" type="password" value={form.password} onChange={set('password')} error={errors.password} />
        <Button type="submit" disabled={busy} className="w-full">
          Ustvari račun
        </Button>
      </form>
    </Card>
  );
}
