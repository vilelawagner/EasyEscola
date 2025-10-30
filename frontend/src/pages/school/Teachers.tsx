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
import { teacherService } from '@/services/teacherService';
import { Teacher } from '@/types';

const teacherSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  birthdate: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['M', 'F']),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido'),
  specialization: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type TeacherForm = z.infer<typeof teacherSchema>;

export default function TeachersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers', page, search],
    queryFn: () => teacherService.list({ page, limit: 10, search }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
  });

  const createMutation = useMutation({
    mutationFn: teacherService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor criado com sucesso!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Erro ao criar professor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeacherForm> }) =>
      teacherService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor atualizado com sucesso!');
      setIsModalOpen(false);
      setEditingTeacher(null);
      reset();
    },
    onError: () => {
      toast.error('Erro ao atualizar professor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teacherService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor excluído com sucesso!');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir professor');
    },
  });

  const onSubmit = (data: TeacherForm) => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    reset({
      name: teacher.name,
      cpf: teacher.cpf,
      birthdate: teacher.birthdate.split('T')[0],
      gender: teacher.gender === 'other' ? 'M' : teacher.gender,
      phone: teacher.phone || '',
      email: teacher.email || '',
      specialization: teacher.specialization || '',
      status: teacher.status,
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingTeacher(null);
    reset({
      name: '',
      cpf: '',
      birthdate: '',
      gender: 'M',
      phone: '',
      email: '',
      specialization: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Teacher },
    { header: 'CPF', accessor: 'cpf' as keyof Teacher },
    { header: 'Email', accessor: ((teacher: Teacher) => teacher.email || '-') },
    { header: 'Telefone', accessor: ((teacher: Teacher) => teacher.phone || '-') },
    { header: 'Especialização', accessor: ((teacher: Teacher) => teacher.specialization || '-') },
    {
      header: 'Status',
      accessor: (teacher: Teacher) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            teacher.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessor: (teacher: Teacher) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(teacher)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => setDeleteId(teacher.id)}
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
          <h1 className="text-2xl font-bold">Professores</h1>
          <Button onClick={handleNew}>
            <Plus size={20} className="mr-2" />
            Novo Professor
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
              placeholder="Buscar por nome, CPF ou email..."
            />
          </CardHeader>
          <CardContent>
            <Table
              data={teachersData?.data || []}
              columns={columns}
              loading={isLoading}
            />
            {teachersData?.pagination && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={teachersData.pagination.totalPages}
                  onPageChange={setPage}
                  totalItems={teachersData.pagination.total}
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
          setEditingTeacher(null);
          reset();
        }}
        title={editingTeacher ? 'Editar Professor' : 'Novo Professor'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border rounded-lg"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">CPF *</label>
              <input
                {...register('cpf')}
                maxLength={11}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.cpf && (
                <p className="text-red-500 text-sm mt-1">{errors.cpf.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Data de Nascimento *
              </label>
              <input
                {...register('birthdate')}
                type="date"
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.birthdate && (
                <p className="text-red-500 text-sm mt-1">{errors.birthdate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Gênero *</label>
              <select {...register('gender')} className="w-full px-3 py-2 border rounded-lg">
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefone *</label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 border rounded-lg"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Especialização</label>
            <input
              {...register('specialization')}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ex: Matemática, Português..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select {...register('status')} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTeacher(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTeacher ? 'Atualizar' : 'Criar'}
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
          <p>Tem certeza que deseja excluir este professor?</p>
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
