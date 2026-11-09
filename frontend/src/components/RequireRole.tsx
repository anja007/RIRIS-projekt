import { Navigate, Outlet } from 'react-router-dom';
import { homePathFor, useAuth } from '../auth';
import type { Role } from '../api';

/** Neprijavljenega uporabnika preusmeri na prijavo, drugo vlogo pa na njeno začetno stran. */
export default function RequireRole({ roles }: { roles: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-gray-500">Nalaganje ...</p>;
  if (!user) return <Navigate to="/prijava" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}
