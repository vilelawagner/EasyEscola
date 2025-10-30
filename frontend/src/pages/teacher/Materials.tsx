import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Download, Trash2, Upload as UploadIcon, FileText, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { materialService, MaterialWithDetails } from '@/services/materialService';
import { classService } from '@/services/classService';
import { subjectService } from '@/services/subjectService';

const materialSchema = z.object({
  class_id: z.coerce.number().min(1, 'Selecione uma turma'),
  subject_id: z.coerce.number().min(1, 'Selecione uma disciplina'),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  visibility: z.enum(['class', 'school', 'group']),
});

type MaterialForm = z.infer<typeof materialSchema>;

export default function MaterialsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterClass, setFilterClass] = useState<number | undefined>();
  const [filterSubject, setFilterSubject] = useState<number | undefined>();
  const queryClient = useQueryClient();

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials', filterClass, filterSubject],
    queryFn: () => materialService.list({ 
      class_id: filterClass, 
      subject_id: filterSubject 
    }),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-all'],
    queryFn: () => classService.list({ limit: 1000 }),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-all'],
    queryFn: () => subjectService.list({ limit: 1000 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: MaterialForm & { file: File }) => {
      setUploadProgress(10);
      const result = await materialService.upload(data);
      setUploadProgress(100);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material enviado com sucesso!');
      setIsModalOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      reset();
    },
    onError: () => {
      toast.error('Erro ao enviar material');
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: materialService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material excluído com sucesso!');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir material');
    },
  });

  const onSubmit = (data: MaterialForm) => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDownload = async (id: number) => {
    try {
      await materialService.download(id);
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao fazer download');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getVisibilityLabel = (visibility: string) => {
    const labels = {
      class: 'Turma',
      school: 'Escola',
      group: 'Grupo',
    };
    return labels[visibility as keyof typeof labels] || visibility;
  };

  const columns = [
    { header: 'Título', accessor: 'title' as keyof MaterialWithDetails },
    { 
      header: 'Turma', 
      accessor: (material: MaterialWithDetails) => material.class_name || '-'
    },
    { 
      header: 'Disciplina', 
      accessor: (material: MaterialWithDetails) => material.subject_name || '-'
    },
    { 
      header: 'Tamanho', 
      accessor: (material: MaterialWithDetails) => formatFileSize(material.file_size)
    },
    { 
      header: 'Tipo', 
      accessor: (material: MaterialWithDetails) => material.file_type.toUpperCase()
    },
    { 
      header: 'Visibilidade', 
      accessor: (material: MaterialWithDetails) => getVisibilityLabel(material.visibility)
    },
    {
      header: 'Ações',
      accessor: (material: MaterialWithDetails) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload(material.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setDeleteId(material.id)}
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
          <h1 className="text-2xl font-bold">Materiais Didáticos</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Enviar Material
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Filtrar por Turma</label>
                <select
                  value={filterClass || ''}
                  onChange={(e) => setFilterClass(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Todas as turmas</option>
                  {classesData?.data?.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.year}/{classItem.semester}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Filtrar por Disciplina</label>
                <select
                  value={filterSubject || ''}
                  onChange={(e) => setFilterSubject(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Todas as disciplinas</option>
                  {subjectsData?.data?.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Table
              data={materialsData?.data || []}
              columns={columns}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal de Upload */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFile(null);
          setUploadProgress(0);
          reset();
        }}
        title="Enviar Material"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-600" size={32} />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <>
                <UploadIcon className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-2">
                  Arraste e solte o arquivo aqui ou
                </p>
                <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                  Selecione um arquivo
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, ZIP, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT (Máx. 10MB)
                </p>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              {...register('title')}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ex: Apostila de Matemática - Capítulo 5"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Turma *</label>
              <select {...register('class_id')} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Selecione...</option>
                {classesData?.data?.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
              {errors.class_id && (
                <p className="text-red-500 text-sm mt-1">{errors.class_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Disciplina *</label>
              <select {...register('subject_id')} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Selecione...</option>
                {subjectsData?.data?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subject_id && (
                <p className="text-red-500 text-sm mt-1">{errors.subject_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              {...register('description')}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Descrição do material..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Visibilidade *</label>
            <select {...register('visibility')} className="w-full px-3 py-2 border rounded-lg">
              <option value="class">Apenas para a turma</option>
              <option value="school">Toda a escola</option>
              <option value="group">Todo o grupo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedFile(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={uploadMutation.isPending}
              disabled={!selectedFile}
            >
              Enviar Material
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
          <p>Tem certeza que deseja excluir este material?</p>
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
