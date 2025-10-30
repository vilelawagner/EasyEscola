import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { School, Users, DollarSign, BookOpen } from 'lucide-react';
import api from '@/lib/api';

export default function SchoolDashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['school-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/school/dashboard');
      return data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Secretaria</h1>
          <p className="text-gray-600 mt-1">Gestão escolar</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Alunos"
            value={dashboard?.total_students || 0}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Total de Professores"
            value={dashboard?.total_teachers || 0}
            icon={Users}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Turmas Ativas"
            value={dashboard?.active_classes || 0}
            icon={School}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Disciplinas"
            value={dashboard?.total_subjects || 0}
            icon={BookOpen}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alunos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recent_students?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recent_students.map((student: any) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">RA: {student.ra}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum aluno cadastrado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.active_teachers?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.active_teachers.map((teacher: any) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{teacher.name}</p>
                        <p className="text-sm text-gray-500">{teacher.specialization || 'N/A'}</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum professor cadastrado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
