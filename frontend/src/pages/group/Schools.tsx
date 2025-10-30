import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { schoolService, CreateSchoolData, UpdateSchoolData } from '@/services/schoolService';
import { School } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function GroupSchoolsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['group-schools', page, search],
    queryFn: () => schoolService.list({ page, limit: 10, search }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSchoolData>();

  const createMutation = useMutation({
    mutationFn: schoolService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-schools'] });
      toast.success('Escola criada com sucesso!');
      closeModal();
    },
    onError: () => {
      toast.error('Erro ao criar escola');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSchoolData }) =>
      schoolService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-schools'] });
      toast.success('Escola atualizada com sucesso!');
      closeModal();
    },
    onError: () => {
      toast.error('Erro ao atualizar escola');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: schoolService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-schools'] });
      toast.success('Escola excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir escola');
    },
  });

  const openModal = (school?: School) => {
    if (school) {
      setEditingSchool(school);
      reset({
        name: school.name,
        cnpj: school.cnpj,
        phone: school.phone || '',
        email: school.email || '',
        address: school.address || '',
        status: school.status,
      });
    } else {
      setEditingSchool(null);
      reset({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchool(null);
    reset();
  };

  const onSubmit = (data: CreateSchoolData) => {
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta escola?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Escolas do Grupo</h1>
          <Button onClick={() => openModal()}>
            <Plus size={20} className="mr-2" />
            Nova Escola
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Escolas</CardTitle>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Buscar por nome ou CNPJ..."
              />
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
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          CNPJ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schoolsData?.data.map((school) => (
                        <tr key={school.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">{school.name}</div>
                              {school.address && (
                                <div className="text-sm text-gray-500">{school.address}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {school.cnpj}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{school.phone || '-'}</div>
                            <div className="text-xs">{school.email || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                school.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {school.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openModal(school)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(school.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {schoolsData && schoolsData.pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={schoolsData.pagination.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSchool ? 'Editar Escola' : 'Nova Escola'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              {...register('name', { required: 'Nome é obrigatório' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNPJ *
            </label>
            <input
              {...register('cnpj', { required: 'CNPJ é obrigatório' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="00.000.000/0000-00"
            />
            {errors.cnpj && (
              <p className="mt-1 text-sm text-red-600">{errors.cnpj.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                {...register('phone')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                {...register('status', { required: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="escola@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Rua, número, bairro, cidade..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingSchool ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
