import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchActivePaymentGateway } from '../../firebase/firestore';
import { processPhonePePayment } from '../../services/phonePeService';
import { PaymentGateway, CartItem } from '../../types';
import { ShippingAddress } from '../../types/address';
import { DEFAULT_PHONEPE_CONFIG } from './DefaultPhonePeConfig';
import { getDefaultPhonePeConfig } from '../../services/DefaultPhonePeConfig';
import { getAuth } from 'firebase/auth';

interface PaymentGatewayCheckoutProps {
  orderId: string;
  amount: number;
  items: CartItem[];
  shippingInfo?: ShippingAddress;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: any) => void;
}

const PaymentGatewayCheckout: React.FC<PaymentGatewayCheckoutProps> = ({
  orderId,
  amount,
  items,
  shippingInfo,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [isUsingDefaultConfig, setIsUsingDefaultConfig] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState(false);

  // Fetch active payment gateway
  useEffect(() => {
    const fetchGateway = async () => {
      try {
        const activeGateway = await fetchActivePaymentGateway('phonepe');
        
        if (activeGateway) {
          setGateway(activeGateway);
          setIsUsingDefaultConfig(false);
          console.log('Using gateway from database:', activeGateway);
        } else {
          // If no gateway is found, create a default one
          console.log('No active gateway found, using default config');
          setIsUsingDefaultConfig(true);
          
          // Create a default gateway object
          const defaultConfig = getDefaultPhonePeConfig(false); // Use test mode by default
          const defaultGateway: PaymentGateway = {
            id: 'default-phonepe-gateway',
            name: 'PhonePe Default',
            provider: 'phonepe',
            isActive: true,
            merchantId: defaultConfig.merchantId,
            merchantKeyId: defaultConfig.clientId,
            merchantKeySecret: defaultConfig.clientSecret,
            mode: defaultConfig.mode,
            callbackUrl: 'https://www.codingtutorialsjamshedpur.fun/api/payment-callback',
            redirectUrl: 'https://www.codingtutorialsjamshedpur.fun/payment-status'
          };
          
          setGateway(defaultGateway);
        }
      } catch (error) {
        console.error('Error fetching active payment gateway:', error);
        
        // Fall back to default gateway on error
        const defaultConfig = getDefaultPhonePeConfig(false);
        const defaultGateway: PaymentGateway = {
          id: 'default-phonepe-gateway',
          name: 'PhonePe Default',
          provider: 'phonepe',
          isActive: true,
          merchantId: defaultConfig.merchantId,
          merchantKeyId: defaultConfig.clientId,
          merchantKeySecret: defaultConfig.clientSecret,
          mode: defaultConfig.mode,
          callbackUrl: window.location.origin + '/payment-callback',
          redirectUrl: window.location.origin + '/payment-callback'
        };
        
        setGateway(defaultGateway);
        setIsUsingDefaultConfig(true);
      }
    };

    fetchGateway();
  }, []);

  // Handle payment initiation
  const processPayment = async () => {
    if (!gateway) {
      console.error('No active payment gateway found');
      setError('No active payment gateway found');
      return;
    }

    setError(null);
    setLoading(true);
    
    // Log payment information for debugging
    console.log('Processing payment with gateway:', gateway);
    console.log('Using default config:', isUsingDefaultConfig);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isProduction = gateway.mode === 'production';
      
      // Generate a unique merchant transaction ID
      const merchantTransactionId = `YBT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      console.log('Generated merchantTransactionId:', merchantTransactionId);

      // Prepare the payload for PhonePe payment
      const payload = {
        merchantTransactionId,
        amount: amount,
        redirectUrl: gateway.redirectUrl || window.location.origin + '/payment-callback',
        callbackUrl: gateway.callbackUrl || window.location.origin + '/payment-callback',
        userId: user.uid,
        customerInfo: {
          name: user.displayName || 'Customer',
          email: user.email || '',
          phone: user.phoneNumber || ''
        },
        orderId: orderId,
        products: items
      };
      
      // Log the payment payload for debugging
      console.log('PhonePe payment payload:', payload);

      const paymentResponse = await processPhonePePayment(
        isProduction,
        payload
      );

      if (paymentResponse.success) {
        // Set redirecting state to show loading message
        setRedirecting(true);
        
        // Store transaction details in session storage for verification after redirect
        const pendingPaymentInfo = {
          ...paymentResponse.pendingPaymentInfo,
          isProduction
        };
        
        sessionStorage.setItem('pendingPayment', JSON.stringify(pendingPaymentInfo));
        
        // Redirect to payment URL
        window.location.href = paymentResponse.redirectUrl;
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setError(error.message || 'An error occurred during payment processing');
      
      // Show a more detailed error message if available
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      {redirecting ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Redirecting to Payment Gateway</h3>
          <p className="text-gray-600">Please wait while we redirect you to the secure payment page...</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-4">Complete Your Payment</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between mb-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{typeof item.price === 'string' ? 
                    parseFloat(item.price.replace(/[^\d.]/g, '')).toFixed(2) : 
                    parseFloat(String(item.price)).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2 font-semibold flex justify-between">
                <span>Total Amount</span>
                <span>₹{amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {isUsingDefaultConfig && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
              <p className="text-sm text-yellow-700">
                Using default PhonePe configuration (test mode).
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Payment Method</h3>
            <div className="border border-gray-200 rounded-md p-4 flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{gateway?.name || 'PhonePe'}</p>
                <p className="text-sm text-gray-500">UPI, Cards, Netbanking & more</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={processPayment}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Complete Payment'
            )}
          </button>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Your payment is secured by {gateway?.name || 'our secure payment gateway'}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentGatewayCheckout;
