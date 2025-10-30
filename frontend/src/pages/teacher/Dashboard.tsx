import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users, FileText, Calendar, Upload } from 'lucide-react';
import api from '@/lib/api';

export default function TeacherDashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/teacher/dashboard');
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Professor</h1>
          <p className="text-gray-600 mt-1">Suas turmas e atividades</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Minhas Turmas"
            value={dashboard?.my_classes?.length || 0}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Total Alunos"
            value={dashboard?.total_students || 0}
            icon={Users}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Materiais"
            value={dashboard?.total_materials || 0}
            icon={FileText}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Próximas Aulas"
            value={dashboard?.upcoming_lessons?.length || 0}
            icon={Calendar}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Turmas</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.my_classes?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.my_classes.map((cls: any) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{cls.class_name}</p>
                        <p className="text-sm text-gray-500">{cls.subject_name}</p>
                      </div>
                      <span className="text-sm text-gray-600">{cls.shift}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma turma atribuída</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Materiais Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recent_materials?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recent_materials.map((material: any) => (
                    <div
                      key={material.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{material.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(material.published_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum material enviado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
