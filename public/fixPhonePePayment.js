// Fix PhonePe Payment Issues Script
// Place this in public folder to access from browser

// Run this function when payment errors occur
async function fixPhonePePaymentIssue() {
  try {
    console.log('Starting PhonePe payment fix...');
    
    // Get Firebase instances from window
    const { getFirestore, collection, getDocs, doc, updateDoc } = firebase.firestore;
    const db = getFirestore();
    
    // 1. Fix the specific transaction mentioned in the error
    const errorTransactionId = 'refNfjs70cH28Nr3ksV'; // From your error message
    console.log(`Fixing transaction ${errorTransactionId}...`);
    
    try {
      await updateDoc(doc(db, 'payment_transactions', errorTransactionId), {
        'gateway.transactions': []
      });
      console.log(`Transaction ${errorTransactionId} fixed!`);
    } catch (err) {
      console.error(`Error fixing specific transaction: ${err.message}`);
    }
    
    // 2. Fix all transactions to ensure they have the correct structure
    console.log('Fixing all payment transactions...');
    const transactionsRef = collection(db, 'payment_transactions');
    const snapshot = await getDocs(transactionsRef);
    
    let fixCount = 0;
    const promises = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (!data.gateway || !data.gateway.transactions) {
        console.log(`Fixing transaction ${docSnapshot.id}...`);
        promises.push(
          updateDoc(doc(db, 'payment_transactions', docSnapshot.id), {
            'gateway.transactions': []
          })
        );
        fixCount++;
      }
    });
    
    await Promise.all(promises);
    console.log(`Fixed ${fixCount} transactions.`);
    
    alert('PhonePe payment issues fixed! Please try completing your payment again.');
    return true;
  } catch (error) {
    console.error('Error in fix script:', error);
    alert('Error fixing payment issues. See console for details.');
    return false;
  }
}

// Add to window object so it can be called from console
window.fixPhonePePaymentIssue = fixPhonePePaymentIssue;

// Automatically check if we're on the payment page and run the fix
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the payment page
  if (document.querySelector('.payment-method') || 
      document.querySelector('.phonepe') ||
      document.URL.includes('payment') || 
      document.URL.includes('checkout')) {
    
    // Look for error messages
    const errorElements = document.querySelectorAll('.text-red-800, .bg-red-100');
    let hasPaymentError = false;
    
    errorElements.forEach(el => {
      if (el.textContent.includes('updateDoc') || 
          el.textContent.includes('undefined') ||
          el.textContent.includes('payment_transactions')) {
        hasPaymentError = true;
      }
    });
    
    if (hasPaymentError) {
      console.log('Payment error detected! Running fix...');
      fixPhonePePaymentIssue();
    }
  }
});
