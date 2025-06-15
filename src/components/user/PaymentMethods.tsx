import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  Plus, 
  Trash, 
  AlertCircle, 
  CheckCircle, 
  Lock 
} from 'lucide-react';
import UserSidebar from './UserSidebar';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface PaymentMethod {
  id: string;
  cardNumber: string; // Last 4 digits only
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  isDefault: boolean;
}

const PaymentMethods = () => {
  const { currentUser } = useAuth();
  
  // State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    isDefault: false
  });
  
  // Current date and time
  const currentDate = new Date(2025, 4, 25, 4, 35);
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  // Months and Years for form dropdowns
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return month < 10 ? `0${month}` : `${month}`;
  });
  
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => `${currentYear + i}`);
  
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Set up real-time listener for user document to get payment methods
    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const userPaymentMethods = userData.paymentMethods || [];
        setPaymentMethods(userPaymentMethods);
      } else {
        setPaymentMethods([]);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching payment methods:', err);
      setError('Failed to load your payment methods. Please try again later.');
      setLoading(false);
    });
    
    // Add data to User_Panel collection
    addToUserPanel();
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);
  
  // Add data to User_Panel collection
  const addToUserPanel = async () => {
    if (!currentUser) return;
    
    try {
      // Create or update document in User_Panel collection
      const userPanelRef = doc(db, 'User_Panel', currentUser.uid);
      
      // Update the document with payment methods data
      await updateDoc(userPanelRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        lastUpdated: new Date(),
        // Leave existing data intact
      });
    } catch (err) {
      console.error('Error updating User_Panel collection:', err);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const detectCardType = (cardNumber: string): string => {
    // Remove spaces and non-numeric characters
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Basic regex patterns for card types
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      rupay: /^6[0-9]/
    };
    
    if (patterns.visa.test(cleanNumber)) return 'Visa';
    if (patterns.mastercard.test(cleanNumber)) return 'Mastercard';
    if (patterns.amex.test(cleanNumber)) return 'American Express';
    if (patterns.discover.test(cleanNumber)) return 'Discover';
    if (patterns.rupay.test(cleanNumber)) return 'RuPay';
    
    return 'Unknown';
  };
  
  const formatCardNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    // Format based on card type
    const cardType = detectCardType(cleanValue);
    
    // For Amex (4-6-5 format)
    if (cardType === 'American Express') {
      const parts = [
        cleanValue.substring(0, 4),
        cleanValue.substring(4, 10),
        cleanValue.substring(10, 15)
      ];
      return parts.filter(part => part !== '').join(' ');
    }
    
    // For other cards (4-4-4-4 format)
    const parts = [
      cleanValue.substring(0, 4),
      cleanValue.substring(4, 8),
      cleanValue.substring(8, 12),
      cleanValue.substring(12, 16)
    ];
    return parts.filter(part => part !== '').join(' ');
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, cardNumber: formattedValue }));
  };
  
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to add a payment method');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Generate a unique ID for the payment method
      const newPaymentMethodId = Date.now().toString();
      
      // Get last 4 digits of card
      const last4 = formData.cardNumber.replace(/\D/g, '').slice(-4);
      
      // Detect card type
      const cardType = detectCardType(formData.cardNumber);
      
      // Create the new payment method
      const newPaymentMethod: PaymentMethod = {
        id: newPaymentMethodId,
        cardNumber: last4,
        cardHolder: formData.cardHolder,
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        cardType,
        isDefault: formData.isDefault
      };
      
      // If this is the first payment method or marked as default, ensure it's the only default
      if (paymentMethods.length === 0 || formData.isDefault) {
        // Set all existing payment methods to non-default
        const updatedPaymentMethods = paymentMethods.map(method => ({ ...method, isDefault: false }));
        
        // Update Firestore with all payment methods plus the new one
        await updateDoc(userRef, {
          paymentMethods: [...updatedPaymentMethods, newPaymentMethod]
        });
      } else {
        // Simply add the new payment method
        await updateDoc(userRef, {
          paymentMethods: arrayUnion(newPaymentMethod)
        });
      }
      
      // Update User_Panel collection
      await updateDoc(doc(db, 'User_Panel', currentUser.uid), {
        'paymentMethods': paymentMethods.length === 0 || formData.isDefault 
          ? [...paymentMethods.map(method => ({ ...method, isDefault: false })), newPaymentMethod]
          : [...paymentMethods, newPaymentMethod],
        lastUpdated: new Date()
      });
      
      // Reset form and hide it
      setFormData({
        cardNumber: '',
        cardHolder: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        isDefault: false
      });
      setShowAddForm(false);
      setSuccessMessage('Payment method added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError('Failed to add payment method. Please try again.');
    }
  };
  
  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingId(paymentMethodId);
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Find the payment method to remove
      const methodToRemove = paymentMethods.find(method => method.id === paymentMethodId);
      if (!methodToRemove) return;
      
      // Remove the payment method
      const updatedPaymentMethods = paymentMethods.filter(method => method.id !== paymentMethodId);
      
      // If the removed method was the default, set a new default if there are other methods
      if (methodToRemove.isDefault && updatedPaymentMethods.length > 0) {
        updatedPaymentMethods[0].isDefault = true;
      }
      
      // Update Firestore
      await updateDoc(userRef, {
        paymentMethods: updatedPaymentMethods
      });
      
      // Update User_Panel collection
      await updateDoc(doc(db, 'User_Panel', currentUser.uid), {
        'paymentMethods': updatedPaymentMethods,
        lastUpdated: new Date()
      });
      
      setProcessingId(null);
      setSuccessMessage('Payment method removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error removing payment method:', err);
      setError('Failed to remove payment method. Please try again.');
      setProcessingId(null);
    }
  };
  
  const handleSetDefault = async (paymentMethodId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingId(paymentMethodId);
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Update all payment methods
      const updatedPaymentMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === paymentMethodId
      }));
      
      // Update Firestore
      await updateDoc(userRef, {
        paymentMethods: updatedPaymentMethods
      });
      
      // Update User_Panel collection
      await updateDoc(doc(db, 'User_Panel', currentUser.uid), {
        'paymentMethods': updatedPaymentMethods,
        lastUpdated: new Date()
      });
      
      setProcessingId(null);
      setSuccessMessage('Default payment method updated');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError('Failed to update default payment method. Please try again.');
      setProcessingId(null);
    }
  };
  
  const getCardIcon = (cardType: string) => {
    return <CreditCard className={`h-6 w-6 ${
      cardType === 'Visa' ? 'text-blue-600' :
      cardType === 'Mastercard' ? 'text-orange-600' :
      cardType === 'American Express' ? 'text-purple-600' :
      cardType === 'Discover' ? 'text-yellow-600' :
      cardType === 'RuPay' ? 'text-green-600' :
      'text-gray-600'
    }`} />;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-500">Loading your payment methods...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payment Methods</h1>
            <p className="text-gray-600">
              Manage your saved payment options
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Payment Method
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}
        
        {/* Payment Method Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Add New Payment Method
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    cardNumber: '',
                    cardHolder: '',
                    expiryMonth: '',
                    expiryYear: '',
                    cvv: '',
                    isDefault: false
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={handleAddPaymentMethod}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="•••• •••• •••• ••••"
                      maxLength={19}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {formData.cardNumber && getCardIcon(detectCardType(formData.cardNumber))}
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name *
                  </label>
                  <input
                    type="text"
                    id="cardHolder"
                    name="cardHolder"
                    value={formData.cardHolder}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name as it appears on card"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Month *
                  </label>
                  <select
                    id="expiryMonth"
                    name="expiryMonth"
                    value={formData.expiryMonth}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Year *
                  </label>
                  <select
                    id="expiryYear"
                    name="expiryYear"
                    value={formData.expiryYear}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                    CVV *
                  </label>
                  <input
                    type="password"
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="•••"
                    maxLength={4}
                    required
                  />
                </div>
                
                <div className="md:col-span-2 mt-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                      Set as default payment method
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Lock className="h-4 w-4 mr-2" />
                  <p>Your payment information is encrypted and securely stored</p>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  disabled={processingId !== null}
                >
                  {processingId ? 'Processing...' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Payment Methods List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {paymentMethods.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id} 
                  className={`p-6 ${method.isDefault ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="mr-4">
                        {getCardIcon(method.cardType)}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {method.cardType}
                          </h3>
                          {method.isDefault && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          •••• •••• •••• {method.cardNumber}
                        </p>
                        <p className="text-gray-600">
                          {method.cardHolder} | Expires {method.expiryMonth}/{method.expiryYear.slice(-2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          disabled={processingId !== null}
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-red-600 hover:text-red-800 ml-4"
                        disabled={processingId !== null}
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No payment methods saved</h3>
              <p className="text-gray-500 mb-4">
                Add a payment method to speed up your checkout process
              </p>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Payment Method
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
