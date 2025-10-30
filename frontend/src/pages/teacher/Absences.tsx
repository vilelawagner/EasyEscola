import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { absenceService } from '@/services/absenceService';
import { subjectService } from '@/services/subjectService';
import { classService } from '@/services/classService';
import { enrollmentService } from '@/services/enrollmentService';

const absenceSchema = z.object({
  student_id: z.coerce.number().min(1, 'Selecione um aluno'),
  subject_id: z.coerce.number().min(1, 'Selecione uma disciplina'),
  date: z.string().min(1, 'Data é obrigatória'),
  periods: z.coerce.number().min(1, 'Número de períodos deve ser maior que 0'),
  reason: z.string().optional(),
});

type AbsenceForm = z.infer<typeof absenceSchema>;

export default function AbsencesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | undefined>();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: absencesData, isLoading } = useQuery({
    queryKey: ['absences', selectedSubject, selectedDate],
    queryFn: () => absenceService.list({ 
      subject_id: selectedSubject,
      date: selectedDate
    }),
    enabled: !!selectedSubject,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-all'],
    queryFn: () => classService.list({ limit: 1000 }),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-all'],
    queryFn: () => subjectService.list({ limit: 1000 }),
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments-by-class', selectedClass],
    queryFn: () => enrollmentService.list({ class_id: selectedClass, limit: 1000 }),
    enabled: !!selectedClass,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AbsenceForm>({
    resolver: zodResolver(absenceSchema),
  });

  const createMutation = useMutation({
    mutationFn: absenceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      toast.success('Falta registrada com sucesso!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Erro ao registrar falta');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: absenceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      toast.success('Falta excluída com sucesso!');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir falta');
    },
  });

  const onSubmit = (data: AbsenceForm) => {
    createMutation.mutate(data);
  };

  const handleQuickAbsence = (studentId: number) => {
    if (!selectedSubject) return;

    const absenceData = {
      student_id: studentId,
      subject_id: selectedSubject,
      date: selectedDate,
      periods: 1,
    };

    createMutation.mutate(absenceData);
  };

  const handleNew = (studentId?: number) => {
    reset({
      student_id: studentId || 0,
      subject_id: selectedSubject || 0,
      date: selectedDate,
      periods: 1,
      reason: '',
    });
    setIsModalOpen(true);
  };

  // Agrupar faltas por aluno
  const absencesByStudent = absencesData?.data.reduce((acc, absence) => {
    if (!acc[absence.student_id]) {
      acc[absence.student_id] = [];
    }
    acc[absence.student_id].push(absence);
    return acc;
  }, {} as Record<number, typeof absencesData.data>);

  const getTotalAbsences = (studentId: number) => {
    const studentAbsences = absencesByStudent?.[studentId] || [];
    return studentAbsences.reduce((sum, absence) => sum + absence.periods, 0);
  };

  const hasAbsenceToday = (studentId: number) => {
    return absencesByStudent?.[studentId]?.some(a => 
      a.date.split('T')[0] === selectedDate
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Registro de Faltas</h1>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione a Turma, Disciplina e Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Turma *</label>
                <select
                  value={selectedClass || ''}
                  onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione uma turma...</option>
                  {classesData?.data?.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.year}/{classItem.semester}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Disciplina *</label>
                <select
                  value={selectedSubject || ''}
                  onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione uma disciplina...</option>
                  {subjectsData?.data?.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Presença */}
        {selectedClass && selectedSubject && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    Lista de Presença - {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  </div>
                </CardTitle>
              </div>
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
                          Aluno
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Total de Faltas
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Status Hoje
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrollmentsData?.data.map((enrollment) => {
                        const hasAbsence = hasAbsenceToday(enrollment.student_id);
                        const totalAbsences = getTotalAbsences(enrollment.student_id);
                        
                        return (
                          <tr key={enrollment.id} className={hasAbsence ? 'bg-red-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {enrollment.student_name || `Aluno ${enrollment.student_id}`}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-semibold ${
                                totalAbsences > 10 ? 'text-red-600' : 
                                totalAbsences > 5 ? 'text-yellow-600' : 
                                'text-gray-600'
                              }`}>
                                {totalAbsences}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {hasAbsence ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  Faltou
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  Presente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex gap-2 justify-center">
                                {!hasAbsence ? (
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleQuickAbsence(enrollment.student_id)}
                                  >
                                    Marcar Falta
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      const absence = absencesByStudent?.[enrollment.student_id]?.find(
                                        a => a.date.split('T')[0] === selectedDate
                                      );
                                      if (absence) setDeleteId(absence.id);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                    Remover
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleNew(enrollment.student_id)}
                                >
                                  <Plus size={16} />
                                  Detalhes
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {(!enrollmentsData?.data || enrollmentsData.data.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhum aluno matriculado nesta turma</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedClass && !selectedSubject && (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">Selecione uma turma e disciplina para registrar faltas</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Registro Detalhado */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Registrar Falta"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('student_id')} />
          <input type="hidden" {...register('subject_id')} />

          <div>
            <label className="block text-sm font-medium mb-1">Data *</label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-3 py-2 border rounded-lg"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Número de Períodos *</label>
            <input
              {...register('periods')}
              type="number"
              min="1"
              className="w-full px-3 py-2 border rounded-lg"
            />
            {errors.periods && (
              <p className="text-red-500 text-sm mt-1">{errors.periods.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Quantidade de aulas/períodos que o aluno faltou
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo (Opcional)</label>
            <textarea
              {...register('reason')}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Motivo da falta..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
            >
              Registrar Falta
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
          <p>Tem certeza que deseja remover este registro de falta?</p>
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
