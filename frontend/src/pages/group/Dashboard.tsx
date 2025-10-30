import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users, School, DollarSign } from 'lucide-react';
import api from '@/lib/api';

export default function GroupDashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['group-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/group/dashboard');
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Grupo</h1>
          <p className="text-gray-600 mt-1">Visão geral das escolas do grupo</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Escolas"
            value={dashboard?.total_schools || 0}
            icon={School}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Total de Alunos"
            value={dashboard?.total_students || 0}
            icon={Users}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Total de Professores"
            value={dashboard?.total_teachers || 0}
            icon={Users}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Receita Mensal"
            value={`R$ ${dashboard?.monthly_revenue?.toLocaleString('pt-BR') || '0,00'}`}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Escolas do Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.schools?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.schools.slice(0, 5).map((school: any) => (
                    <div
                      key={school.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <School className="text-blue-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">{school.name}</p>
                          <p className="text-sm text-gray-500">
                            {school.total_students || 0} alunos
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          school.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {school.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma escola cadastrada
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recent_payments?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recent_payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="text-green-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.student_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.paid_date || payment.due_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          R$ {payment.amount.toLocaleString('pt-BR')}
                        </p>
                        <span
                          className={`text-xs ${
                            payment.status === 'paid'
                              ? 'text-green-600'
                              : payment.status === 'overdue'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {payment.status === 'paid' ? 'Pago' : 
                           payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum pagamento recente
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Matrículas por Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard?.enrollments_by_shift?.map((item: any) => (
                  <div key={item.shift} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">
                      {item.shift === 'morning' ? 'Manhã' : 
                       item.shift === 'afternoon' ? 'Tarde' : 'Noite'}
                    </span>
                    <span className="font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pagos</span>
                  <span className="font-semibold text-green-600">
                    {dashboard?.payment_status?.paid || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pendentes</span>
                  <span className="font-semibold text-yellow-600">
                    {dashboard?.payment_status?.pending || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vencidos</span>
                  <span className="font-semibold text-red-600">
                    {dashboard?.payment_status?.overdue || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Acadêmico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Turmas Ativas</span>
                  <span className="font-semibold text-gray-900">
                    {dashboard?.total_classes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Disciplinas</span>
                  <span className="font-semibold text-gray-900">
                    {dashboard?.total_subjects || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taxa de Aprovação</span>
                  <span className="font-semibold text-green-600">
                    {dashboard?.approval_rate || 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
