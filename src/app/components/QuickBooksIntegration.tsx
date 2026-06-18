import { useState } from 'react';
import { Link2, CheckCircle, AlertCircle, Settings, Key } from 'lucide-react';

export function QuickBooksIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [realmId, setRealmId] = useState('');

  const connectToQuickBooks = () => {
    if (!clientId || !clientSecret || !realmId) {
      alert('Please fill in all QuickBooks credentials');
      return;
    }

    alert('QuickBooks Connection Initiated!\n\nIn production, this would:\n1. Redirect to QuickBooks OAuth\n2. Get authorization from user\n3. Store access/refresh tokens\n4. Enable invoice syncing');
    setIsConnected(true);
  };

  const disconnectFromQuickBooks = () => {
    if (confirm('Are you sure you want to disconnect from QuickBooks?')) {
      setIsConnected(false);
      setClientId('');
      setClientSecret('');
      setRealmId('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Link2 className="w-6 h-6 text-[#7B1E2B]" />
          QuickBooks Integration
        </h2>
        {isConnected && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border-2 border-green-300">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Connected</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-6">
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-700 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-rose-950 mb-2">Setup Instructions</h3>
                <ol className="text-sm text-rose-900 space-y-2 list-decimal list-inside">
                  <li>Go to <a href="https://developer.intuit.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">QuickBooks Developer Portal</a></li>
                  <li>Create a new app or select an existing app</li>
                  <li>Get your Client ID and Client Secret from the Keys & OAuth section</li>
                  <li>Get your Realm ID (Company ID) from QuickBooks Online</li>
                  <li>Add your redirect URI: <code className="bg-rose-200 px-2 py-1 rounded text-xs">https://yourapp.com/callback</code></li>
                  <li>Enter the credentials below and click Connect</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#7B1E2B]" />
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter QuickBooks Client ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#7B1E2B]" />
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter QuickBooks Client Secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#7B1E2B]" />
                Realm ID (Company ID)
              </label>
              <input
                type="text"
                value={realmId}
                onChange={(e) => setRealmId(e.target.value)}
                placeholder="Enter QuickBooks Realm ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A6332E]"
              />
            </div>

            <button
              onClick={connectToQuickBooks}
              className="w-full px-6 py-3 bg-[#2CA01C] text-white rounded-lg hover:bg-[#228016] transition-colors font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <Link2 className="w-5 h-5" />
              Connect to QuickBooks
            </button>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Security Note:</span> In production, credentials should be stored securely using environment variables and encrypted storage. Never commit API keys to version control.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-green-50 to-red-50 border-2 border-green-300 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              QuickBooks Connected Successfully
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Client ID:</span> {clientId.substring(0, 10)}...</p>
              <p><span className="font-semibold">Realm ID:</span> {realmId}</p>
              <p><span className="font-semibold">Status:</span> Active</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <h4 className="font-semibold text-gray-800 mb-2">Available Features</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Create Invoices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Sync Customers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Track Payments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Update Balances
                </li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-rose-200">
              <h4 className="font-semibold text-gray-800 mb-2">Integration Stats</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><span className="font-semibold">Invoices Synced:</span> 0</li>
                <li><span className="font-semibold">Customers Synced:</span> 0</li>
                <li><span className="font-semibold">Last Sync:</span> Never</li>
                <li><span className="font-semibold">Next Sync:</span> Manual</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => alert('Manual sync initiated! This would sync all invoices and payments with QuickBooks.')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#7B1E2B] to-[#A6332E] text-white rounded-lg hover:from-[#5E1620] hover:to-[#5E1620] transition-colors font-semibold shadow-lg"
            >
              Sync Now
            </button>
            <button
              onClick={disconnectFromQuickBooks}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-[#7B1E2B] rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">Implementation Guide</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>To fully implement QuickBooks integration in production:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Install the QuickBooks SDK: <code className="bg-gray-200 px-2 py-1 rounded text-xs">npm install intuit-oauth</code></li>
            <li>Set up OAuth 2.0 flow with proper redirect handling</li>
            <li>Store access/refresh tokens securely (encrypted database)</li>
            <li>Implement token refresh mechanism (tokens expire)</li>
            <li>Create API endpoints for invoice creation, customer sync, and payment tracking</li>
            <li>Handle QuickBooks webhooks for real-time updates</li>
            <li>Implement error handling and retry logic</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
