import { useState, FormEvent } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { signIn } from '../lib/cognito';

export type UserSession =
  | { role: 'superadmin' }
  | { role: 'client'; clientId: string };

interface LoginScreenProps {
  onAuthenticated: () => void;
  onNewPasswordRequired: (email: string, session: string) => void;
}

export function LoginScreen({ onAuthenticated, onNewPasswordRequired }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.status === 'new_password_required') {
        onNewPasswordRequired(result.email, result.session);
      } else {
        onAuthenticated();
      }
    } catch (err: any) {
      setError(err?.message?.includes('Incorrect') || err?.message?.includes('NotAuthorized')
        ? 'Incorrect email or password.'
        : (err?.message || 'Sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E]" />
        <div className="p-8">
          <div className="flex justify-center mb-2">
            <img
              src="/payment_insight_mark.svg"
              alt="Payment Insight"
              className="w-24 h-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-[#7B1E2B]">PAYMENT INSIGHT</h1>
          <p className="text-center text-gray-600 text-sm mb-6">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-[#A6332E]"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-[#A6332E]"
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#7B1E2B] transition-colors font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" /> {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secure sign-in
          </p>
        </div>
      </div>
    </div>
  );
}
