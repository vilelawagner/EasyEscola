import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BookOpen, FileText, Award, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function StudentDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['student-overview'],
    queryFn: async () => {
      const { data } = await api.get('/student/overview');
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
          <h1 className="text-3xl font-bold text-gray-900">Meu Painel</h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo(a), {overview?.student?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Turma"
            value={overview?.enrollment?.class_name || 'N/A'}
            icon={BookOpen}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Média Geral"
            value={overview?.avg_grade || 'N/A'}
            icon={Award}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Faltas"
            value={overview?.total_absences || 0}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
          <StatCard
            title="Turno"
            value={overview?.enrollment?.shift || 'N/A'}
            icon={BookOpen}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Aluno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{overview?.student?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">RA:</span>
                  <span className="font-medium">{overview?.student?.ra}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">CPF:</span>
                  <span className="font-medium">{overview?.student?.cpf}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{overview?.student?.email || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desempenho Acadêmico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Média Geral:</span>
                  <span className={`text-2xl font-bold ${
                    parseFloat(overview?.avg_grade || '0') >= 7 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {overview?.avg_grade || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total de Faltas:</span>
                  <span className={`text-2xl font-bold ${
                    (overview?.total_absences || 0) > 10 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {overview?.total_absences || 0}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {parseFloat(overview?.avg_grade || '0') >= 7
                      ? '🎉 Parabéns! Continue assim!'
                      : '📚 Continue se dedicando aos estudos!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Materiais</span>
              </button>
              <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Notas</span>
              </button>
              <button className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Faltas</span>
              </button>
              <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Disciplinas</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
