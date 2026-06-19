import { useState, useEffect, FormEvent } from 'react';
import { Users as UsersIcon, Plus, Trash2, CheckCircle, Copy, X, Mail, Shield, User } from 'lucide-react';
import { dataApi, ManagedUser } from '../lib/dataApi';

interface UserManagementProps {
  currentEmail: string;
}

const statusLabel = (s?: string) =>
  s === 'FORCE_CHANGE_PASSWORD' ? 'Invited — pending first sign-in'
    : s === 'CONFIRMED' ? 'Active'
    : s === 'RESET_REQUIRED' ? 'Password reset required'
    : s || 'Unknown';

const statusColor = (s?: string) =>
  s === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : s === 'FORCE_CHANGE_PASSWORD' ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-gray-100 text-gray-700 border-gray-300';

export function UserManagement({ currentEmail }: UserManagementProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      setUsers(await dataApi.listUsers());
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const inviteAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const addr = email.trim();
    if (!addr) return;
    try {
      const res = await dataApi.inviteAdmin({ email: addr });
      setCreated({ email: res.email, password: res.tempPassword });
      setEmail('');
      setShowForm(false);
      await reload();
    } catch (err: any) {
      setError(err?.message || 'Could not create admin. Please try again.');
    }
  };

  const removeUser = async (u: ManagedUser) => {
    const extra = u.role === 'client' ? '\n\nThis also removes their client & loan record.' : '';
    if (!confirm(`Remove ${u.email}? Their login will be deleted.${extra}`)) return;
    try {
      await dataApi.deleteUser(u.email);
      await reload();
    } catch (err: any) {
      alert('Error removing user: ' + (err?.message || 'please try again.'));
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const clientCount = users.filter((u) => u.role === 'client').length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {created && (
        <div className="mb-6 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Admin invited — login created</p>
                <p className="text-sm text-gray-700 mt-1">
                  Share these temporary credentials. They'll set their own password on first sign-in.
                </p>
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-gray-600">Email / username</span>
                  <span className="font-mono font-semibold text-gray-900">{created.email}</span>
                  <span className="text-gray-600">Temporary password</span>
                  <span className="font-mono font-semibold text-[#7B1E2B]">{created.password}</span>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(`Email: ${created.email}\nTemporary password: ${created.password}`)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy credentials
                </button>
              </div>
            </div>
            <button onClick={() => setCreated(null)} className="text-gray-400 hover:text-gray-700 shrink-0" aria-label="Dismiss">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-[#7B1E2B]" />
            User Management
            <span className="ml-2 px-3 py-1 bg-[#A6332E] text-white rounded-full text-sm font-bold">{users.length}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {adminCount} admin{adminCount === 1 ? '' : 's'} · {clientCount} client{clientCount === 1 ? '' : 's'}.
            Admins have full access; clients only see their own portal.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((s) => !s); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#7B1E2B] transition-colors font-semibold shadow"
        >
          <Plus className="w-5 h-5" /> Add Admin
        </button>
      </div>

      {showForm && (
        <form onSubmit={inviteAdmin} className="mb-6 p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
          <h3 className="text-lg font-semibold mb-1">Invite a new admin</h3>
          <p className="text-xs text-gray-500 mb-3">To add a client, use the <span className="font-semibold text-[#7B1E2B]">Clients</span> tab (so you can enter their loan details).</p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
            />
            <button type="submit" className="px-5 py-2 bg-[#7B1E2B] text-white rounded-lg hover:bg-[#5E1620] font-semibold flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> Create admin
            </button>
          </div>
          {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No users found.</td></tr>
            ) : (
              users.map((u, i) => {
                const isSelf = u.email.toLowerCase() === currentEmail.toLowerCase();
                return (
                  <tr key={u.email} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {u.email}
                      {isSelf && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-[#7B1E2B] border border-rose-200">
                          <Shield className="w-3.5 h-3.5" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                          <User className="w-3.5 h-3.5" /> Client
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(u.status)}`}>
                        {statusLabel(u.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelf ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <button
                          onClick={() => removeUser(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
