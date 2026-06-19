import { useState, useEffect, FormEvent } from 'react';
import { ShieldCheck, Plus, Trash2, CheckCircle, Copy, X, Mail } from 'lucide-react';
import { dataApi } from '../lib/dataApi';

interface AdminUser {
  email: string;
  status?: string;
  enabled?: boolean;
  created?: string;
}

interface UserManagementProps {
  currentEmail: string;
}

const statusLabel = (s?: string) =>
  s === 'FORCE_CHANGE_PASSWORD' ? 'Invited — pending first sign-in'
    : s === 'CONFIRMED' ? 'Active'
    : s || 'Unknown';

const statusColor = (s?: string) =>
  s === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : s === 'FORCE_CHANGE_PASSWORD' ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-gray-100 text-gray-700 border-gray-300';

export function UserManagement({ currentEmail }: UserManagementProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const list = await dataApi.listAdmins();
      list.sort((a, b) => a.email.localeCompare(b.email));
      setAdmins(list);
    } catch (e) {
      console.error('Error loading admins:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const addAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const addr = email.trim();
    if (!addr) return;
    try {
      const res = await dataApi.createAdmin({ email: addr });
      setCreated({ email: res.email, password: res.tempPassword });
      setEmail('');
      setShowForm(false);
      await reload();
    } catch (err: any) {
      setError(err?.message || 'Could not create admin. Please try again.');
    }
  };

  const removeAdmin = async (addr: string) => {
    if (!confirm(`Remove admin access for ${addr}? Their login will be deleted.`)) return;
    try {
      await dataApi.deleteAdmin(addr);
      await reload();
    } catch (err: any) {
      alert('Error removing admin: ' + (err?.message || 'please try again.'));
    }
  };

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
            <ShieldCheck className="w-6 h-6 text-[#7B1E2B]" />
            Admin Users
            <span className="ml-2 px-3 py-1 bg-[#A6332E] text-white rounded-full text-sm font-bold">{admins.length}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Admins have full access to clients, invoices, payments, and this page.</p>
        </div>
        <button
          onClick={() => { setShowForm((s) => !s); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#7B1E2B] transition-colors font-semibold shadow"
        >
          <Plus className="w-5 h-5" /> Add Admin
        </button>
      </div>

      {showForm && (
        <form onSubmit={addAdmin} className="mb-6 p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
          <h3 className="text-lg font-semibold mb-3">Invite a new admin</h3>
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
          <p className="text-xs text-gray-500 mt-2">A temporary password is generated; they'll change it on first sign-in.</p>
          {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500">Loading…</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500">No admins found.</td></tr>
            ) : (
              admins.map((a, i) => (
                <tr key={a.email} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {a.email}
                    {a.email.toLowerCase() === currentEmail.toLowerCase() && (
                      <span className="ml-2 text-xs text-gray-500">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(a.status)}`}>
                      {statusLabel(a.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.email.toLowerCase() === currentEmail.toLowerCase() ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <button
                        onClick={() => removeAdmin(a.email)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
