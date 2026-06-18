import { useState } from 'react';
import { Table, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { Client } from './ClientManagement';

interface PaymentDetail {
  paymentNumber: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface ClientAmortizationScheduleProps {
  client: Client | null;
  onCreateInvoice?: () => void;
}

export function ClientAmortizationSchedule({ client, onCreateInvoice }: ClientAmortizationScheduleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  if (!client) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">
          <Table className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Client Selected</h3>
          <p className="text-gray-600 mb-4">Select a client from the Clients tab to view their complete amortization schedule.</p>
          <div className="inline-block p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
            <p className="text-sm text-gray-700">
              💡 <span className="font-semibold">Tip:</span> Go to the <span className="font-semibold text-[#7B1E2B]">Clients</span> tab and click the <span className="text-[#7B1E2B]">$</span> button next to any client.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Generate amortization schedule
  const generateSchedule = (): PaymentDetail[] => {
    const monthlyRate = (client.interestRate / 100) / 12;
    const numberOfPayments = client.loanTerm * 12;
    const monthlyPayment = client.monthlyPayment;

    let balance = client.loanAmount;
    const schedule: PaymentDetail[] = [];
    const startDate = new Date(client.startDate);

    for (let i = 1; i <= numberOfPayments && balance > 0.01; i++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;

      if (principalPayment > balance) {
        principalPayment = balance;
      }

      const actualPayment = interestPayment + principalPayment;
      balance = Math.max(0, balance - principalPayment);

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + i);

      schedule.push({
        paymentNumber: i,
        paymentDate: paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        payment: actualPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance
      });
    }

    return schedule;
  };

  const schedule = generateSchedule();
  const displayedSchedule = isExpanded
    ? schedule.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : schedule.slice(0, 12);

  const totalPages = Math.ceil(schedule.length / itemsPerPage);

  const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
  const totalPrincipal = schedule.reduce((sum, p) => sum + p.principal, 0);
  const totalPaid = totalInterest + totalPrincipal;

  const exportToCSV = () => {
    const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance'];
    const rows = schedule.map(p => [
      p.paymentNumber,
      p.paymentDate,
      p.payment.toFixed(2),
      p.principal.toFixed(2),
      p.interest.toFixed(2),
      p.balance.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${client.name.replace(/\s/g, '_')}_amortization_schedule.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Table className="w-6 h-6 text-[#7B1E2B]" />
            Amortization Schedule
          </h2>
          <p className="text-sm text-gray-600 mt-1">Client: {client.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onCreateInvoice && (
            <button
              onClick={onCreateInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFB800] text-white rounded-lg hover:bg-[#e6a600] transition-colors shadow-md"
            >
              <FileText className="w-4 h-4" />
              Create Invoice
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#A6332E] text-white rounded-lg hover:bg-[#5E1620] transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#5E1620] transition-colors shadow-md"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All ({schedule.length} payments)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-lg border-2 border-[#7B1E2B]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Loan Progress</span>
          <span className="text-sm text-gray-600">
            {client.startDate} → {(() => {
              const start = new Date(client.startDate);
              const end = new Date(start);
              end.setFullYear(end.getFullYear() + client.loanTerm);
              return end.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            })()}
          </span>
        </div>
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] transition-all duration-500"
            style={{ width: `${((client.loanAmount - client.balance) / client.loanAmount) * 100}%` }}
          >
            <div className="h-full flex items-center justify-center text-white text-xs font-semibold">
              {(((client.loanAmount - client.balance) / client.loanAmount) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Paid: {formatCurrency(client.loanAmount - client.balance)}</span>
          <span>Remaining: {formatCurrency(client.balance)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4 border-2 border-[#7B1E2B]">
          <p className="text-sm text-gray-600 mb-1">Total Principal</p>
          <p className="text-2xl font-bold text-[#7B1E2B]">{formatCurrency(totalPrincipal)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-4 border-2 border-[#FFB800]">
          <p className="text-sm text-gray-600 mb-1">Total Interest</p>
          <p className="text-2xl font-bold text-[#FFB800]">{formatCurrency(totalInterest)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-[#A6332E]">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-[#A6332E]">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg p-4 border-2 border-[#7B1E2B]">
          <p className="text-sm text-gray-600 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-[#7B1E2B]">{schedule.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment #</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Payment</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Principal</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Interest</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {displayedSchedule.map((payment, index) => (
              <tr
                key={payment.paymentNumber}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                <td className="px-4 py-3 text-sm text-gray-900">{payment.paymentNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentDate}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(payment.payment)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-[#A6332E] font-medium">
                  {formatCurrency(payment.principal)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-[#FFB800] font-medium">
                  {formatCurrency(payment.interest)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(payment.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isExpanded && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-lg border-2 border-[#A6332E]">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Understanding the schedule:</span> Each row shows how the monthly payment of {formatCurrency(client.monthlyPayment)} is split between principal (paying down the loan) and interest (cost of borrowing). Early payments have more interest, while later payments have more principal.
        </p>
      </div>
    </div>
  );
}
