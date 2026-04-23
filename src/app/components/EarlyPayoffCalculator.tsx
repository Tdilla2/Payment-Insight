import { useState } from 'react';
import { Zap, Calendar, TrendingDown, DollarSign } from 'lucide-react';

interface EarlyPayoffCalculatorProps {
  principal: number;
  annualRate: number;
  termYears: number;
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
  basePayment: number;
}

export function EarlyPayoffCalculator({
  principal,
  annualRate,
  termYears,
  paymentFrequency,
  basePayment
}: EarlyPayoffCalculatorProps) {
  const [targetPayoffYears, setTargetPayoffYears] = useState<number>(Math.max(1, termYears - 5));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateRequiredPayment = (targetYears: number) => {
    let paymentsPerYear: number;
    switch (paymentFrequency) {
      case 'monthly':
        paymentsPerYear = 12;
        break;
      case 'biweekly':
        paymentsPerYear = 26;
        break;
      case 'weekly':
        paymentsPerYear = 52;
        break;
    }

    const periodicRate = (annualRate / 100) / paymentsPerYear;
    const numberOfPayments = targetYears * paymentsPerYear;

    const requiredPayment = principal *
      (periodicRate * Math.pow(1 + periodicRate, numberOfPayments)) /
      (Math.pow(1 + periodicRate, numberOfPayments) - 1);

    return requiredPayment;
  };

  const calculateSavings = (targetYears: number) => {
    const requiredPayment = calculateRequiredPayment(targetYears);
    let paymentsPerYear: number;
    switch (paymentFrequency) {
      case 'monthly':
        paymentsPerYear = 12;
        break;
      case 'biweekly':
        paymentsPerYear = 26;
        break;
      case 'weekly':
        paymentsPerYear = 52;
        break;
    }

    const originalPayments = termYears * paymentsPerYear;
    const newPayments = targetYears * paymentsPerYear;

    const originalTotal = basePayment * originalPayments;
    const newTotal = requiredPayment * newPayments;

    return {
      requiredPayment,
      extraPayment: requiredPayment - basePayment,
      interestSaved: originalTotal - newTotal,
      paymentsSaved: originalPayments - newPayments,
      timeSaved: termYears - targetYears
    };
  };

  const savings = calculateSavings(targetPayoffYears);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Zap className="w-6 h-6 text-[#1B4E9B]" />
        Early Payoff Calculator
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Target Payoff Time (Years)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max={termYears}
            value={targetPayoffYears}
            onChange={(e) => setTargetPayoffYears(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#20B2AA]"
          />
          <div className="w-20 text-center">
            <span className="text-2xl font-bold text-[#1B4E9B]">{targetPayoffYears}</span>
            <span className="text-sm text-gray-600 ml-1">years</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>1 year</span>
          <span>Original: {termYears} years</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-[#1B4E9B]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#1B4E9B]" />
            <p className="text-sm font-medium text-gray-700">Required Payment</p>
          </div>
          <p className="text-2xl font-bold text-[#1B4E9B]">{formatCurrency(savings.requiredPayment)}</p>
          <p className="text-xs text-gray-600 mt-1">Per payment period</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border-2 border-[#20B2AA]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-[#20B2AA]" />
            <p className="text-sm font-medium text-gray-700">Extra Payment</p>
          </div>
          <p className="text-2xl font-bold text-[#20B2AA]">
            {savings.extraPayment > 0 ? '+' : ''}{formatCurrency(savings.extraPayment)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Additional per period</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-4 border-2 border-[#FFB800]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#FFB800]" />
            <p className="text-sm font-medium text-gray-700">Interest Saved</p>
          </div>
          <p className="text-2xl font-bold text-[#FFB800]">{formatCurrency(savings.interestSaved)}</p>
          <p className="text-xs text-gray-600 mt-1">Total savings</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 border-2 border-[#1B4E9B]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-[#1B4E9B]" />
            <p className="text-sm font-medium text-gray-700">Time Saved</p>
          </div>
          <p className="text-2xl font-bold text-[#1B4E9B]">{savings.timeSaved}</p>
          <p className="text-xs text-gray-600 mt-1">Years earlier</p>
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 border-2 border-[#20B2AA]">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Summary:</span> By paying{' '}
          <span className="font-bold text-[#1B4E9B]">{formatCurrency(savings.requiredPayment)}</span> instead of{' '}
          <span className="font-bold">{formatCurrency(basePayment)}</span>, you'll pay off your loan in{' '}
          <span className="font-bold text-[#20B2AA]">{targetPayoffYears} years</span> instead of{' '}
          <span className="font-bold">{termYears} years</span>, saving{' '}
          <span className="font-bold text-[#FFB800]">{formatCurrency(savings.interestSaved)}</span> in interest!
        </p>
      </div>
    </div>
  );
}
