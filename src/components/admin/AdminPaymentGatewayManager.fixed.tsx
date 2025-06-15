import React, { useState, useEffect } from 'react';
import PhonePeSetupTool from './PhonePeSetupTool';
import { 
  fetchPaymentGateways, 
  addPaymentGateway, 
  updatePaymentGateway, 
  deletePaymentGateway,
  fetchPaymentTransactions
} from '../../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { PaymentGateway, PaymentTransaction } from '../../types';
import { serverTimestamp } from 'firebase/firestore';

const AdminPaymentGatewayManager: React.FC = () => {
  // State for payment gateways
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [currentGateway, setCurrentGateway] = useState<PaymentGateway | null>(null);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for transactions
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'gateways' | 'transactions'>('gateways');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Load all payment gateways and transactions
  const loadData = async () => {
    setIsLoading(true);
    try {
      const gatewaysData = await fetchPaymentGateways();
      setPaymentGateways(gatewaysData as PaymentGateway[]);
      
      const transactionsData = await fetchPaymentTransactions();
      setTransactions(transactionsData as PaymentTransaction[]);
    } catch (error) {
      console.error('Error loading payment data:', error);
      showNotification('error', 'Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show notification message
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };
  
  // Handle new gateway form
  const handleNewGateway = () => {
    // Using the credentials provided by the user
    const callbackUrl = window.location.origin ? `${window.location.origin}/payment-callback` : 'https://example.com/phonepe-callback';
    const redirectUrl = window.location.origin ? `${window.location.origin}/payment-success` : 'https://example.com/payment/success';
    
    setCurrentGateway({
      name: 'PhonePe India',
      provider: 'phonepe',
      isActive: false,
      // PhonePe Test credentials
      merchantId: 'M23VR50UZCWH0',
      merchantKeyId: 'TEST-M23VR50UZCWH0_25052', // Client ID
      merchantKeySecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3', // Client Secret
      mode: 'test', // Default to test mode
      callbackUrl,
      redirectUrl,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    setShowGatewayModal(true);
  };
  
  // Handle edit gateway
  const handleEditGateway = (gateway: PaymentGateway) => {
    setCurrentGateway(gateway);
    setShowGatewayModal(true);
  };
  
  // Handle delete gateway
  const handleDeleteGateway = async (id?: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this payment gateway?')) {
      setIsLoading(true);
      try {
        await deletePaymentGateway(id);
        setPaymentGateways(paymentGateways.filter(gateway => gateway.id !== id));
        showNotification('success', 'Payment gateway deleted successfully');
      } catch (error) {
        console.error('Error deleting payment gateway:', error);
        showNotification('error', 'Failed to delete payment gateway');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Handle gateway form submission
  const handleGatewaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGateway) return;
    
    setIsLoading(true);
    try {
      // Ensure all required fields exist
      const gatewayData = {
        ...currentGateway,
        name: currentGateway.name || 'PhonePe India',
        provider: currentGateway.provider || 'phonepe',
        isActive: currentGateway.isActive || false,
        merchantId: currentGateway.merchantId || '',
        merchantKeyId: currentGateway.merchantKeyId || '',
        merchantKeySecret: currentGateway.merchantKeySecret || '',
        mode: currentGateway.mode || 'test',
        callbackUrl: currentGateway.callbackUrl || '',
        redirectUrl: currentGateway.redirectUrl || '',
        updatedAt: Timestamp.now()
      };
      
      if (currentGateway.id) {
        // Update existing gateway
        await updatePaymentGateway(currentGateway.id, gatewayData);
        
        // Update state
        setPaymentGateways(
          paymentGateways.map(gateway => 
            gateway.id === currentGateway.id ? { ...gateway, ...gatewayData } : gateway
          )
        );
        
        showNotification('success', 'Payment gateway updated successfully');
      } else {
        // Add new gateway
        const newGateway = await addPaymentGateway({
          ...gatewayData,
          createdAt: Timestamp.now()
        });
        
        // Update state
        setPaymentGateways([...paymentGateways, newGateway as PaymentGateway]);
        
        showNotification('success', 'Payment gateway added successfully');
      }
      
      // Close modal
      setShowGatewayModal(false);
      setCurrentGateway(null);
    } catch (error) {
      console.error('Error saving payment gateway:', error);
      showNotification('error', 'Failed to save payment gateway');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle input change in gateway form
  const handleGatewayInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!currentGateway) return;
    
    const { name, value, type } = e.target;
    
    // Handle checkbox (boolean) values
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentGateway({
        ...currentGateway,
        [name]: checkbox.checked
      });
    } else {
      // Handle regular text/select values
      setCurrentGateway({
        ...currentGateway,
        [name]: value
      });
    }
  };
  
  // Format date from Timestamp
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  // Format transaction status with color
  const formatStatus = (status: string) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        bgColor = 'bg-green-200';
        textColor = 'text-green-800';
        break;
      case 'pending':
      case 'processing':
        bgColor = 'bg-yellow-200';
        textColor = 'text-yellow-800';
        break;
      case 'failed':
      case 'error':
        bgColor = 'bg-red-200';
        textColor = 'text-red-800';
        break;
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </span>
    );
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-3 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      {/* Header section */}
      <h1 className="text-2xl font-semibold mb-6">Payment Gateway Manager</h1>
      <p className="text-gray-600 mb-6">Configure and manage payment gateways and view transaction history</p>
      
      {/* PhonePe Setup Tool for fixing collections */}
      <div className="mb-8">
        <PhonePeSetupTool />
      </div>
      
      {/* Tab navigation */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'gateways' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('gateways')}
        >
          Payment Gateways
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Payment Gateways Tab */}
      {!isLoading && activeTab === 'gateways' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Payment Gateway Configurations</h2>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
              onClick={handleNewGateway}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Gateway
            </button>
          </div>
          
          {/* Gateway cards */}
          {paymentGateways.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No payment gateways configured</h3>
              <p className="text-gray-500 mb-4">Add a payment gateway to start accepting online payments</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                onClick={handleNewGateway}
              >
                Add Your First Gateway
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentGateways.map(gateway => (
                <div key={gateway.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                  {/* Gateway header */}
                  <div className={`p-4 ${gateway.isActive ? 'bg-green-50' : 'bg-gray-50'} border-b border-gray-200 flex justify-between items-center`}>
                    <div>
                      <h3 className="font-medium text-gray-800">{gateway.name}</h3>
                      <span className={`text-sm px-2 py-1 rounded-full ${gateway.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {gateway.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="text-gray-500 hover:text-blue-600 p-1"
                        onClick={() => handleEditGateway(gateway)}
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className="text-gray-500 hover:text-red-600 p-1"
                        onClick={() => handleDeleteGateway(gateway.id)}
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Gateway details */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Provider:</span>
                        <span className="ml-2 font-medium">{gateway.provider}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mode:</span>
                        <span className="ml-2 font-medium capitalize">{gateway.mode || 'test'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Merchant ID:</span>
                        <span className="ml-2 font-medium">{gateway.merchantId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 font-medium">{formatDate(gateway.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <span className="ml-2 font-medium">{formatDate(gateway.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Transactions Tab */}
      {!isLoading && activeTab === 'transactions' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Payment Transactions</h2>
          
          {transactions.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No transactions found</h3>
              <p className="text-gray-500">Transactions will appear here when payments are processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map(transaction => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.transactionId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.orderId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{transaction.amount?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatStatus(transaction.status || 'unknown')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.gateway?.provider || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Gateway Modal */}
      {showGatewayModal && currentGateway && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {currentGateway.id ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
              </h3>
            </div>
            
            <form onSubmit={handleGatewaySubmit}>
              <div className="px-6 py-4 space-y-4">
                {/* Gateway Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gateway Name</label>
                  <input
                    type="text"
                    name="name"
                    value={currentGateway.name || ''}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                {/* Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    name="provider"
                    value={currentGateway.provider || 'phonepe'}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="phonepe">PhonePe</option>
                    {/* Add more providers as needed */}
                  </select>
                </div>
                
                {/* Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                  <select
                    name="mode"
                    value={currentGateway.mode || 'test'}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="test">Test</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                
                {/* Merchant ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                  <input
                    type="text"
                    name="merchantId"
                    value={currentGateway.merchantId || ''}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Merchant Key ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Key ID (Client ID)</label>
                  <input
                    type="text"
                    name="merchantKeyId"
                    value={currentGateway.merchantKeyId || ''}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Merchant Key Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Key Secret (Client Secret)</label>
                  <input
                    type="password"
                    name="merchantKeySecret"
                    value={currentGateway.merchantKeySecret || ''}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Callback URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Callback URL</label>
                  <input
                    type="text"
                    name="callbackUrl"
                    value={currentGateway.callbackUrl || ''}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://your-domain.com/api/payment/callback"
                  />
                </div>
                
                {/* Redirect URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
                  <input
                    type="text"
                    name="redirectUrl"
                    value={currentGateway.redirectUrl || ''}
                    onChange={handleGatewayInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://your-domain.com/payment-success"
                  />
                </div>
                
                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={currentGateway.isActive}
                    onChange={handleGatewayInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active (Enable this payment gateway)
                  </label>
                </div>
              </div>
              
              {/* Modal Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowGatewayModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentGatewayManager;
