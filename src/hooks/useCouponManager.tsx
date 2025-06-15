import { useState, useCallback, useMemo } from 'react';
import { useToast } from '../components/ui/use-toast';

// Define coupon types
export type CouponType = 'fixed' | 'percentage';

// Define coupon interface
export interface Coupon {
  code: string;
  discount: number;
  type: CouponType;
}

// Valid coupons for the application
const VALID_COUPONS: Coupon[] = [
  { code: 'SAVE10', discount: 10, type: 'fixed' },
  { code: 'WELCOME15', discount: 15, type: 'fixed' },
  { code: 'SPECIAL20', discount: 20, type: 'fixed' },
  { code: 'SUMMER25', discount: 25, type: 'percentage' }
];

export const useCouponManager = (subtotal: number = 0) => {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Calculate discount amount based on coupon type
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.discount) / 100;
    }
    
    return appliedCoupon.discount;
  }, [appliedCoupon, subtotal]);

  // Format discount for display
  const formattedDiscount = useMemo(() => {
    if (!appliedCoupon) return '₹0.00';
    
    if (appliedCoupon.type === 'percentage') {
      return `-₹${discountAmount.toFixed(2)} (${appliedCoupon.discount}%)`;
    }
    
    return `-₹${appliedCoupon.discount.toFixed(2)}`;
  }, [appliedCoupon, discountAmount]);

  // Apply coupon handler
  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    
    setIsApplying(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find matching coupon (case insensitive)
      const matchedCoupon = VALID_COUPONS.find(
        c => c.code.toLowerCase() === couponCode.trim().toLowerCase()
      );
      
      if (matchedCoupon) {
        setAppliedCoupon(matchedCoupon);
        setCouponCode('');
        
        // Message based on coupon type
        const message = matchedCoupon.type === 'percentage' 
          ? `${matchedCoupon.discount}% discount applied!` 
          : `₹${matchedCoupon.discount} discount applied!`;
        
        toast({
          title: 'Coupon Applied',
          description: message
        });
      } else {
        toast({
          title: 'Invalid Coupon',
          description: `Coupon "${couponCode}" is not valid. Try SUMMER25 for 25% off.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply coupon. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsApplying(false);
    }
  }, [couponCode, toast]);

  // Remove coupon handler
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    toast({
      title: 'Coupon Removed',
      description: 'Discount has been removed from your order.'
    });
  }, [toast]);

  // Calculate final total after discount
  const finalTotal = useMemo(() => {
    const total = Math.max(0, subtotal - discountAmount);
    return total.toFixed(2);
  }, [subtotal, discountAmount]);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isApplying,
    discountAmount,
    formattedDiscount,
    applyCoupon,
    removeCoupon,
    finalTotal
  };
};
