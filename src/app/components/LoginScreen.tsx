import { useState, FormEvent } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { Client } from './ClientManagement';

export type UserSession =
  | { role: 'superadmin' }
  | { role: 'client'; clientId: string };

interface LoginScreenProps {
  onLogin: (session: UserSession, mustChangePassword: boolean) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const userInput = username.trim();

    // Super admin match (handled silently behind the scenes)
    if (userInput.toLowerCase() === 'superadmin' && password === 'admin123') {
      onLogin({ role: 'superadmin' }, false);
      return;
    }

    // Otherwise, try to find a client by email
    try {
      const stored = localStorage.getItem('payment_insight_clients');
      const clients: Client[] = stored ? JSON.parse(stored) : [];
      const client = clients.find(c => c.email.toLowerCase() === userInput.toLowerCase());

      if (client) {
        const expectedPassword = client.password ?? 'password123';
        const mustChange = client.mustChangePassword ?? true;
        if (password !== expectedPassword) {
          setError('Incorrect username or password.');
          return;
        }
        onLogin({ role: 'client', clientId: client.id }, mustChange);
        return;
      }

      setError('Incorrect username or password.');
    } catch {
      setError('Login error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA]" />
        <div className="p-8">
          <div className="flex justify-center mb-2">
            <img
              src="/src/imports/payment_insight_logo_new.JPG"
              alt="Payment Insight"
              className="w-28 h-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-[#1B4E9B]">PAYMENT INSIGHT</h1>
          <p className="text-center text-gray-600 text-sm mb-6">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-[#20B2AA]"
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-[#20B2AA]"
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
              className="w-full px-4 py-3 bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA] text-white rounded-lg hover:from-[#153d7a] hover:to-[#1a8f8f] transition-colors font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In
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
