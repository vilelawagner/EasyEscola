import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { materialService, MaterialWithDetails } from '@/services/materialService';
import { classService } from '@/services/classService';
import { subjectService } from '@/services/subjectService';
import { Download, FileText, FileArchive, FileImage, File } from 'lucide-react';
import type { Class, Subject } from '@/types';

export default function StudentMaterialsPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.list({}),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.list({}),
  });

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials', selectedClass, selectedSubject],
    queryFn: () => materialService.list({
      class_id: selectedClass || undefined,
      subject_id: selectedSubject || undefined,
    }),
  });

  const handleDownload = async (materialId: number) => {
    try {
      await materialService.download(materialId);
    } catch (error) {
      console.error('Erro ao baixar material:', error);
      alert('Erro ao baixar o arquivo. Tente novamente.');
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="text-red-600" size={24} />;
      case 'zip':
      case 'rar':
        return <FileArchive className="text-yellow-600" size={24} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="text-blue-600" size={24} />;
      default:
        return <File className="text-gray-600" size={24} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Materiais de Estudo</h1>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turma
                </label>
                <select
                  value={selectedClass || ''}
                  onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todas as turmas</option>
                  {classesData?.data.map((classItem: Class) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disciplina
                </label>
                <select
                  value={selectedSubject || ''}
                  onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todas as disciplinas</option>
                  {subjectsData?.data.map((subject: Subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Materiais */}
        <Card>
          <CardHeader>
            <CardTitle>
              Materiais Disponíveis ({materialsData?.data.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {materialsData?.data.map((material: MaterialWithDetails) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(material.filename)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {material.title}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {material.filename}
                        </p>
                        {material.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {material.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {material.class_name}
                          </span>
                          <span>•</span>
                          <span>{material.subject_name}</span>
                          <span>•</span>
                          <span>{formatDate(material.uploaded_at)}</span>
                          {material.file_size && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(material.file_size)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      <Button
                        onClick={() => handleDownload(material.id)}
                        variant="secondary"
                        size="sm"
                      >
                        <Download size={16} className="mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                ))}

                {(!materialsData?.data || materialsData.data.length === 0) && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 text-lg">Nenhum material disponível</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {selectedClass || selectedSubject
                        ? 'Tente ajustar os filtros para ver mais materiais'
                        : 'Materiais serão exibidos aqui quando disponibilizados pelos professores'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-600">
                <strong>Dica:</strong> Use os filtros acima para encontrar materiais específicos de uma turma ou disciplina. 
                Todos os arquivos disponibilizados pelos professores podem ser baixados para estudo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
