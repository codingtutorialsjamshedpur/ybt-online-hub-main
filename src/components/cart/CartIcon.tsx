import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../../firebase/config';

interface CartIconProps {
  className?: string;
}

// Define color constants
type IconColorState = 'blue' | 'green' | 'red';

const CartIcon: React.FC<CartIconProps> = ({ className }) => {
  const { cartCount, loading, refreshCart } = useCart();
  const [iconColor, setIconColor] = useState<IconColorState>('blue');
  const prevCountRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  
  // Reset color to default after 5 seconds
  const resetColorAfterDelay = () => {
    // Clear any existing timer
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    
    // Set new timer to reset color after 5 seconds
    timerRef.current = window.setTimeout(() => {
      setIconColor('blue');
      timerRef.current = null;
    }, 5000);
  };
  
  // Track cart count changes to update colors
  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      // Product was added
      setIconColor('green');
      resetColorAfterDelay();
    } else if (cartCount < prevCountRef.current && prevCountRef.current > 0) {
      // Product was removed
      setIconColor('red');
      resetColorAfterDelay();
    }
    
    prevCountRef.current = cartCount;
  }, [cartCount]);
  
  // Listen for cart modifications from the admin panel
  useEffect(() => {
    const handleCartModified = (event: Event) => {
      // Get the custom event details
      const customEvent = event as CustomEvent;
      const action = customEvent.detail?.action;
      const userId = customEvent.detail?.userId;
      const currentUserId = auth.currentUser?.uid || 'guest';
      
      // Only update the cart icon if the modified cart belongs to the current user
      if (userId === currentUserId) {
        // Set the icon color based on the action
        if (action === 'delete') {
          setIconColor('red');
          resetColorAfterDelay();
        } else if (action === 'update') {
          setIconColor('green');
          resetColorAfterDelay();
        }
        
        // Refresh cart data
        refreshCart();
      }
    };
    
    // Add event listener for the custom event
    window.addEventListener('cart-modified', handleCartModified);
    
    // Clean up the event listener and any active timer on unmount
    return () => {
      window.removeEventListener('cart-modified', handleCartModified);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [refreshCart]);

  return (
    <Link 
      to="/cart" 
      className={`relative inline-flex items-center justify-center ${className || ''}`}
      aria-label="Shopping Cart"
    >
      <ShoppingCart 
        size={20} 
        className={`${iconColor === 'blue' ? 'text-blue-600' : 
                     iconColor === 'green' ? 'text-green-600' : 
                     'text-red-600'} transition-colors duration-300`} 
      />
      
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`absolute -top-2 -right-2 ${iconColor === 'blue' ? 'bg-blue-600' : 
                         iconColor === 'green' ? 'bg-green-600' : 
                         'bg-red-600'} text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center opacity-90 transition-colors duration-300`}
          >
            {cartCount}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
};

export default CartIcon;
