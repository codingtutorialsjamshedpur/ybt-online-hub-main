// Coupon utilities for cart management

// Valid coupon codes with their respective discount information
export interface CouponInfo {
  code: string;
  discount: number;
  type: 'fixed' | 'percentage';
  description: string;
}

// List of valid coupons for the application
export const validCoupons: CouponInfo[] = [
  { 
    code: "SAVE10", 
    discount: 10, 
    type: 'fixed',
    description: '₹10 off your order'
  },
  { 
    code: "WELCOME15", 
    discount: 15, 
    type: 'fixed',
    description: '₹15 off your order'
  },
  { 
    code: "SPECIAL20", 
    discount: 20, 
    type: 'fixed',
    description: '₹20 off your order'
  },
  { 
    code: "SUMMER25", 
    discount: 25, 
    type: 'percentage',
    description: '25% off your order'
  }
];

/**
 * Validates a coupon code
 * @param code The coupon code to validate
 * @returns The coupon info if valid, null otherwise
 */
export const validateCoupon = (code: string): CouponInfo | null => {
  const trimmedCode = code.trim();
  
  return validCoupons.find(
    coupon => coupon.code.toLowerCase() === trimmedCode.toLowerCase()
  ) || null;
};

/**
 * Calculates the discount amount based on the coupon and subtotal
 * @param coupon The coupon to apply
 * @param subtotal The cart subtotal
 * @returns The discount amount
 */
export const calculateDiscount = (coupon: CouponInfo, subtotal: number): number => {
  if (coupon.type === 'percentage') {
    return subtotal * (coupon.discount / 100);
  }
  return coupon.discount;
};

/**
 * Formats the discount for display
 * @param coupon The applied coupon
 * @param subtotal The cart subtotal
 * @returns Formatted discount string
 */
export const formatDiscount = (coupon: CouponInfo, subtotal: number): string => {
  const discountAmount = calculateDiscount(coupon, subtotal);
  
  if (coupon.type === 'percentage') {
    return `-₹${discountAmount.toFixed(2)} (${coupon.discount}%)`;
  }
  
  return `-₹${discountAmount.toFixed(2)}`;
};
