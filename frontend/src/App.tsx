import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, homePathFor, useAuth } from './auth';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import LoginPage from './pages/LoginPage';
import ServicesPage from './pages/admin/ServicesPage';
import HairdressersPage from './pages/admin/HairdressersPage';
import NoShowsPage from './pages/admin/NoShowsPage';
import BookingPage from './pages/client/BookingPage';
import MyAppointmentsPage from './pages/client/MyAppointmentsPage';
import SchedulePage from './pages/hairdresser/SchedulePage';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homePathFor(user.role) : '/booking'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          {/* cenik in prosti termini: gost ali stranka; potrditev zahteva prijavo */}
          <Route element={<RequireRole roles={['CLIENT']} allowGuest />}>
            <Route path="/booking" element={<BookingPage />} />
          </Route>

          <Route element={<RequireRole roles={['CLIENT']} />}>
            <Route path="/my-appointments" element={<MyAppointmentsPage />} />
          </Route>

          <Route element={<RequireRole roles={['HAIRDRESSER']} />}>
            <Route path="/schedule" element={<SchedulePage />} />
          </Route>

          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="/admin/hairdressers" element={<HairdressersPage />} />
            <Route path="/admin/services" element={<ServicesPage />} />
            <Route path="/admin/no-shows" element={<NoShowsPage />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
