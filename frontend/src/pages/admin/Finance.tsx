import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminFinanceService } from '@/services/adminFinanceService';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminFinanceDashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-finance-dashboard'],
    queryFn: () => adminFinanceService.getDashboard(),
    refetchInterval: 30000, // Atualiza a cada 30s
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

  const totalReceivable = dashboard?.total_receivable || 0;
  const totalReceived = dashboard?.total_received || 0;
  const totalPending = dashboard?.total_pending || 0;
  const totalOverdue = dashboard?.total_overdue || 0;
  const overdueCount = dashboard?.overdue_count || 0;
  const pendingCount = dashboard?.pending_count || 0;

  const receivedPercentage = totalReceivable > 0 
    ? ((totalReceived / totalReceivable) * 100).toFixed(1) 
    : '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão Financeira</h1>
            <p className="text-gray-600 mt-1">Controle de recebimentos dos grupos</p>
          </div>
          <Link to="/admin/finance/billings">
            <Button>
              <Calendar size={20} className="mr-2" />
              Ver Todas as Cobranças
            </Button>
          </Link>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent>
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total a Receber</p>
                  <DollarSign className="text-blue-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${receivedPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{receivedPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Recebido</p>
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {dashboard?.paid_count || 0} pagamento{dashboard?.paid_count !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Pendente</p>
                  <Clock className="text-yellow-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-yellow-600">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {pendingCount} cobrança{pendingCount !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Vencido</p>
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-red-600">
                  R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {overdueCount} vencido{overdueCount !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Inadimplência */}
        {overdueCount > 0 && (
          <Card>
            <CardContent>
              <div className="flex items-start gap-3 py-4">
                <AlertTriangle className="text-red-600 mt-1" size={24} />
                <div className="flex-1">
                  <p className="font-semibold text-red-800 text-lg">
                    {overdueCount} Cobrança{overdueCount !== 1 ? 's' : ''} Vencida{overdueCount !== 1 ? 's' : ''}!
                  </p>
                  <p className="text-gray-600 mt-1">
                    Você tem cobranças vencidas no valor total de <strong>R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. 
                    Entre em contato com os grupos inadimplentes.
                  </p>
                  <Link to="/admin/finance/billings?status=overdue">
                    <Button variant="danger" size="sm" className="mt-3">
                      Ver Cobranças Vencidas
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid com 2 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cobranças Vencidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="text-red-600" size={20} />
                Cobranças Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.overdue_billings && dashboard.overdue_billings.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.overdue_billings.slice(0, 5).map((billing) => (
                    <div
                      key={billing.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {billing.group_name || `Grupo #${billing.group_id}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(billing.reference_month + '-01').toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Venceu em {new Date(billing.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          R$ {billing.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {billing.total_schools} escola{billing.total_schools !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-green-600 mb-2" size={40} />
                  <p className="text-gray-500">Nenhuma cobrança vencida</p>
                  <p className="text-sm text-green-600 mt-1">Todos os pagamentos em dia!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagamentos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                Pagamentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recent_payments && dashboard.recent_payments.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recent_payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {payment.group_name || `Grupo #${payment.group_id}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.reference_month + '-01').toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Pago em {payment.paid_date && new Date(payment.paid_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          R$ {payment.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.payment_method || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto text-gray-400 mb-2" size={40} />
                  <p className="text-gray-500">Nenhum pagamento recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Receita Mensal */}
        {dashboard?.monthly_revenue && dashboard.monthly_revenue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} />
                Receita Mensal (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.monthly_revenue.map((item) => {
                  const maxAmount = Math.max(...dashboard.monthly_revenue.map(r => r.amount));
                  const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={item.month}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(item.month + '-01').toLocaleDateString('pt-BR', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/finance/billings?action=generate">
                <Button variant="primary" className="w-full">
                  <Calendar size={18} className="mr-2" />
                  Gerar Cobranças do Mês
                </Button>
              </Link>
              <Link to="/admin/finance/config">
                <Button variant="secondary" className="w-full">
                  <DollarSign size={18} className="mr-2" />
                  Configurar Valores
                </Button>
              </Link>
              <Link to="/admin/finance/reports">
                <Button variant="secondary" className="w-full">
                  <TrendingUp size={18} className="mr-2" />
                  Ver Relatórios
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
