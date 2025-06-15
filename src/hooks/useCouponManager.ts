import { useState, useEffect, useCallback } from 'react';
import { fetchCollection } from '../firebase/firestore';
import { Coupon } from '../types';
import { useToast } from '../components/ui/use-toast';

interface UseCouponManagerResult {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: Coupon | null;
  isApplying: boolean;
  formattedDiscount: string;
  discountAmount: number;
  finalTotal: number;
  applyCoupon: () => Promise<void>;
  removeCoupon: () => void;
  validateCoupon: (code: string) => Promise<Coupon | null>;
}

export const useCouponManager = (subtotal: number): UseCouponManagerResult => {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(subtotal);

  // Update final total when subtotal or discount changes
  useEffect(() => {
    if (subtotal > 0) {
      setFinalTotal(subtotal - discountAmount);
    } else {
      setFinalTotal(0);
    }
  }, [subtotal, discountAmount]);

  // Validate coupon against database
  const validateCoupon = useCallback(async (code: string): Promise<Coupon | null> => {
    if (!code) return null;

    try {
      // Fetch coupons from Firestore
      const coupons = await fetchCollection<Coupon>('coupons');
      
      // Find coupon by code (case insensitive)
      const coupon = coupons.find(c => 
        c.code.toLowerCase() === code.toLowerCase() && 
        c.status === 'Active'
      );
      
      if (!coupon) {
        return null;
      }
      
      // Check if coupon is still valid
      const now = new Date();
      const validFrom = typeof coupon.validFrom === 'string' 
        ? new Date(coupon.validFrom) 
        : coupon.validFrom.toDate();
      
      const validUntil = typeof coupon.validUntil === 'string' 
        ? new Date(coupon.validUntil) 
        : coupon.validUntil.toDate();
      
      if (now < validFrom || now > validUntil) {
        return null;
      }
      
      // Check usage limit if applicable
      if (coupon.usageLimit && coupon.usageCount && coupon.usageCount >= coupon.usageLimit) {
        return null;
      }
      
      // Check minimum purchase if applicable
      if (coupon.minimumPurchase) {
        const minPurchase = parseFloat(coupon.minimumPurchase);
        if (subtotal < minPurchase) {
          return null;
        }
      }
      
      return coupon;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return null;
    }
  }, [subtotal]);

  // Apply coupon
  const applyCoupon = useCallback(async () => {
    if (!couponCode) {
      toast({
        title: "No coupon code",
        description: "Please enter a coupon code.",
        variant: "destructive"
      });
      return;
    }
    
    setIsApplying(true);
    
    try {
      const validCoupon = await validateCoupon(couponCode);
      
      if (!validCoupon) {
        toast({
          title: "Invalid coupon",
          description: "This coupon code is invalid or expired.",
          variant: "destructive"
        });
        setIsApplying(false);
        return;
      }
      
      // Calculate discount
      let discount = 0;
      if (validCoupon.type === 'Percentage') {
        discount = (subtotal * parseFloat(validCoupon.discount)) / 100;
      } else {
        // Fixed amount
        discount = parseFloat(validCoupon.discount);
      }
      
      // Apply discount
      setAppliedCoupon(validCoupon);
      setDiscountAmount(discount);
      
      toast({
        title: "Coupon applied",
        description: `Discount of ₹${discount.toFixed(2)} has been applied.`
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Failed to apply coupon",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  }, [couponCode, subtotal, toast, validateCoupon]);

  // Remove coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscountAmount(0);
    
    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order."
    });
  }, [toast]);

  // Format discount for display
  const formattedDiscount = discountAmount > 0 ? `-₹${discountAmount.toFixed(2)}` : '₹0.00';

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isApplying,
    formattedDiscount,
    discountAmount,
    finalTotal,
    applyCoupon,
    removeCoupon,
    validateCoupon
  };
};

export default useCouponManager;
