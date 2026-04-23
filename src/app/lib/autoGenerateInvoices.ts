import { Client } from '../components/ClientManagement';
import { Invoice } from '../components/InvoiceGenerator';

const CLIENTS_KEY = 'payment_insight_clients';
const INVOICES_KEY = 'payment_insight_invoices';
const LAST_RUN_KEY = 'payment_insight_autogen_last_run';

function clampBillingDay(day: number, year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

function sameMonthYear(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export interface AutoGenResult {
  created: number;
  createdForClients: string[];
}

export function autoGenerateInvoicesForThisMonth(): AutoGenResult {
  try {
    const clientsRaw = localStorage.getItem(CLIENTS_KEY);
    const invoicesRaw = localStorage.getItem(INVOICES_KEY);
    const clients: Client[] = clientsRaw ? JSON.parse(clientsRaw) : [];
    const invoices: Invoice[] = invoicesRaw ? JSON.parse(invoicesRaw) : [];

    const today = new Date();
    const createdNames: string[] = [];

    for (const client of clients) {
      if (!client.billingDay) continue;

      const targetDate = clampBillingDay(client.billingDay, today.getFullYear(), today.getMonth());
      // Only create if today is on or after the client's billing day this month
      if (today < targetDate) continue;

      // Skip if an invoice already exists for this client in this month
      const alreadyHas = invoices.some(inv => {
        if (inv.clientId !== client.id) return false;
        const dueMonth = new Date(inv.dueDate);
        const invMonth = new Date(inv.invoiceDate);
        return sameMonthYear(dueMonth, targetDate) || sameMonthYear(invMonth, targetDate);
      });
      if (alreadyHas) continue;

      const invoiceDate = targetDate.toISOString().split('T')[0];
      // Due date: same day next month (clamped to month-end)
      const next = clampBillingDay(client.billingDay, today.getFullYear(), today.getMonth() + 1);
      const dueDate = next.toISOString().split('T')[0];

      const id = `${Date.now()}-${client.id}`;
      const invoice: Invoice = {
        id,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}${client.id.slice(-2)}`,
        invoiceDate,
        dueDate,
        amount: client.monthlyPayment,
        lateFee: 0,
        totalAmount: client.monthlyPayment,
        status: 'sent',
        description: `Auto-generated monthly loan payment — ${targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      };
      invoices.push(invoice);
      createdNames.push(client.name);
    }

    if (createdNames.length > 0) {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    }
    localStorage.setItem(LAST_RUN_KEY, today.toISOString());

    return { created: createdNames.length, createdForClients: createdNames };
  } catch (error) {
    console.error('Auto-generate invoices failed:', error);
    return { created: 0, createdForClients: [] };
  }
}

export function getLastAutoGenRun(): string | null {
  return localStorage.getItem(LAST_RUN_KEY);
}
