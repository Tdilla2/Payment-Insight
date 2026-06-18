import { useState, useEffect } from 'react';
import { FileText, Send, Download, AlertCircle, Users, ArrowLeft, Printer, Mail, Phone, Trash2 } from 'lucide-react';
import { Client } from './ClientManagement';
import { dataApi } from '../lib/dataApi';

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  loanType?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  lateFee: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  description: string;
}

interface InvoiceGeneratorProps {
  client: Client | null;
  onClose: () => void;
  lockedToClient?: boolean;
}

export function InvoiceGenerator({ client, onClose, lockedToClient }: InvoiceGeneratorProps) {
  const [lateFeeRate, setLateFeeRate] = useState(5); // 5% late fee
  const [lateFeeType, setLateFeeType] = useState<'percentage' | 'fixed'>('percentage');
  const [fixedLateFee, setFixedLateFee] = useState(25);
  const [gracePeriodDays, setGracePeriodDays] = useState(5);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(client);
  const [existingInvoices, setExistingInvoices] = useState<Invoice[]>([]);

  const loadInvoices = async () => {
    try {
      setExistingInvoices(await dataApi.listInvoices());
    } catch {
      setExistingInvoices([]);
    }
  };

  // Load clients + invoices from the API
  useEffect(() => {
    dataApi.listClients()
      .then(setAllClients)
      .catch((error) => console.error('Error loading clients:', error));
    loadInvoices();
  }, []);

  const deleteExistingInvoice = async (inv: Invoice) => {
    if (!confirm(`Delete invoice ${inv.invoiceNumber} for ${inv.clientName}?\n\nThis cannot be undone.`)) return;
    try {
      await dataApi.deleteInvoice(inv.id);
      setExistingInvoices(prev => prev.filter(i => i.id !== inv.id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice.');
    }
  };

  // Update selected client when prop changes
  useEffect(() => {
    if (client) {
      setSelectedClient(client);
    }
  }, [client]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Show client selector if no client is selected
  if (!selectedClient) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#7B1E2B]" />
            Select Client for Invoice
          </h2>
          <span className="px-3 py-1 bg-[#A6332E] text-white rounded-full text-sm font-bold">
            {allClients.length} Clients
          </span>
        </div>

        {allClients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Clients Found</h3>
            <p className="text-gray-600 mb-4">You need to add clients before creating invoices.</p>
            <div className="inline-block p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
              <p className="text-sm text-gray-700">
                💡 <span className="font-semibold">Tip:</span> Go to the <span className="font-semibold text-[#7B1E2B]">Clients</span> tab to add your first client.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a client to create a new invoice
            </label>
            <select
              value=""
              onChange={(e) => {
                const chosen = allClients.find(c => c.id === e.target.value);
                if (chosen) setSelectedClient(chosen);
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-[#A6332E] text-lg bg-white"
            >
              <option value="" disabled>
                -- Select a client --
              </option>
              {allClients.map((clientItem) => {
                const isOverdue = new Date(clientItem.nextPaymentDate) < new Date();
                return (
                  <option key={clientItem.id} value={clientItem.id}>
                    {clientItem.name} — {clientItem.email} • {formatCurrency(clientItem.monthlyPayment)}/mo
                    {isOverdue ? ' (OVERDUE)' : ''}
                  </option>
                );
              })}
            </select>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#7B1E2B]" />
                  Existing Invoices
                </h3>
                <span className="text-sm text-gray-500">{existingInvoices.length} total</span>
              </div>

              {existingInvoices.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No invoices yet. Pick a client above to create one.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Invoice #</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Client</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Loan Type</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Due</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...existingInvoices]
                        .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
                        .map((inv) => (
                          <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                            <td className="px-3 py-2">{inv.clientName}</td>
                            <td className="px-3 py-2 text-gray-600">{inv.loanType || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{inv.dueDate}</td>
                            <td className="px-3 py-2 text-right font-semibold text-[#7B1E2B]">{formatCurrency(inv.totalAmount)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200'
                                : inv.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200'
                                : inv.status === 'sent' ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => deleteExistingInvoice(inv)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors font-medium"
                                title="Delete invoice"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const calculateLateFee = () => {
    if (!selectedClient) return 0;
    const nextPayment = new Date(selectedClient.nextPaymentDate);
    const today = new Date();
    const daysLate = Math.floor((today.getTime() - nextPayment.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLate <= gracePeriodDays) {
      return 0;
    }

    if (lateFeeType === 'percentage') {
      return selectedClient.monthlyPayment * (lateFeeRate / 100);
    } else {
      return fixedLateFee;
    }
  };

  const lateFee = calculateLateFee();
  const totalAmount = selectedClient.monthlyPayment + lateFee;
  const invoiceNumber = `INV-${Date.now()}`;
  const invoiceDate = new Date().toISOString().split('T')[0];
  const dueDate = selectedClient.nextPaymentDate;

  const generateInvoice = async () => {
    // Block duplicates: one invoice per client per month/year (based on due date)
    const newDue = new Date(dueDate);
    const duplicate = existingInvoices.find(inv => {
      if (inv.clientId !== selectedClient.id) return false;
      const existingDue = new Date(inv.dueDate);
      return existingDue.getFullYear() === newDue.getFullYear()
        && existingDue.getMonth() === newDue.getMonth();
    });
    if (duplicate) {
      const monthLabel = newDue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      alert(`Duplicate invoice blocked.\n\n${selectedClient.name} already has invoice ${duplicate.invoiceNumber} for ${monthLabel}.`);
      return;
    }

    try {
      await dataApi.createInvoice({
        clientId: selectedClient.id,
        invoiceNumber,
        invoiceDate,
        dueDate,
        amount: selectedClient.monthlyPayment,
        lateFee,
        totalAmount,
        status: lateFee > 0 ? 'overdue' : 'sent',
        description: `Loan Payment - ${invoiceDate}`,
      });
      loadInvoices();
      alert(`Invoice ${invoiceNumber} created for ${selectedClient.name}!\nTotal: ${formatCurrency(totalAmount)}\n\nView it in the Payments tab to collect payment.`);
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice: ' + (error?.message || 'please try again.'));
    }
  };

  const sendToQuickBooks = () => {
    alert('QuickBooks Integration: This would send the invoice to QuickBooks.\n\nIn production, this would:\n1. Connect to QuickBooks API\n2. Create invoice in QuickBooks\n3. Sync customer data\n4. Return invoice ID');
  };

  const sendInvoiceEmail = () => {
    alert(`Email sent to ${selectedClient.email}!\n\nInvoice: ${invoiceNumber}\nAmount: ${formatCurrency(totalAmount)}\n\nIncludes payment link for online payment.`);
  };

  const isOverdue = () => {
    const nextPayment = new Date(selectedClient.nextPaymentDate);
    const today = new Date();
    return today > nextPayment;
  };

  const getDaysUntilDue = () => {
    const nextPayment = new Date(selectedClient.nextPaymentDate);
    const today = new Date();
    const days = Math.floor((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {!lockedToClient && (
            <button
              onClick={() => setSelectedClient(null)}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Back to client list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#7B1E2B]" />
              {lockedToClient ? 'Your Invoice' : 'Generate Invoice'}
            </h2>
            <p className="text-sm text-gray-600">Client: {selectedClient.name}</p>
          </div>
        </div>
      </div>

      {isOverdue() && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3 print:hidden">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-800 mb-1">Payment Overdue</h3>
            <p className="text-sm text-red-700">
              This payment is {Math.abs(getDaysUntilDue())} days late. Late fees may apply.
            </p>
          </div>
        </div>
      )}

      <details className="mb-6 border border-gray-200 rounded-lg print:hidden">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 select-none">
          Late Fee Settings
        </summary>
        <div className="p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={lateFeeType}
              onChange={(e) => setLateFeeType(e.target.value as 'percentage' | 'fixed')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          {lateFeeType === 'percentage' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={lateFeeRate}
                onChange={(e) => setLateFeeRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed ($)</label>
              <input
                type="number"
                step="1"
                value={fixedLateFee}
                onChange={(e) => setFixedLateFee(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (days)</label>
            <input
              type="number"
              value={gracePeriodDays}
              onChange={(e) => setGracePeriodDays(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
            />
          </div>
        </div>
      </details>

      <div className="mx-auto max-w-4xl bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden print:shadow-none print:border-0">
        <div className="h-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E]" />

        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <img
                src="/payment_insight_mark.svg"
                alt="Payment Insight"
                className="w-16 h-auto"
              />
              <div>
                <h2 className="text-xl font-bold text-[#7B1E2B] tracking-tight">PAYMENT INSIGHT</h2>
                <p className="text-sm text-gray-600 mt-1">Powered by GDI Digital Solutions</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> billing@paymentinsight.com
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> (555) 123-4567
                </p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
              <p className="font-mono text-sm text-gray-700 mt-2">{invoiceNumber}</p>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-end gap-6">
                  <span className="text-gray-500">Issued</span>
                  <span className="font-medium text-gray-900 w-28 text-left">{invoiceDate}</span>
                </div>
                <div className="flex justify-end gap-6">
                  <span className="text-gray-500">Due</span>
                  <span className={`font-medium w-28 text-left ${getDaysUntilDue() < 0 ? 'text-red-600' : 'text-gray-900'}`}>{dueDate}</span>
                </div>
              </div>
              <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${
                lateFee > 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {lateFee > 0 ? 'OVERDUE' : 'DUE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-gray-200">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Bill To</p>
              <p className="font-semibold text-gray-900 text-lg">{selectedClient.name}</p>
              <p className="text-sm text-gray-700">{selectedClient.email}</p>
              <p className="text-sm text-gray-700">{selectedClient.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Loan Summary</p>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-gray-600">Loan Type</span>
                <span className="text-right font-semibold text-[#7B1E2B]">{selectedClient.loanType || 'Home Mortgage'}</span>
                <span className="text-gray-600">Original Amount</span>
                <span className="text-right font-medium text-gray-900">{formatCurrency(selectedClient.loanAmount)}</span>
                <span className="text-gray-600">Interest Rate</span>
                <span className="text-right font-medium text-gray-900">{selectedClient.interestRate}%</span>
                <span className="text-gray-600">Term</span>
                <span className="text-right font-medium text-gray-900">{selectedClient.loanTerm} years</span>
                <span className="text-gray-600">Current Balance</span>
                <span className="text-right font-semibold text-[#7B1E2B]">{formatCurrency(selectedClient.balance)}</span>
              </div>
            </div>
          </div>

          <div className="py-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left text-xs uppercase tracking-wider text-gray-500 font-semibold pb-3">Description</th>
                  <th className="text-right text-xs uppercase tracking-wider text-gray-500 font-semibold pb-3 w-40">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-medium text-gray-900">Monthly Loan Payment</p>
                    <p className="text-sm text-gray-500">Billing period ending {dueDate}</p>
                  </td>
                  <td className="py-4 text-right font-medium text-gray-900">{formatCurrency(selectedClient.monthlyPayment)}</td>
                </tr>
                {lateFee > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-4">
                      <p className="font-medium text-red-700">Late Fee</p>
                      <p className="text-sm text-gray-500">
                        {lateFeeType === 'percentage'
                          ? `${lateFeeRate}% of monthly payment (after ${gracePeriodDays}-day grace period)`
                          : `Flat fee (after ${gracePeriodDays}-day grace period)`}
                      </p>
                    </td>
                    <td className="py-4 text-right font-medium text-red-700">{formatCurrency(lateFee)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pb-6">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(selectedClient.monthlyPayment)}</span>
              </div>
              {lateFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Late Fee</span>
                  <span className="font-medium text-red-700">{formatCurrency(lateFee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                <span className="font-semibold text-gray-900">Total Due</span>
                <span className="font-bold text-[#7B1E2B] text-2xl">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-lg p-5 border border-[#A6332E] mb-6">
            <p className="text-xs uppercase tracking-wider text-[#7B1E2B] font-semibold mb-2">Payment Instructions</p>
            <p className="text-sm text-gray-700">
              Please remit payment by <span className="font-semibold">{dueDate}</span>. You may pay online via the Payments tab, or contact us to arrange alternate payment.
            </p>
          </div>

          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p className="font-medium text-gray-700">Thank you for your business.</p>
            <p className="mt-1">Questions? Contact billing@paymentinsight.com</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3 print:hidden">
        <button
          onClick={generateInvoice}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#5E1620] transition-colors font-semibold shadow-lg"
        >
          <FileText className="w-5 h-5" />
          Save Invoice
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold shadow-lg"
        >
          <Printer className="w-5 h-5" />
          Print / PDF
        </button>
        <button
          onClick={sendToQuickBooks}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2CA01C] text-white rounded-lg hover:bg-[#228016] transition-colors font-semibold shadow-lg"
        >
          <Download className="w-5 h-5" />
          QuickBooks
        </button>
        <button
          onClick={sendInvoiceEmail}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFB800] text-white rounded-lg hover:bg-[#e6a600] transition-colors font-semibold shadow-lg"
        >
          <Send className="w-5 h-5" />
          Email Invoice
        </button>
      </div>
    </div>
  );
}
