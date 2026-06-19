import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ allowedRoles }) {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !user?.roles?.some(r => allowedRoles.includes(r))) {
    return <Navigate to="/dashboard" />;
  }
  return <Outlet />;
}
