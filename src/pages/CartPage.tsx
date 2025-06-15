import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, CreditCard, Tag, ShoppingBag, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';

// UI Components
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import Breadcrumb from '../components/Breadcrumb';

// Custom components and hooks
import { useCart } from '../components/cart/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCouponManager } from '../hooks/useCouponManager';
import PaymentGatewayCheckout from '../components/checkout/PaymentGatewayCheckout';

// Firebase services
import { addOrder } from '../firebase/firestore';

// Types
import { CartItem } from '../types';
import { ShippingAddress, getUserShippingAddress } from '../types/address';

// Using try-catch for Helmet import to prevent errors
let Helmet: any;
try {
  Helmet = require('react-helmet-async').Helmet;
} catch (error) {
  // Fallback if Helmet is not available
  Helmet = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

const CartPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, loading, updateQuantity, removeItem, clearCart, refreshCart } = useCart();
  const { userData } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // Get cart subtotal for coupon calculation
  const getCartSubtotal = useCallback(() => {
    if (!cart?.items || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => {
      const price = typeof item.price === 'string' ? 
        parseFloat(item.price.replace(/[^\d.]/g, '')) : 
        parseFloat(String(item.price));
      return total + (price * item.quantity);
    }, 0);
  }, [cart?.items]);
  
  // Use our custom coupon manager hook
  const { 
    couponCode, 
    setCouponCode, 
    appliedCoupon, 
    isApplying: applyingCoupon, 
    formattedDiscount,
    applyCoupon: handleApplyCoupon,
    removeCoupon: handleRemoveCoupon,
    finalTotal
  } = useCouponManager(getCartSubtotal());

  // Effect to load user shipping address
  useEffect(() => {
    if (userData) {
      const shippingAddress = getUserShippingAddress(userData);
      setUserShippingAddress(shippingAddress);
      
      // Log the extracted address for debugging
      console.log('Extracted shipping address:', shippingAddress);
    }
  }, [userData]);

  // Effect to handle initial loading and potential errors
  useEffect(() => {
    // Only try to refresh if we don't already have cart items
    if (!loading && (!cart || !cart.items || cart.items.length === 0)) {
      const initCart = async () => {
        try {
          // Use a local variable to track if the component is still mounted
          let isMounted = true;
          await refreshCart();
          // Only update state if still mounted
          if (isMounted) {
            setError(null);
          }
        } catch (err) {
          console.error('Error initializing cart:', err);
          setError('Failed to load cart data. Please refresh the page.');
        }
      };
      
      initCart();
    }
    // This should only run once on mount, not on every refreshCart change
  }, [loading, cart, refreshCart]);

  // State for payment methods - always using PhonePe as the only option
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'phonepe'>('phonepe');
  const [userShippingAddress, setUserShippingAddress] = useState<ShippingAddress | undefined>();
  
  // Proceed to checkout handler
  const handleProceedToCheckout = useCallback(async () => {
    if (!userData) {
      toast({
        title: "Login Required",
        description: "Please login to continue with checkout",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    if (!cart || !cart.items || cart.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add some products to continue.",
        variant: "destructive"
      });
      return;
    }
    
    // Proceed to checkout step
    setCheckoutStep('checkout');
    window.scrollTo(0, 0);
  }, [userData, cart, navigate, toast]);
    
  // Place order handler
  const handlePlaceOrder = async () => {
    if (!userData) {
      toast({
        title: "Login Required",
        description: "Please login to continue with checkout",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setProcessingCheckout(true);
      setError(null);
      
      // Prepare order data
      const orderData = {
        userId: userData.id,
        items: cart?.items || [],
        total: typeof finalTotal === 'number' ? finalTotal : Number(finalTotal), // Use the coupon-adjusted total
        subtotal: getCartSubtotal(),
        discount: appliedCoupon ? (getCartSubtotal() - (typeof finalTotal === 'number' ? finalTotal : Number(finalTotal))) : 0,
        couponCode: appliedCoupon?.code || '',
        shippingInfo: userData.shippingAddress || {
          name: userData.displayName || '',
          address: '',
          city: '',
          postalCode: '',
          phone: ''
        },
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: selectedPaymentMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add order to Firestore
      const orderId = await addOrder(orderData);
      
      // Save order ID for confirmation screen
      setOrderId(orderId);
      
      // If payment method is COD, complete order now
      if (selectedPaymentMethod === 'cod') {
        // Clear cart after successful order
        await clearCart();
        
        // Set checkout step to confirmation
        setCheckoutStep('confirmation');
        
        toast({
          title: "Order Placed Successfully",
          description: "Your order has been placed and will be processed shortly.",
        });
      }
      // For online payment, keep in checkout step to show payment options
      // PhonePe checkout is rendered conditionally in the JSX
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place your order. Please try again.');
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingCheckout(false);
    }
  };
  
  // Handle payment success
  const handlePaymentSuccess = useCallback(async (paymentData: any) => {
    // Payment successful, show confirmation
    setCheckoutStep('confirmation');
    window.scrollTo(0, 0);
    
    // Clear cart after successful payment
    await clearCart();
    
    toast({
      title: "Payment Successful",
      description: "Your payment was processed successfully. Your order is confirmed!"
    });
  }, [clearCart, toast]);
  
  // Handle payment error
  const handlePaymentError = useCallback((error: any) => {
    console.error('Payment error:', error);
    setProcessingCheckout(false);
    
    toast({
      title: "Payment Failed",
      description: error?.message || "There was an error processing your payment. Please try again.",
      variant: "destructive"
    });
  }, [toast]);

  // Continue shopping handler
  const handleContinueShopping = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  // Clear cart handler
  const handleClearCart = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart."
      });
    }
  }, [clearCart, toast]);

  // Increment quantity handler
  const handleIncrement = useCallback((item: CartItem) => {
    updateQuantity(item.id, item.quantity + 1);
  }, [updateQuantity]);

  // Decrement quantity handler
  const handleDecrement = useCallback((item: CartItem) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  }, [updateQuantity]);

  // Remove item handler
  const handleRemoveItem = useCallback((itemId: string) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      removeItem(itemId);
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart."
      });
    }
  }, [removeItem, toast]);

  // Calculate total amount - now using the finalTotal from useCouponManager
  const calculateTotal = useCallback((): string => {
    // Ensure finalTotal is a number before using toFixed
    if (typeof finalTotal === 'number') {
      return finalTotal.toFixed(2);
    } else if (typeof finalTotal === 'string') {
      // Try to parse string to number
      const parsedTotal = parseFloat(finalTotal);
      return isNaN(parsedTotal) ? getCartSubtotal().toFixed(2) : parsedTotal.toFixed(2);
    } else {
      // Fallback to cart subtotal if finalTotal is undefined or another type
      const subtotal = getCartSubtotal();
      return subtotal.toFixed(2);
    }
  }, [finalTotal, getCartSubtotal]);

  // Memoize cart calculations to prevent unnecessary re-renders
  const cartTotal = useMemo(() => {
    return cart?.items ? calculateTotal() : "0.00";
  }, [cart?.items, calculateTotal]);

  // Cart items for payment gateway checkout
  const checkoutItems = useMemo(() => {
    if (!cart?.items) return [];
    
    return cart.items.map(item => ({
      id: item.id,
      name: item.name,
      price: parseFloat(typeof item.price === 'string' ? 
        item.price.replace(/[^\d.]/g, '') : 
        item.price as string),
      quantity: item.quantity
    }));
  }, [cart?.items]);

  return (
    <div className="min-h-screen bg-gray-50">
      {Helmet && (
        <Helmet>
          <title>Your Cart | YBT Store</title>
        </Helmet>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Home', path: '/' },
            { label: 'Cart', path: '/cart' }
          ]}
        />
        
        <h1 className="text-3xl font-bold mb-8">
          {checkoutStep === 'cart' ? 'Your Cart' : 
           checkoutStep === 'checkout' ? 'Checkout' : 
           'Order Confirmation'}
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-96" />
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
            <Button 
              onClick={handleContinueShopping}
              className="bg-[#1A3C5E] hover:bg-[#2D4E6F]"
              type="button"
            >
              Continue Shopping
            </Button>
          </div>
        ) : checkoutStep === 'cart' ? (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart items (left column on desktop) */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Shopping Cart</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleClearCart}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Clear Cart
                  </Button>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cart?.items?.map((item, index) => (
                    <div key={index} className="p-6 flex flex-col md:flex-row gap-4">
                      {/* Product image */}
                      <div className="flex-shrink-0">
                        <img 
                          src={item.image || '/placeholder-product.jpg'} 
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      </div>
                      
                      {/* Product details */}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <h3 className="text-base font-medium">{item.name}</h3>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-500"
                            onClick={() => handleRemoveItem(item.id)}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDecrement(item)}
                              disabled={item.quantity <= 1}
                              type="button"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleIncrement(item)}
                              type="button"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="font-medium">
                            ₹{typeof item.price === 'string' ? 
                              parseFloat(item.price.replace(/[^\d.]/g, '')).toFixed(2) : 
                              parseFloat(item.price as string).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Order summary (right column on desktop) */}
            <div>
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Order Summary</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Coupon Code */}
                  <div>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              {appliedCoupon.code} ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.discount}%` : `₹${appliedCoupon.discount}`} off)
                            </p>
                            <p className="text-xs text-green-600">Coupon applied successfully!</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-gray-500 hover:text-red-500"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Coupon Code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || applyingCoupon}
                          type="button"
                        >
                          {applyingCoupon ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : 'Apply'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Summary details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{getCartSubtotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">
                        {appliedCoupon ? formattedDiscount : "₹0.00"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">₹0.00</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">₹0.00</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{cartTotal}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-[#1A3C5E] hover:bg-[#2D4E6F]"
                    onClick={handleProceedToCheckout}
                    type="button"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" /> Proceed to Checkout
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : checkoutStep === 'checkout' ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div>
              <Card className="mb-4">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                  
                  {userShippingAddress ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{userShippingAddress.name || userData?.displayName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{userShippingAddress.phone || userData?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{userShippingAddress.address || 'Not provided'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-500">City</p>
                          <p className="font-medium">{userShippingAddress.city && userShippingAddress.city !== 'Not extracted' ? userShippingAddress.city : 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Postal Code</p>
                          <p className="font-medium">{userShippingAddress.postalCode && userShippingAddress.postalCode !== 'Not extracted' ? userShippingAddress.postalCode : 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 rounded-md text-yellow-800 text-sm">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span className="font-medium">Missing Address</span>
                      </div>
                      <p>Please add your shipping address in your account settings.</p>
                      <Button 
                        size="sm" 
                        className="mt-2" 
                        variant="outline"
                        onClick={() => navigate('/user/address')}
                        type="button"
                      >
                        Add Address
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Payment Method</h3>
                
                <div className="space-y-3">                    
                  <div className="border rounded-md p-3 flex items-center border-blue-500 bg-blue-50">
                    <div className="h-5 w-5 rounded-full border border-gray-300 mr-3 flex-shrink-0 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="flex-grow flex items-center">
                      <div className="w-8 h-8 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88"><path d="M17.89 0h87.1c9.87 0 17.89 8.02 17.89 17.89v87.1c0 9.87-8.02 17.89-17.89 17.89h-87.1C8.02 122.88 0 114.86 0 104.99v-87.1C0 8.02 8.02 0 17.89 0z" fill="#5f259f"/><path d="M94.4 51.19H28.48c-3.3 0-5.97 2.42-5.97 5.4v9.8h77.86v-9.8c0-2.98-2.67-5.4-5.97-5.4zM28.48 71.69v15.7h9.93V71.69h-9.93zm28.54 0v15.7h9.93V71.69h-9.93zm28.55 0v15.7h9.93V71.69h-9.93zm14.8-33.74v33.74h14.82V37.95H100.37z" fill="#fff"/></svg>
                      </div>
                      <div>
                        <p className="font-medium">PhonePe</p>
                        <p className="text-sm text-gray-500">UPI, Cards, Netbanking & more</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                  <p className="font-medium text-blue-800 mb-1">PhonePe Secure Payment</p>
                  <p className="text-blue-700">You'll be redirected to PhonePe's secure payment gateway after placing your order.</p>
                </div>
                
                <Button 
                  onClick={handlePlaceOrder}
                  className="w-full mt-6 bg-[#1A3C5E] hover:bg-[#2D4E6F]"
                  disabled={processingCheckout || (!userShippingAddress || !userShippingAddress.address)}
                  type="button"
                >
                  {processingCheckout ? (
                    <span className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span>Continue to Payment</span>
                  )}
                </Button>
              </Card>
              
              {/* Show PhonePe payment component after order is created */}
              {orderId && (
                <div className="mt-4">
                  <PaymentGatewayCheckout 
                    orderId={orderId}
                    amount={typeof finalTotal === 'number' ? finalTotal : Number(finalTotal)}
                    items={cart?.items || []}
                    shippingInfo={userShippingAddress}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </div>
              )}
            </div>

            {/* Order summary (right column) */}
            <div>
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Order Summary</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  {cart?.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded bg-gray-200 flex-shrink-0 mr-3 overflow-hidden">
                          <img 
                            src={item.image || '/placeholder-product.jpg'} 
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">{item.name}</h3>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        ₹{(typeof item.price === 'string' ? 
                          parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity : 
                          parseFloat(String(item.price)) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₹{getCartSubtotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">
                        {appliedCoupon ? formattedDiscount : "₹0.00"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">₹0.00</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">₹0.00</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{(typeof finalTotal === 'number' ? finalTotal : Number(finalTotal)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Button 
                variant="outline"
                onClick={() => setCheckoutStep('cart')}
                className="w-full mt-4"
                type="button"
              >
                Back to Cart
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Order Confirmed!</h2>
            <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been confirmed.</p>
            <div className="max-w-md mx-auto">
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold mb-2">Order Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-medium">{orderId || `YBT${Math.floor(Math.random() * 100000)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium">PhonePe</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-medium">₹{cartTotal}</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleContinueShopping}
                className="bg-[#1A3C5E] hover:bg-[#2D4E6F]"
                type="button"
              >
                <ShoppingBag className="h-4 w-4 mr-2" /> Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
