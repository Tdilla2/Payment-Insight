import { useState } from 'react';
import { Table, ChevronDown, ChevronUp } from 'lucide-react';

interface PaymentDetail {
  paymentNumber: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface AmortizationScheduleProps {
  schedule: PaymentDetail[];
}

export function AmortizationSchedule({ schedule }: AmortizationScheduleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const displayedSchedule = isExpanded
    ? schedule.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : schedule.slice(0, 12);

  const totalPages = Math.ceil(schedule.length / itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Table className="w-6 h-6 text-[#7B1E2B]" />
          Amortization Schedule
        </h2>
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment #</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Payment</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Principal</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Interest</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Balance</th>
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

      <div className="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Understanding the schedule:</span> Each row shows how your payment is split between principal (paying down the loan) and interest (cost of borrowing). Early payments have more interest, while later payments have more principal.
        </p>
      </div>
    </div>
  );
}