import { BarChart3 } from 'lucide-react';

interface PaymentDetail {
  paymentNumber: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface PaymentChartProps {
  schedule: PaymentDetail[];
}

export function PaymentChart({ schedule }: PaymentChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalPrincipal = schedule.reduce((sum, p) => sum + p.principal, 0);
  const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
  const totalPayment = totalPrincipal + totalInterest;

  const principalPercentage = (totalPrincipal / totalPayment) * 100;
  const interestPercentage = (totalInterest / totalPayment) * 100;

  const firstPayment = schedule[0];
  const midPayment = schedule[Math.floor(schedule.length / 2)];
  const lastPayment = schedule[schedule.length - 1];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-[#7B1E2B]" />
        Payment Breakdown Analysis
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Total Payment Distribution</h3>
          <div className="flex h-12 rounded-lg overflow-hidden border border-gray-200">
            <div
              className="bg-[#A6332E] flex items-center justify-center text-white font-semibold transition-all"
              style={{ width: `${principalPercentage}%` }}
            >
              <span className="text-sm">Principal {principalPercentage.toFixed(1)}%</span>
            </div>
            <div
              className="bg-[#FFB800] flex items-center justify-center text-white font-semibold transition-all"
              style={{ width: `${interestPercentage}%` }}
            >
              <span className="text-sm">Interest {interestPercentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Principal: {formatCurrency(totalPrincipal)}</span>
            <span>Interest: {formatCurrency(totalInterest)}</span>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Payment Progression Over Time</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">First Payment (#{firstPayment.paymentNumber})</span>
                <span className="text-sm text-gray-500">{firstPayment.paymentDate}</span>
              </div>
              <div className="flex h-8 rounded overflow-hidden bg-gray-100">
                <div
                  className="bg-[#A6332E] flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(firstPayment.principal / firstPayment.payment) * 100}%` }}
                >
                  {formatCurrency(firstPayment.principal)}
                </div>
                <div
                  className="bg-[#FFB800] flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(firstPayment.interest / firstPayment.payment) * 100}%` }}
                >
                  {formatCurrency(firstPayment.interest)}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Balance: {formatCurrency(firstPayment.balance)}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Mid-Term Payment (#{midPayment.paymentNumber})</span>
                <span className="text-sm text-gray-500">{midPayment.paymentDate}</span>
              </div>
              <div className="flex h-8 rounded overflow-hidden bg-gray-100">
                <div
                  className="bg-[#A6332E] flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(midPayment.principal / midPayment.payment) * 100}%` }}
                >
                  {formatCurrency(midPayment.principal)}
                </div>
                <div
                  className="bg-[#FFB800] flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(midPayment.interest / midPayment.payment) * 100}%` }}
                >
                  {formatCurrency(midPayment.interest)}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Balance: {formatCurrency(midPayment.balance)}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Final Payment (#{lastPayment.paymentNumber})</span>
                <span className="text-sm text-gray-500">{lastPayment.paymentDate}</span>
              </div>
              <div className="flex h-8 rounded overflow-hidden bg-gray-100">
                <div
                  className="bg-[#A6332E] flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(lastPayment.principal / lastPayment.payment) * 100}%` }}
                >
                  {formatCurrency(lastPayment.principal)}
                </div>
                <div
                  className="bg-[#FFB800] flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(lastPayment.interest / lastPayment.payment) * 100}%` }}
                >
                  {formatCurrency(lastPayment.interest)}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Balance: {formatCurrency(lastPayment.balance)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-lg p-4 border-2 border-[#7B1E2B]">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Notice:</span> Early payments are mostly interest (<span className="text-[#FFB800] font-semibold">gold</span>), while later payments are mostly principal (<span className="text-[#A6332E] font-semibold">teal</span>). This is normal amortization behavior.
          </p>
        </div>
      </div>
    </div>
  );
}