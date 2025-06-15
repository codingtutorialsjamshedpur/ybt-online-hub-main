import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { COLLECTIONS } from '../firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Order, Ticket, User } from '../types';
import { auth } from '../firebase/config';

// Function to update or create user profile in Firestore
export const syncUserProfile = async (userId: string): Promise<User | null> => {
  try {
    // Check if user exists in Firestore
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    // Get current auth user data
    const authUser = auth.currentUser;
    if (!authUser) return null;
    
    if (!userSnap.exists()) {
      // Create new user document if it doesn't exist
      const userData: User = {
        id: userId,
        email: authUser.email || '',
        name: authUser.displayName || '',
        username: authUser.email ? authUser.email.split('@')[0] : `user_${userId.substring(0, 6)}`,
        photoURL: authUser.photoURL || '',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(userRef, userData);
      return userData;
    } else {
      // If user exists, update with latest auth data if needed
      const existingData = userSnap.data() as User;
      
      // Check if we need to update any fields
      const updates: Partial<User> = {};
      
      if (authUser.displayName && !existingData.name) {
        updates.name = authUser.displayName;
      }
      
      if (authUser.photoURL && !existingData.photoURL) {
        updates.photoURL = authUser.photoURL;
      }
      
      if (authUser.email && (!existingData.email || existingData.email !== authUser.email)) {
        updates.email = authUser.email;
      }
      
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await updateDoc(userRef, updates);
        return { ...existingData, ...updates };
      }
      
      return existingData;
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
    return null;
  }
};

// Get user data with sync
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    // First try to get from Firestore
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    
    // If not found, try to sync and create
    return await syncUserProfile(userId);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// This function has been removed to avoid duplication with the existing updateUserProfile function
// at line 457

// Local image cache for ticket attachments
// In a real production app, you would use IndexedDB for this
type LocalImageCache = {
  [key: string]: {
    data: string; // Base64 encoded image data
    metadata: {
      name: string;
      type: string;
      size: number;
      uploadedAt: Date;
    }
  }
};

// Initialize local storage for images if it doesn't exist
const initLocalImageCache = (): void => {
  if (!localStorage.getItem('imageCache')) {
    localStorage.setItem('imageCache', JSON.stringify({}));
  }
};

// Save image to local storage
export const saveImageToLocalCache = async (
  imageFile: File, 
  ticketId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    initLocalImageCache();
    
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imageData = reader.result as string;
        const cacheKey = `ticket_${ticketId}_${Date.now()}`;
        
        // Get current cache
        const cache = JSON.parse(localStorage.getItem('imageCache') || '{}') as LocalImageCache;
        
        // Add new image to cache
        cache[cacheKey] = {
          data: imageData,
          metadata: {
            name: imageFile.name,
            type: imageFile.type,
            size: imageFile.size,
            uploadedAt: new Date()
          }
        };
        
        // Save updated cache
        localStorage.setItem('imageCache', JSON.stringify(cache));
        
        // Return the cache key for reference
        resolve(cacheKey);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
};

// Get image from local storage
export const getImageFromLocalCache = (cacheKey: string): string | null => {
  try {
    const cache = JSON.parse(localStorage.getItem('imageCache') || '{}') as LocalImageCache;
    return cache[cacheKey]?.data || null;
  } catch (error) {
    console.error('Error retrieving image from cache:', error);
    return null;
  }
};

// Remove image from local storage
export const removeImageFromLocalCache = (cacheKey: string): boolean => {
  try {
    const cache = JSON.parse(localStorage.getItem('imageCache') || '{}') as LocalImageCache;
    if (cache[cacheKey]) {
      delete cache[cacheKey];
      localStorage.setItem('imageCache', JSON.stringify(cache));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing image from cache:', error);
    return false;
  }
};

// Fetch user orders
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Order[];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

// Fetch user tickets
export const fetchUserTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Ticket[];
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
};

// Fetch single ticket
export const fetchTicket = async (ticketId: string): Promise<Ticket | null> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (ticketSnap.exists()) {
      return {
        ...ticketSnap.data(),
        id: ticketSnap.id
      } as Ticket;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }
};

// Create a new ticket
export const createTicket = async (
  ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  imageFiles?: File[]
): Promise<string> => {
  try {
    // Create the ticket first to get an ID
    const ticketData = {
      ...ticket,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const ticketsRef = collection(db, 'tickets');
    const docRef = await addDoc(ticketsRef, ticketData);
    const ticketId = docRef.id;
    
    // If there are image files, handle them
    if (imageFiles && imageFiles.length > 0) {
      const imageAttachments = [];
      
      // Process each image
      for (const imageFile of imageFiles) {
        // First, save to local cache
        const localCacheKey = await saveImageToLocalCache(imageFile, ticketId);
        
        // Then upload to Firebase Storage
        const storageRef = ref(storage, `tickets/${ticketId}/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Add to attachments array
        imageAttachments.push({
          localCacheKey,
          name: imageFile.name,
          url: downloadURL,
          type: imageFile.type,
          size: imageFile.size,
          uploadedAt: new Date().toISOString()
        });
      }
      
      // Update the ticket with attachment information
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        attachments: imageAttachments,
        updatedAt: serverTimestamp()
      });
    }
    
    return ticketId;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

// Update ticket
export const updateTicket = async (
  ticketId: string,
  updates: Partial<Ticket>,
  newImageFiles?: File[]
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    
    // If there are new image files, process them
    if (newImageFiles && newImageFiles.length > 0) {
      // Get current ticket data to access existing attachments
      const ticketSnap = await getDoc(ticketRef);
      const ticketData = ticketSnap.exists() ? ticketSnap.data() : {};
      const existingAttachments = ticketData.attachments || [];
      
      const newAttachments = [];
      
      // Process each new image
      for (const imageFile of newImageFiles) {
        // Save to local cache
        const localCacheKey = await saveImageToLocalCache(imageFile, ticketId);
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, `tickets/${ticketId}/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Add to new attachments array
        newAttachments.push({
          localCacheKey,
          name: imageFile.name,
          url: downloadURL,
          type: imageFile.type,
          size: imageFile.size,
          uploadedAt: new Date().toISOString()
        });
      }
      
      // Combine existing and new attachments
      const allAttachments = [...existingAttachments, ...newAttachments];
      
      // Update ticket with all attachments and other updates
      await updateDoc(ticketRef, {
        ...updates,
        attachments: allAttachments,
        updatedAt: serverTimestamp()
      });
    } else {
      // No new images, just update the ticket
      await updateDoc(ticketRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

// Add ticket reply
export const addTicketReply = async (
  ticketId: string,
  reply: {
    content: string;
    isFromUser: boolean;
    userId: string;
    userName: string;
  },
  imageFiles?: File[]
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) {
      throw new Error('Ticket not found');
    }
    
    const ticketData = ticketSnap.data();
    const existingReplies = ticketData.replies || [];
    
    const newReply = {
      ...reply,
      createdAt: serverTimestamp(),
      attachments: []
    };
    
    // Process image files if any
    if (imageFiles && imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        // Save to local cache
        const localCacheKey = await saveImageToLocalCache(imageFile, ticketId);
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, `tickets/${ticketId}/replies/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Add to reply attachments
        newReply.attachments.push({
          localCacheKey,
          name: imageFile.name,
          url: downloadURL,
          type: imageFile.type,
          size: imageFile.size,
          uploadedAt: new Date().toISOString()
        });
      }
    }
    
    // Update ticket with new reply
    await updateDoc(ticketRef, {
      replies: [...existingReplies, newReply],
      updatedAt: serverTimestamp(),
      // If reply is from admin/support, update status to in_progress if not already resolved
      ...(reply.isFromUser === false && ticketData.status !== 'resolved' 
        ? { status: 'in_progress' } 
        : {})
    });
  } catch (error) {
    console.error('Error adding ticket reply:', error);
    throw error;
  }
};

// Update user profile with improved functionality
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>,
  profileImage?: File
): Promise<void> => {
  try {
    // Use COLLECTIONS constant instead of hardcoded 'users'
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    // If profile image is provided, upload it
    if (profileImage) {
      const storageRef = ref(storage, `user_avatars/${userId}`);
      await uploadBytes(storageRef, profileImage);
      const photoURL = await getDownloadURL(storageRef);
      updates.photoURL = photoURL;
    }
    
    // Update in Firestore
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Sync with Auth profile if needed
    if (auth.currentUser && (updates.name || updates.photoURL)) {
      try {
        const updateData: any = {};
        if (updates.name) updateData.displayName = updates.name;
        if (updates.photoURL) updateData.photoURL = updates.photoURL;
        
        // No need to await this, it can happen in background
        auth.currentUser.updateProfile(updateData);
      } catch (err) {
        console.warn('Non-critical error updating auth profile:', err);
      }
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Add address to user
export const addUserAddress = async (
  userId: string,
  address: any
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const addresses = userData.addresses || [];
      
      await updateDoc(userRef, {
        addresses: [...addresses, { ...address, id: Date.now().toString() }],
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error adding user address:', error);
    throw error;
  }
};

// Add payment method to user
export const addPaymentMethod = async (
  userId: string,
  paymentMethod: any
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const paymentMethods = userData.paymentMethods || [];
      
      await updateDoc(userRef, {
        paymentMethods: [...paymentMethods, { ...paymentMethod, id: Date.now().toString() }],
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

// Add item to wishlist
export const addToWishlist = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const wishlist = userData.wishlist || [];
      
      // Only add if not already in wishlist
      if (!wishlist.includes(productId)) {
        await updateDoc(userRef, {
          wishlist: [...wishlist, productId],
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const wishlist = userData.wishlist || [];
      
      // Filter out the product ID
      const updatedWishlist = wishlist.filter((id: string) => id !== productId);
      
      await updateDoc(userRef, {
        wishlist: updatedWishlist,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

// Get user wishlist with product details
export const getUserWishlistWithDetails = async (userId: string): Promise<any[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return [];
    }
    
    const userData = userSnap.data();
    const wishlist = userData.wishlist || [];
    
    if (wishlist.length === 0) {
      return [];
    }
    
    // Get product details for each item in wishlist
    const productDetails = [];
    
    for (const productId of wishlist) {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        productDetails.push({
          ...productSnap.data(),
          id: productSnap.id
        });
      }
    }
    
    return productDetails;
  } catch (error) {
    console.error('Error getting wishlist details:', error);
    return [];
  }
};
