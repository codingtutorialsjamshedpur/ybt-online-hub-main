import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from './CartContext';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingCartButton = () => {
  const { cartCount } = useCart();

  // Don't show if cart is empty
  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50 md:hidden"
      >
        <Link 
          to="/cart"
          className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors relative"
        >
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingCartButton;
