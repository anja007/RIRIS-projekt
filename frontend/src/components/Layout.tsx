import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import type { Role } from '../api';

const LINKS: Record<Role, { to: string; label: string }[]> = {
  CLIENT: [
    { to: '/booking', label: 'Rezervacija' },
    { to: '/my-appointments', label: 'Moji termini' },
  ],
  HAIRDRESSER: [{ to: '/schedule', label: 'Moj urnik' }],
  ADMIN: [
    { to: '/admin/hairdressers', label: 'Frizerji' },
    { to: '/admin/services', label: 'Storitve' },
    { to: '/admin/no-shows', label: 'Neprihodi' },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  CLIENT: '',
  HAIRDRESSER: 'frizer',
  ADMIN: 'administrator',
};

const navClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 py-1 ${isActive ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg'}`;

/** Glava kot v wireframih: logotip levo, meni vloge in uporabnik desno; administrator ima zavihke v drugi vrstici. */
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
          <NavLink to="/" className="rounded-md border-2 border-fg px-4 py-1 font-display text-2xl">
            Salonko
          </NavLink>
          <nav className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-2">
            {user && !isAdmin && LINKS[user.role].map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <span className="rounded-lg border border-line px-3 py-1 text-sm">
                  {user.firstName} {user.lastName}
                  {ROLE_LABELS[user.role] && <span className="text-muted"> · {ROLE_LABELS[user.role]}</span>}
                </span>
                <button onClick={handleLogout} className="cursor-pointer text-muted hover:text-fg">
                  Odjava
                </button>
              </>
            ) : (
              // gost: cenik in prosti termini sta ena stran (čarovnik), poleg je prijava
              <>
                <NavLink to="/booking" className={navClass}>
                  Cenik in termini
                </NavLink>
                <NavLink to="/login" className={navClass}>
                  Prijava
                </NavLink>
              </>
            )}
          </nav>
        </div>
        {isAdmin && (
          <nav className="mx-auto flex max-w-6xl gap-1 px-4">
            {LINKS.ADMIN.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `-mb-px rounded-t-lg border px-4 py-2 ${isActive ? 'border-line border-b-surface bg-bg text-fg' : 'border-transparent text-muted hover:text-fg'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
