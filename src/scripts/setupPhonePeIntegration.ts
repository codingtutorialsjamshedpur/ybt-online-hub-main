import { db } from '../firebase/config';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../firebase/firestore';

/**
 * This script sets up the necessary Firestore collections for PhonePe integration
 * and fixes any existing issues with the database structure.
 */

// PhonePe test credentials
const TEST_CREDENTIALS = {
  name: 'PhonePe India',
  provider: 'phonepe',
  isActive: true,
  merchantId: 'TEST-M23VR50UZCWH0_25052',
  merchantKeyId: 'TEST-M23VR50UZCWH0_25052',
  merchantKeySecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
  mode: 'test',
  callbackUrl: window.location.origin + '/payment-callback',
  redirectUrl: window.location.origin + '/payment-callback',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

// PhonePe production credentials
const PROD_CREDENTIALS = {
  name: 'PhonePe India',
  provider: 'phonepe',
  isActive: false, // Set to false by default for safety
  merchantId: 'SU2505262030593101637421',
  merchantKeyId: 'SU2505262030593101637421',
  merchantKeySecret: 'e5dcff97-ce5c-4b4f-a621-c4d03fccd9cd',
  mode: 'production',
  callbackUrl: window.location.origin + '/payment-callback',
  redirectUrl: window.location.origin + '/payment-callback',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

/**
 * Sets up PhonePe payment gateway in Firestore
 */
export const setupPhonePeGateway = async (): Promise<string> => {
  try {
    console.log('Setting up PhonePe payment gateway...');

    // First, clean up any existing PhonePe gateway entries
    const gatewaysRef = collection(db, COLLECTIONS.PAYMENT_GATEWAYS);
    const q = query(gatewaysRef, where('provider', '==', 'phonepe'));
    const querySnapshot = await getDocs(q);
    
    // Delete any existing phonepe entries to avoid duplicates
    const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
      console.log(`Deleting existing PhonePe gateway: ${docSnapshot.id}`);
      await deleteDoc(doc(db, COLLECTIONS.PAYMENT_GATEWAYS, docSnapshot.id));
    });
    
    await Promise.all(deletePromises);
    
    // Create test gateway
    const testGatewayId = `phonepe_test_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.PAYMENT_GATEWAYS, testGatewayId), TEST_CREDENTIALS);
    console.log(`Created test PhonePe gateway with ID: ${testGatewayId}`);
    
    // Create production gateway
    const prodGatewayId = `phonepe_prod_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.PAYMENT_GATEWAYS, prodGatewayId), PROD_CREDENTIALS);
    console.log(`Created production PhonePe gateway with ID: ${prodGatewayId}`);
    
    return testGatewayId; // Return the test gateway ID
  } catch (error) {
    console.error('Error setting up PhonePe gateway:', error);
    throw error;
  }
};

/**
 * Creates a sample payment transaction
 */
export const createSampleTransaction = async (): Promise<void> => {
  try {
    console.log('Creating sample payment transaction...');
    
    const transactionId = `sample_txn_${Date.now()}`;
    const transactionData = {
      orderId: `order_${Date.now()}`,
      userId: 'sample_user_id',
      amount: 100.00, // Must be a number, not a string
      currency: 'INR',
      status: 'initiated',
      gatewayTransactionId: `PHONEPE_TXN_${Date.now()}`,
      // Key fix: gatewayResponse must be an object, not undefined
      gatewayResponse: {
        orderId: `PHONEPE_ORDER_${Date.now()}`,
        transactionId: `PHONEPE_TXN_${Date.now()}`,
        amount: 10000, // In paise (smallest unit)
        responseCode: 'SUCCESS',
        responseMessage: 'Payment successful'
      },
      paymentMethod: 'UPI',
      paymentGateway: 'phonepe',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, COLLECTIONS.PAYMENT_TRANSACTIONS, transactionId), transactionData);
    console.log(`Created sample payment transaction with ID: ${transactionId}`);
  } catch (error) {
    console.error('Error creating sample payment transaction:', error);
    throw error;
  }
};

/**
 * Run the entire setup process
 */
export const runPhonePeSetup = async (): Promise<void> => {
  try {
    console.log('Starting PhonePe integration setup...');
    
    // Step 1: Set up PhonePe gateway
    const gatewayId = await setupPhonePeGateway();
    
    // Step 2: Create a sample transaction
    await createSampleTransaction();
    
    console.log('PhonePe integration setup completed successfully!');
    console.log(`Active test gateway ID: ${gatewayId}`);
    console.log('You can now use PhonePe for payments in your application.');
    
    return;
  } catch (error) {
    console.error('Error in PhonePe setup:', error);
    throw error;
  }
};

// For manual execution in browser console
(window as any).setupPhonePe = runPhonePeSetup;
