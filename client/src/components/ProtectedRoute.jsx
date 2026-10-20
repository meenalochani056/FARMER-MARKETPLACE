import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
export function RoleRoute({ role }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />;
}
