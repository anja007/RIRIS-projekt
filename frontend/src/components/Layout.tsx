import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import type { Role } from '../api';

const LINKS: Record<Role, { to: string; label: string }[]> = {
  CLIENT: [
    { to: '/rezervacija', label: 'Rezervacija' },
    { to: '/moji-termini', label: 'Moji termini' },
  ],
  HAIRDRESSER: [{ to: '/urnik', label: 'Moj urnik' }],
  ADMIN: [
    { to: '/admin/frizerji', label: 'Frizerji' },
    { to: '/admin/storitve', label: 'Storitve' },
    { to: '/admin/neprihodi', label: 'Neprihodi' },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  CLIENT: 'stranka',
  HAIRDRESSER: 'frizer',
  ADMIN: 'administrator',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/prijava');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="rounded border-2 border-gray-800 px-3 py-1 text-xl font-semibold">Salonko</span>
          {user && (
            <nav className="flex flex-1 gap-4">
              {LINKS[user.role].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `border-b-2 py-1 text-sm ${isActive ? 'border-gray-800 font-medium' : 'border-transparent text-gray-600'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
          {user && (
            <div className="ml-auto flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                {user.firstName} {user.lastName} · {ROLE_LABELS[user.role]}
              </span>
              <button onClick={handleLogout} className="font-medium hover:underline">
                Odjava
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
