import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  schoolFinanceService,
  type StudentPayment,
  type Defaulter,
} from '../../services/schoolFinanceService';
import { studentService } from '../../services/studentService';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  CheckCircle,
} from 'lucide-react';

const Finance = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<StudentPayment | null>(null);
  const [showDefaultersModal, setShowDefaultersModal] = useState(false);

  // Queries
  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['finance-summary', selectedMonth],
    queryFn: () => schoolFinanceService.getSummary(selectedMonth),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['student-payments', selectedMonth, statusFilter],
    queryFn: () =>
      schoolFinanceService.listPayments({
        month: selectedMonth,
        status: statusFilter || undefined,
        limit: 50,
      }),
  });

  const { data: defaultersData } = useQuery({
    queryKey: ['defaulters'],
    queryFn: () => schoolFinanceService.listDefaulters({ limit: 100 }),
    enabled: showDefaultersModal,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-active'],
    queryFn: () => studentService.list({ limit: 1000 }),
    enabled: showGenerateModal,
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: schoolFinanceService.generateBoleto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      setShowGenerateModal(false);
      alert('Boleto gerado com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao gerar boleto');
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: ({ id, data }: any) => schoolFinanceService.markAsPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      setShowPayModal(false);
      setSelectedPayment(null);
      alert('Pagamento confirmado!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao confirmar pagamento');
    },
  });

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetchSummary();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchSummary]);

  const handleGenerateBoleto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    generateMutation.mutate({
      studentId: parseInt(formData.get('studentId') as string),
      referenceMonth: formData.get('referenceMonth') as string,
      amount: parseFloat(formData.get('amount') as string),
      dueDate: formData.get('dueDate') as string,
      description: formData.get('description') as string,
    });
  };

  const handleMarkAsPaid = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPayment) return;
    const formData = new FormData(e.currentTarget);
    markAsPaidMutation.mutate({
      id: selectedPayment.id,
      data: {
        paymentMethod: formData.get('paymentMethod') as any,
        amountPaid: parseFloat(formData.get('amountPaid') as string),
        paidDate: formData.get('paidDate') as string,
        notes: formData.get('notes') as string,
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      late: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      late: 'Atrasado',
      cancelled: 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const receivedPercentage = summary
    ? ((summary.total_received / (summary.total_expected || 1)) * 100).toFixed(1)
    : '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-gray-500">Gerenciamento de pagamentos dos alunos</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Gerar Boleto
          </button>
        </div>

      {/* Filtro de Mês */}
      <div className="flex gap-4 items-center">
        <label className="font-medium">Mês:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Esperado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold break-words">
              {formatCurrency(summary?.total_expected || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor total a receber no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600 break-words">
              {formatCurrency(summary?.total_received || 0)}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{receivedPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${receivedPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-yellow-600 break-words">
              {formatCurrency(summary?.total_pending || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-red-600 break-words">
              {formatCurrency(summary?.total_late || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.late_count || 0} pagamentos •{' '}
              {summary?.defaulters_count || 0} alunos
            </p>
            {(summary?.defaulters_count || 0) > 0 && (
              <button
                onClick={() => setShowDefaultersModal(true)}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Ver inadimplentes →
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Inadimplência */}
      {(summary?.late_count || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">
              Atenção: {summary?.late_count} pagamentos atrasados
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Há {summary?.defaulters_count} alunos com pagamentos em atraso.
              Entre em contato com os responsáveis.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos dos Alunos</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Lista de todos os pagamentos gerados
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="late">Atrasado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Tabela de Pagamentos */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    RA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aluno
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentsData?.data?.map((payment: StudentPayment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {payment.student_ra}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {payment.student_name}
                    </td>
                    <td className="px-4 py-4 text-sm">{payment.description}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {formatDate(payment.due_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPayModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Confirmar Pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!paymentsData?.data || paymentsData.data.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Nenhum pagamento encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Gerar Boleto */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Gerar Boleto</h2>
            <form onSubmit={handleGenerateBoleto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Aluno *</label>
                <select
                  name="studentId"
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {studentsData?.data?.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.ra} - {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mês de Referência *
                </label>
                <input
                  type="month"
                  name="referenceMonth"
                  defaultValue={selectedMonth}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor *</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Ex: Mensalidade Outubro 2025"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'Gerando...' : 'Gerar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Pagamento */}
      {showPayModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirmar Pagamento</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm">
                <strong>Aluno:</strong> {selectedPayment.student_name}
              </p>
              <p className="text-sm">
                <strong>Descrição:</strong> {selectedPayment.description}
              </p>
              <p className="text-sm">
                <strong>Valor:</strong> {formatCurrency(selectedPayment.amount)}
              </p>
            </div>
            <form onSubmit={handleMarkAsPaid} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Forma de Pagamento *
                </label>
                <select
                  name="paymentMethod"
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="boleto">Boleto</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valor Pago *
                </label>
                <input
                  type="number"
                  name="amountPaid"
                  step="0.01"
                  min="0"
                  defaultValue={selectedPayment.amount}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  name="paidDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Observações sobre o pagamento..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={markAsPaidMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {markAsPaidMutation.isPending ? 'Confirmando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedPayment(null);
                  }}
                  className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inadimplentes */}
      {showDefaultersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Alunos Inadimplentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      RA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pagamentos Atrasados
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dívida Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {defaultersData?.data?.map((defaulter: Defaulter) => (
                    <tr key={defaulter.student_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {defaulter.student_ra}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {defaulter.student_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {defaulter.student_email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        {defaulter.late_payments_count}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                        {formatCurrency(defaulter.total_debt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDefaultersModal(false)}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default Finance;
