import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/firestore';
import { Cart, CartItem, Product } from '../../types';
import { useToast } from '../ui/use-toast';

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  cartTotal: string;
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, change: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Calculate derived states
  const cartCount = cart?.items?.reduce((count, item) => count + item.quantity, 0) || 0;
  const cartTotal = cart?.totalAmount || '0';

  // Helper function to calculate total cart amount
  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((total, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace(/[^\d.]/g, '')) 
        : parseFloat(item.price as string);
      
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  // Use real-time listener for user's active cart
  const setupCartListener = () => {
    setLoading(true);
    const userId = auth.currentUser ? auth.currentUser.uid : 'guest';
    const cartsRef = collection(db, COLLECTIONS.CART);
    const cartQuery = query(cartsRef, where('userId', '==', userId), where('status', '==', 'active'));
    
    return onSnapshot(cartQuery, (snapshot) => {
      if (!snapshot.empty) {
        const cartDoc = snapshot.docs[0];
        const cartData = cartDoc.data() as Cart;
        setCart({
          id: cartDoc.id,
          ...cartData
        });
      } else {
        setCart(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error in cart listener:', error);
      toast({
        title: "Error",
        description: "There was a problem with the cart connection. Please refresh the page.",
        variant: "destructive"
      });
      setLoading(false);
    });
  };
  
  // For backwards compatibility - implements the refreshCart function that's needed by CartIcon
  const fetchCart = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : 'guest';
      const cartsRef = collection(db, COLLECTIONS.CART);
      const cartQuery = query(cartsRef, where('userId', '==', userId), where('status', '==', 'active'));
      const cartSnapshot = await getDocs(cartQuery);
      
      if (!cartSnapshot.empty) {
        const cartDoc = cartSnapshot.docs[0];
        const cartData = cartDoc.data() as Cart;
        setCart({
          id: cartDoc.id,
          ...cartData
        });
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: "Error",
        description: "There was a problem loading your cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Implementation of refreshCart for CartIcon component is at the end of this file

  // Setup real-time cart listener
  useEffect(() => {
    // Setup cart listener
    const unsubscribeCart = setupCartListener();
    
    // Listen for auth state changes to refresh cart listener
    const unsubscribeAuth = auth.onAuthStateChanged(() => {
      // Detach previous listener and setup a new one for the new user
      if (unsubscribeCart) unsubscribeCart();
      setupCartListener();
    });
    
    // Cleanup both listeners on unmount
    return () => {
      if (unsubscribeCart) unsubscribeCart();
      unsubscribeAuth();
    };
  }, []);

  // Add product to cart
  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      setLoading(true);
      const userId = auth.currentUser ? auth.currentUser.uid : 'guest';
      const cartsRef = collection(db, COLLECTIONS.CART);
      
      // Check if cart already exists
      let cartId;
      let existingItems: CartItem[] = [];
      
      if (cart && cart.id) {
        // Update existing cart
        cartId = cart.id;
        existingItems = [...(cart.items || [])];
        
        // Check if item already exists in cart
        const existingItemIndex = existingItems.findIndex(item => item.productId === product.id);
        
        if (existingItemIndex >= 0) {
          // Update quantity if product already in cart
          existingItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item to cart
          existingItems.push({
            productId: product.id,
            name: product.title || product.name,
            price: product.price,
            image: product.imageUrl || product.image,
            quantity: quantity
          });
        }
        
        // Update the cart document
        await updateDoc(doc(db, COLLECTIONS.CART, cartId), {
          items: existingItems,
          updatedAt: Timestamp.now(),
          totalAmount: calculateTotal(existingItems)
        });
      } else {
        // Create a new cart
        const newCart = {
          userId: userId,
          status: 'active',
          items: [{
            productId: product.id,
            name: product.title || product.name,
            price: product.price,
            image: product.imageUrl || product.image,
            quantity: quantity
          }],
          totalAmount: product.price,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const newCartRef = await addDoc(cartsRef, newCart);
        cartId = newCartRef.id;
      }
      
      // Refresh cart
      await fetchCart();
      
      // Show success notification
      toast({
        title: "Added to cart!",
        description: `${product.title || product.name} has been added to your cart.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "There was a problem adding this item to your cart.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: string, change: number) => {
    if (!cart || !cart.id) return;
    
    try {
      setLoading(true);
      const updatedItems = [...(cart.items || [])];
      const itemIndex = updatedItems.findIndex(item => item.productId === productId);
      
      if (itemIndex === -1) return;
      
      const newQuantity = updatedItems[itemIndex].quantity + change;
      
      // Remove item if quantity is 0
      if (newQuantity <= 0) {
        updatedItems.splice(itemIndex, 1);
      } else {
        updatedItems[itemIndex].quantity = newQuantity;
      }
      
      // Calculate new total
      const totalAmount = calculateTotal(updatedItems);
      
      // Update Firestore
      await updateDoc(doc(db, COLLECTIONS.CART, cart.id), {
        items: updatedItems,
        totalAmount,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setCart(prevCart => {
        if (!prevCart) return null;
        return {
          ...prevCart,
          items: updatedItems,
          totalAmount
        };
      });
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Error",
        description: "There was a problem updating your cart.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (productId: string) => {
    if (!cart || !cart.id) return;
    
    try {
      setLoading(true);
      const updatedItems = cart.items.filter(item => item.productId !== productId);
      
      // Calculate new total
      const totalAmount = calculateTotal(updatedItems);
      
      // Update Firestore
      await updateDoc(doc(db, COLLECTIONS.CART, cart.id), {
        items: updatedItems,
        totalAmount,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setCart(prevCart => {
        if (!prevCart) return null;
        return {
          ...prevCart,
          items: updatedItems,
          totalAmount
        };
      });
      
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      toast({
        title: "Error",
        description: "There was a problem removing the item from your cart.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!cart || !cart.id) return;
    
    try {
      setLoading(true);
      
      // Update Firestore - we keep the cart but empty the items
      await updateDoc(doc(db, COLLECTIONS.CART, cart.id), {
        items: [],
        totalAmount: "0",
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setCart(prevCart => {
        if (!prevCart) return null;
        return {
          ...prevCart,
          items: [],
          totalAmount: "0"
        };
      });
      
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "There was a problem clearing your cart.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh cart data
  const refreshCart = async () => {
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartTotal,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
