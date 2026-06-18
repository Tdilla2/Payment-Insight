import React from 'react';
import { Receipt, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface PaymentDetail {
  paymentNumber: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface TaxDeductionsProps {
  schedule: PaymentDetail[];
  loanType: string;
  initialTaxRate?: number;
}

export function TaxDeductions({ schedule, loanType, initialTaxRate = 22 }: TaxDeductionsProps) {
  const [taxRate, setTaxRate] = React.useState(initialTaxRate);

  if (loanType !== 'mortgage') {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const currentYear = new Date().getFullYear();

  const calculateYearlyInterest = (year: number) => {
    const startMonth = (year - currentYear) * 12;
    const endMonth = startMonth + 12;

    return schedule
      .filter((_, idx) => idx >= startMonth && idx < endMonth)
      .reduce((sum, payment) => sum + payment.interest, 0);
  };

  const years = Array.from({ length: Math.min(10, Math.ceil(schedule.length / 12)) }, (_, i) => currentYear + i);

  const yearlyData = years.map(year => {
    const interest = calculateYearlyInterest(year);
    const taxSavings = interest * (taxRate / 100);
    return { year, interest, taxSavings };
  });

  const totalInterestFirst10Years = yearlyData.reduce((sum, y) => sum + y.interest, 0);
  const totalTaxSavings = yearlyData.reduce((sum, y) => sum + y.taxSavings, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Receipt className="w-6 h-6 text-[#7B1E2B]" />
          Tax Deductions (Mortgage Interest)
        </h2>
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-gray-600" />
          <label htmlFor="taxRate" className="text-sm font-medium text-gray-700">
            Tax Bracket:
          </label>
          <select
            id="taxRate"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] text-sm"
          >
            <option value="10">10%</option>
            <option value="12">12%</option>
            <option value="22">22%</option>
            <option value="24">24%</option>
            <option value="32">32%</option>
            <option value="35">35%</option>
            <option value="37">37%</option>
          </select>
        </div>
      </div>

      <div className="mb-6 bg-rose-50 rounded-lg p-4 border border-rose-200">
        <div className="flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-rose-700 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Estimated Tax Savings</h3>
            <p className="text-sm text-gray-600 mb-3">
              Mortgage interest is typically tax-deductible. Based on a {taxRate}% tax bracket, here's your estimated annual tax savings:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded p-3">
                <p className="text-sm text-gray-600">Total Interest (First 10 Years)</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalInterestFirst10Years)}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-sm text-gray-600">Total Tax Savings (First 10 Years)</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(totalTaxSavings)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Year</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Interest Paid</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Tax Savings ({taxRate}%)</th>
            </tr>
          </thead>
          <tbody>
            {yearlyData.map((data, index) => (
              <tr
                key={data.year}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{data.year}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(data.interest)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                  {formatCurrency(data.taxSavings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-gray-700">
          <span className="font-semibold">Disclaimer:</span> Tax deductions vary based on your individual tax situation, filing status, and current tax laws.
          The standard deduction for 2026 may exceed your itemized deductions, making mortgage interest non-deductible.
          Consult with a tax professional for accurate advice specific to your situation.
        </p>
      </div>
    </div>
  );
}
