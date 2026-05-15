import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'nasabah')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    if (userProfile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/nasabah" replace />;
    }
  }

  if (!userProfile.isActive) {
    return <Navigate to="/login?reason=inactive" replace />;
  }

  return <Outlet />;
}
