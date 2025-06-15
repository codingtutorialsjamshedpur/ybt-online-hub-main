import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './firestore';
import { PaymentGateway } from '../types';

/**
 * Ensures that a default PhonePe payment gateway exists in the database
 * This is critical for the payment functionality to work
 */
export const ensureDefaultPhonePeGateway = async (): Promise<string> => {
  try {
    // Check if a PhonePe gateway already exists
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_GATEWAYS),
      where('provider', '==', 'phonepe')
    );
    
    const querySnapshot = await getDocs(q);
    
    // If PhonePe gateway exists, return its ID
    if (!querySnapshot.empty) {
      const gateway = querySnapshot.docs[0];
      console.log('Existing PhonePe gateway found:', gateway.id);
      return gateway.id;
    }
    
    // Create a new default PhonePe gateway
    console.log('No PhonePe gateway found. Creating default...');
    
    // Generate a unique ID for the new gateway
    const gatewayId = `phonepe_${Date.now()}`;
    const gatewayRef = doc(db, COLLECTIONS.PAYMENT_GATEWAYS, gatewayId);
    
    // Default PhonePe test credentials
    const defaultGateway: PaymentGateway = {
      id: gatewayId,
      name: 'PhonePe India',
      provider: 'phonepe',
      isActive: true,
      merchantId: 'TEST-M23VR50UZCWH0_25052',
      merchantKeyId: 'TEST-M23VR50UZCWH0_25052',
      merchantKeySecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
      mode: 'test',
      callbackUrl: 'https://www.codingtutorialsjamshedpur.fun/api/payment-callback',
      redirectUrl: 'https://www.codingtutorialsjamshedpur.fun/payment-status',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    
    // Set the document in Firestore
    await setDoc(gatewayRef, defaultGateway);
    
    console.log('Default PhonePe gateway created with ID:', gatewayId);
    return gatewayId;
  } catch (error) {
    console.error('Error ensuring default PhonePe gateway:', error);
    throw error;
  }
};
