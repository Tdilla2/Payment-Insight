import { useState, FormEvent } from 'react';
import { Lock, LogIn, ArrowLeft, MailCheck } from 'lucide-react';
import { signIn, forgotPassword, confirmForgotPassword } from '../lib/cognito';

export type UserSession =
  | { role: 'superadmin' }
  | { role: 'client'; clientId: string };

interface LoginScreenProps {
  onAuthenticated: () => void;
  onNewPasswordRequired: (email: string, session: string) => void;
}

type Mode = 'signin' | 'forgot-request' | 'forgot-confirm';

const passwordOk = (p: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(p);

export function LoginScreen({ onAuthenticated, onNewPasswordRequired }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = (m: Mode) => { setMode(m); setError(''); setInfo(''); };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
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

  const handleForgotRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const addr = email.trim();
    try {
      await forgotPassword(addr);
    } catch {
      // Swallow — don't reveal whether an account exists.
    } finally {
      setLoading(false);
    }
    // Always advance to the code step with a neutral message.
    setMode('forgot-confirm');
    setError('');
    setInfo(`If an account exists for ${addr}, a 6-digit reset code has been emailed.`);
  };

  const handleForgotConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!passwordOk(newPassword)) {
      setError('Password must be at least 8 characters with an uppercase, lowercase, and a number.');
      return;
    }
    setLoading(true);
    try {
      await confirmForgotPassword(email.trim(), code.trim(), newPassword);
      setPassword('');
      reset('signin');
      setInfo('Password reset! You can now sign in with your new password.');
    } catch (err: any) {
      setError(err?.message?.includes('CodeMismatch') ? 'That code is incorrect.'
        : err?.message?.includes('ExpiredCode') ? 'That code has expired — request a new one.'
        : (err?.message || 'Could not reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-[#A6332E]';
  const btnCls = 'w-full px-4 py-3 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#7B1E2B] transition-colors font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60';

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-stone-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E]" />
        <div className="p-8">
          <div className="flex justify-center mb-2">
            <img src="/payment_insight_mark.svg" alt="Payment Insight" className="w-24 h-auto" />
          </div>
          <h1 className="text-2xl font-bold text-center text-[#7B1E2B]">PAYMENT INSIGHT</h1>
          <p className="text-center text-gray-600 text-sm mb-6">
            {mode === 'signin' ? 'Sign in to continue'
              : mode === 'forgot-request' ? 'Reset your password'
              : 'Enter your reset code'}
          </p>

          {info && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2">
              <MailCheck className="w-4 h-4 shrink-0" /> {info}
            </div>
          )}
          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" className={inputCls} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inputCls} required />
              </div>
              <button type="submit" disabled={loading} className={btnCls}>
                <LogIn className="w-4 h-4" /> {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <button type="button" onClick={() => reset('forgot-request')}
                className="w-full text-sm text-[#7B1E2B] hover:underline">
                Forgot password?
              </button>
            </form>
          )}

          {mode === 'forgot-request' && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" className={inputCls} required autoFocus />
                <p className="text-xs text-gray-500 mt-1">We'll email you a code to reset your password.</p>
              </div>
              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
              <button type="button" onClick={() => reset('signin')}
                className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>
            </form>
          )}

          {mode === 'forgot-confirm' && (
            <form onSubmit={handleForgotConfirm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset code</label>
                <input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code from your email" className={inputCls} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls} required />
                <p className="text-xs text-gray-500 mt-1">Min 8 chars, with uppercase, lowercase, and a number.</p>
              </div>
              <button type="submit" disabled={loading} className={btnCls}>
                <Lock className="w-4 h-4" /> {loading ? 'Resetting…' : 'Set new password'}
              </button>
              <button type="button" onClick={() => reset('signin')}
                className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>
            </form>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Secure sign-in
          </p>
        </div>
      </div>
    </div>
  );
}
