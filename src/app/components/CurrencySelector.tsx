import { DollarSign } from 'lucide-react';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
];

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export function CurrencySelector({ selectedCurrency, onCurrencyChange }: CurrencySelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 print:hidden">
      <div className="flex items-center gap-3">
        <DollarSign className="w-5 h-5 text-[#7B1E2B]" />
        <label htmlFor="currency" className="font-medium text-gray-700">
          Currency:
        </label>
        <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E] focus:border-transparent"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} - {currency.name} ({currency.code})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export const getCurrencySymbol = (code: string): string => {
  const currency = currencies.find(c => c.code === code);
  return currency?.symbol || '$';
};

export const formatCurrencyValue = (amount: number, currencyCode: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};
