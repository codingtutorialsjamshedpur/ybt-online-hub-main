import { serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  fetchDocument,
  fetchCollection,
  fetchDocumentsWhere,
  setDocument,
  updateDocument,
  COLLECTIONS 
} from '../firebase/firestore';
import { User } from '../types';

/**
 * Initialize or update the User_Panel document for a user
 * @param userId The ID of the user
 * @param userData The user data from authentication
 */
export const initializeUserPanel = async (userId: string, userData: any) => {
  try {
    // Initialize collections array to ensure all required collections exist
    const requiredCollections = [
      COLLECTIONS.USER_PANEL,
      COLLECTIONS.ORDERS,
      COLLECTIONS.TICKETS,
      COLLECTIONS.NOTIFICATIONS,
      COLLECTIONS.PRODUCTS,
      COLLECTIONS.CART
    ];
    
    // Check if User_Panel document exists
    const existingUserPanel = await fetchDocument(COLLECTIONS.USER_PANEL, userId);
    
    if (!existingUserPanel) {
      // Create new User_Panel document if it doesn't exist
      await setDocument(COLLECTIONS.USER_PANEL, userId, {
        userId,
        email: userData.email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        phone: userData.phoneNumber || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        preferences: {
          theme: 'light',
          emailNotifications: true,
          smsNotifications: false
        }
      });
      
      console.log('User_Panel document created for user:', userId);
      return true;
    } else {
      // Update the existing User_Panel document with new data
      // Type casting to avoid TypeScript errors
      const typedUserPanel = existingUserPanel as Record<string, any>;
      
      await updateDocument(COLLECTIONS.USER_PANEL, userId, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
        email: userData.email,
        displayName: userData.displayName || typedUserPanel.displayName || '',
        photoURL: userData.photoURL || typedUserPanel.photoURL || '',
        phone: userData.phoneNumber || typedUserPanel.phone || ''
      });
      
      console.log('User_Panel document updated for user:', userId);
      return true;
    }
  } catch (error) {
    console.error('Error initializing User_Panel document:', error);
    return false;
  }
};

/**
 * Get all data from the User_Panel document
 * @param userId The ID of the user
 */
export const getUserPanelData = async (userId: string) => {
  try {
    const userPanel = await fetchDocument(COLLECTIONS.USER_PANEL, userId);
    
    if (userPanel) {
      return userPanel;
    } else {
      console.log('No User_Panel document found for user:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error getting User_Panel data:', error);
    return null;
  }
};

/**
 * Update a specific field in the User_Panel document
 * @param userId The ID of the user
 * @param field The field to update
 * @param value The new value
 */
export const updateUserPanelField = async (userId: string, field: string, value: any) => {
  try {
    // Create update object
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    updateData[field] = value;
    
    await updateDocument(COLLECTIONS.USER_PANEL, userId, updateData);
    console.log(`User_Panel document field '${field}' updated for user:`, userId);
    return true;
  } catch (error) {
    console.error(`Error updating User_Panel field '${field}':`, error);
    return false;
  }
};

/**
 * Add an item to an array field in the User_Panel document
 * @param userId The ID of the user
 * @param field The array field to update
 * @param item The item to add
 */
export const addItemToUserPanelArray = async (userId: string, field: string, item: any) => {
  try {
    const userPanel = await fetchDocument(COLLECTIONS.USER_PANEL, userId);
    
    if (userPanel) {
      const currentArray = userPanel[field] || [];
      currentArray.push(item);
      
      // Update the document
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      updateData[field] = currentArray;
      
      await updateDocument(COLLECTIONS.USER_PANEL, userId, updateData);
      console.log(`Item added to User_Panel field '${field}' for user:`, userId);
      return true;
    } else {
      console.log('No User_Panel document found for user:', userId);
      return false;
    }
  } catch (error) {
    console.error(`Error adding item to User_Panel field '${field}':`, error);
    return false;
  }
};

/**
 * Remove an item from an array field in the User_Panel document
 * @param userId The ID of the user
 * @param field The array field to update
 * @param itemId The ID of the item to remove
 */
export const removeItemFromUserPanelArray = async (userId: string, field: string, itemId: string) => {
  try {
    const userPanel = await fetchDocument(COLLECTIONS.USER_PANEL, userId);
    
    if (userPanel) {
      const currentArray = userPanel[field] || [];
      const updatedArray = currentArray.filter((item: any) => item.id !== itemId);
      
      // Update the document
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      updateData[field] = updatedArray;
      
      await updateDocument(COLLECTIONS.USER_PANEL, userId, updateData);
      console.log(`Item removed from User_Panel field '${field}' for user:`, userId);
      return true;
    } else {
      console.log('No User_Panel document found for user:', userId);
      return false;
    }
  } catch (error) {
    console.error(`Error removing item from User_Panel field '${field}':`, error);
    return false;
  }
};

/**
 * Update an item in an array field in the User_Panel document
 * @param userId The ID of the user
 * @param field The array field to update
 * @param itemId The ID of the item to update
 * @param updatedItem The updated item data
 */
export const updateItemInUserPanelArray = async (userId: string, field: string, itemId: string, updatedItem: any) => {
  try {
    const userPanel = await fetchDocument(COLLECTIONS.USER_PANEL, userId);
    
    if (userPanel) {
      const currentArray = userPanel[field] || [];
      const updatedArray = currentArray.map((item: any) => 
        item.id === itemId ? { ...item, ...updatedItem } : item
      );
      
      // Update the document
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      updateData[field] = updatedArray;
      
      await updateDocument(COLLECTIONS.USER_PANEL, userId, updateData);
      console.log(`Item updated in User_Panel field '${field}' for user:`, userId);
      return true;
    } else {
      console.log('No User_Panel document found for user:', userId);
      return false;
    }
  } catch (error) {
    console.error(`Error updating item in User_Panel field '${field}':`, error);
    return false;
  }
};

/**
 * Update order status
 * @param orderId The ID of the order
 * @param status The new status
 */
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const order = await fetchDocument(COLLECTIONS.ORDERS, orderId);
    
    if (order) {
      await updateDocument(COLLECTIONS.ORDERS, orderId, {
        status,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Order ${orderId} status updated to ${status}`);
      return true;
    }
    
    console.log(`Order ${orderId} not found`);
    return false;
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error);
    return false;
  }
};

/**
 * Update user addresses
 * @param userId The ID of the user
 * @param addresses The new addresses
 */
export const updateUserAddresses = async (userId: string, addresses: any[]) => {
  try {
    const userPanel = await fetchDocument(COLLECTIONS.USER_PANEL, userId);
    
    if (userPanel) {
      await updateDocument(COLLECTIONS.USER_PANEL, userId, {
        addresses,
        updatedAt: serverTimestamp()
      });
      
      console.log(`User ${userId} addresses updated`);
      return true;
    }
    
    console.log(`User_Panel document for user ${userId} not found`);
    return false;
  } catch (error) {
    console.error('Error updating user addresses:', error);
    return false;
  }
};

/**
 * Check if order exists for user
 * @param userId The ID of the user
 * @param orderId The ID of the order
 */
export const checkOrderExists = async (userId: string, orderId: string) => {
  try {
    const order = await fetchDocument(COLLECTIONS.ORDERS, orderId);
    
    if (order && (order as any).userId === userId) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking order exists:', error);
    return false;
  }
};

/**
 * Get user orders
 * @param userId The ID of the user
 */
export const getUserOrders = async (userId: string) => {
  try {
    return await fetchDocumentsWhere(COLLECTIONS.ORDERS, 'userId', '==', userId);
  } catch (error) {
    console.error(`Error getting orders for user ${userId}:`, error);
    return [];
  }
};

/**
 * Get all User_Panel documents (admin function)
 */
export const getAllUserPanels = async () => {
  try {
    return await fetchCollection(COLLECTIONS.USER_PANEL);
  } catch (error) {
    console.error('Error getting all User_Panel documents:', error);
    return [];
  }
};

/**
 * Get User_Panel documents by a specific field value (admin function)
 * @param field The field to query
 * @param value The value to match
 */
export const getUserPanelsByField = async (field: string, value: any) => {
  try {
    return await fetchDocumentsWhere(COLLECTIONS.USER_PANEL, field, '==', value);
  } catch (error) {
    console.error(`Error getting User_Panel documents by field '${field}':`, error);
    return [];
  }
};
