import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, DollarSign, Calendar, Calculator, KeyRound } from 'lucide-react';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  loanAmount: number;
  monthlyPayment: number;
  interestRate: number;
  loanTerm: number;
  startDate: string;
  nextPaymentDate: string;
  balance: number;
  status: 'current' | 'late' | 'paid';
  password?: string;
  mustChangePassword?: boolean;
  billingDay?: number;
}

interface ClientManagementProps {
  onSelectClient: (client: Client) => void;
}

const STORAGE_KEY = 'payment_insight_clients';

const getDefaultClients = (): Client[] => [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    loanAmount: 250000,
    monthlyPayment: 1580.17,
    interestRate: 6.5,
    loanTerm: 30,
    startDate: '2024-01-15',
    nextPaymentDate: '2026-05-15',
    balance: 248500,
    status: 'current',
    password: 'password123',
    mustChangePassword: true
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 234-5678',
    loanAmount: 35000,
    monthlyPayment: 670.50,
    interestRate: 5.5,
    loanTerm: 5,
    startDate: '2023-06-01',
    nextPaymentDate: '2026-04-15',
    balance: 28400,
    status: 'late',
    password: 'password123',
    mustChangePassword: true
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'mbrown@email.com',
    phone: '(555) 345-6789',
    loanAmount: 100000,
    monthlyPayment: 1200.25,
    interestRate: 7.5,
    loanTerm: 7,
    startDate: '2022-03-10',
    nextPaymentDate: '2026-05-10',
    balance: 85000,
    status: 'current',
    password: 'password123',
    mustChangePassword: true
  }
];

export function ClientManagement({ onSelectClient }: ClientManagementProps) {
  // Load clients from localStorage on mount
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return getDefaultClients();
    } catch (error) {
      console.error('Error loading clients from localStorage:', error);
      return getDefaultClients();
    }
  });

  // Save clients to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving clients to localStorage:', error);
    }
  }, [clients]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm: Partial<Client> = {
    name: '',
    email: '',
    phone: '',
    loanAmount: 0,
    monthlyPayment: 0,
    interestRate: 0,
    loanTerm: 0,
    startDate: '',
    nextPaymentDate: '',
    balance: 0,
    status: 'current'
  };
  const [newClient, setNewClient] = useState<Partial<Client>>(emptyForm);

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setNewClient({ ...client });
    setShowAddForm(true);
  };

  const resetPassword = (client: Client) => {
    if (!confirm(`Reset password for ${client.name} to "password123"?\n\nThey will be required to choose a new password on next login.`)) return;
    setClients(clients.map(c =>
      c.id === client.id ? { ...c, password: 'password123', mustChangePassword: true } : c
    ));
    alert(`Password reset for ${client.name}.\nTemporary password: password123`);
  };

  const calculateMonthlyPayment = (loanAmount: number, interestRate: number, loanTerm: number): number => {
    if (loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) {
      return 0;
    }

    const monthlyRate = (interestRate / 100) / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPayment = loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return monthlyPayment;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const saveClient = () => {
    // Validate required fields
    if (!newClient.name || !newClient.name.trim()) {
      alert('Please enter a client name');
      return;
    }
    if (!newClient.email || !newClient.email.trim()) {
      alert('Please enter an email address');
      return;
    }
    if (!newClient.loanAmount || newClient.loanAmount <= 0) {
      alert('Please enter a valid loan amount');
      return;
    }
    if (!newClient.interestRate || newClient.interestRate <= 0) {
      alert('Please enter a valid interest rate');
      return;
    }
    if (!newClient.loanTerm || newClient.loanTerm <= 0) {
      alert('Please enter a valid loan term');
      return;
    }
    if (!newClient.startDate) {
      alert('Please select a loan starting date');
      return;
    }
    if (!newClient.monthlyPayment || newClient.monthlyPayment <= 0) {
      alert('Monthly payment could not be calculated. Please check your loan details.');
      return;
    }

    if (editingId) {
      const existing = clients.find(c => c.id === editingId);
      const updated: Client = {
        ...(existing as Client),
        ...newClient,
        id: editingId,
        phone: newClient.phone || '',
        nextPaymentDate: newClient.nextPaymentDate || newClient.startDate!,
        balance: newClient.balance ?? newClient.loanAmount!,
      } as Client;
      setClients(clients.map(c => (c.id === editingId ? updated : c)));
      setEditingId(null);
      setShowAddForm(false);
      setNewClient(emptyForm);
      alert(`✅ ${updated.name}'s information has been updated.`);
      return;
    }

    const client: Client = {
      id: Date.now().toString(),
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone || '',
      loanAmount: newClient.loanAmount,
      monthlyPayment: newClient.monthlyPayment,
      interestRate: newClient.interestRate,
      loanTerm: newClient.loanTerm,
      startDate: newClient.startDate,
      nextPaymentDate: newClient.nextPaymentDate || newClient.startDate,
      balance: newClient.balance || newClient.loanAmount,
      status: 'current',
      password: 'password123',
      mustChangePassword: true,
      billingDay: newClient.billingDay
    };

    setClients([...clients, client]);
    setShowAddForm(false);
    setNewClient(emptyForm);

    alert(`✅ Success!\n\nClient "${client.name}" has been added.\n\nLogin: ${client.email}\nTemporary password: password123 (they'll be asked to change it)`);
  };

  const deleteClient = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'late':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1B4E9B]" />
            Client Management
            <span className="ml-2 px-3 py-1 bg-[#20B2AA] text-white rounded-full text-sm font-bold">
              {clients.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            💾 All data is automatically saved to your browser
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingId(null);
                setNewClient(emptyForm);
              } else {
                setEditingId(null);
                setNewClient(emptyForm);
                setShowAddForm(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA] text-white rounded-lg hover:from-[#153d7a] hover:to-[#1a8f8f] transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-[#20B2AA]">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Client' : 'Add New Client'}</h3>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 Tip:</span> Enter the loan amount, interest rate, and loan term - the monthly payment will be calculated automatically!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter client name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="client@email.com"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                placeholder="Phone"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 250000"
                required
                value={newClient.loanAmount || ''}
                onChange={(e) => {
                  const loanAmount = Number(e.target.value);
                  const monthlyPayment = calculateMonthlyPayment(loanAmount, newClient.interestRate || 0, newClient.loanTerm || 0);
                  setNewClient({ ...newClient, loanAmount, monthlyPayment, balance: loanAmount });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 6.5"
                required
                value={newClient.interestRate || ''}
                onChange={(e) => {
                  const interestRate = Number(e.target.value);
                  const monthlyPayment = calculateMonthlyPayment(newClient.loanAmount || 0, interestRate, newClient.loanTerm || 0);
                  setNewClient({ ...newClient, interestRate, monthlyPayment });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 30"
                required
                value={newClient.loanTerm || ''}
                onChange={(e) => {
                  const loanTerm = Number(e.target.value);
                  const monthlyPayment = calculateMonthlyPayment(newClient.loanAmount || 0, newClient.interestRate || 0, loanTerm);
                  setNewClient({ ...newClient, loanTerm, monthlyPayment });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Payment (Auto-Calculated)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newClient.monthlyPayment ? formatCurrency(newClient.monthlyPayment) : '$0.00'}
                  readOnly
                  className="px-4 py-2 border-2 border-[#20B2AA] rounded-lg bg-teal-50 text-[#1B4E9B] font-bold text-lg w-full"
                  placeholder="$0.00"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <DollarSign className="w-5 h-5 text-[#20B2AA]" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Starting Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newClient.startDate}
                onChange={(e) => {
                  const startDate = e.target.value;
                  let endDate = '';
                  if (startDate && newClient.loanTerm) {
                    const start = new Date(startDate);
                    const end = new Date(start);
                    end.setFullYear(end.getFullYear() + newClient.loanTerm);
                    endDate = end.toISOString().split('T')[0];
                  }
                  // Set next payment date to one month after start
                  let nextPayment = '';
                  if (startDate) {
                    const next = new Date(startDate);
                    next.setMonth(next.getMonth() + 1);
                    nextPayment = next.toISOString().split('T')[0];
                  }
                  setNewClient({ ...newClient, startDate, nextPaymentDate: nextPayment });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan End Date (Auto-Calculated)
              </label>
              <input
                type="text"
                value={
                  newClient.startDate && newClient.loanTerm
                    ? (() => {
                        const start = new Date(newClient.startDate);
                        const end = new Date(start);
                        end.setFullYear(end.getFullYear() + newClient.loanTerm);
                        return end.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                      })()
                    : 'Select start date and loan term'
                }
                readOnly
                className="px-4 py-2 border-2 border-[#20B2AA] rounded-lg bg-teal-50 text-[#1B4E9B] font-semibold w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Generate Bill On <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={newClient.billingDay ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewClient({ ...newClient, billingDay: v ? Number(v) : undefined });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] w-full"
              >
                <option value="">— Don't auto-generate —</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    Day {d} of each month{d === 1 ? ' (1st)' : d === 15 ? ' (mid-month)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                If set, an invoice will be auto-created each month on this day.
              </p>
            </div>
          </div>
          {newClient.monthlyPayment && newClient.monthlyPayment > 0 && (
            <div className="col-span-full mt-4 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-[#1B4E9B]">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#1B4E9B]" />
                Loan Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm mb-3">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-gray-600 text-xs">Loan Amount</p>
                  <p className="font-bold text-[#1B4E9B]">{formatCurrency(newClient.loanAmount || 0)}</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-gray-600 text-xs">Monthly Interest Rate</p>
                  <p className="font-bold text-[#20B2AA]">{((newClient.interestRate || 0) / 12).toFixed(3)}%</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-gray-600 text-xs">Total Payments</p>
                  <p className="font-bold text-[#FFB800]">{(newClient.loanTerm || 0) * 12} months</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-gray-600 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Loan Duration
                  </p>
                  <p className="font-bold text-gray-900">
                    {newClient.startDate && newClient.loanTerm ? (
                      <>
                        {new Date(newClient.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {' → '}
                        {(() => {
                          const start = new Date(newClient.startDate);
                          const end = new Date(start);
                          end.setFullYear(end.getFullYear() + newClient.loanTerm);
                          return end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        })()}
                      </>
                    ) : (
                      'Set dates'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 col-span-full">
            <button
              onClick={saveClient}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA] text-white rounded-lg hover:from-[#153d7a] hover:to-[#1a8f8f] transition-colors font-bold shadow-lg text-lg"
            >
              💾 {editingId ? 'Update Client' : 'Save Client'}
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
                  setShowAddForm(false);
                  setEditingId(null);
                  setNewClient(emptyForm);
                }
              }}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA] text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold">Client Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Balance</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Monthly Payment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Next Payment</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <tr
                key={client.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div>{client.email}</div>
                  <div className="text-xs text-gray-500">{client.phone}</div>
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-[#1B4E9B]">
                  {formatCurrency(client.balance)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(client.monthlyPayment)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{client.nextPaymentDate}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(client.status)}`}>
                    {client.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => onSelectClient(client)}
                      className="p-2 bg-[#1B4E9B] text-white rounded hover:bg-[#153d7a] transition-colors"
                      title="View Client Details"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(client)}
                      className="p-2 bg-[#20B2AA] text-white rounded hover:bg-[#1a8f8f] transition-colors"
                      title="Edit Client"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => resetPassword(client)}
                      className="p-2 bg-[#FFB800] text-white rounded hover:bg-[#e6a600] transition-colors"
                      title={`Reset password${client.mustChangePassword ? ' (pending change)' : ''}`}
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="Delete Client"
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

      {clients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No clients found. Click "Add Client" to get started.
        </div>
      )}
    </div>
  );
}
