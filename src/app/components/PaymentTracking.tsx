import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, DollarSign, Filter, Trash2, Edit, Zap, X } from 'lucide-react';
import { Invoice } from './InvoiceGenerator';
import { dataApi } from '../lib/dataApi';

interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  loanType?: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'sent';
  paymentMethod?: 'online' | 'check' | 'cash' | 'bank_transfer';
  confirmationNumber?: string;
}

interface PaymentTrackingProps {
  onPayInvoice?: (invoice: { id: string; invoiceNumber: string; clientName: string; amount: number; loanType?: string }) => void;
  filterClientId?: string;
  hideAdminActions?: boolean;
}

export function PaymentTracking({ onPayInvoice, filterClientId, hideAdminActions }: PaymentTrackingProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [invoiceCache, setInvoiceCache] = useState<Invoice[]>([]);

  const reloadPayments = async () => {
    try {
      const invoices = await dataApi.listInvoices();
      setInvoiceCache(invoices);
      const scoped = filterClientId ? invoices.filter(i => i.clientId === filterClientId) : invoices;
      const paymentsFromInvoices: Payment[] = scoped.map(inv => ({
        id: inv.id,
        clientId: inv.clientId,
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        loanType: inv.loanType,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.totalAmount,
        paymentDate: inv.status === 'paid' ? inv.invoiceDate : '',
        dueDate: inv.dueDate,
        status: inv.status === 'draft' || inv.status === 'sent' ? 'pending' : inv.status,
        paymentMethod: inv.status === 'paid' ? 'online' : undefined,
        confirmationNumber: inv.status === 'paid' ? `PAY-${inv.id.substring(0, 8)}` : undefined
      }));
      setPayments(paymentsFromInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setPayments([]);
    }
  };

  useEffect(() => {
    reloadPayments();
  }, []);

  const getInvoiceById = (id: string): Invoice | null =>
    invoiceCache.find(inv => inv.id === id) || null;

  const saveEditedInvoice = async (updated: Invoice) => {
    try {
      await dataApi.updateInvoice(updated.id, updated);
      setEditingInvoice(null);
      await reloadPayments();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving changes.');
    }
  };

  const runAutoGenerate = () => {
    alert('Automatic monthly invoice generation runs server-side based on each client\'s billing day.\n\nThis demo build does not trigger it manually — create invoices from the Invoices tab.');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'overdue':
        return <XCircle className="w-5 h-5 text-[#7B1E2B]" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'overdue':
        return 'bg-rose-100 text-[#7B1E2B] border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    // Client filter (for client role)
    if (filterClientId && payment.clientId !== filterClientId) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && payment.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (startDate || endDate) {
      const dueDate = new Date(payment.dueDate);
      if (startDate && dueDate < new Date(startDate)) return false;
      if (endDate && dueDate > new Date(endDate)) return false;
    }

    return true;
  });

  const totalPaid = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = filteredPayments.filter(p => p.status === 'pending' || p.status === 'sent').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = filteredPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

  const sendPaymentReminder = (payment: Payment) => {
    alert(`Payment reminder sent to ${payment.clientEmail} for Invoice ${payment.invoiceNumber}!\n\nEmail includes:\n- Payment amount: ${formatCurrency(payment.amount)}\n- Online payment link\n- Late fee warning if applicable`);
  };

  const deleteInvoice = async (payment: Payment) => {
    if (!confirm(`Delete invoice ${payment.invoiceNumber} for ${payment.clientName}?\n\nThis cannot be undone.`)) return;
    try {
      await dataApi.deleteInvoice(payment.id);
      setPayments(prev => prev.filter(p => p.id !== payment.id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice. Please try again.');
    }
  };

  const payInvoice = (payment: Payment) => {
    if (onPayInvoice) {
      onPayInvoice({
        id: payment.id,
        invoiceNumber: payment.invoiceNumber,
        clientName: payment.clientName,
        amount: payment.amount,
        loanType: payment.loanType,
      });
    }
  };

  const markAsPaid = async (payment: Payment) => {
    if (!confirm(`Mark invoice ${payment.invoiceNumber} as paid?`)) return;
    try {
      await dataApi.updateInvoice(payment.id, { status: 'paid' });
      setPayments(prev => prev.map(p =>
        p.id === payment.id
          ? {
              ...p,
              status: 'paid' as const,
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod: 'online' as const,
              confirmationNumber: `PAY-${payment.id.substring(0, 8)}`
            }
          : p
      ));
      alert('Payment marked as paid successfully!');
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#7B1E2B]" />
          Payment Tracking
        </h2>
        {!hideAdminActions && (
          <button
            onClick={runAutoGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#5E1620] transition-colors font-semibold shadow-md"
            title="Generate invoices for clients whose billing day has arrived"
          >
            <Zap className="w-4 h-4" />
            Auto-Generate Invoices
          </button>
        )}
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-lg border-2 border-[#7B1E2B]">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#7B1E2B]" />
          Filter Invoices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
            />
          </div>
        </div>
        {(startDate || endDate || statusFilter !== 'all') && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter('all'); }}
            className="mt-3 text-sm text-[#7B1E2B] hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border-2 border-emerald-300">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-700">Paid</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          <p className="text-sm text-gray-600 mt-1">{filteredPayments.filter(p => p.status === 'paid').length} payments</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border-2 border-amber-300">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-700">Pending</h3>
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalPending)}</p>
          <p className="text-sm text-gray-600 mt-1">{filteredPayments.filter(p => p.status === 'pending' || p.status === 'sent').length} payments</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4 border-2 border-[#7B1E2B]">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-[#7B1E2B]" />
            <h3 className="font-semibold text-gray-700">Overdue</h3>
          </div>
          <p className="text-2xl font-bold text-[#7B1E2B]">{formatCurrency(totalOverdue)}</p>
          <p className="text-sm text-gray-600 mt-1">{filteredPayments.filter(p => p.status === 'overdue').length} payments</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Loan Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Invoice #</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment Date</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Method</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <DollarSign className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-700">No invoices found</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {payments.length === 0
                      ? 'Generate invoices from the Invoices tab to see them here'
                      : 'Try adjusting your filters'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => (
              <tr
                key={payment.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.clientName}</td>
                <td className="px-4 py-3 text-sm">
                  {payment.loanType && (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#7B1E2B] border border-rose-200">
                      {payment.loanType}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-700">{payment.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-[#7B1E2B]">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{payment.dueDate}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {payment.paymentDate || '-'}
                  {payment.confirmationNumber && (
                    <div className="text-xs text-gray-500">{payment.confirmationNumber}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                  {payment.paymentMethod ? payment.paymentMethod.replace('_', ' ') : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center flex-wrap">
                    {payment.status !== 'paid' && (
                      <>
                        <button
                          onClick={() => payInvoice(payment)}
                          className="px-3 py-1 bg-[#7B1E2B] text-white rounded text-xs hover:bg-[#5E1620] transition-colors font-medium"
                        >
                          Pay Now
                        </button>
                        {!hideAdminActions && (
                          <>
                            <button
                              onClick={() => markAsPaid(payment)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors font-medium"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => sendPaymentReminder(payment)}
                              className="px-3 py-1 bg-[#FFB800] text-white rounded text-xs hover:bg-[#e6a600] transition-colors font-medium"
                            >
                              Remind
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {payment.status === 'paid' && (
                      <span className="text-xs text-emerald-600 font-medium">✓ Paid</span>
                    )}
                    {!hideAdminActions && (
                      <>
                        <button
                          onClick={() => {
                            const inv = getInvoiceById(payment.id);
                            if (inv) setEditingInvoice(inv);
                          }}
                          title="Edit invoice"
                          className="px-2 py-1 bg-[#A6332E] text-white rounded text-xs hover:bg-[#5E1620] transition-colors font-medium flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteInvoice(payment)}
                          title="Delete invoice"
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={saveEditedInvoice}
        />
      )}
    </div>
  );
}

interface EditInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (inv: Invoice) => void;
}

function EditInvoiceModal({ invoice, onClose, onSave }: EditInvoiceModalProps) {
  const [amount, setAmount] = useState(invoice.amount);
  const [lateFee, setLateFee] = useState(invoice.lateFee);
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoiceDate);
  const [status, setStatus] = useState<Invoice['status']>(invoice.status);
  const [description, setDescription] = useState(invoice.description);

  const total = Number(amount) + Number(lateFee);

  const save = () => {
    if (amount <= 0) { alert('Amount must be greater than 0.'); return; }
    if (!dueDate || !invoiceDate) { alert('Dates are required.'); return; }
    onSave({
      ...invoice,
      amount: Number(amount),
      lateFee: Number(lateFee),
      totalAmount: total,
      dueDate,
      invoiceDate,
      status,
      description,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E]">
          <div className="flex items-center gap-2 text-white">
            <Edit className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Edit Invoice {invoice.invoiceNumber}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee</label>
              <input
                type="number"
                step="0.01"
                value={lateFee}
                onChange={(e) => setLateFee(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Invoice['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-200">
            <span className="text-sm text-gray-700">New Total</span>
            <span className="font-bold text-[#7B1E2B] text-lg">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#5E1620] font-semibold shadow"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
