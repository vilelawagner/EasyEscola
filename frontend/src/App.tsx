import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard'
import AdminGroupsPage from './pages/admin/Groups'
import AdminSchoolsPage from './pages/admin/Schools'
import AdminFinancePage from './pages/admin/Finance'
import AdminBillingsPage from './pages/admin/FinanceBillings'
import AdminFinanceConfigPage from './pages/admin/FinanceConfig'
import GroupDashboard from './pages/group/Dashboard'
import GroupSchoolsPage from './pages/group/Schools'
import GroupPaymentsPage from './pages/group/Payments'
import SchoolDashboard from './pages/school/Dashboard'
import StudentsPage from './pages/school/Students'
import TeachersPage from './pages/school/Teachers'
import ClassesPage from './pages/school/Classes'
import SubjectsPage from './pages/school/Subjects'
import EnrollmentsPage from './pages/school/Enrollments'
import SchoolFinancePage from './pages/school/Finance'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherMaterialsPage from './pages/teacher/Materials'
import TeacherGradesPage from './pages/teacher/Grades'
import TeacherAbsencesPage from './pages/teacher/Absences'
import StudentDashboard from './pages/student/Dashboard'
import StudentGradesPage from './pages/student/Grades'
import StudentAbsencesPage from './pages/student/Absences'
import StudentMaterialsPage from './pages/student/Materials'
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { useAuthStore } from './store/authStore';
import { UserRole } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RoleBasedRedirect() {
  const user = useAuthStore((state) => state.user);
  
  if (!user) return <Navigate to="/login" replace />;
  
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleBasedRedirect />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SUPERADMIN]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/groups" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SUPERADMIN]}>
              <AdminGroupsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/schools" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SUPERADMIN]}>
              <AdminSchoolsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/finance" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SUPERADMIN]}>
              <AdminFinancePage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/finance/billings" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SUPERADMIN]}>
              <AdminBillingsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/finance/config" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SUPERADMIN]}>
              <AdminFinanceConfigPage />
            </RoleProtectedRoute>
          } />
          
          {/* Group Manager Routes */}
          <Route path="/group/dashboard" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_GROUP_MANAGER]}>
              <GroupDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/group/schools" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_GROUP_MANAGER]}>
              <GroupSchoolsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/group/payments" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_GROUP_MANAGER]}>
              <GroupPaymentsPage />
            </RoleProtectedRoute>
          } />
          
          {/* School Secretary Routes */}
          <Route path="/school/dashboard" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SCHOOL_SECRETARY]}>
              <SchoolDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/students" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SCHOOL_SECRETARY]}>
              <StudentsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/teachers" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SCHOOL_SECRETARY]}>
              <TeachersPage />
            </RoleProtectedRoute>
          } />
          <Route path="/classes" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SCHOOL_SECRETARY]}>
              <ClassesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/subjects" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SCHOOL_SECRETARY]}>
              <SubjectsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/enrollments" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SCHOOL_SECRETARY]}>
              <EnrollmentsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/school/finance" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_SCHOOL_SECRETARY]}>
              <SchoolFinancePage />
            </RoleProtectedRoute>
          } />
          
          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_TEACHER]}>
              <TeacherDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/materials" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_TEACHER]}>
              <TeacherMaterialsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/grades" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_TEACHER]}>
              <TeacherGradesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/absences" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_TEACHER]}>
              <TeacherAbsencesPage />
            </RoleProtectedRoute>
          } />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_STUDENT]}>
              <StudentDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/student/grades" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_STUDENT]}>
              <StudentGradesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/student/absences" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_STUDENT]}>
              <StudentAbsencesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/student/materials" element={
            <RoleProtectedRoute allowedRoles={[UserRole.ROLE_STUDENT]}>
              <StudentMaterialsPage />
            </RoleProtectedRoute>
          } />
        </Routes>
      </Router>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
