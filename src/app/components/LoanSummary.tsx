import { DollarSign, TrendingUp, Calendar, CreditCard, Zap, Clock } from 'lucide-react';

interface LoanSummaryProps {
  summary: {
    monthlyPayment: number;
    totalPayments: number;
    totalInterest: number;
    totalPaid: number;
    extraPayment?: number;
    savedPayments?: number;
    savedInterest?: number;
  };
}

export function LoanSummary({ summary }: LoanSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-[#1B4E9B]" />
        Loan Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-[#1B4E9B]">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#1B4E9B] p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-medium text-gray-700">Payment Amount</h3>
          </div>
          <p className="text-3xl font-bold text-[#1B4E9B]">{formatCurrency(summary.monthlyPayment)}</p>
          <p className="text-sm text-gray-600 mt-1">Per payment period</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6 border-2 border-[#20B2AA]">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#20B2AA] p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-medium text-gray-700">Total Payments</h3>
          </div>
          <p className="text-3xl font-bold text-[#20B2AA]">{summary.totalPayments}</p>
          <p className="text-sm text-gray-600 mt-1">Number of payments</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-6 border-2 border-[#FFB800]">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#FFB800] p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-medium text-gray-700">Total Interest</h3>
          </div>
          <p className="text-3xl font-bold text-[#FFB800]">{formatCurrency(summary.totalInterest)}</p>
          <p className="text-sm text-gray-600 mt-1">Over loan term</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-6 border-2 border-[#1B4E9B]">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#1B4E9B] p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-medium text-gray-700">Total Amount</h3>
          </div>
          <p className="text-3xl font-bold text-[#1B4E9B]">{formatCurrency(summary.totalPaid)}</p>
          <p className="text-sm text-gray-600 mt-1">Principal + Interest</p>
        </div>
      </div>

      {summary.extraPayment && summary.extraPayment > 0 && (
        <div className="mt-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border-2 border-[#20B2AA]">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-[#20B2AA]" />
            <h3 className="text-xl font-semibold text-gray-800">Extra Payment Savings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#1B4E9B]">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-[#1B4E9B]" />
                <p className="text-sm font-medium text-gray-600">Extra Payment</p>
              </div>
              <p className="text-2xl font-bold text-[#1B4E9B]">{formatCurrency(summary.extraPayment)}</p>
              <p className="text-xs text-gray-500 mt-1">Per payment period</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#20B2AA]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#20B2AA]" />
                <p className="text-sm font-medium text-gray-600">Payments Saved</p>
              </div>
              <p className="text-2xl font-bold text-[#20B2AA]">{summary.savedPayments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Fewer payments needed</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#FFB800]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#FFB800]" />
                <p className="text-sm font-medium text-gray-600">Interest Saved</p>
              </div>
              <p className="text-2xl font-bold text-[#FFB800]">{formatCurrency(summary.savedInterest || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Total savings from extra payments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}