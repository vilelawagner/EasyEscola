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
import { classService } from '@/services/classService';
import { Class } from '@/types';

const classSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  year: z.coerce.number().min(2020, 'Ano inválido').max(2100, 'Ano inválido'),
  semester: z.coerce.number().min(1, 'Semestre deve ser 1 ou 2').max(2, 'Semestre deve ser 1 ou 2'),
  shift: z.enum(['morning', 'afternoon', 'night']),
  capacity: z.coerce.number().min(1, 'Capacidade deve ser maior que 0'),
  status: z.enum(['active', 'inactive']),
});

type ClassForm = z.infer<typeof classSchema>;

export default function ClassesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes', page, search],
    queryFn: () => classService.list({ page, limit: 10, search }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
  });

  const createMutation = useMutation({
    mutationFn: classService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma criada com sucesso!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Erro ao criar turma');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClassForm> }) =>
      classService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma atualizada com sucesso!');
      setIsModalOpen(false);
      setEditingClass(null);
      reset();
    },
    onError: () => {
      toast.error('Erro ao atualizar turma');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma excluída com sucesso!');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir turma');
    },
  });

  const onSubmit = (data: ClassForm) => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    reset({
      name: classItem.name,
      year: classItem.year,
      semester: classItem.semester,
      shift: classItem.shift,
      capacity: classItem.capacity,
      status: classItem.status,
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingClass(null);
    const currentYear = new Date().getFullYear();
    reset({
      name: '',
      year: currentYear,
      semester: 1,
      shift: 'morning',
      capacity: 30,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const getShiftLabel = (shift: string) => {
    const shifts = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      night: 'Noite',
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Class },
    { 
      header: 'Ano/Semestre', 
      accessor: (classItem: Class) => `${classItem.year}/${classItem.semester}` 
    },
    { 
      header: 'Turno', 
      accessor: (classItem: Class) => getShiftLabel(classItem.shift)
    },
    { header: 'Capacidade', accessor: 'capacity' as keyof Class },
    {
      header: 'Status',
      accessor: (classItem: Class) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            classItem.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {classItem.status === 'active' ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessor: (classItem: Class) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(classItem)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => setDeleteId(classItem.id)}
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
          <h1 className="text-2xl font-bold">Turmas</h1>
          <Button onClick={handleNew}>
            <Plus size={20} className="mr-2" />
            Nova Turma
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
              placeholder="Buscar por nome da turma..."
            />
          </CardHeader>
          <CardContent>
            <Table
              data={classesData?.data || []}
              columns={columns}
              loading={isLoading}
            />
            {classesData?.pagination && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={classesData.pagination.totalPages}
                  onPageChange={setPage}
                  totalItems={classesData.pagination.total}
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
          setEditingClass(null);
          reset();
        }}
        title={editingClass ? 'Editar Turma' : 'Nova Turma'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Turma *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ex: 1º Ano A"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ano *</label>
              <input
                {...register('year')}
                type="number"
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.year && (
                <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Semestre *</label>
              <select {...register('semester')} className="w-full px-3 py-2 border rounded-lg">
                <option value="1">1º Semestre</option>
                <option value="2">2º Semestre</option>
              </select>
              {errors.semester && (
                <p className="text-red-500 text-sm mt-1">{errors.semester.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Turno *</label>
              <select {...register('shift')} className="w-full px-3 py-2 border rounded-lg">
                <option value="morning">Manhã</option>
                <option value="afternoon">Tarde</option>
                <option value="night">Noite</option>
              </select>
              {errors.shift && (
                <p className="text-red-500 text-sm mt-1">{errors.shift.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Capacidade *</label>
              <input
                {...register('capacity')}
                type="number"
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.capacity && (
                <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select {...register('status')} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingClass(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingClass ? 'Atualizar' : 'Criar'}
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
          <p>Tem certeza que deseja excluir esta turma?</p>
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
