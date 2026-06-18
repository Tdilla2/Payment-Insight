import { useState, FormEvent } from 'react';
import { Lock, LogOut, Shield } from 'lucide-react';
import { completeNewPassword } from '../lib/cognito';

interface ChangePasswordScreenProps {
  email: string;
  cognitoSession: string;
  onPasswordChanged: () => void;
  onCancel: () => void;
}

export function ChangePasswordScreen({ email, cognitoSession, onPasswordChanged, onCancel }: ChangePasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    // Cognito policy: min 8 chars, upper, lower, number.
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      setError('Password must be at least 8 characters and include upper, lower, and a number.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await completeNewPassword(email, newPassword, cognitoSession);
      onPasswordChanged();
    } catch (err: any) {
      setError(err?.message || 'Error saving password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E]" />
        <div className="p-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7B1E2B] to-[#A6332E] flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-[#7B1E2B]">Set a New Password</h1>
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-[#A6332E]"
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-[#A6332E]"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#7B1E2B] transition-colors font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Lock className="w-4 h-4" /> {saving ? 'Saving…' : 'Save New Password'}
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
