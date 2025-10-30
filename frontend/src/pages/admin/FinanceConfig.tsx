import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { adminFinanceService } from '@/services/adminFinanceService';
import { groupService } from '@/services/groupService';
import { Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface ConfigFormData {
  price_per_school: string;
  due_day: string;
  payment_terms: string;
}

export default function AdminFinanceConfigPage() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['groups-finance-config'],
    queryFn: () => groupService.list({ limit: 100 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ConfigFormData>();

  const updateConfigMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: ConfigFormData }) =>
      adminFinanceService.updateConfig(groupId, {
        price_per_school: parseFloat(data.price_per_school),
        due_day: parseInt(data.due_day),
        payment_terms: data.payment_terms,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups-finance-config'] });
      toast.success('Configuração atualizada com sucesso!');
      closeModal();
    },
    onError: () => {
      toast.error('Erro ao atualizar configuração');
    },
  });

  const openModal = async (groupId: number) => {
    setSelectedGroupId(groupId);
    try {
      const config = await adminFinanceService.getConfig(groupId);
      reset({
        price_per_school: config.price_per_school?.toString() || '0',
        due_day: config.due_day?.toString() || '10',
        payment_terms: config.payment_terms || '',
      });
    } catch {
      reset({
        price_per_school: '0',
        due_day: '10',
        payment_terms: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGroupId(null);
    reset();
  };

  const onSubmit = (data: ConfigFormData) => {
    if (selectedGroupId) {
      updateConfigMutation.mutate({ groupId: selectedGroupId, data });
    }
  };

  const getGroupConfig = () => {
    // Simulação - em produção viria da API
    return {
      price_per_school: 0,
      due_day: 10,
      configured: false,
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Configuração de Cobranças</h1>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Como funciona:</strong> Configure o valor que cada grupo deverá pagar por escola cadastrada.
            O sistema calculará automaticamente o valor mensal (Nº de Escolas × Valor por Escola).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grupos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Grupo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Escolas Ativas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Valor por Escola
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Valor Mensal Estimado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Dia de Vencimento
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
                    {groupsData?.data.map((group) => {
                      const config = getGroupConfig();
                      const schoolsCount = 0; // TODO: Buscar da API
                      const estimatedMonthly = schoolsCount * config.price_per_school;
                      
                      return (
                        <tr key={group.id}>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{group.name}</div>
                            <div className="text-sm text-gray-500">{group.email || 'Sem contato'}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-2xl font-bold text-blue-600">
                              {schoolsCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              R$ {config.price_per_school.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500">por escola/mês</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-lg text-gray-900">
                              R$ {estimatedMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {schoolsCount > 0 && (
                              <div className="text-xs text-gray-500">
                                {schoolsCount} × R$ {config.price_per_school.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-gray-900 font-medium">
                              {config.due_day > 0 ? `Todo dia ${config.due_day}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {config.configured ? (
                              <div className="flex items-center justify-center gap-2 text-green-600">
                                <CheckCircle size={18} />
                                <span className="text-sm">Configurado</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 text-yellow-600">
                                <AlertCircle size={18} />
                                <span className="text-sm">Não Configurado</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              onClick={() => openModal(group.id)}
                              variant="secondary"
                              size="sm"
                            >
                              <Edit2 size={16} className="mr-2" />
                              {config.configured ? 'Editar' : 'Configurar'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {(!groupsData?.data || groupsData.data.length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Nenhum grupo cadastrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <CheckCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Cálculo Automático</p>
                  <p className="text-gray-600">
                    O valor mensal é calculado automaticamente multiplicando o número de escolas ativas pelo valor configurado por escola.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <CheckCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Atualização de Escolas</p>
                  <p className="text-gray-600">
                    Quando um grupo adiciona ou remove escolas, o valor da próxima cobrança será ajustado automaticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <CheckCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Dia de Vencimento</p>
                  <p className="text-gray-600">
                    Configure o dia do mês em que as cobranças vencem (de 1 a 28). Recomendamos entre os dias 5 e 15.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <CheckCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Termos de Pagamento</p>
                  <p className="text-gray-600">
                    Você pode adicionar instruções ou observações sobre formas de pagamento, descontos ou penalidades.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Configuração */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Configurar Cobrança do Grupo"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor por Escola (R$) *
            </label>
            <input
              {...register('price_per_school', {
                required: 'Campo obrigatório',
                min: { value: 0, message: 'Valor deve ser maior ou igual a 0' },
              })}
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0,00"
            />
            {errors.price_per_school && (
              <p className="text-red-600 text-sm mt-1">{errors.price_per_school.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Este valor será multiplicado pelo número de escolas ativas do grupo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dia de Vencimento *
            </label>
            <select
              {...register('due_day', { required: 'Campo obrigatório' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Selecione o dia</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Todo dia {day}
                </option>
              ))}
            </select>
            {errors.due_day && (
              <p className="text-red-600 text-sm mt-1">{errors.due_day.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Dia do mês em que a cobrança vence (1-28)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Termos de Pagamento (Opcional)
            </label>
            <textarea
              {...register('payment_terms')}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ex: Pagamento via PIX ou Transferência. Desconto de 5% para pagamento até o dia 5."
            />
            <p className="text-xs text-gray-500 mt-1">
              Instruções, descontos, penalidades ou outras informações relevantes
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">Exemplo de Cobrança:</p>
            <p className="text-sm text-gray-600">
              Se o grupo tem <strong>5 escolas</strong> e o valor por escola é <strong>R$ 100,00</strong>,
              a cobrança mensal será de <strong>R$ 500,00</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateConfigMutation.isPending}>
              {updateConfigMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
