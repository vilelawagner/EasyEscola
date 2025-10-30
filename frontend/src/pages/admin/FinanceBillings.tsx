import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { adminFinanceService, GroupBilling } from '@/services/adminFinanceService';
import { groupService } from '@/services/groupService';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Download
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function AdminBillingsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'paid' | 'overdue' | 'cancelled'>('');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(searchParams.get('action') === 'generate');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<GroupBilling | null>(null);

  const { data: billingsData, isLoading } = useQuery({
    queryKey: ['admin-billings', page, search, statusFilter],
    queryFn: () => adminFinanceService.listBillings({
      page,
      limit: 15,
      search,
      status: statusFilter || undefined,
    }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups-for-billing'],
    queryFn: () => groupService.list({ limit: 100, status: 'active' }),
  });

  const { register: registerGenerate, handleSubmit: handleSubmitGenerate, reset: resetGenerate } = useForm<{ reference_month: string }>();
  const { register: registerPay, handleSubmit: handleSubmitPay, reset: resetPay } = useForm<{ payment_method: string }>();

  const generateMutation = useMutation({
    mutationFn: (month: string) => adminFinanceService.generateMonthlyBillings(month),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-billings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-dashboard'] });
      toast.success(`${data.created} cobrança(s) gerada(s) com sucesso!`);
      closeGenerateModal();
    },
    onError: () => {
      toast.error('Erro ao gerar cobranças');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, paymentMethod }: { id: number; paymentMethod: string }) =>
      adminFinanceService.markAsPaid(id, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-dashboard'] });
      toast.success('Pagamento confirmado com sucesso!');
      closePayModal();
    },
    onError: () => {
      toast.error('Erro ao confirmar pagamento');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: adminFinanceService.cancelBilling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-dashboard'] });
      toast.success('Cobrança cancelada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cancelar cobrança');
    },
  });

  const openGenerateModal = () => {
    resetGenerate({
      reference_month: new Date().toISOString().slice(0, 7),
    });
    setIsGenerateModalOpen(true);
  };

  const closeGenerateModal = () => {
    setIsGenerateModalOpen(false);
    resetGenerate();
  };

  const openPayModal = (billing: GroupBilling) => {
    setSelectedBilling(billing);
    resetPay({ payment_method: 'pix' });
    setIsPayModalOpen(true);
  };

  const closePayModal = () => {
    setIsPayModalOpen(false);
    setSelectedBilling(null);
    resetPay();
  };

  const onSubmitGenerate = (data: { reference_month: string }) => {
    if (window.confirm(`Tem certeza que deseja gerar cobranças para ${new Date(data.reference_month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}?`)) {
      generateMutation.mutate(data.reference_month);
    }
  };

  const onSubmitPay = (data: { payment_method: string }) => {
    if (selectedBilling) {
      markPaidMutation.mutate({
        id: selectedBilling.id,
        paymentMethod: data.payment_method,
      });
    }
  };

  const handleCancel = (id: number) => {
    if (window.confirm('Tem certeza que deseja cancelar esta cobrança?')) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'overdue':
        return <XCircle className="text-red-600" size={20} />;
      case 'cancelled':
        return <XCircle className="text-gray-600" size={20} />;
      default:
        return <AlertCircle className="text-yellow-600" size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cobranças dos Grupos</h1>
          <div className="flex gap-3">
            <Button variant="secondary">
              <Download size={20} className="mr-2" />
              Exportar
            </Button>
            <Button onClick={openGenerateModal}>
              <Calendar size={20} className="mr-2" />
              Gerar Cobranças
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <CardTitle>Lista de Cobranças</CardTitle>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar grupo..."
                />
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
                          Grupo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Mês Ref.
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Escolas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {billingsData?.data.map((billing) => (
                        <tr key={billing.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {billing.group_name || `Grupo #${billing.group_id}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(billing.reference_month + '-01').toLocaleDateString('pt-BR', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="font-semibold text-gray-900">
                              {billing.total_schools}
                            </span>
                            <div className="text-xs text-gray-500">
                              R$ {billing.price_per_school.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              R$ {billing.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {billing.payment_method && (
                              <div className="text-xs text-gray-500">{billing.payment_method}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className={billing.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                              {new Date(billing.due_date).toLocaleDateString('pt-BR')}
                            </div>
                            {billing.paid_date && (
                              <div className="text-xs text-green-600">
                                Pago: {new Date(billing.paid_date).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(billing.status)}
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(billing.status)}`}>
                                {getStatusLabel(billing.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {(billing.status === 'pending' || billing.status === 'overdue') && (
                                <>
                                  <Button
                                    onClick={() => openPayModal(billing)}
                                    variant="success"
                                    size="sm"
                                  >
                                    Confirmar
                                  </Button>
                                  <Button
                                    onClick={() => handleCancel(billing.id)}
                                    variant="danger"
                                    size="sm"
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              {billing.status === 'paid' && (
                                <span className="text-sm text-green-600">✓ Pago</span>
                              )}
                              {billing.status === 'cancelled' && (
                                <span className="text-sm text-gray-500">Cancelado</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {(!billingsData?.data || billingsData.data.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhuma cobrança encontrada</p>
                    </div>
                  )}
                </div>

                {billingsData && billingsData.pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={billingsData.pagination.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Gerar Cobranças */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={closeGenerateModal}
        title="Gerar Cobranças Mensais"
      >
        <form onSubmit={handleSubmitGenerate(onSubmitGenerate)} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              Esta ação irá gerar cobranças automáticas para <strong>todos os grupos ativos</strong> com base no número de escolas cadastradas e no valor configurado por escola.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mês de Referência *
            </label>
            <input
              {...registerGenerate('reference_month', { required: true })}
              type="month"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {groupsData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Resumo:
              </p>
              <p className="text-sm text-gray-600">
                • <strong>{groupsData.data.length}</strong> grupo(s) ativo(s)
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Apenas grupos com configuração de cobrança terão cobranças geradas.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeGenerateModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Gerando...' : 'Gerar Cobranças'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmar Pagamento */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={closePayModal}
        title="Confirmar Recebimento"
      >
        <form onSubmit={handleSubmitPay(onSubmitPay)} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Grupo:</strong> {selectedBilling?.group_name || `#${selectedBilling?.group_id}`}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Mês:</strong> {selectedBilling && new Date(selectedBilling.reference_month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Valor:</strong> R$ {selectedBilling?.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Escolas:</strong> {selectedBilling?.total_schools} x R$ {selectedBilling?.price_per_school.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pagamento *
            </label>
            <select
              {...registerPay('payment_method', { required: true })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência Bancária</option>
              <option value="boleto">Boleto</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closePayModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="success" disabled={markPaidMutation.isPending}>
              Confirmar Recebimento
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
