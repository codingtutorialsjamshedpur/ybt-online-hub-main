import axios from 'axios';
import { addPaymentTransaction, updatePaymentTransaction, getTransactionByGatewayId } from '../firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

// PhonePe API configuration
interface PhonePeConfig {
  clientId: string;
  clientSecret: string;
  clientVersion: string;
  isProduction: boolean;
}

// PhonePe token response
interface PhonePeTokenResponse {
  access_token: string;
  expires_at: string;
}

/**
 * Get Authorization Token from PhonePe
 */
export const getPhonePeAuthToken = async (config: PhonePeConfig): Promise<string> => {
  try {
    const baseUrl = config.isProduction 
      ? 'https://api.phonepe.com/apis/pg' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    
    const url = `${baseUrl}/v1/oauth/token`;
    const requestData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      client_version: config.clientVersion,
      grant_type: 'client_credentials'
    };

    const response = await axios({
      method: 'POST',
      url,
      data: new URLSearchParams(requestData).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data && response.data.access_token) {
      return response.data.access_token;
    } else {
      throw new Error('Failed to get access token');
    }
  } catch (error: any) {
    console.error('PhonePe Auth Error:', error.response ? error.response.data : error.message);
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

/**
 * Initiate a payment with PhonePe
 */
export const initiatePhonePePayment = async (
  config: PhonePeConfig,
  merchantOrderId: string,
  amount: number,
  redirectUrl: string,
  customerInfo: any
): Promise<any> => {
  try {
    // First, get auth token
    const accessToken = await getPhonePeAuthToken(config);
    
    // Prepare API URL based on environment
    const baseUrl = config.isProduction 
      ? 'https://api.phonepe.com/apis/pg' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    
    const url = `${baseUrl}/checkout/v2/pay`;
    
    // Prepare request body
    const requestBody = {
      merchantOrderId,
      amount: amount * 100, // Convert to paisa
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        udf1: customerInfo.name,
        udf2: customerInfo.email,
        udf3: customerInfo.phone,
        udf4: `order_${merchantOrderId}`,
        udf5: "payment_for_order"
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment for your order",
        merchantUrls: {
          redirectUrl
        }
      }
    };

    // Make API request
    const response = await axios({
      method: 'POST',
      url,
      data: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    });

    // Return the payment info
    return response.data;
  } catch (error: any) {
    console.error('PhonePe Payment Error:', error.response ? error.response.data : error.message);
    throw new Error(`Payment initiation failed: ${error.message}`);
  }
};

/**
 * Verify payment status with PhonePe
 */
export const verifyPhonePePayment = async (
  config: PhonePeConfig,
  merchantOrderId: string
): Promise<any> => {
  try {
    // First, get auth token
    const accessToken = await getPhonePeAuthToken(config);
    
    // Prepare API URL based on environment
    const baseUrl = config.isProduction 
      ? 'https://api.phonepe.com/apis/pg' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    
    const url = `${baseUrl}/checkout/v2/order/${merchantOrderId}/status`;
    
    // Make API request
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('PhonePe Verification Error:', error.response ? error.response.data : error.message);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

/**
 * Process PhonePe payment and save transaction to Firebase
 */
export const processPhonePePayment = async (
  isProduction: boolean,
  payload: any
): Promise<any> => {
  const { merchantTransactionId, amount, redirectUrl } = payload;
  const orderId = payload.merchantTransactionId;  
  const userId = payload.userId || 'anonymous';
  
  // For debugging - log the payload
  console.log('PhonePe payment payload:', payload);
  try {
    // Use the provided merchantTransactionId or generate a new one
    const merchantOrderId = merchantTransactionId || `YBT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Determine which credentials to use
    const config: PhonePeConfig = isProduction 
      ? {
          clientId: 'SU2505262030593101637421',
          clientSecret: 'e5dcff97-ce5c-4b4f-a621-c4d03fccd9cd',
          clientVersion: '1',
          isProduction: true
        } 
      : {
          clientId: 'TEST-M23VR50UZCWH0_25052',
          clientSecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
          clientVersion: '1',
          isProduction: false
        };
    
    // Record transaction in Firebase first - ensure all fields have valid values
    const transactionData = {
      orderId,
      userId,
      amount: typeof amount === 'number' ? amount : parseFloat(String(amount)),
      currency: 'INR',
      status: 'initiated',
      gatewayTransactionId: merchantOrderId,
      paymentMethod: 'UPI',
      paymentGateway: 'phonepe',
      // This is where the error was happening - ensure the gatewayResponse is a valid object
      gatewayResponse: {
        // Make sure customerInfo is always a valid object
        customerInfo: payload.customerInfo || {
          name: 'Customer',
          email: 'customer@example.com',
          phone: '1234567890'
        },
        merchantOrderId,
        timestamp: new Date().toISOString(),
        // Add additional fields to make sure the structure is consistent
        amount: typeof amount === 'number' ? amount : parseFloat(String(amount)),
        currency: 'INR',
        status: 'initiated'
      },
      // Add an empty gateway object with transactions array to prevent undefined errors
      gateway: {
        transactions: []
      }
    };
    
    // Log the transaction data for debugging
    console.log('Creating transaction with data:', transactionData);
    
    // Add the transaction to Firestore
    const transactionId = await addPaymentTransaction(transactionData);
    
    // Initiate payment with PhonePe
    const paymentResponse = await initiatePhonePePayment(
      config,
      merchantOrderId,
      typeof amount === 'number' ? amount : parseFloat(String(amount)),
      redirectUrl,
      payload.customerInfo || {}
    );
    
    // Update transaction with payment response
    if (paymentResponse && paymentResponse.redirectUrl) {
      // Make sure we have a valid gatewayResponse object
      const updatedResponse = {
        status: 'processing',
        // Ensure paymentResponse is a valid object
        gatewayResponse: paymentResponse || {},
        updatedAt: serverTimestamp()
      };
      
      // Log the update data for debugging
      console.log('Updating transaction with data:', updatedResponse);
      
      // Update the transaction in Firestore
      await updatePaymentTransaction(transactionId, updatedResponse);
      
      // Save pending payment info to session storage for callback verification
      const pendingPaymentInfo = {
        transactionId,
        orderId,
        amount,
        merchantOrderId,
        redirectUrl: paymentResponse.redirectUrl
      };
      
      sessionStorage.setItem('pendingPayment', JSON.stringify(pendingPaymentInfo));
      
      return {
        success: true,
        transactionId,
        redirectUrl: paymentResponse.redirectUrl,
        pendingPaymentInfo
      };
    } else {
      throw new Error('Invalid payment response from PhonePe');
    }
  } catch (error: any) {
    console.error('Process PhonePe Payment Error:', error);
    throw error;
  }
};

/**
 * Complete PhonePe transaction after callback
 */
export const completePhonePeTransaction = async (
  isProduction: boolean,
  merchantOrderId: string,
  transactionId: string
): Promise<any> => {
  // For debugging - log the inputs
  console.log('Completing PhonePe transaction:', { isProduction, merchantOrderId, transactionId });
  try {
    // Determine which credentials to use
    const config: PhonePeConfig = isProduction 
      ? {
          clientId: 'SU2505262030593101637421',
          clientSecret: 'e5dcff97-ce5c-4b4f-a621-c4d03fccd9cd',
          clientVersion: '1',
          isProduction: true
        } 
      : {
          clientId: 'TEST-M23VR50UZCWH0_25052',
          clientSecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
          clientVersion: '1',
          isProduction: false
        };
    
    // Verify the payment status
    const verificationResult = await verifyPhonePePayment(config, merchantOrderId);
    
    // Find the transaction in Firebase
    const transaction = await getTransactionByGatewayId(merchantOrderId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Update transaction based on verification result
    if (verificationResult) {
      // Determine the status from verification result
      const status = verificationResult.paymentState === 'COMPLETED' ? 'SUCCESS' : 'failed';
      
      // Prepare the update data - ensure all fields are valid
      const updateData = {
        status,
        // Ensure gatewayResponse is always a valid object
        gatewayResponse: verificationResult || {
          success: false,
          message: 'Payment verification failed'
        },
        updatedAt: serverTimestamp()
      };
      
      // Log the update data for debugging
      console.log('Updating transaction with verification result:', updateData);
      
      // Update the transaction in Firestore
      await updatePaymentTransaction(transaction.id, updateData);
      
      return {
        success: true,
        status,
        data: verificationResult
      };
    } else {
      // Create a default error response if verificationResult is undefined
      const errorResponse = {
        success: false,
        message: 'Payment verification failed',
        timestamp: new Date().toISOString()
      };
      
      // Log the error response for debugging
      console.log('Transaction failed, updating with error response:', errorResponse);
      
      // Update the transaction with the error response
      await updatePaymentTransaction(transaction.id, {
        status: 'failed',
        // Use the error response instead of undefined
        gatewayResponse: errorResponse,
        updatedAt: serverTimestamp()
      });
      
      return {
        success: false,
        status: 'failed',
        data: verificationResult
      };
    }
  } catch (error: any) {
    console.error('Complete PhonePe Transaction Error:', error);
    throw error;
  }
};
