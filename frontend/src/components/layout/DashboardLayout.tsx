import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  FileText,
  DollarSign,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  label: string;
  path: string;
  icon: any;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ROLE_SUPERADMIN],
  },
  {
    label: 'Dashboard',
    path: '/group/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ROLE_GROUP_MANAGER],
  },
  {
    label: 'Dashboard',
    path: '/school/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ROLE_SCHOOL_SECRETARY],
  },
  {
    label: 'Dashboard',
    path: '/teacher/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ROLE_TEACHER],
  },
  {
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ROLE_STUDENT],
  },
  {
    label: 'Grupos',
    path: '/admin/groups',
    icon: School,
    roles: [UserRole.ROLE_SUPERADMIN],
  },
  {
    label: 'Escolas',
    path: '/admin/schools',
    icon: School,
    roles: [UserRole.ROLE_SUPERADMIN],
  },
  {
    label: 'Finanças',
    path: '/admin/finance',
    icon: DollarSign,
    roles: [UserRole.ROLE_SUPERADMIN],
  },
  {
    label: 'Escolas',
    path: '/group/schools',
    icon: School,
    roles: [UserRole.ROLE_GROUP_MANAGER],
  },
  {
    label: 'Alunos',
    path: '/students',
    icon: Users,
    roles: [UserRole.ROLE_SCHOOL_SECRETARY, UserRole.ROLE_TEACHER],
  },
  {
    label: 'Professores',
    path: '/teachers',
    icon: GraduationCap,
    roles: [UserRole.ROLE_SCHOOL_SECRETARY],
  },
  {
    label: 'Turmas',
    path: '/classes',
    icon: Users,
    roles: [UserRole.ROLE_SCHOOL_SECRETARY],
  },
  {
    label: 'Disciplinas',
    path: '/subjects',
    icon: BookOpen,
    roles: [UserRole.ROLE_SCHOOL_SECRETARY],
  },
  {
    label: 'Matrículas',
    path: '/enrollments',
    icon: FileText,
    roles: [UserRole.ROLE_SCHOOL_SECRETARY],
  },
  {
    label: 'Materiais',
    path: '/materials',
    icon: FileText,
    roles: [UserRole.ROLE_TEACHER],
  },
  {
    label: 'Notas',
    path: '/grades',
    icon: FileText,
    roles: [UserRole.ROLE_TEACHER],
  },
  {
    label: 'Faltas',
    path: '/absences',
    icon: FileText,
    roles: [UserRole.ROLE_TEACHER],
  },
  {
    label: 'Minhas Notas',
    path: '/student/grades',
    icon: FileText,
    roles: [UserRole.ROLE_STUDENT],
  },
  {
    label: 'Minhas Faltas',
    path: '/student/absences',
    icon: FileText,
    roles: [UserRole.ROLE_STUDENT],
  },
  {
    label: 'Materiais',
    path: '/student/materials',
    icon: FileText,
    roles: [UserRole.ROLE_STUDENT],
  },
  {
    label: 'Pagamentos',
    path: '/group/payments',
    icon: DollarSign,
    roles: [UserRole.ROLE_GROUP_MANAGER],
  },
];

export function DashboardLayout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth, hasRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter((item) => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">Easy Escola</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-[57px] left-0 z-30 w-64 h-[calc(100vh-57px)] bg-white shadow-lg transition-transform duration-300`}
        >
          <nav className="p-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
