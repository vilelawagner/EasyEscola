import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { gradeService, GradeWithDetails } from '@/services/gradeService';
import { classService } from '@/services/classService';
import { subjectService } from '@/services/subjectService';
import { enrollmentService } from '@/services/enrollmentService';

const gradeSchema = z.object({
  student_id: z.coerce.number().min(1, 'Selecione um aluno'),
  class_id: z.coerce.number().min(1, 'Selecione uma turma'),
  subject_id: z.coerce.number().min(1, 'Selecione uma disciplina'),
  term: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal('final'), z.literal('recovery')]),
  grade: z.coerce.number().min(0, 'Nota mínima é 0').max(10, 'Nota máxima é 10'),
  comments: z.string().optional(),
});

type GradeForm = z.infer<typeof gradeSchema>;

export default function GradesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeWithDetails | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | undefined>();
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>();
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const queryClient = useQueryClient();

  const { data: gradesData, isLoading } = useQuery({
    queryKey: ['grades', selectedClass, selectedSubject, selectedTerm],
    queryFn: () => gradeService.list({ 
      class_id: selectedClass, 
      subject_id: selectedSubject,
      term: selectedTerm
    }),
    enabled: !!selectedClass && !!selectedSubject,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-all'],
    queryFn: () => classService.list({ limit: 1000 }),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-all'],
    queryFn: () => subjectService.list({ limit: 1000 }),
  });

  // Buscar alunos matriculados na turma selecionada
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
  } = useForm<GradeForm>({
    resolver: zodResolver(gradeSchema),
  });

  const createMutation = useMutation({
    mutationFn: gradeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Nota lançada com sucesso!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Erro ao lançar nota');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GradeForm> }) =>
      gradeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Nota atualizada com sucesso!');
      setIsModalOpen(false);
      setEditingGrade(null);
      reset();
    },
    onError: () => {
      toast.error('Erro ao atualizar nota');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gradeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Nota excluída com sucesso!');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir nota');
    },
  });

  const onSubmit = (data: GradeForm) => {
    // Converter term para número se for string numérica
    const termValue = typeof data.term === 'string' && !isNaN(Number(data.term)) 
      ? Number(data.term) as 1 | 2 | 3 | 4
      : data.term;

    const gradeData = {
      ...data,
      term: termValue,
    };

    if (editingGrade) {
      updateMutation.mutate({ id: editingGrade.id, data: gradeData });
    } else {
      createMutation.mutate(gradeData);
    }
  };

  const handleEdit = (grade: GradeWithDetails) => {
    setEditingGrade(grade);
    reset({
      student_id: grade.student_id,
      class_id: grade.class_id,
      subject_id: grade.subject_id,
      term: grade.term.toString() as any,
      grade: grade.grade,
      comments: grade.comments || '',
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingGrade(null);
    reset({
      student_id: 0,
      class_id: selectedClass || 0,
      subject_id: selectedSubject || 0,
      term: selectedTerm as any,
      grade: 0,
      comments: '',
    });
    setIsModalOpen(true);
  };

  const getTermLabel = (term: string | number) => {
    const terms: Record<string, string> = {
      '1': '1º Bimestre',
      '2': '2º Bimestre',
      '3': '3º Bimestre',
      '4': '4º Bimestre',
      'final': 'Prova Final',
      'recovery': 'Recuperação',
    };
    return terms[term.toString()] || term;
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 7) return 'text-green-600 font-semibold';
    if (grade >= 5) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  // Agrupar notas por aluno
  const gradesByStudent = gradesData?.data.reduce((acc, grade) => {
    if (!acc[grade.student_id]) {
      acc[grade.student_id] = {
        student_name: grade.student_name || `Aluno ${grade.student_id}`,
        grades: {}
      };
    }
    acc[grade.student_id].grades[grade.term] = grade;
    return acc;
  }, {} as Record<number, { student_name: string; grades: Record<string | number, GradeWithDetails> }>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Lançamento de Notas</h1>
          {selectedClass && selectedSubject && (
            <Button onClick={handleNew}>
              <Plus size={20} className="mr-2" />
              Lançar Nota
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione a Turma e Disciplina</CardTitle>
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
                <label className="block text-sm font-medium mb-1">Período</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="1">1º Bimestre</option>
                  <option value="2">2º Bimestre</option>
                  <option value="3">3º Bimestre</option>
                  <option value="4">4º Bimestre</option>
                  <option value="final">Prova Final</option>
                  <option value="recovery">Recuperação</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Notas */}
        {selectedClass && selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle>Notas - {getTermLabel(selectedTerm)}</CardTitle>
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
                          Nota
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Comentários
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrollmentsData?.data.map((enrollment) => {
                        const studentGrade = gradesByStudent?.[enrollment.student_id]?.grades[selectedTerm];
                        return (
                          <tr key={enrollment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {enrollment.student_name || `Aluno ${enrollment.student_id}`}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {studentGrade ? (
                                <span className={getGradeColor(studentGrade.grade)}>
                                  {studentGrade.grade.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {studentGrade?.comments || '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {studentGrade ? (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleEdit(studentGrade)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(studentGrade.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    reset({
                                      student_id: enrollment.student_id,
                                      class_id: selectedClass,
                                      subject_id: selectedSubject,
                                      term: selectedTerm as any,
                                      grade: 0,
                                      comments: '',
                                    });
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <Plus size={16} className="mr-1" />
                                  Lançar
                                </Button>
                              )}
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
                <p className="text-gray-500">Selecione uma turma e disciplina para ver as notas</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Lançamento/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGrade(null);
          reset();
        }}
        title={editingGrade ? 'Editar Nota' : 'Lançar Nota'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('student_id')} />
          <input type="hidden" {...register('class_id')} />
          <input type="hidden" {...register('subject_id')} />
          <input type="hidden" {...register('term')} />

          <div>
            <label className="block text-sm font-medium mb-1">Nota (0 a 10) *</label>
            <input
              {...register('grade')}
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="w-full px-3 py-2 border rounded-lg text-lg font-semibold text-center"
              placeholder="0.0"
            />
            {errors.grade && (
              <p className="text-red-500 text-sm mt-1">{errors.grade.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comentários</label>
            <textarea
              {...register('comments')}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Observações sobre o desempenho..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingGrade(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              <Save size={18} className="mr-2" />
              {editingGrade ? 'Atualizar' : 'Lançar'}
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
          <p>Tem certeza que deseja excluir esta nota?</p>
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
