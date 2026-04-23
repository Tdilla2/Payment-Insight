import { useState, FormEvent } from 'react';
import { Lock, LogOut, Shield } from 'lucide-react';
import { Client } from './ClientManagement';

interface ChangePasswordScreenProps {
  clientId: string;
  onPasswordChanged: () => void;
  onCancel: () => void;
}

export function ChangePasswordScreen({ clientId, onPasswordChanged, onCancel }: ChangePasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword === 'password123') {
      setError('Please choose a password different from the default.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const stored = localStorage.getItem('payment_insight_clients');
      const clients: Client[] = stored ? JSON.parse(stored) : [];
      const updated = clients.map(c =>
        c.id === clientId ? { ...c, password: newPassword, mustChangePassword: false } : c
      );
      localStorage.setItem('payment_insight_clients', JSON.stringify(updated));
      onPasswordChanged();
    } catch {
      setError('Error saving password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA]" />
        <div className="p-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1B4E9B] to-[#20B2AA] flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-[#1B4E9B]">Set a New Password</h1>
          <p className="text-center text-gray-600 text-sm mb-6">
            For security, please change your default password before continuing.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-[#20B2AA]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-[#20B2AA]"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA] text-white rounded-lg hover:from-[#153d7a] hover:to-[#1a8f8f] transition-colors font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Save New Password
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
