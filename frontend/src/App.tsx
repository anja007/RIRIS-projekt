import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, homePathFor, useAuth } from './auth';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import LoginPage from './pages/LoginPage';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homePathFor(user.role) : '/prijava'} replace />;
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
          <Route path="/prijava" element={<LoginPage />} />

          <Route element={<RequireRole roles={['CLIENT']} />}>
            <Route path="/rezervacija" element={<Soon title="Rezervacija termina" />} />
            <Route path="/moji-termini" element={<Soon title="Moji termini" />} />
          </Route>

          <Route element={<RequireRole roles={['HAIRDRESSER']} />}>
            <Route path="/urnik" element={<Soon title="Moj urnik" />} />
          </Route>

          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="/admin/frizerji" element={<Soon title="Frizerji" />} />
            <Route path="/admin/storitve" element={<Soon title="Storitve" />} />
            <Route path="/admin/neprihodi" element={<Soon title="Neprihodi" />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
