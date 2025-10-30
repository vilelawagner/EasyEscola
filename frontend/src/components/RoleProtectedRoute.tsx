import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário não tem permissão, redireciona para o dashboard dele
  if (!allowedRoles.includes(user.role)) {
    switch (user.role) {
      case UserRole.ROLE_SUPERADMIN:
        return <Navigate to="/admin/dashboard" replace />;
      case UserRole.ROLE_GROUP_MANAGER:
        return <Navigate to="/group/dashboard" replace />;
      case UserRole.ROLE_SCHOOL_SECRETARY:
        return <Navigate to="/school/dashboard" replace />;
      case UserRole.ROLE_TEACHER:
        return <Navigate to="/teacher/dashboard" replace />;
      case UserRole.ROLE_STUDENT:
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
