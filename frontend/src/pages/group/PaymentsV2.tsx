import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { groupPaymentService } from '@/services/groupPaymentService';
import { 
  DollarSign, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  School
} from 'lucide-react';

export default function GroupPaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'paid' | 'pending' | 'late' | ''>('');
  const [monthFilter, setMonthFilter] = useState('');

  // Buscar resumo dos pagamentos
  const { data: summary } = useQuery({
    queryKey: ['group-payments-summary', monthFilter],
    queryFn: () => groupPaymentService.getSummary(monthFilter || undefined),
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  // Buscar lista de pagamentos
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['group-payments', page, statusFilter, monthFilter],
    queryFn: () => groupPaymentService.list({
      page,
      limit: 10,
      status: statusFilter || undefined,
      month: monthFilter || undefined,
    }),
  });

  const totalReceivable = parseFloat(summary?.total_paid || '0') + parseFloat(summary?.total_pending || '0');
  const totalReceived = parseFloat(summary?.total_paid || '0');
  const totalPending = parseFloat(summary?.total_pending || '0');
  const paidCount = Number(summary?.paid_count || 0);
  const pendingCount = Number(summary?.pending_count || 0);
  const lateCount = Number(summary?.late_count || 0);

  const receivedPercentage = totalReceivable > 0 
    ? ((totalReceived / totalReceivable) * 100).toFixed(1) 
    : '0';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'late':
        return 'Atrasado';
      default:
        return 'Pendente';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Pagamentos</h1>
          <p className="text-gray-600 mt-1">Controle de mensalidades dos alunos</p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent>
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total a Receber</p>
                  <DollarSign className="text-blue-600" size={24} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
                  R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${receivedPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-xs text-gray-600 font-medium">{receivedPercentage}%</span>
                  </div>
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
                <p className="text-2xl md:text-3xl font-bold text-green-600 break-words">
                  R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {paidCount} pagamento{paidCount !== 1 ? 's' : ''}
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
                <p className="text-2xl md:text-3xl font-bold text-yellow-600 break-words">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {pendingCount} mensalidade{pendingCount !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Atrasados</p>
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-red-600 break-words">
                  {lateCount}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  pagamento{lateCount !== 1 ? 's' : ''} atrasado{lateCount !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de Inadimplência */}
        {lateCount > 0 && (
          <Card>
            <CardContent>
              <div className="flex items-start gap-3 py-4">
                <AlertTriangle className="text-red-600 mt-1" size={24} />
                <div className="flex-1">
                  <p className="font-semibold text-red-800 text-lg">
                    {lateCount} Pagamento{lateCount !== 1 ? 's' : ''} Atrasado{lateCount !== 1 ? 's' : ''}!
                  </p>
                  <p className="text-gray-600 mt-1">
                    Há mensalidades vencidas que precisam de atenção. Entre em contato com os responsáveis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Pagamentos */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <CardTitle>Lista de Pagamentos</CardTitle>
              <div className="flex flex-wrap gap-3">
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos os meses</option>
                  <option value="2025-01">Janeiro/2025</option>
                  <option value="2025-02">Fevereiro/2025</option>
                  <option value="2025-03">Março/2025</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as '' | 'paid' | 'pending' | 'late')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="late">Atrasado</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Escola
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Mês Ref.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentsData?.data.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <School size={16} className="text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {payment.school_name || `Escola #${payment.school_id}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.reference_month + '-01').toLocaleDateString('pt-BR', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">
                              R$ {parseFloat(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {payment.method && (
                              <div className="text-xs text-gray-500 capitalize">{payment.method}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="text-gray-700">
                              {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                            </div>
                            {payment.paid_date && (
                              <div className="text-xs text-green-600">
                                Pago: {new Date(payment.paid_date).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                              {getStatusLabel(payment.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {(!paymentsData?.data || paymentsData.data.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhum pagamento encontrado</p>
                    </div>
                  )}
                </div>

                {paymentsData && paymentsData.pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={page}
                      totalPages={paymentsData.pagination.totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
