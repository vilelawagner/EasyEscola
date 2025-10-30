import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  studentId: number | null;
  isAuthenticated: boolean;
  
  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    studentId?: number;
  }) => void;
  
  clearAuth: () => void;
  
  updateUser: (user: Partial<User>) => void;
  
  hasRole: (roles: UserRole[]) => boolean;
  
  getAccessLevel: () => number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      studentId: null,
      isAuthenticated: false,

      setAuth: (data) => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          studentId: data.studentId || null,
          isAuthenticated: true,
        });
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          studentId: null,
          isAuthenticated: false,
        });
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      hasRole: (roles) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },

      getAccessLevel: () => {
        const user = get().user;
        if (!user) return 0;

        switch (user.role) {
          case UserRole.ROLE_SUPERADMIN:
            return 1;
          case UserRole.ROLE_GROUP_MANAGER:
            return 2;
          case UserRole.ROLE_SCHOOL_SECRETARY:
          case UserRole.ROLE_TEACHER:
            return 3;
          case UserRole.ROLE_STUDENT:
            return 4;
          default:
            return 0;
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
