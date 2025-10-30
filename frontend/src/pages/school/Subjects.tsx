import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { subjectService } from '@/services/subjectService';
import { Subject } from '@/types';

const subjectSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  workload: z.coerce.number().min(0, 'Carga horária deve ser maior ou igual a 0').optional(),
});

type SubjectForm = z.infer<typeof subjectSchema>;

export default function SubjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ['subjects', page, search],
    queryFn: () => subjectService.list({ page, limit: 10, search }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectForm>({
    resolver: zodResolver(subjectSchema),
  });

  const createMutation = useMutation({
    mutationFn: subjectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Disciplina criada com sucesso!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Erro ao criar disciplina');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubjectForm> }) =>
      subjectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Disciplina atualizada com sucesso!');
      setIsModalOpen(false);
      setEditingSubject(null);
      reset();
    },
    onError: () => {
      toast.error('Erro ao atualizar disciplina');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subjectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Disciplina excluída com sucesso!');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir disciplina');
    },
  });

  const onSubmit = (data: SubjectForm) => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    reset({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      workload: subject.workload || 0,
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingSubject(null);
    reset({
      name: '',
      code: '',
      description: '',
      workload: 0,
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Código', accessor: 'code' as keyof Subject },
    { header: 'Nome', accessor: 'name' as keyof Subject },
    { 
      header: 'Descrição', 
      accessor: (subject: Subject) => subject.description || '-' 
    },
    { 
      header: 'Carga Horária', 
      accessor: (subject: Subject) => subject.workload ? `${subject.workload}h` : '-'
    },
    {
      header: 'Ações',
      accessor: (subject: Subject) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(subject)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => setDeleteId(subject.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Disciplinas</h1>
          <Button onClick={handleNew}>
            <Plus size={20} className="mr-2" />
            Nova Disciplina
          </Button>
        </div>

        <Card>
          <CardHeader>
            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Buscar por nome ou código..."
            />
          </CardHeader>
          <CardContent>
            <Table
              data={subjectsData?.data || []}
              columns={columns}
              loading={isLoading}
            />
            {subjectsData?.pagination && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={subjectsData.pagination.totalPages}
                  onPageChange={setPage}
                  totalItems={subjectsData.pagination.total}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubject(null);
          reset();
        }}
        title={editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input
                {...register('code')}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ex: MAT101"
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Carga Horária</label>
              <input
                {...register('workload')}
                type="number"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ex: 80"
              />
              {errors.workload && (
                <p className="text-red-500 text-sm mt-1">{errors.workload.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ex: Matemática Básica"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              {...register('description')}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Descrição da disciplina..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSubject(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingSubject ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja excluir esta disciplina?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              loading={deleteMutation.isPending}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
