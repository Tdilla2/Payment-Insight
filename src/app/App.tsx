import { useState, useEffect } from 'react';
import { Calculator, Users, FileText, CreditCard, Link2, DollarSign, Table, LogOut, Shield, User, UserCog } from 'lucide-react';
import { LoanCalculator } from './components/LoanCalculator';
import { ClientManagement, Client } from './components/ClientManagement';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { PaymentTracking } from './components/PaymentTracking';
import { QuickBooksIntegration } from './components/QuickBooksIntegration';
import { OnlinePayment } from './components/OnlinePayment';
import { ClientAmortizationSchedule } from './components/ClientAmortizationSchedule';
import { LoginScreen, UserSession } from './components/LoginScreen';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { UserManagement } from './components/UserManagement';
import { dataApi } from './lib/dataApi';
import { getTokens, signOut } from './lib/cognito';

type TabType = 'calculator' | 'clients' | 'invoices' | 'payments' | 'quickbooks' | 'online-payment' | 'amortization' | 'users';

interface PayableInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  loanType?: string;
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [loggedInClient, setLoggedInClient] = useState<Client | null>(null);
  const [pendingNewPassword, setPendingNewPassword] = useState<{ email: string; session: string } | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [payableInvoice, setPayableInvoice] = useState<PayableInvoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Load the signed-in identity from the API (using the stored Cognito token).
  const bootstrap = async () => {
    setBooting(true);
    try {
      const me = await dataApi.me();
      setUserEmail(me.email);
      if (me.role === 'superadmin') {
        setSession({ role: 'superadmin' });
        setActiveTab('calculator');
      } else if (me.role === 'user') {
        setSession({ role: 'user' });
        setActiveTab('calculator');
      } else {
        setSession({ role: 'client', clientId: me.clientId ?? '' });
        if (me.clientId) {
          const c = await dataApi.getClient(me.clientId).catch(() => null);
          setLoggedInClient(c);
          setSelectedClient(c);
        }
        setActiveTab('invoices');
      }
    } catch {
      signOut();
      setSession(null);
    } finally {
      setBooting(false);
    }
  };

  useEffect(() => {
    if (getTokens()) bootstrap();
    else setBooting(false);
  }, []);

  const allTabs: { id: TabType; label: string; icon: typeof Calculator }[] = [
    { id: 'calculator', label: 'Loan Calculator', icon: Calculator },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'amortization', label: 'Amortization', icon: Table },
    { id: 'quickbooks', label: 'QuickBooks', icon: Link2 },
    { id: 'online-payment', label: 'Online Payment', icon: DollarSign },
    { id: 'users', label: 'User Management', icon: UserCog },
  ];

  const clientTabIds: TabType[] = ['invoices', 'payments', 'amortization', 'online-payment'];
  const visibleTabs = session?.role === 'client'
    ? allTabs.filter(t => clientTabIds.includes(t.id))
    : session?.role === 'user'
      ? allTabs.filter(t => t.id !== 'users')   // staff: everything except user management
      : allTabs;                                // super admin: everything

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('amortization');
  };

  const handleLogout = () => {
    signOut();
    setSession(null);
    setLoggedInClient(null);
    setSelectedClient(null);
    setPayableInvoice(null);
    setPendingNewPassword(null);
  };

  // --- render ---

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-[#7B1E2B] font-semibold animate-pulse">Loading…</div>
      </div>
    );
  }

  if (pendingNewPassword) {
    return (
      <ChangePasswordScreen
        email={pendingNewPassword.email}
        cognitoSession={pendingNewPassword.session}
        onPasswordChanged={() => { setPendingNewPassword(null); bootstrap(); }}
        onCancel={handleLogout}
      />
    );
  }

  if (!session) {
    return (
      <LoginScreen
        onAuthenticated={() => bootstrap()}
        onNewPasswordRequired={(email, cognitoSession) => setPendingNewPassword({ email, session: cognitoSession })}
      />
    );
  }

  const isStaff = session.role === 'superadmin' || session.role === 'user';
  const roleLabel = session.role === 'superadmin' ? 'Super Admin'
    : session.role === 'user' ? 'User'
    : loggedInClient?.name || 'Client';
  const RoleIcon = session.role === 'superadmin' ? Shield : session.role === 'user' ? UserCog : User;
  const activeTabLabel = visibleTabs.find(t => t.id === activeTab)?.label ?? 'Payment Insight';

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 shrink-0 bg-gradient-to-b from-[#7B1E2B] to-[#4F1019] text-white flex flex-col min-h-screen print:hidden">
        <div className="px-4 md:px-6 py-6 border-b border-white/10 flex flex-col items-center md:items-start gap-3">
          <img
            src="/payment_insight_mark.svg"
            alt="Payment Insight Logo"
            className="w-12 md:w-20 h-auto bg-white rounded-xl p-1.5 shadow-md"
          />
          <h1 className="hidden md:block text-xl font-bold tracking-wide">PAYMENT INSIGHT</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleTabs.filter((t) => t.id !== 'users').map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#7B1E2B] shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Management pinned just above the sign-out footer (admins only) */}
        {visibleTabs.some((t) => t.id === 'users') && (
          <div className="p-3 border-t border-white/10">
            <button
              onClick={() => setActiveTab('users')}
              title="User Management"
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-[#7B1E2B] shadow-md'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <UserCog className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">User Management</span>
            </button>
          </div>
        )}

        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 px-2 py-2 rounded-lg bg-white/10">
            <RoleIcon className="w-4 h-4 shrink-0 text-[#E8B4BC]" />
            <span className="hidden md:inline text-sm text-white/90 truncate">
              {roleLabel}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-[#7B1E2B]">{activeTabLabel}</h2>
            <p className="text-gray-600 text-sm">
              {session.role === 'client'
                ? 'View your invoices, payments, and loan schedule'
                : 'Manage loans, clients, invoices, and payments all in one place'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <RoleIcon className="w-4 h-4 text-[#7B1E2B]" />
            <span className="text-sm text-gray-700">
              Signed in as <span className="font-semibold text-[#7B1E2B]">{roleLabel}</span>
            </span>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {isStaff && activeTab === 'calculator' && <LoanCalculator />}
          {isStaff && activeTab === 'clients' && (
            <ClientManagement onSelectClient={handleSelectClient} />
          )}
          {isStaff && activeTab === 'quickbooks' && <QuickBooksIntegration />}
          {session.role === 'superadmin' && activeTab === 'users' && <UserManagement currentEmail={userEmail} />}

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
              loanType={payableInvoice?.loanType || loggedInClient?.loanType || selectedClient?.loanType}
              onPaid={() => setActiveTab('payments')}
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
