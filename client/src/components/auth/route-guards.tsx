import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '@/components/full-page-spinner';
import { useCurrentUser } from '@/hooks/use-auth';

export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function GuestOnly() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isPending) return <FullPageSpinner />;
  if (user) return <Navigate to={from} replace />;
  return <Outlet />;
}
