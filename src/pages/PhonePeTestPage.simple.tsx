import React, { useState } from 'react';

const PhonePeTestPage: React.FC = () => {
  const [mode, setMode] = useState<'test' | 'production'>('test');
  const [amount, setAmount] = useState<number>(100);
  
  // PhonePe API credentials
  const TEST_CREDENTIALS = {
    clientId: 'TEST-M23VR50UZCWH0_25052',
    clientSecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
    apiBaseUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
  };
  
  const PROD_CREDENTIALS = {
    clientId: 'SU2505262030593101637421',
    clientSecret: 'e5dcff97-ce5c-4b4f-a621-c4d03fccd9cd',
    apiBaseUrl: 'https://api.phonepe.com/apis'
  };
  
  const getCurrentCredentials = () => {
    return mode === 'test' ? TEST_CREDENTIALS : PROD_CREDENTIALS;
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">PhonePe Payment Test Page</h1>
      
      {/* Mode selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Choose Payment Mode</h2>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMode"
              value="test"
              checked={mode === 'test'}
              onChange={() => setMode('test')}
              className="mr-2"
            />
            <span className="font-medium">Test Mode</span>
            <span className="ml-2 text-sm text-gray-500">(Sandbox environment)</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMode"
              value="production"
              checked={mode === 'production'}
              onChange={() => setMode('production')}
              className="mr-2"
            />
            <span className="font-medium">Production Mode</span>
            <span className="ml-2 text-sm text-gray-500">(Real transactions)</span>
          </label>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-medium mb-2">Current Credentials:</h3>
          <div className="text-xs font-mono bg-gray-100 p-2 rounded">
            <div>Client ID: {getCurrentCredentials().clientId}</div>
            <div>Client Secret: {getCurrentCredentials().clientSecret.substring(0, 10)}...</div>
            <div>API Base URL: {getCurrentCredentials().apiBaseUrl}</div>
          </div>
        </div>
      </div>
      
      {/* Payment form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">2. Configure Payment</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">
            Amount (₹)
          </label>
          <input
            type="number"
            id="amount"
            min="1"
            max="100000"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Amount in Indian Rupees (minimum ₹1)
          </p>
        </div>
        
        <button
          onClick={() => alert('This is a simplified demo. The full PhonePe integration requires backend API calls.')}
          className="w-full py-2 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700"
        >
          Initiate Test Payment
        </button>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2 text-blue-800">PhonePe Integration Notes</h2>
        <ul className="list-disc pl-5 space-y-2 text-blue-800">
          <li>
            <strong>Test Mode Credentials:</strong><br />
            Client ID: {TEST_CREDENTIALS.clientId}<br />
            Client Secret: {TEST_CREDENTIALS.clientSecret}
          </li>
          <li>
            <strong>Production Mode Credentials:</strong><br />
            Client ID: {PROD_CREDENTIALS.clientId}<br />
            Client Secret: {PROD_CREDENTIALS.clientSecret}
          </li>
          <li>
            <strong>Payment Flow:</strong> Authorization Token → Payment Request → Process Payment → Verify Status
          </li>
          <li>
            <strong>APIs Required:</strong> OAuth Token API, Checkout API, Status API
          </li>
          <li>
            <strong>Webhook Setup:</strong> Configure callbacks in PhonePe merchant dashboard
          </li>
        </ul>
        <p className="mt-4 text-sm text-blue-700">
          This simplified page demonstrates the configuration. The full implementation requires server-side code to handle authentication tokens and payment processing.
        </p>
      </div>
    </div>
  );
};

export default PhonePeTestPage;
