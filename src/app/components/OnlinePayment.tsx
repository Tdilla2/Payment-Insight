import { useState } from 'react';
import { CreditCard, Smartphone, Building2, Lock, CheckCircle } from 'lucide-react';

interface OnlinePaymentProps {
  amount: number;
  invoiceNumber: string;
  clientName: string;
  invoiceId?: string;
}

export function OnlinePayment({ amount, invoiceNumber, clientName, invoiceId }: OnlinePaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const processPayment = async () => {
    if (paymentMethod === 'card' && (!cardNumber || !expiryDate || !cvv || !nameOnCard)) {
      alert('Please fill in all card details');
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setPaymentComplete(true);

      if (invoiceId) {
        try {
          const stored = localStorage.getItem('payment_insight_invoices');
          if (stored) {
            const invoices = JSON.parse(stored);
            const updated = invoices.map((inv: { id: string }) =>
              inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
            );
            localStorage.setItem('payment_insight_invoices', JSON.stringify(updated));
          }
        } catch (error) {
          console.error('Error updating invoice status:', error);
        }
      }

      alert(`Payment Successful!\n\nAmount: ${formatCurrency(amount)}\nConfirmation: PAY-${Date.now()}\n\nReceipt sent to email.`);
    }, 2000);
  };

  if (paymentComplete) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Thank you for your payment, {clientName}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Invoice Number</p>
            <p className="font-mono font-bold text-lg text-gray-900">{invoiceNumber}</p>
            <p className="text-sm text-gray-600 mt-2">Amount Paid</p>
            <p className="font-bold text-2xl text-green-600">{formatCurrency(amount)}</p>
            <p className="text-sm text-gray-600 mt-2">Confirmation Number</p>
            <p className="font-mono text-gray-900">PAY-{Date.now()}</p>
          </div>
          <p className="text-sm text-gray-500">
            A receipt has been sent to your email address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Lock className="w-6 h-6 text-[#1B4E9B]" />
        Secure Online Payment
      </h2>

      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border-2 border-[#20B2AA]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Invoice: {invoiceNumber}</p>
            <p className="text-sm text-gray-600">Client: {clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Amount Due</p>
            <p className="text-3xl font-bold text-[#1B4E9B]">{formatCurrency(amount)}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'card'
                ? 'border-[#20B2AA] bg-teal-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-[#1B4E9B]" />
            <p className="text-sm font-semibold text-gray-900">Credit/Debit Card</p>
          </button>

          <button
            onClick={() => setPaymentMethod('ach')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'ach'
                ? 'border-[#20B2AA] bg-teal-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Building2 className="w-6 h-6 mx-auto mb-2 text-[#1B4E9B]" />
            <p className="text-sm font-semibold text-gray-900">Bank Transfer (ACH)</p>
          </button>

          <button
            onClick={() => setPaymentMethod('paypal')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'paypal'
                ? 'border-[#20B2AA] bg-teal-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Smartphone className="w-6 h-6 mx-auto mb-2 text-[#1B4E9B]" />
            <p className="text-sm font-semibold text-gray-900">PayPal</p>
          </button>
        </div>
      </div>

      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name on Card
            </label>
            <input
              type="text"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
              placeholder="John Smith"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA]"
            />
          </div>
        </div>
      )}

      {paymentMethod === 'ach' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              placeholder="Enter account number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Routing Number
            </label>
            <input
              type="text"
              placeholder="Enter routing number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA]">
              <option>Checking</option>
              <option>Savings</option>
            </select>
          </div>
        </div>
      )}

      {paymentMethod === 'paypal' && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You will be redirected to PayPal to complete your payment</p>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700">
              Click "Pay Now" to proceed to PayPal's secure payment page
            </p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={processPayment}
          disabled={processing}
          className={`w-full px-6 py-4 bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA] text-white rounded-lg hover:from-[#153d7a] hover:to-[#1a8f8f] transition-colors font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${
            processing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay {formatCurrency(amount)}
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
        <Lock className="w-4 h-4" />
        <span>Secure payment powered by Stripe</span>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Note:</span> In production, this would integrate with Stripe, PayPal, or your preferred payment gateway. Payment processing requires proper PCI compliance and SSL certificates.
        </p>
      </div>
    </div>
  );
}
