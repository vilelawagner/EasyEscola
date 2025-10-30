import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { absenceService } from '@/services/absenceService';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function StudentAbsencesPage() {
  const { data: absencesData, isLoading } = useQuery({
    queryKey: ['student-absences'],
    queryFn: () => absenceService.list({}),
  });

  // Agrupar faltas por disciplina
  const absencesBySubject = absencesData?.data.reduce((acc, absence) => {
    if (!acc[absence.subject_id]) {
      acc[absence.subject_id] = {
        subject_name: absence.subject_name || `Disciplina ${absence.subject_id}`,
        absences: []
      };
    }
    acc[absence.subject_id].absences.push(absence);
    return acc;
  }, {} as Record<number, { subject_name: string; absences: typeof absencesData.data }>);

  const getTotalPeriods = (absences: any[]) => {
    return absences.reduce((sum, absence) => sum + absence.periods, 0);
  };

  const getAttendancePercentage = (totalAbsences: number, totalClasses: number = 80) => {
    const attended = totalClasses - totalAbsences;
    return ((attended / totalClasses) * 100).toFixed(1);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 75) return <CheckCircle className="text-green-600" size={24} />;
    if (percentage >= 60) return <AlertTriangle className="text-yellow-600" size={24} />;
    return <XCircle className="text-red-600" size={24} />;
  };

  const totalAbsencesCount = absencesData?.data.reduce((sum, absence) => sum + absence.periods, 0) || 0;
  const generalAttendancePercentage = parseFloat(getAttendancePercentage(totalAbsencesCount));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Minhas Faltas</h1>
        </div>

        {/* Resumo Geral de Presença */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-gray-600 text-sm">Percentual de Presença Geral</p>
                <p className={`text-4xl font-bold ${getStatusColor(generalAttendancePercentage)}`}>
                  {generalAttendancePercentage}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {totalAbsencesCount} falta{totalAbsencesCount !== 1 ? 's' : ''} registrada{totalAbsencesCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusIcon(generalAttendancePercentage)}
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {generalAttendancePercentage >= 75 ? 'Frequência OK' : 
                     generalAttendancePercentage >= 60 ? 'Atenção!' : 
                     'Risco de Reprovação'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {generalAttendancePercentage >= 75 ? 'Continue assim!' : 'Mínimo exigido: 75%'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {generalAttendancePercentage < 75 && (
          <Card>
            <CardContent>
              <div className="flex items-start gap-3 py-3">
                <AlertTriangle className="text-yellow-600 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-yellow-800">
                    {generalAttendancePercentage < 60 ? 'Atenção: Risco de Reprovação!' : 'Atenção: Frequência Baixa'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Você precisa ter no mínimo 75% de frequência para ser aprovado. 
                    {generalAttendancePercentage < 60 && ' Sua frequência está abaixo do mínimo exigido!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Faltas por Disciplina */}
        <Card>
          <CardHeader>
            <CardTitle>Faltas por Disciplina</CardTitle>
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
                        Total de Faltas
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Frequência
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {absencesBySubject && Object.entries(absencesBySubject).map(([subjectId, data]) => {
                      const totalAbsences = getTotalPeriods(data.absences);
                      const attendancePercentage = parseFloat(getAttendancePercentage(totalAbsences));
                      
                      return (
                        <tr key={subjectId}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {data.subject_name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold ${
                              totalAbsences > 20 ? 'text-red-600' : 
                              totalAbsences > 10 ? 'text-yellow-600' : 
                              'text-gray-600'
                            }`}>
                              {totalAbsences}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-lg font-bold ${getStatusColor(attendancePercentage)}`}>
                              {attendancePercentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              attendancePercentage >= 75 ? 'bg-green-100 text-green-800' :
                              attendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendancePercentage >= 75 ? 'OK' : 
                               attendancePercentage >= 60 ? 'Atenção' : 
                               'Risco'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {(!absencesBySubject || Object.keys(absencesBySubject).length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Nenhuma falta registrada</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Faltas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Faltas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {absencesData?.data.slice(0, 10).map((absence) => (
                <div key={absence.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{absence.subject_name || `Disciplina ${absence.subject_id}`}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(absence.date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                    {absence.reason && (
                      <p className="text-xs text-gray-500 mt-1">Motivo: {absence.reason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                      {absence.periods} período{absence.periods > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}

              {(!absencesData?.data || absencesData.data.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma falta registrada</p>
                  <p className="text-sm text-green-600 mt-1">Parabéns pela presença!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-600">
                <strong>Importante:</strong> É necessário ter no mínimo 75% de frequência para ser aprovado. 
                Isso significa que você pode faltar no máximo 20 aulas em uma disciplina com 80 aulas no semestre.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
