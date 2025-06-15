/**
 * This script updates all Firebase collections necessary for PhonePe integration
 * Run this script to fix any structural issues in your collections
 */

import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { COLLECTIONS } from '../firebase/firestore';

/**
 * Updates the payment_gateways collection with proper PhonePe configuration
 */
const updatePaymentGateways = async () => {
  try {
    console.log('Updating payment_gateways collection...');
    
    // Check if a PhonePe gateway already exists
    const gatewaysRef = collection(db, COLLECTIONS.PAYMENT_GATEWAYS);
    const q = query(gatewaysRef, where('provider', '==', 'phonepe'));
    const querySnapshot = await getDocs(q);
    
    // PhonePe gateway configuration
    const phonePeGateway = {
      name: 'PhonePe India',
      provider: 'phonepe',
      isActive: true,
      merchantId: 'TEST-M23VR50UZCWH0_25052',
      merchantKeyId: 'TEST-M23VR50UZCWH0_25052',
      merchantKeySecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
      mode: 'test',
      callbackUrl: 'https://www.codingtutorialsjamshedpur.fun/api/payment-callback',
      redirectUrl: 'https://www.codingtutorialsjamshedpur.fun/payment-status',
      updatedAt: serverTimestamp()
    };
    
    if (!querySnapshot.empty) {
      // Update existing gateway
      const gatewayDoc = querySnapshot.docs[0];
      console.log(`Updating existing PhonePe gateway: ${gatewayDoc.id}`);
      
      await updateDoc(doc(db, COLLECTIONS.PAYMENT_GATEWAYS, gatewayDoc.id), {
        ...phonePeGateway
      });
      
      console.log('PhonePe gateway updated successfully');
    } else {
      // Create new gateway
      const gatewayId = `phonepe_test_gateway_${Date.now()}`;
      console.log(`Creating new PhonePe gateway with ID: ${gatewayId}`);
      
      await setDoc(doc(db, COLLECTIONS.PAYMENT_GATEWAYS, gatewayId), {
        ...phonePeGateway,
        id: gatewayId,
        createdAt: serverTimestamp()
      });
      
      console.log('PhonePe gateway created successfully');
    }
  } catch (error) {
    console.error('Error updating payment_gateways:', error);
  }
};

/**
 * Updates the payment_transactions collection to fix any structural issues
 */
const updatePaymentTransactions = async () => {
  try {
    console.log('Updating payment_transactions collection...');
    
    const transactionsRef = collection(db, COLLECTIONS.PAYMENT_TRANSACTIONS);
    const querySnapshot = await getDocs(transactionsRef);
    
    if (querySnapshot.empty) {
      console.log('No payment transactions found');
      return;
    }
    
    // Process each transaction
    const updatePromises = querySnapshot.docs.map(async (transactionDoc) => {
      const transactionData = transactionDoc.data();
      const updates: any = {};
      
      // Fix gateway.transactions field if missing or not an array
      if (!transactionData.gateway || typeof transactionData.gateway !== 'object') {
        updates.gateway = { transactions: [] };
      } else if (!transactionData.gateway.transactions || !Array.isArray(transactionData.gateway.transactions)) {
        updates['gateway.transactions'] = [];
      }
      
      // Only update if changes are needed
      if (Object.keys(updates).length > 0) {
        console.log(`Updating transaction ${transactionDoc.id} with fixes`);
        await updateDoc(doc(db, COLLECTIONS.PAYMENT_TRANSACTIONS, transactionDoc.id), updates);
      }
    });
    
    await Promise.all(updatePromises);
    console.log('Payment transactions updated successfully');
  } catch (error) {
    console.error('Error updating payment_transactions:', error);
  }
};

/**
 * Updates the orders collection to ensure proper linking with payment transactions
 */
const updateOrders = async () => {
  try {
    console.log('Updating orders collection...');
    
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const querySnapshot = await getDocs(ordersRef);
    
    if (querySnapshot.empty) {
      console.log('No orders found');
      return;
    }
    
    // Process each order
    const updatePromises = querySnapshot.docs.map(async (orderDoc) => {
      const orderData = orderDoc.data();
      const updates: any = {};
      
      // Ensure paymentMethod is set to phonepe if using PhonePe
      if (orderData.paymentMethod !== 'phonepe' && 
          (!orderData.paymentMethod || orderData.paymentTransactionId)) {
        updates.paymentMethod = 'phonepe';
      }
      
      // Only update if changes are needed
      if (Object.keys(updates).length > 0) {
        console.log(`Updating order ${orderDoc.id} with fixes`);
        await updateDoc(doc(db, COLLECTIONS.ORDERS, orderDoc.id), updates);
      }
    });
    
    await Promise.all(updatePromises);
    console.log('Orders updated successfully');
  } catch (error) {
    console.error('Error updating orders:', error);
  }
};

/**
 * Run all updates
 */
export const updatePhonePeCollections = async () => {
  try {
    console.log('Starting PhonePe collections update...');
    
    // Update collections in sequence
    await updatePaymentGateways();
    await updatePaymentTransactions();
    await updateOrders();
    
    console.log('All PhonePe collections updated successfully!');
    return true;
  } catch (error) {
    console.error('Error updating PhonePe collections:', error);
    return false;
  }
};

// For calling directly from browser console
(window as any).updatePhonePeCollections = updatePhonePeCollections;

// Execute immediately when script is loaded
updatePhonePeCollections()
  .then(result => {
    if (result) {
      console.log('PhonePe collections update completed successfully');
    } else {
      console.error('PhonePe collections update failed');
    }
  })
  .catch(error => {
    console.error('Error during PhonePe collections update:', error);
  });
