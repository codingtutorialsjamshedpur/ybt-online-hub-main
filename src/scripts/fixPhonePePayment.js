// A simple script to fix the PhonePe payment error
// Run this in your browser console when viewing your website

async function fixPhonePePaymentIssue() {
  try {
    console.log('Starting to fix PhonePe payment issues...');
    
    // Get Firebase modules from the window
    const { db, collection, getDocs, doc, updateDoc } = window.firebase || {};
    
    if (!db || !collection || !getDocs || !doc || !updateDoc) {
      console.error('Firebase modules not found in window. Please run this on your website after it has loaded.');
      return false;
    }
    
    // Fix payment transactions
    console.log('Fixing payment_transactions collection...');
    const transactionsRef = collection(db, 'payment_transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    
    if (transactionsSnapshot.empty) {
      console.log('No payment transactions found.');
    } else {
      for (const docSnapshot of transactionsSnapshot.docs) {
        const transactionData = docSnapshot.data();
        const transactionId = docSnapshot.id;
        
        // Check if gateway field needs fixing
        if (!transactionData.gateway || typeof transactionData.gateway !== 'object' || 
            !transactionData.gateway.transactions || !Array.isArray(transactionData.gateway.transactions)) {
          
          console.log(`Fixing transaction ${transactionId}...`);
          
          // Update the document to include gateway.transactions as an empty array
          await updateDoc(doc(db, 'payment_transactions', transactionId), {
            'gateway': { transactions: [] }
          });
          
          console.log(`Transaction ${transactionId} fixed.`);
        }
      }
    }
    
    // Fix payment gateways
    console.log('Fixing payment_gateways collection...');
    const gatewaysRef = collection(db, 'payment_gateways');
    const gatewaysSnapshot = await getDocs(gatewaysRef);
    
    if (gatewaysSnapshot.empty) {
      console.log('No payment gateways found. Creating a default one...');
      
      // Create a default PhonePe gateway
      const gatewayRef = doc(db, 'payment_gateways', 'default_phonepe_gateway');
      await setDoc(gatewayRef, {
        id: 'default_phonepe_gateway',
        name: 'PhonePe India',
        provider: 'phonepe',
        isActive: true,
        merchantId: 'TEST-M23VR50UZCWH0_25052',
        merchantKeyId: 'TEST-M23VR50UZCWH0_25052',
        merchantKeySecret: 'MmVkODRiYzEtNDAxZC00NGM0LTk2ZDItYzhhNmI2NWVjYjM3',
        mode: 'test',
        callbackUrl: 'https://www.codingtutorialsjamshedpur.fun/api/payment-callback',
        redirectUrl: 'https://www.codingtutorialsjamshedpur.fun/payment-status',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Default PhonePe gateway created.');
    } else {
      console.log('Payment gateways found, no need to create a default one.');
    }
    
    console.log('PhonePe payment issues fixed successfully!');
    return true;
  } catch (error) {
    console.error('Error fixing PhonePe payment issues:', error);
    return false;
  }
}

// Export to window for direct access in browser console
window.fixPhonePePaymentIssue = fixPhonePePaymentIssue;

// Run immediately
fixPhonePePaymentIssue();
