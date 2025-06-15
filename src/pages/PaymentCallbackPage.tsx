import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { completePhonePeTransaction } from '../services/phonePeService';
import { updateOrder } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

const PaymentCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get pending payment details from session storage
        const pendingPaymentStr = sessionStorage.getItem('pendingPayment');
        if (!pendingPaymentStr) {
          throw new Error('Payment details not found');
        }

        const pendingPayment = JSON.parse(pendingPaymentStr);
        setOrderDetails(pendingPayment);

        // Get the merchant order ID from pending payment
        const merchantOrderId = pendingPayment.merchantOrderId;
        const transactionId = pendingPayment.transactionId;

        // Determine if we're in production mode based on the merchant order ID
        // Real implementation would use a configuration value
        const isProduction = pendingPayment.isProduction || false;

        // Complete the transaction with PhonePe
        const verificationResult = await completePhonePeTransaction(
          isProduction,
          merchantOrderId,
          transactionId
        );

        if (verificationResult.success && verificationResult.status === 'SUCCESS') {
          // Update order status in Firestore
          if (pendingPayment.orderId) {
            await updateOrder(pendingPayment.orderId, {
              status: 'paid',
              paymentDetails: {
                paymentId: verificationResult.data?.transactionId || 'UNKNOWN',
                merchantOrderId,
                amount: pendingPayment.amount,
                status: 'completed',
                paidAt: new Date().toISOString()
              }
            });
          }

          // Clear pending payment from session storage
          sessionStorage.removeItem('pendingPayment');

          // Set success state
          setStatus('success');
          setMessage('Your payment was successful! Your order is being processed.');
        } else {
          throw new Error(verificationResult.data?.responseCode || 'Payment verification failed');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(`Payment verification failed: ${error.message}. Please contact support.`);
      }
    };

    verifyPayment();
  }, [location.search]);

  const handleContinue = () => {
    // Redirect based on payment status
    if (status === 'success') {
      navigate('/account');
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`p-6 ${status === 'success' ? 'bg-green-50' : status === 'failed' ? 'bg-red-50' : 'bg-blue-50'}`}>
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            )}
            
            {status === 'success' && (
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            {status === 'failed' && (
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h2 className="mt-4 text-xl font-bold text-center">
            {status === 'success' ? 'Payment Successful!' : 
             status === 'failed' ? 'Payment Failed' : 
             'Processing Payment'}
          </h2>
          
          <p className="mt-2 text-center text-gray-600">
            {message}
          </p>
        </div>
        
        {orderDetails && (
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="font-medium mb-2">Order Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderDetails.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₹{orderDetails.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium truncate">{orderDetails.merchantTransactionId}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="px-6 py-4 bg-gray-50 flex justify-center">
          <button
            onClick={handleContinue}
            className={`py-2 px-6 rounded-md font-medium text-white ${
              status === 'loading' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : status === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={status === 'loading'}
          >
            {status === 'success' ? 'View Order' : 'Back to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
