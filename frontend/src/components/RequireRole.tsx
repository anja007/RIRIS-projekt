import { Navigate, Outlet } from 'react-router-dom';
import { homePathFor, useAuth } from '../auth';
import type { Role } from '../api';

/**
 * Neprijavljenega uporabnika preusmeri na prijavo, drugo vlogo pa na njeno začetno stran (US-02).
 * Z allowGuest stran vidi tudi gost (npr. prosti termini, US-07 kriterij 6).
 */
export default function RequireRole({ roles, allowGuest = false }: { roles: Role[]; allowGuest?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-muted">Nalaganje …</p>;
  if (!user) return allowGuest ? <Outlet /> : <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}
