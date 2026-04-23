import { useState, useEffect, useMemo } from 'react';
import { Calculator, Users, FileText, CreditCard, Link2, DollarSign, Table, LogOut, Shield, User } from 'lucide-react';
import { LoanCalculator } from './components/LoanCalculator';
import { ClientManagement, Client } from './components/ClientManagement';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { PaymentTracking } from './components/PaymentTracking';
import { QuickBooksIntegration } from './components/QuickBooksIntegration';
import { OnlinePayment } from './components/OnlinePayment';
import { ClientAmortizationSchedule } from './components/ClientAmortizationSchedule';
import { LoginScreen, UserSession } from './components/LoginScreen';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { autoGenerateInvoicesForThisMonth } from './lib/autoGenerateInvoices';

type TabType = 'calculator' | 'clients' | 'invoices' | 'payments' | 'quickbooks' | 'online-payment' | 'amortization';

interface PayableInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
}

const SESSION_KEY = 'payment_insight_session';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [payableInvoice, setPayableInvoice] = useState<PayableInvoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(() => {
    try {
      const stored = localStorage.getItem('payment_insight_selected_client');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Persist session
  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [session]);

  // For client role: look up their client record
  const loggedInClient = useMemo<Client | null>(() => {
    if (!session || session.role !== 'client') return null;
    try {
      const stored = localStorage.getItem('payment_insight_clients');
      const clients: Client[] = stored ? JSON.parse(stored) : [];
      return clients.find(c => c.id === session.clientId) || null;
    } catch {
      return null;
    }
  }, [session, activeTab, mustChangePassword]);

  // When a client logs in, lock selectedClient to their own record so downstream components use it
  useEffect(() => {
    if (session?.role === 'client' && loggedInClient) {
      setSelectedClient(loggedInClient);
    }
  }, [session, loggedInClient]);

  // Default tab after login + auto-run invoice generation for super admin
  useEffect(() => {
    if (session?.role === 'client') {
      setActiveTab('invoices');
    } else if (session?.role === 'superadmin') {
      setActiveTab('calculator');
      const result = autoGenerateInvoicesForThisMonth();
      if (result.created > 0) {
        console.log(`Auto-generated ${result.created} invoice(s):`, result.createdForClients);
      }
    }
  }, [session?.role]);

  // Save selected client to localStorage whenever it changes
  useEffect(() => {
    try {
      if (selectedClient) {
        localStorage.setItem('payment_insight_selected_client', JSON.stringify(selectedClient));
      } else {
        localStorage.removeItem('payment_insight_selected_client');
      }
    } catch (error) {
      console.error('Error saving selected client:', error);
    }
  }, [selectedClient]);

  // Sync selected client with latest data from clients list when switching tabs
  useEffect(() => {
    if (selectedClient) {
      try {
        const stored = localStorage.getItem('payment_insight_clients');
        if (stored) {
          const clients = JSON.parse(stored) as Client[];
          const updatedClient = clients.find(c => c.id === selectedClient.id);
          if (updatedClient && JSON.stringify(updatedClient) !== JSON.stringify(selectedClient)) {
            setSelectedClient(updatedClient);
          }
        }
      } catch (error) {
        console.error('Error syncing client data:', error);
      }
    }
  }, [activeTab]);

  const allTabs: { id: TabType; label: string; icon: typeof Calculator }[] = [
    { id: 'calculator', label: 'Loan Calculator', icon: Calculator },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'amortization', label: 'Amortization', icon: Table },
    { id: 'quickbooks', label: 'QuickBooks', icon: Link2 },
    { id: 'online-payment', label: 'Online Payment', icon: DollarSign },
  ];

  const clientTabIds: TabType[] = ['invoices', 'payments', 'amortization', 'online-payment'];
  const visibleTabs = session?.role === 'client'
    ? allTabs.filter(t => clientTabIds.includes(t.id))
    : allTabs;

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('amortization');
  };

  const handleLogout = () => {
    setSession(null);
    setMustChangePassword(false);
    setSelectedClient(null);
    setPayableInvoice(null);
  };

  // --- render ---

  if (!session) {
    return (
      <LoginScreen
        onLogin={(newSession, needsChange) => {
          setSession(newSession);
          setMustChangePassword(needsChange);
        }}
      />
    );
  }

  if (session.role === 'client' && mustChangePassword) {
    return (
      <ChangePasswordScreen
        clientId={session.clientId}
        onPasswordChanged={() => setMustChangePassword(false)}
        onCancel={handleLogout}
      />
    );
  }

  const roleLabel = session.role === 'superadmin' ? 'Super Admin' : loggedInClient?.name || 'Client';
  const RoleIcon = session.role === 'superadmin' ? Shield : User;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-4 print:hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow border border-gray-200">
            <RoleIcon className="w-4 h-4 text-[#1B4E9B]" />
            <span className="text-sm text-gray-700">
              Signed in as <span className="font-semibold text-[#1B4E9B]">{roleLabel}</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="text-center mb-8 print:mb-4">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <img
              src="/src/imports/payment_insight_logo_new.JPG"
              alt="Payment Insight Logo"
              className="w-48 h-auto"
            />
            <div>
              <h1 className="text-5xl font-bold text-[#1B4E9B]">PAYMENT INSIGHT</h1>
            </div>
          </div>
          <p className="text-gray-700 text-lg">
            {session.role === 'superadmin'
              ? 'Manage loans, clients, invoices, and payments all in one place'
              : 'View your invoices, payments, and loan schedule'}
          </p>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-lg p-2 print:hidden">
          <div className="flex flex-wrap gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#1B4E9B] to-[#20B2AA] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {session.role === 'superadmin' && activeTab === 'calculator' && <LoanCalculator />}
          {session.role === 'superadmin' && activeTab === 'clients' && (
            <ClientManagement onSelectClient={handleSelectClient} />
          )}
          {session.role === 'superadmin' && activeTab === 'quickbooks' && <QuickBooksIntegration />}

          {activeTab === 'invoices' && (
            session.role === 'client'
              ? <PaymentTracking
                  filterClientId={session.clientId}
                  hideAdminActions
                  onPayInvoice={(inv) => { setPayableInvoice(inv); setActiveTab('online-payment'); }}
                />
              : <InvoiceGenerator client={selectedClient} onClose={() => {}} />
          )}

          {activeTab === 'payments' && (
            <PaymentTracking
              filterClientId={session.role === 'client' ? session.clientId : undefined}
              hideAdminActions={session.role === 'client'}
              onPayInvoice={(inv) => {
                setPayableInvoice(inv);
                setActiveTab('online-payment');
              }}
            />
          )}

          {activeTab === 'amortization' && (
            <ClientAmortizationSchedule
              client={session.role === 'client' ? loggedInClient : selectedClient}
              onCreateInvoice={() => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'online-payment' && (
            <OnlinePayment
              invoiceId={payableInvoice?.id}
              amount={payableInvoice?.amount ?? loggedInClient?.monthlyPayment ?? selectedClient?.monthlyPayment ?? 1580.17}
              invoiceNumber={payableInvoice?.invoiceNumber || 'INV-1001'}
              clientName={payableInvoice?.clientName || loggedInClient?.name || selectedClient?.name || 'Demo Client'}
            />
          )}
        </div>

        <div className="mt-8 text-center print:mt-4">
          <p className="text-sm text-gray-600">Powered by GDI Digital Solutions</p>
        </div>
      </div>
    </div>
  );
}
