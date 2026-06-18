import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calculator, DollarSign, Calendar, Percent, TrendingUp, Home, Car, Briefcase, GraduationCap, Wallet, Zap } from 'lucide-react';
import { AmortizationSchedule } from './AmortizationSchedule';
import { LoanSummary } from './LoanSummary';
import { PaymentChart } from './PaymentChart';
import { ExportTools } from './ExportTools';
import { TaxDeductions } from './TaxDeductions';
import { EarlyPayoffCalculator } from './EarlyPayoffCalculator';
import { CurrencySelector } from './CurrencySelector';

type LoanType = 'mortgage' | 'auto' | 'personal' | 'student' | 'business' | 'custom';

interface LoanFormData {
  loanType: LoanType;
  purchasePrice: number;
  downPayment: number;
  principal: number;
  annualRate: number;
  termYears: number;
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
  extraPayment: number;
}

interface PaymentDetail {
  paymentNumber: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const loanTypePresets = {
  mortgage: {
    icon: Home,
    label: 'Home Mortgage',
    purchasePrice: 350000,
    downPayment: 70000,
    annualRate: 6.5,
    termYears: 30,
    extraPayment: 0
  },
  auto: {
    icon: Car,
    label: 'Auto Loan',
    purchasePrice: 35000,
    downPayment: 5000,
    annualRate: 5.5,
    termYears: 5,
    extraPayment: 0
  },
  personal: {
    icon: Wallet,
    label: 'Personal Loan',
    purchasePrice: 15000,
    downPayment: 0,
    annualRate: 10.5,
    termYears: 3,
    extraPayment: 0
  },
  student: {
    icon: GraduationCap,
    label: 'Student Loan',
    purchasePrice: 50000,
    downPayment: 0,
    annualRate: 4.5,
    termYears: 10,
    extraPayment: 0
  },
  business: {
    icon: Briefcase,
    label: 'Business Loan',
    purchasePrice: 100000,
    downPayment: 20000,
    annualRate: 7.5,
    termYears: 7,
    extraPayment: 0
  },
  custom: {
    icon: Calculator,
    label: 'Custom Loan',
    purchasePrice: 250000,
    downPayment: 0,
    annualRate: 6.5,
    termYears: 30,
    extraPayment: 0
  }
};

export function LoanCalculator() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LoanFormData>({
    defaultValues: {
      loanType: 'mortgage',
      purchasePrice: 350000,
      downPayment: 70000,
      principal: 280000,
      annualRate: 6.5,
      termYears: 30,
      paymentFrequency: 'monthly',
      extraPayment: 0
    }
  });

  const loanType = watch('loanType');
  const purchasePrice = watch('purchasePrice');
  const downPayment = watch('downPayment');

  useEffect(() => {
    if (loanType && loanType !== 'custom') {
      const preset = loanTypePresets[loanType];
      setValue('purchasePrice', preset.purchasePrice);
      setValue('downPayment', preset.downPayment);
      setValue('principal', preset.purchasePrice - preset.downPayment);
      setValue('annualRate', preset.annualRate);
      setValue('termYears', preset.termYears);
      setValue('extraPayment', preset.extraPayment);
    }
  }, [loanType, setValue]);

  useEffect(() => {
    const principal = purchasePrice - downPayment;
    setValue('principal', principal > 0 ? principal : 0);
  }, [purchasePrice, downPayment, setValue]);

  const [schedule, setSchedule] = useState<PaymentDetail[] | null>(null);
  const [summary, setSummary] = useState<{
    monthlyPayment: number;
    totalPayments: number;
    totalInterest: number;
    totalPaid: number;
    extraPayment?: number;
    savedPayments?: number;
    savedInterest?: number;
  } | null>(null);
  const [currency, setCurrency] = useState<string>('USD');
  const [showEarlyPayoff, setShowEarlyPayoff] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(22);

  const calculateLoan = (data: LoanFormData) => {
    const { principal, annualRate, termYears, paymentFrequency, extraPayment } = data;

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
    const numberOfPayments = termYears * paymentsPerYear;

    const basePayment = principal *
      (periodicRate * Math.pow(1 + periodicRate, numberOfPayments)) /
      (Math.pow(1 + periodicRate, numberOfPayments) - 1);

    const monthlyPayment = basePayment + extraPayment;

    let balance = principal;
    const amortizationSchedule: PaymentDetail[] = [];
    const startDate = new Date();
    let actualPayments = 0;
    let totalPaid = 0;

    for (let i = 1; i <= numberOfPayments && balance > 0.01; i++) {
      const interestPayment = balance * periodicRate;
      let principalPayment = basePayment - interestPayment + extraPayment;

      if (principalPayment > balance) {
        principalPayment = balance;
      }

      const actualPayment = interestPayment + principalPayment;
      balance = Math.max(0, balance - principalPayment);
      totalPaid += actualPayment;

      const paymentDate = new Date(startDate);
      if (paymentFrequency === 'monthly') {
        paymentDate.setMonth(startDate.getMonth() + i);
      } else if (paymentFrequency === 'biweekly') {
        paymentDate.setDate(startDate.getDate() + (i * 14));
      } else {
        paymentDate.setDate(startDate.getDate() + (i * 7));
      }

      amortizationSchedule.push({
        paymentNumber: i,
        paymentDate: paymentDate.toLocaleDateString(),
        payment: actualPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance
      });

      actualPayments = i;
    }

    const totalInterest = totalPaid - principal;

    setSchedule(amortizationSchedule);
    setSummary({
      monthlyPayment: basePayment,
      totalPayments: actualPayments,
      totalInterest,
      totalPaid,
      extraPayment,
      savedPayments: numberOfPayments - actualPayments,
      savedInterest: (basePayment * numberOfPayments - principal) - totalInterest
    });
  };

  return (
    <div className="space-y-6">
      <CurrencySelector selectedCurrency={currency} onCurrencyChange={setCurrency} />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-[#7B1E2B]" />
          Loan Details
        </h2>

        <form onSubmit={handleSubmit(calculateLoan)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Loan Type
              </div>
            </label>
            <select
              {...register('loanType')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
            >
              {Object.entries(loanTypePresets).map(([key, preset]) => {
                const Icon = preset.icon;
                return (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Purchase Price / Total Amount
                </div>
              </label>
              <input
                type="number"
                step="1000"
                {...register('purchasePrice', { required: true, min: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
              />
              {errors.purchasePrice && <span className="text-red-500 text-sm">Please enter a valid amount</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Down Payment
                </div>
              </label>
              <input
                type="number"
                step="1000"
                {...register('downPayment', { required: true, min: 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
              />
              {errors.downPayment && <span className="text-red-500 text-sm">Please enter a valid down payment</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Loan Amount (Calculated)
                </div>
              </label>
              <input
                type="number"
                step="1000"
                {...register('principal', { required: true, min: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
                readOnly
              />
              {errors.principal && <span className="text-red-500 text-sm">Please enter a valid loan amount</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Annual Interest Rate (%)
                </div>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('annualRate', { required: true, min: 0.01, max: 100 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
              />
              {errors.annualRate && <span className="text-red-500 text-sm">Please enter a valid interest rate</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Loan Term (Years)
                </div>
              </label>
              <input
                type="number"
                step="1"
                {...register('termYears', { required: true, min: 1, max: 50 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
              />
              {errors.termYears && <span className="text-red-500 text-sm">Please enter a valid loan term</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Payment Frequency
                </div>
              </label>
              <select
                {...register('paymentFrequency')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Extra Payment (Optional)
                </div>
              </label>
              <input
                type="number"
                step="10"
                {...register('extraPayment', { min: 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Add extra payment per period to pay off loan faster</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white py-3 px-6 rounded-lg hover:from-[#5E1620] hover:to-[#5E1620] transition-colors font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Calculator className="w-5 h-5" />
            Calculate Loan
          </button>
        </form>
      </div>

      {summary && schedule && (
        <>
          <LoanSummary summary={summary} />
          <PaymentChart schedule={schedule} />

          <div className="print:hidden">
            <button
              onClick={() => setShowEarlyPayoff(!showEarlyPayoff)}
              className="w-full bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white py-3 px-6 rounded-lg hover:from-[#5E1620] hover:to-[#5E1620] transition-colors font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-5 h-5" />
              {showEarlyPayoff ? 'Hide' : 'Show'} Early Payoff Calculator
            </button>
          </div>

          {showEarlyPayoff && (
            <EarlyPayoffCalculator
              principal={watch('principal')}
              annualRate={watch('annualRate')}
              termYears={watch('termYears')}
              paymentFrequency={watch('paymentFrequency')}
              basePayment={summary.monthlyPayment}
            />
          )}

          <TaxDeductions
            schedule={schedule}
            loanType={loanType}
            initialTaxRate={taxRate}
          />

          <ExportTools schedule={schedule} summary={summary} />

          <AmortizationSchedule schedule={schedule} />
        </>
      )}
    </div>
  );
}