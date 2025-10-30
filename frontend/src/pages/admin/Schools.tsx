import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { adminSchoolService, SchoolWithGroup } from '@/services/adminSchoolService';
import { groupService } from '@/services/groupService';
import { School, Users, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSchoolsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [groupFilter, setGroupFilter] = useState<number | ''>('');

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['admin-schools', page, search, statusFilter, groupFilter],
    queryFn: () => adminSchoolService.listAll({
      page,
      limit: 15,
      search,
      status: statusFilter || undefined,
      group_id: groupFilter || undefined,
    }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups-list'],
    queryFn: () => groupService.list({ limit: 100 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'inactive' }) =>
      adminSchoolService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const handleToggleStatus = (school: SchoolWithGroup) => {
    const newStatus = school.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'ativar' : 'desativar';
    
    if (window.confirm(`Tem certeza que deseja ${action} a escola "${school.name}"?`)) {
      updateStatusMutation.mutate({ id: school.id, status: newStatus });
    }
  };

  const totalSchools = schoolsData?.pagination.total || 0;
  const activeSchools = schoolsData?.data.filter(s => s.status === 'active').length || 0;
  const inactiveSchools = schoolsData?.data.filter(s => s.status === 'inactive').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Todas as Escolas</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-gray-600">Total de Escolas</p>
                  <p className="text-2xl font-bold text-blue-600">{totalSchools}</p>
                </div>
                <School className="text-blue-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-gray-600">Escolas Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{activeSchools}</p>
                </div>
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-gray-600">Escolas Inativas</p>
                  <p className="text-2xl font-bold text-red-600">{inactiveSchools}</p>
                </div>
                <XCircle className="text-red-600" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <CardTitle>Lista de Escolas</CardTitle>
              <div className="flex gap-3">
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value ? Number(e.target.value) : '')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos os grupos</option>
                  {groupsData?.data.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar escola..."
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Escola
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Grupo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          CNPJ
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Alunos
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Professores
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schoolsData?.data.map((school) => (
                        <tr key={school.id}>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{school.name}</div>
                              {school.address && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {school.address}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600">
                              {school.group_name || `Grupo #${school.group_id}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {school.cnpj}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users size={16} className="text-purple-600" />
                              <span className="font-semibold text-gray-900">
                                {school.total_students || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <GraduationCap size={16} className="text-green-600" />
                              <span className="font-semibold text-gray-900">
                                {school.total_teachers || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{school.phone || '-'}</div>
                            <div className="text-xs">{school.email || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                school.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {school.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button
                              onClick={() => handleToggleStatus(school)}
                              variant={school.status === 'active' ? 'danger' : 'success'}
                              size="sm"
                            >
                              {school.status === 'active' ? 'Desativar' : 'Ativar'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {(!schoolsData?.data || schoolsData.data.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhuma escola encontrada</p>
                    </div>
                  )}
                </div>

                {schoolsData && schoolsData.pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={schoolsData.pagination.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
