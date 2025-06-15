import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query,
  where,
  orderBy,
  limit,
  serverTimestamp, 
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './config';
import { PaymentGateway } from '../types';
// Define generic types instead of importing to avoid path conflicts
type GenericDocument = Record<string, any>;

// Collection names - updated to match Firebase console
export const COLLECTIONS = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  USERS: 'users',
  USER_PANEL: 'User_Panel',  // Matches case in Firebase console
  NOTIFICATIONS: 'notifications',
  COUPONS: 'coupons',
  CART: 'cart',  // Singular to match Firebase console
  BLOG: 'blog',  // Updated from plural to singular to match Firebase console
  TICKETS: 'tickets',
  CONTACT_US: 'contact_us',
  PAYMENT_GATEWAYS: 'payment_gateways',
  PAYMENT_TRANSACTIONS: 'payment_transactions'
};

// Generic function to convert Firebase Timestamp to string date
export const convertTimestampToString = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString().split('T')[0];
};

// Generic functions for CRUD operations

// Fetch a single document by ID
export const fetchDocument = async <T>(collectionName: string, documentId: string): Promise<T | null> => {
  try {
    console.log(`Fetching document: ${collectionName}/${documentId}`);
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`Document found: ${documentId}`, docSnap.data());
      return {
        ...docSnap.data(),
        id: docSnap.id
      } as T;
    } else {
      console.log(`Document not found: ${documentId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching document ${collectionName}/${documentId}:`, error);
    return null;
  }
};

// Set a document with a specific ID
export const setDocument = async <T>(collectionName: string, documentId: string, data: T): Promise<void> => {
  try {
    console.log(`Setting document: ${collectionName}/${documentId}`, data);
    const docRef = doc(db, collectionName, documentId);
    await setDoc(docRef, data);
    console.log(`Document set: ${documentId}`);
  } catch (error) {
    console.error(`Error setting document ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

// Fetch documents with a where clause
export const fetchDocumentsWhere = async <T>(
  collectionName: string, 
  field: string, 
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=', 
  value: any,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limitCount?: number
): Promise<T[]> => {
  try {
    console.log(`Fetching documents where ${field} ${operator} ${value} from ${collectionName}`);
    
    const constraints: QueryConstraint[] = [where(field, operator, value)];
    
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection || 'asc'));
    }
    
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.docs.length} documents in ${collectionName} where ${field} ${operator} ${value}`);
    
    const result = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as T));
    
    return result;
  } catch (error) {
    console.error(`Error fetching documents from ${collectionName} where ${field} ${operator} ${value}:`, error);
    return [];
  }
};

// Fetch all documents from a collection
export const fetchCollection = async <T>(collectionName: string): Promise<T[]> => {
  try {
    console.log(`Fetching collection: ${collectionName}`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    console.log(`Found ${querySnapshot.docs.length} documents in ${collectionName}`);
    
    // Debug each document
    querySnapshot.docs.forEach(doc => {
      console.log(`Document ID: ${doc.id}`, doc.data());
    });
    
    // Map the data with ID
    const result = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as T));
    
    return result;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
};

// Add a document to a collection
export const addDocument = async <T>(
  collectionName: string, 
  data: T
): Promise<string> => {
  // Clone the data object to avoid mutating the original
  const dataCopy = { ...data } as any;
  
  // Remove id if present to let Firestore generate one
  if (dataCopy.id !== undefined) {
    delete dataCopy.id;
  }
  
  // Add timestamp
  const dataWithTimestamp = {
    ...dataCopy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Add document to collection
  const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
  return docRef.id;
};

// Add document with specific ID
export const addDocumentWithId = async <T>(
  collectionName: string, 
  id: string, 
  data: T
): Promise<void> => {
  // Add timestamps
  const dataWithTimestamp = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Set document with specific ID
  await setDoc(doc(db, collectionName, id), dataWithTimestamp);
};

// Update a document in a collection
export const updateDocument = async <T>(
  collectionName: string, 
  id: string, 
  data: Partial<T>
): Promise<void> => {
  // Add updated timestamp
  const dataWithTimestamp = {
    ...data,
    updatedAt: serverTimestamp()
  };

  // Update document
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, dataWithTimestamp as any);
};

// Delete a document from a collection
export const deleteDocument = async (
  collectionName: string, 
  id: string
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

// Specific functions for each entity

// Products
export const fetchProducts = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.PRODUCTS);
};

export const addProduct = async (product: any): Promise<string> => {
  return addDocument(COLLECTIONS.PRODUCTS, product);
};

export const updateProduct = async (id: string, product: any): Promise<void> => {
  // Use 'any' to avoid type conflicts between different imports of Product
  return updateDocument(COLLECTIONS.PRODUCTS, id, product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.PRODUCTS, id);
};

// Orders
export const fetchOrders = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.ORDERS);
};

export const addOrder = async (order: any): Promise<string> => {
  return addDocument(COLLECTIONS.ORDERS, order);
};

export const updateOrder = async (id: string, order: any): Promise<void> => {
  return updateDocument(COLLECTIONS.ORDERS, id, order);
};

export const deleteOrder = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.ORDERS, id);
};

// Users
export const fetchUsers = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.USERS);
};

export const addUser = async (user: any): Promise<string> => {
  return addDocument(COLLECTIONS.USERS, user);
};

export const updateUser = async (id: string, user: any): Promise<void> => {
  // Use 'any' to avoid type conflicts with different User role definitions
  return updateDocument(COLLECTIONS.USERS, id, user);
};

export const deleteUser = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.USERS, id);
};

// Coupons
export const fetchCoupons = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.COUPONS);
};

export const addCoupon = async (coupon: any): Promise<string> => {
  return addDocument(COLLECTIONS.COUPONS, coupon);
};

export const updateCoupon = async (id: string, coupon: any): Promise<void> => {
  return updateDocument(COLLECTIONS.COUPONS, id, coupon);
};

export const deleteCoupon = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.COUPONS, id);
};

// Cart
export const fetchCarts = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.CART);
};

export const addCart = async (cart: any): Promise<string> => {
  return addDocument(COLLECTIONS.CART, cart);
};

export const updateCart = async (id: string, cart: any): Promise<void> => {
  return updateDocument(COLLECTIONS.CART, id, cart);
};

export const deleteCart = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.CART, id);
};

// User Panel
export const fetchUserPanel = async (userId: string): Promise<any> => {
  return fetchDocument(COLLECTIONS.USER_PANEL, userId);
};

// Create a new payment transaction
export const createPaymentTransaction = async (data: any): Promise<string> => {
  try {
    // Ensure data has the correct structure to prevent undefined fields
    const sanitizedData = { ...data };
    
    // Make sure gateway.transactions is properly initialized
    if (!sanitizedData.gateway || typeof sanitizedData.gateway !== 'object') {
      sanitizedData.gateway = {};
    }
    
    if (!sanitizedData.gateway.transactions || !Array.isArray(sanitizedData.gateway.transactions)) {
      sanitizedData.gateway.transactions = [];
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENT_TRANSACTIONS), {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    return '';
  }
};

export const updateUserPanel = async (userId: string, userData: Partial<any>): Promise<void> => {
  return updateDocument(COLLECTIONS.USER_PANEL, userId, {
    ...userData,
    updatedAt: serverTimestamp()
  });
};

// Notifications
export const fetchNotifications = async (userId: string): Promise<any[]> => {
  return fetchDocumentsWhere(COLLECTIONS.NOTIFICATIONS, 'userId', '==', userId);
};

export const addNotification = async (notification: any): Promise<string> => {
  return addDocument(COLLECTIONS.NOTIFICATIONS, {
    ...notification,
    read: false,
    createdAt: serverTimestamp()
  });
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  return updateDocument(COLLECTIONS.NOTIFICATIONS, id, {
    read: true,
    updatedAt: serverTimestamp()
  });
};

export const deleteNotification = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.NOTIFICATIONS, id);
};

// Tickets
export const fetchTickets = async (userId: string): Promise<any[]> => {
  return fetchDocumentsWhere(COLLECTIONS.TICKETS, 'userId', '==', userId);
};

export const fetchTicket = async (id: string): Promise<any> => {
  return fetchDocument(COLLECTIONS.TICKETS, id);
};

export const addTicket = async (ticket: any): Promise<string> => {
  return addDocument(COLLECTIONS.TICKETS, {
    ...ticket,
    status: ticket.status || 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateTicket = async (id: string, ticketData: Partial<any>): Promise<void> => {
  return updateDocument(COLLECTIONS.TICKETS, id, {
    ...ticketData,
    updatedAt: serverTimestamp()
  });
};

export const addTicketReply = async (ticketId: string, reply: any): Promise<void> => {
  const ticket = await fetchTicket(ticketId);
  const replies = ticket.replies || [];
  replies.push({
    ...reply,
    id: `reply-${Date.now()}`,
    createdAt: serverTimestamp()
  });
  
  return updateTicket(ticketId, { replies, updatedAt: serverTimestamp() });
};

// Blog
export const fetchBlogPosts = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.BLOG);
};

export const addBlogPost = async (blog: any): Promise<string> => {
  return addDocument(COLLECTIONS.BLOG, blog);
};

export const updateBlogPost = async (id: string, blog: any): Promise<void> => {
  return updateDocument(COLLECTIONS.BLOG, id, blog);
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.BLOG, id);
};

// Contact Submissions
export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  
  // Optional fields
  mobileNo?: string; // Changed from phone to mobileNo to match Firebase structure
  department?: string;
  contactTime?: string;
  priority?: string;
  attachmentUrl?: string;
  
  // Admin fields
  status?: string;
  assignedTo?: string;
  notes?: string;
  createdAt?: any;
  lastUpdated?: any;
  timestamp?: any; // Added to match Firebase structure
}

export const fetchContactSubmissions = async (): Promise<ContactSubmission[]> => {
  return fetchCollection<ContactSubmission>(COLLECTIONS.CONTACT_US);
};

export const fetchContactSubmission = async (id: string): Promise<ContactSubmission | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.CONTACT_US, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as ContactSubmission;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching contact submission ${id}:`, error);
    return null;
  }
};

export const addContactSubmission = async (submission: ContactSubmission): Promise<string> => {
  return addDocument<ContactSubmission>(COLLECTIONS.CONTACT_US, submission);
};

export const updateContactSubmission = async (id: string, submission: Partial<ContactSubmission>): Promise<void> => {
  return updateDocument<ContactSubmission>(COLLECTIONS.CONTACT_US, id, submission);
};

export const deleteContactSubmission = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.CONTACT_US, id);
};

// Payment Gateway Management

export const fetchPaymentGateways = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.PAYMENT_GATEWAYS);
};

export const fetchActivePaymentGateway = async (provider?: string): Promise<PaymentGateway | null> => {
  try {
    console.log('Fetching active payment gateway for provider:', provider);
    
    // Try to ensure we have a default gateway first
    try {
      // Dynamically import to avoid circular dependencies
      const { ensureDefaultPhonePeGateway } = await import('./ensureDefaultGateway');
      await ensureDefaultPhonePeGateway();
    } catch (err) {
      console.warn('Could not ensure default gateway, but continuing:', err);
    }
    
    // Now fetch all gateways
    const gateways = await fetchCollection<PaymentGateway>(COLLECTIONS.PAYMENT_GATEWAYS);
    console.log('Found gateways:', gateways);
    
    let activeGateways = gateways.filter(gateway => gateway.isActive === true);
    if (activeGateways.length === 0) {
      // Backward compatibility for older gateway structure
      activeGateways = gateways.filter(gateway => (gateway as any).Active === true);
    }
    
    // If provider is specified, filter by provider
    if (provider) {
      activeGateways = activeGateways.filter(gateway => gateway.provider === provider);
    }
    
    // If we found active gateways, return the first one
    if (activeGateways.length > 0) {
      console.log('Active payment gateway found:', activeGateways[0]);
      return activeGateways[0];
    }
    
    // If no active gateway found and provider is phonepe or unspecified, create a default one
    if (provider === 'phonepe' || !provider) {
      console.log('No active payment gateway found. Creating default PhonePe gateway...');
      // Import the function dynamically to avoid circular dependency
      const { ensureDefaultPhonePeGateway } = await import('./ensureDefaultGateway');
      const gatewayId = await ensureDefaultPhonePeGateway();
      
      if (gatewayId) {
        return await fetchDocument<PaymentGateway>(COLLECTIONS.PAYMENT_GATEWAYS, gatewayId);
        console.log(`No active ${provider} gateway found`);
        return null;
      }
    }
    
    // Otherwise return the first active gateway
    const selectedGateway = activeGateways[0];
    console.log(`Found active gateway: ${selectedGateway.id}`);
    return selectedGateway;
  } catch (error) {
    console.error('Error fetching active payment gateway:', error);
    return null;
  }
};

export const fetchPaymentGateway = async (id: string): Promise<any> => {
  return fetchDocument(COLLECTIONS.PAYMENT_GATEWAYS, id);
};

export const addPaymentGateway = async (gateway: any): Promise<string> => {
  // Ensure all required fields are present as shown in Firebase
  const gatewayData = {
    name: gateway.name || 'PhonePe India',
    provider: gateway.provider || 'phonepe',
    isActive: gateway.isActive || false,
    merchantId: gateway.merchantId || '',
    merchantKeyId: gateway.merchantKeyId || '',
    merchantKeySecret: gateway.merchantKeySecret || '',
    mode: gateway.mode || 'test',
    callbackUrl: gateway.callbackUrl || 'https://example.com/phonepe-callback',
    redirectUrl: gateway.redirectUrl || 'https://example.com/payment/success',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  return addDocument(COLLECTIONS.PAYMENT_GATEWAYS, gatewayData);
};

export const updatePaymentGateway = async (id: string, gateway: any): Promise<void> => {
  // Only include fields that exist in the Firebase structure
  const updateData = {
    name: gateway.name,
    provider: gateway.provider,
    isActive: gateway.isActive,
    merchantId: gateway.merchantId,
    merchantKeyId: gateway.merchantKeyId,
    merchantKeySecret: gateway.merchantKeySecret,
    mode: gateway.mode,
    callbackUrl: gateway.callbackUrl,
    redirectUrl: gateway.redirectUrl,
    updatedAt: serverTimestamp()
  };
  
  return updateDocument(COLLECTIONS.PAYMENT_GATEWAYS, id, updateData);
};

export const deletePaymentGateway = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.PAYMENT_GATEWAYS, id);
};

// This function is now defined above

// Payment Transactions Management
export const fetchPaymentTransactions = async (): Promise<any[]> => {
  return fetchCollection(COLLECTIONS.PAYMENT_TRANSACTIONS);
};

export const fetchPaymentTransactionsByOrder = async (orderId: string): Promise<any[]> => {
  return fetchDocumentsWhere(COLLECTIONS.PAYMENT_TRANSACTIONS, 'orderId', '==', orderId);
};

export const fetchPaymentTransactionsByUser = async (userId: string): Promise<any[]> => {
  return fetchDocumentsWhere(COLLECTIONS.PAYMENT_TRANSACTIONS, 'userId', '==', userId);
};

export const fetchPaymentTransaction = async (id: string): Promise<any> => {
  return fetchDocument(COLLECTIONS.PAYMENT_TRANSACTIONS, id);
};

export const addPaymentTransaction = async (transaction: any): Promise<string> => {
  // Match the exact structure seen in Firebase screenshots
  const transactionData = {
    orderId: transaction.orderId,
    userId: transaction.userId,
    amount: transaction.amount,
    currency: transaction.currency || 'INR',
    status: transaction.status || 'initiated',
    gatewayTransactionId: transaction.gatewayTransactionId || '',
    gatewayResponse: transaction.gatewayResponse,
    paymentMethod: transaction.paymentMethod || 'UPI',
    paymentGateway: transaction.paymentGateway || 'phonepe',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  return addDocument(COLLECTIONS.PAYMENT_TRANSACTIONS, transactionData);
};

export const updatePaymentTransaction = async (id: string, transaction: any): Promise<void> => {
  // Only include fields that exist in the Firebase structure
  const updateData = {
    status: transaction.status,
    gatewayTransactionId: transaction.gatewayTransactionId,
    gatewayResponse: transaction.gatewayResponse,
    updatedAt: serverTimestamp()
  };
  
  return updateDocument(COLLECTIONS.PAYMENT_TRANSACTIONS, id, updateData);
};

// Get transaction by gateway transaction ID
export const getTransactionByGatewayId = async (gatewayTransactionId: string): Promise<any> => {
  const transactions = await fetchDocumentsWhere(
    COLLECTIONS.PAYMENT_TRANSACTIONS, 
    'gatewayTransactionId', 
    '==', 
    gatewayTransactionId
  );
  return transactions.length > 0 ? transactions[0] : null;
};

export const deletePaymentTransaction = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.PAYMENT_TRANSACTIONS, id);
};
