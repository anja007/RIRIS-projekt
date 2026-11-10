import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, homePathFor, useAuth } from './auth';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import LoginPage from './pages/LoginPage';
import ServicesPage from './pages/admin/ServicesPage';
import HairdressersPage from './pages/admin/HairdressersPage';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

function Soon({ title }: { title: string }) {
  return <h1 className="text-2xl font-semibold">{title}</h1>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireRole roles={['CLIENT']} />}>
            <Route path="/booking" element={<Soon title="Rezervacija termina" />} />
            <Route path="/my-appointments" element={<Soon title="Moji termini" />} />
          </Route>

          <Route element={<RequireRole roles={['HAIRDRESSER']} />}>
            <Route path="/schedule" element={<Soon title="Moj urnik" />} />
          </Route>

          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="/admin/hairdressers" element={<HairdressersPage />} />
            <Route path="/admin/services" element={<ServicesPage />} />
            <Route path="/admin/no-shows" element={<Soon title="Neprihodi" />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
