import axios from 'axios';
import { addPaymentTransaction, fetchActivePaymentGateway as fetchActiveGateway, getTransactionByGatewayId } from '../firebase/firestore';
import { PaymentGateway, PaymentTransaction } from '../types';
import { serverTimestamp } from 'firebase/firestore';

// Function to initialize PhonePe SDK
export const initPhonePeSdk = async () => {
  try {
    // Check if PhonePe SDK is already loaded
    if (window.PhonePe) {
      console.log('PhonePe SDK already loaded');
      return window.PhonePe;
    }
    
    // In a real implementation, we would load the SDK dynamically
    // Since we're mocking the SDK for now, we'll return a mock implementation
    const mockPhonePeSdk = {
      createPayment: async (options: any) => {
        console.log('Mock PhonePe SDK: Creating payment', options);
        return {
          success: true,
          code: 'PAYMENT_INITIATED',
          message: 'Payment initiated successfully',
          data: {
            paymentUrl: `https://secure.phonepe.com/transact/simulator?transactionId=${options.merchantTransactionId}&amount=${options.amount}`,
            paymentId: `PAY_${Date.now()}`,
            merchantTransactionId: options.merchantTransactionId
          }
        };
      },
      verifyPayment: async (options: any) => {
        console.log('Mock PhonePe SDK: Verifying payment', options);
        return {
          success: true,
          code: 'PAYMENT_SUCCESS',
          data: {
            merchantId: options.merchantId,
            merchantTransactionId: options.merchantTransactionId,
            transactionId: options.paymentId,
            amount: options.amount,
            paymentState: 'COMPLETED',
            paymentMethod: 'UPI',
            responseCode: 'SUCCESS'
          }
        };
      }
    };
    
    window.PhonePe = mockPhonePeSdk;
    console.log('Mock PhonePe SDK initialized');
    return mockPhonePeSdk;
  } catch (error) {
    console.error('Error initializing PhonePe SDK:', error);
    throw new Error('Failed to initialize PhonePe payment gateway');
  }
};

// Function to get active payment gateway configuration
export const getActivePaymentGateway = async (provider = 'phonepe'): Promise<PaymentGateway | null> => {
  try {
    // Using the fetchActiveGateway function from firestore.ts
    const activeGateway = await fetchActiveGateway();
    
    if (!activeGateway) {
      console.error(`No active payment gateway found`);
      return null;
    }
    
    // Check if we need to filter by provider
    if (provider && activeGateway.provider !== provider) {
      // If the provider doesn't match, log and return null
      console.log(`Found active gateway (${activeGateway.name}) but it's not ${provider}`);
      return null;
    }
    
    console.log(`Active payment gateway found: ${activeGateway.name}`);
    return activeGateway;
  } catch (error) {
    console.error('Error fetching payment gateway:', error);
    return null;
  }
};

// Create PhonePe payment
export const createPhonePePayment = async (
  orderId: string,
  userId: string, 
  amount: number, 
  redirectUrl: string,
  merchantTransactionId: string,
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  }
) => {
  try {
    // Get active PhonePe gateway
    const gateway = await getActivePaymentGateway('phonepe');
    if (!gateway) {
      throw new Error('PhonePe payment gateway not configured');
    }
    
    // Record transaction in Firestore matching the exact structure in screenshots
    const transactionId = await addPaymentTransaction({
      orderId,
      userId,
      amount,
      currency: 'INR',
      status: 'initiated',
      gatewayTransactionId: merchantTransactionId,
      paymentMethod: 'UPI',
      paymentGateway: 'phonepe',
      gatewayResponse: {
        customerInfo,
        merchantTransactionId
      }
      // createdAt and updatedAt are added in the addPaymentTransaction function
    });
    
    // Initialize the PhonePe SDK
    try {
      // For a real implementation, we'd use the PhonePe SDK directly
      // But for this demo, we'll use a mock implementation that simulates the SDK behavior
      
      // This would be the real code using the SDK:
      // const PhonePe = await initPhonePeSdk();
      // const paymentOptions = {
      //   merchantId: gateway.merchantId,
      //   merchantTransactionId,
      //   amount,
      //   redirectUrl: redirectUrl || gateway.redirectUrl,
      //   callbackUrl: gateway.callbackUrl,
      //   customerInfo,
      // };
      // const paymentResponse = await PhonePe.createPayment(paymentOptions);
      
      // Instead, we'll create a simple mock response:
      const paymentResponse = {
        success: true,
        code: 'PAYMENT_INITIATED',
        message: 'Payment initiated successfully',
        data: {
          paymentUrl: `https://secure.phonepe.com/transact/simulator?transactionId=${merchantTransactionId}&amount=${amount}`,
          paymentId: `PAY_${Date.now()}`,
          merchantTransactionId
        }
      };
      
      // Update transaction with gateway response
      await updatePaymentTransactionStatus(transactionId, 'processing', paymentResponse.data);
      
      return {
        transactionId,
        ...paymentResponse
      };
    } catch (sdkError) {
      console.error('PhonePe SDK error:', sdkError);
      await updatePaymentTransactionStatus(transactionId, 'failed', { error: sdkError.message });
      throw new Error('Failed to initiate payment with PhonePe');
    }
  } catch (error) {
    console.error('Error creating PhonePe payment:', error);
    throw error;
  }
};

// Update payment transaction status
export const updatePaymentTransactionStatus = async (
  transactionId: string,
  status: 'initiated' | 'processing' | 'completed' | 'SUCCESS' | 'failed' | 'refunded',
  gatewayResponse?: any
) => {
  try {
    // Import the function directly here to avoid circular dependency
    const { updatePaymentTransaction } = await import('../firebase/firestore');
    
    await updatePaymentTransaction(transactionId, {
      status,
      gatewayResponse,
      // If this is a successful transaction, update the gateway transaction ID
      ...(gatewayResponse?.transactionId && { gatewayTransactionId: gatewayResponse.transactionId }),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating payment transaction status:', error);
    return false;
  }
};

// Verify PhonePe payment status
export const verifyPhonePePayment = async (paymentId: string, merchantTransactionId: string) => {
  try {
    // Get active PhonePe gateway
    const gateway = await getActivePaymentGateway('phonepe');
    if (!gateway) {
      throw new Error('PhonePe payment gateway not configured');
    }
    
    // In a real implementation, we would call the PhonePe API to verify the payment
    // For this demo, we'll simulate a successful verification
    const verificationResponse = {
      success: true,
      code: 'PAYMENT_SUCCESS',
      data: {
        merchantId: gateway.merchantId,
        merchantTransactionId,
        transactionId: paymentId,
        amount: 10000, // amount in paisa (₹100.00)
        paymentState: 'COMPLETED',
        paymentMethod: 'UPI',
        responseCode: 'SUCCESS'
      }
    };
    
    // Find the transaction by gatewayTransactionId directly
    const transaction = await getTransactionByGatewayId(merchantTransactionId);
    
    if (transaction) {
      // Update transaction status based on verification response
      if (verificationResponse.success && verificationResponse.data.paymentState === 'COMPLETED') {
        await updatePaymentTransactionStatus(
          transaction.id,
          'SUCCESS', // Using 'SUCCESS' to match Firebase data
          verificationResponse.data
        );
      } else {
        await updatePaymentTransactionStatus(
          transaction.id,
          'failed',
          verificationResponse.data
        );
      }
    }
    
    return verificationResponse;
  } catch (error) {
    console.error('Error verifying PhonePe payment:', error);
    throw error;
  }
};

// Add this type declaration to avoid TypeScript errors
declare global {
  interface Window {
    PhonePe: any;
  }
}
