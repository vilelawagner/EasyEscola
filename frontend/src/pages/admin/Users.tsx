import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { adminUserService, type User, type CreateUserData, type UpdateUserData } from '@/services/userService';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn: () => adminUserService.list({
      page,
      limit: 20,
      search: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: adminUserService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowModal(false);
      alert('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao criar usuário');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      adminUserService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowModal(false);
      setEditingUser(null);
      alert('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao atualizar usuário');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminUserService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Usuário removido com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao remover usuário');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: any = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      status: formData.get('status') as string,
    };

    if (formData.get('groupId')) {
      data.groupId = parseInt(formData.get('groupId') as string);
    }
    if (formData.get('schoolId')) {
      data.schoolId = parseInt(formData.get('schoolId') as string);
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      data.password = formData.get('password') as string;
      createMutation.mutate(data as CreateUserData);
    }
  };

  const handleDelete = (user: User) => {
    if (confirm(`Tem certeza que deseja remover ${user.name}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ROLE_SUPERADMIN: 'Superadmin',
      ROLE_GROUP_MANAGER: 'Gestor',
      ROLE_SCHOOL_SECRETARY: 'Secretária',
      ROLE_TEACHER: 'Professor',
      ROLE_STUDENT: 'Aluno',
    };
    return labels[role] || role;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-gray-600">Gerenciamento de todos os usuários do sistema</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">Todas as funções</option>
                <option value="ROLE_SUPERADMIN">Superadmin</option>
                <option value="ROLE_GROUP_MANAGER">Gestor</option>
                <option value="ROLE_SCHOOL_SECRETARY">Secretária</option>
                <option value="ROLE_TEACHER">Professor</option>
                <option value="ROLE_STUDENT">Aluno</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escola</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data?.data?.map((user: User) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium">{user.name}</td>
                          <td className="px-4 py-4 text-sm">{user.email}</td>
                          <td className="px-4 py-4 text-sm">{getRoleLabel(user.role)}</td>
                          <td className="px-4 py-4 text-sm">{user.group_name || '-'}</td>
                          <td className="px-4 py-4 text-sm">{user.school_name || '-'}</td>
                          <td className="px-4 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data && data.pagination.totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={page}
                      totalPages={data.pagination.totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingUser?.name}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser?.email}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Senha *</label>
                    <input
                      type="password"
                      name="password"
                      required={!editingUser}
                      minLength={6}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Função *</label>
                  <select
                    name="role"
                    defaultValue={editingUser?.role}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Selecione...</option>
                    <option value="ROLE_SUPERADMIN">Superadmin</option>
                    <option value="ROLE_GROUP_MANAGER">Gestor</option>
                    <option value="ROLE_SCHOOL_SECRETARY">Secretária</option>
                    <option value="ROLE_TEACHER">Professor</option>
                    <option value="ROLE_STUDENT">Aluno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ID do Grupo</label>
                  <input
                    type="number"
                    name="groupId"
                    defaultValue={editingUser?.group_id}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ID da Escola</label>
                  <input
                    type="number"
                    name="schoolId"
                    defaultValue={editingUser?.school_id}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select
                    name="status"
                    defaultValue={editingUser?.status || 'active'}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
