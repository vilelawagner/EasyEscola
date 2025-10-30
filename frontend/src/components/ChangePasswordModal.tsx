import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/userService';
import { X, Lock } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      alert('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Erro ao alterar senha');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    mutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold">Alterar Senha</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Senha Atual *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Digite sua senha atual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nova Senha *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border rounded px-3 py-2"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirmar Nova Senha *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border rounded px-3 py-2"
              placeholder="Digite novamente a nova senha"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Alterando...' : 'Alterar Senha'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
