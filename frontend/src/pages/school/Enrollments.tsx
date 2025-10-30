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
import { enrollmentService, EnrollmentWithDetails } from '@/services/enrollmentService';
import { studentService } from '@/services/studentService';
import { classService } from '@/services/classService';

const enrollmentSchema = z.object({
  student_id: z.coerce.number().min(1, 'Selecione um aluno'),
  class_id: z.coerce.number().min(1, 'Selecione uma turma'),
  enrollment_date: z.string().min(1, 'Data de matrícula é obrigatória'),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated']),
});

type EnrollmentForm = z.infer<typeof enrollmentSchema>;

export default function EnrollmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: enrollmentsData, isLoading } = useQuery({
    queryKey: ['enrollments', page, search],
    queryFn: () => enrollmentService.list({ page, limit: 10, search }),
  });

  // Query para listar alunos (para o select)
  const { data: studentsData } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => studentService.list({ limit: 1000 }),
  });

  // Query para listar turmas (para o select)
  const { data: classesData } = useQuery({
    queryKey: ['classes-all'],
    queryFn: () => classService.list({ limit: 1000 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnrollmentForm>({
    resolver: zodResolver(enrollmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: enrollmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Matrícula realizada com sucesso!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Erro ao realizar matrícula');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EnrollmentForm> }) =>
      enrollmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Matrícula atualizada com sucesso!');
      setIsModalOpen(false);
      setEditingEnrollment(null);
      reset();
    },
    onError: () => {
      toast.error('Erro ao atualizar matrícula');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: enrollmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Matrícula excluída com sucesso!');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir matrícula');
    },
  });

  const onSubmit = (data: EnrollmentForm) => {
    if (editingEnrollment) {
      updateMutation.mutate({ id: editingEnrollment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (enrollment: EnrollmentWithDetails) => {
    setEditingEnrollment(enrollment);
    reset({
      student_id: enrollment.student_id,
      class_id: enrollment.class_id,
      enrollment_date: enrollment.enrollment_date.split('T')[0],
      status: enrollment.status,
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingEnrollment(null);
    const today = new Date().toISOString().split('T')[0];
    reset({
      student_id: 0,
      class_id: 0,
      enrollment_date: today,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const statuses = {
      active: 'Ativo',
      inactive: 'Inativo',
      transferred: 'Transferido',
      graduated: 'Graduado',
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      transferred: 'bg-blue-100 text-blue-800',
      graduated: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { 
      header: 'Aluno', 
      accessor: (enrollment: EnrollmentWithDetails) => enrollment.student_name || `ID: ${enrollment.student_id}`
    },
    { 
      header: 'Turma', 
      accessor: (enrollment: EnrollmentWithDetails) => enrollment.class_name || `ID: ${enrollment.class_id}`
    },
    { 
      header: 'Data de Matrícula', 
      accessor: (enrollment: EnrollmentWithDetails) => 
        new Date(enrollment.enrollment_date).toLocaleDateString('pt-BR')
    },
    {
      header: 'Status',
      accessor: (enrollment: EnrollmentWithDetails) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(enrollment.status)}`}>
          {getStatusLabel(enrollment.status)}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessor: (enrollment: EnrollmentWithDetails) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(enrollment)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => setDeleteId(enrollment.id)}
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
          <h1 className="text-2xl font-bold">Matrículas</h1>
          <Button onClick={handleNew}>
            <Plus size={20} className="mr-2" />
            Nova Matrícula
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
              placeholder="Buscar por aluno ou turma..."
            />
          </CardHeader>
          <CardContent>
            <Table
              data={enrollmentsData?.data || []}
              columns={columns}
              loading={isLoading}
            />
            {enrollmentsData?.pagination && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={enrollmentsData.pagination.totalPages}
                  onPageChange={setPage}
                  totalItems={enrollmentsData.pagination.total}
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
          setEditingEnrollment(null);
          reset();
        }}
        title={editingEnrollment ? 'Editar Matrícula' : 'Nova Matrícula'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Aluno *</label>
            <select
              {...register('student_id')}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={!!editingEnrollment}
            >
              <option value="">Selecione um aluno...</option>
              {studentsData?.data?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.ra}
                </option>
              ))}
            </select>
            {errors.student_id && (
              <p className="text-red-500 text-sm mt-1">{errors.student_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Turma *</label>
            <select
              {...register('class_id')}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Selecione uma turma...</option>
              {classesData?.data?.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.year}/{classItem.semester}
                </option>
              ))}
            </select>
            {errors.class_id && (
              <p className="text-red-500 text-sm mt-1">{errors.class_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data de Matrícula *</label>
            <input
              {...register('enrollment_date')}
              type="date"
              className="w-full px-3 py-2 border rounded-lg"
            />
            {errors.enrollment_date && (
              <p className="text-red-500 text-sm mt-1">{errors.enrollment_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select {...register('status')} className="w-full px-3 py-2 border rounded-lg">
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="transferred">Transferido</option>
              <option value="graduated">Graduado</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingEnrollment(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingEnrollment ? 'Atualizar' : 'Matricular'}
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
          <p>Tem certeza que deseja excluir esta matrícula?</p>
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
