// Maps the API's relational (snake_case) rows to/from the camelCase shapes the
// UI components already use, so components change as little as possible.
import { api } from './api';
import type { Client } from '../components/ClientManagement';
import type { Invoice } from '../components/InvoiceGenerator';

const day = (s: string | null | undefined) => (s ? String(s).slice(0, 10) : '');
const num = (n: any) => (n == null ? 0 : Number(n));

function toClient(r: any): Client {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? '',
    loanType: r.loan_type ?? 'Home Mortgage',
    loanAmount: num(r.loan_amount),
    monthlyPayment: num(r.monthly_payment),
    interestRate: num(r.interest_rate),
    loanTerm: num(r.loan_term),
    startDate: day(r.start_date),
    nextPaymentDate: day(r.next_payment_date),
    balance: num(r.balance),
    status: r.status ?? 'current',
    billingDay: r.billing_day ?? 1,
  };
}

function toInvoice(r: any): Invoice {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name ?? '',
    clientEmail: r.client_email ?? '',
    loanType: r.loan_type ?? '',
    invoiceNumber: r.invoice_number,
    invoiceDate: day(r.invoice_date),
    dueDate: day(r.due_date),
    amount: num(r.amount),
    lateFee: num(r.late_fee),
    totalAmount: num(r.total_amount),
    status: r.status,
    description: r.description ?? '',
  };
}

export interface Me {
  email: string;
  role: 'superadmin' | 'client';
  clientId: string | null;
  stripePublishableKey: string;
  stripeMode: string;
}

export const dataApi = {
  me: () => api.get<Me>('/me'),

  // clients
  listClients: async (): Promise<Client[]> => (await api.get<any[]>('/clients')).map(toClient),
  getClient: async (id: string): Promise<Client> => toClient(await api.get<any>(`/clients/${id}`)),
  createClient: async (c: Partial<Client>): Promise<Client> => toClient(await api.post('/clients', c)),
  updateClient: async (id: string, c: Partial<Client>): Promise<Client> => toClient(await api.put(`/clients/${id}`, c)),
  deleteClient: (id: string) => api.del(`/clients/${id}`),
  amortization: (clientId: string) =>
    api.get<{ month: number; date: string; payment: number; principal: number; interest: number; balance: number }[]>(
      `/clients/${clientId}/amortization`),

  // invoices
  listInvoices: async (): Promise<Invoice[]> => (await api.get<any[]>('/invoices')).map(toInvoice),
  createInvoice: async (i: Partial<Invoice>): Promise<Invoice> => toInvoice(await api.post('/invoices', i)),
  updateInvoice: async (id: string, i: Partial<Invoice>): Promise<Invoice> => toInvoice(await api.put(`/invoices/${id}`, i)),
  deleteInvoice: (id: string) => api.del(`/invoices/${id}`),

  // payments
  createPaymentIntent: (invoiceId: string) =>
    api.post<{ intentId: string; clientSecret: string; publishableKey: string; mock: boolean; amount: number }>(
      '/payments/intent', { invoiceId }),
  listPayments: () => api.get<any[]>('/payments'),
  confirmPayment: (paymentId: string) => api.post(`/payments/${paymentId}/confirm`),
};
