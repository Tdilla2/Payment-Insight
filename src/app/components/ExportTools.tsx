import { Download, Printer, FileText } from 'lucide-react';

interface PaymentDetail {
  paymentNumber: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface ExportToolsProps {
  schedule: PaymentDetail[];
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

export function ExportTools({ schedule, summary }: ExportToolsProps) {
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
    link.setAttribute('download', `loan_amortization_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToText = () => {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    let content = 'LOAN AMORTIZATION SCHEDULE\n';
    content += '='.repeat(80) + '\n\n';
    content += 'SUMMARY\n';
    content += '-'.repeat(80) + '\n';
    content += `Monthly Payment: ${formatCurrency(summary.monthlyPayment)}\n`;
    content += `Total Payments: ${summary.totalPayments}\n`;
    content += `Total Interest: ${formatCurrency(summary.totalInterest)}\n`;
    content += `Total Amount Paid: ${formatCurrency(summary.totalPaid)}\n`;

    if (summary.extraPayment && summary.extraPayment > 0) {
      content += `\nExtra Payment: ${formatCurrency(summary.extraPayment)}\n`;
      content += `Payments Saved: ${summary.savedPayments}\n`;
      content += `Interest Saved: ${formatCurrency(summary.savedInterest || 0)}\n`;
    }

    content += '\n\nPAYMENT SCHEDULE\n';
    content += '-'.repeat(80) + '\n';
    content += 'Payment #'.padEnd(12) + 'Date'.padEnd(15) + 'Payment'.padEnd(15) +
               'Principal'.padEnd(15) + 'Interest'.padEnd(15) + 'Balance\n';
    content += '-'.repeat(80) + '\n';

    schedule.forEach(p => {
      content += String(p.paymentNumber).padEnd(12) +
                 p.paymentDate.padEnd(15) +
                 formatCurrency(p.payment).padEnd(15) +
                 formatCurrency(p.principal).padEnd(15) +
                 formatCurrency(p.interest).padEnd(15) +
                 formatCurrency(p.balance) + '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loan_schedule_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 print:hidden">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Download className="w-5 h-5 text-[#7B1E2B]" />
        Export & Print Options
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#A6332E] text-white rounded-lg hover:bg-[#5E1620] transition-colors font-medium shadow-md"
        >
          <Download className="w-5 h-5" />
          Export to CSV
        </button>

        <button
          onClick={exportToText}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#7B1E2B] text-white rounded-lg hover:bg-[#5E1620] transition-colors font-medium shadow-md"
        >
          <FileText className="w-5 h-5" />
          Export to Text
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFB800] text-white rounded-lg hover:bg-[#e6a600] transition-colors font-medium shadow-md"
        >
          <Printer className="w-5 h-5" />
          Print Schedule
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-3">
        Export your complete amortization schedule or print a physical copy for your records.
      </p>
    </div>
  );
}
