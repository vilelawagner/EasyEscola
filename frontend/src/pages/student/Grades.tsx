import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { gradeService } from '@/services/gradeService';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function StudentGradesPage() {
  const { data: gradesData, isLoading } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => gradeService.list({}),
  });

  const getGradeColor = (grade: number) => {
    if (grade >= 7) return 'text-green-600 font-bold';
    if (grade >= 5) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const getStatusIcon = (average: number) => {
    if (average >= 7) return <CheckCircle className="text-green-600" size={24} />;
    if (average >= 5) return <AlertCircle className="text-yellow-600" size={24} />;
    return <XCircle className="text-red-600" size={24} />;
  };

  // Agrupar notas por disciplina
  const gradesBySubject = gradesData?.data.reduce((acc, grade) => {
    if (!acc[grade.subject_id]) {
      acc[grade.subject_id] = {
        subject_name: grade.subject_name || `Disciplina ${grade.subject_id}`,
        grades: {}
      };
    }
    acc[grade.subject_id].grades[grade.term] = grade.grade;
    return acc;
  }, {} as Record<number, { subject_name: string; grades: Record<string | number, number> }>);

  const calculateAverage = (grades: Record<string | number, number>) => {
    const numericGrades = Object.entries(grades)
      .filter(([term]) => !isNaN(Number(term)))
      .map(([, grade]) => grade);
    
    if (numericGrades.length === 0) return null;
    const sum = numericGrades.reduce((acc, grade) => acc + grade, 0);
    return sum / numericGrades.length;
  };

  const calculateGeneralAverage = () => {
    if (!gradesBySubject) return null;
    
    const averages = Object.values(gradesBySubject)
      .map(subject => calculateAverage(subject.grades))
      .filter(avg => avg !== null) as number[];
    
    if (averages.length === 0) return null;
    const sum = averages.reduce((acc, avg) => acc + avg, 0);
    return sum / averages.length;
  };

  const generalAverage = calculateGeneralAverage();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Minhas Notas</h1>
        </div>

        {/* Média Geral */}
        {generalAverage !== null && (
          <Card>
            <CardContent>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-gray-600 text-sm">Média Geral</p>
                  <p className={`text-4xl font-bold ${getGradeColor(generalAverage)}`}>
                    {generalAverage.toFixed(1)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusIcon(generalAverage)}
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {generalAverage >= 7 ? 'Aprovado' : generalAverage >= 5 ? 'Em Recuperação' : 'Reprovado'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {generalAverage >= 7 ? 'Parabéns!' : 'Continue estudando!'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Notas por Disciplina */}
        <Card>
          <CardHeader>
            <CardTitle>Notas por Disciplina</CardTitle>
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
                        Disciplina
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        1º Bim
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        2º Bim
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        3º Bim
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        4º Bim
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Média
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gradesBySubject && Object.entries(gradesBySubject).map(([subjectId, data]) => {
                      const average = calculateAverage(data.grades);
                      return (
                        <tr key={subjectId}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {data.subject_name}
                          </td>
                          {[1, 2, 3, 4].map(term => (
                            <td key={term} className="px-6 py-4 text-center">
                              {data.grades[term] !== undefined ? (
                                <span className={getGradeColor(data.grades[term])}>
                                  {data.grades[term].toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-center">
                            {average !== null ? (
                              <span className={`text-lg ${getGradeColor(average)}`}>
                                {average.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {average !== null && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                average >= 7 ? 'bg-green-100 text-green-800' :
                                average >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {average >= 7 ? 'Aprovado' : average >= 5 ? 'Recuperação' : 'Reprovado'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {(!gradesBySubject || Object.keys(gradesBySubject).length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Nenhuma nota lançada ainda</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card>
          <CardContent>
            <div className="flex gap-8 py-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-sm text-gray-600">Aprovado (≥ 7.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                <span className="text-sm text-gray-600">Recuperação (5.0 - 6.9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-sm text-gray-600">Reprovado (&lt; 5.0)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
