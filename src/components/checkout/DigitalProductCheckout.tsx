import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Order } from '../../types';
import { addOrder } from '../../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

// Define Razorpay interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface DigitalProductCheckoutProps {
  product: Product;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

const DigitalProductCheckout = ({ product, onClose, onSuccess }: DigitalProductCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const { userData } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: ''
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Initialize Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Create a new order in Firestore
  const createOrder = async () => {
    try {
      // Create a timestamp for the order
      const now = Timestamp.now();
      
      // Prepare the order object
      const orderData: Omit<Order, 'id'> = {
        customer: formData.name,
        customerEmail: formData.email,
        products: JSON.stringify([{
          id: product.id,
          name: product.name,
          quantity: 1
        }]),
        total: product.price,
        date: now,
        status: 'Processing',
        paymentMethod: 'Razorpay',
        createdAt: now,
        updatedAt: now
      };
      
      // Add the order to Firestore
      const newOrderId = await addOrder(orderData);
      setOrderId(newOrderId);
      return newOrderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Handle Razorpay payment
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    setPaymentProcessing(true);
    
    try {
      // Create order in Firestore
      const newOrderId = await createOrder();
      
      // Create Razorpay options
      const options = {
        key: 'rzp_test_your_key_here', // Replace with your actual Razorpay key
        amount: parseFloat(product.price) * 100, // Amount in paise
        currency: 'INR',
        name: 'J-Digital Products',
        description: `Purchase of ${product.name}`,
        order_id: newOrderId, // Use the Firestore order ID
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          product_id: product.id,
          is_digital: product.isDigitalProduct ? 'true' : 'false'
        },
        theme: {
          color: '#3B82F6'
        },
        handler: function (response: any) {
          // Handle successful payment
          handlePaymentSuccess(newOrderId, response);
        }
      };
      
      // Initialize Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (orderId: string, response: any) => {
    setPaymentProcessing(false);
    setPaymentSuccess(true);
    
    if (product.isDigitalProduct && product.downloadLink) {
      setDownloadLink(product.downloadLink);
    }
    
    onSuccess(orderId);
  };

  // Handle download button click
  const handleDownload = () => {
    if (downloadLink) {
      window.open(downloadLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {paymentSuccess ? 'Purchase Complete' : 'Complete Your Purchase'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          {!paymentSuccess ? (
            <>
              <div className="mb-4">
                <div className="flex items-center p-4 mb-4 bg-gray-50 rounded-md">
                  <div className="flex-shrink-0 h-16 w-16 mr-4">
                    <img 
                      className="h-16 w-16 rounded-md object-cover" 
                      src={product.image || product.imageUrl || 'https://via.placeholder.com/64'} 
                      alt={product.name} 
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{product.name}</h3>
                    <p className="text-xl font-bold text-blue-600">{product.price}</p>
                  </div>
                </div>
                
                <form onSubmit={handlePayment}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email*
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">
                      {product.isDigitalProduct 
                        ? 'You will receive a download link after successful payment.'
                        : 'Your order details will be sent to your email after payment.'}
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={paymentProcessing}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
                  >
                    {paymentProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex h-24 w-24 rounded-full bg-green-100 p-4 items-center justify-center">
                  <svg className="h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-bold mb-2">Thank You for Your Purchase!</h3>
              <p className="text-gray-600 mb-6">Your order has been successfully placed.</p>
              
              {product.isDigitalProduct && downloadLink && (
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium mb-2">Your Digital Product is Ready</h4>
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Download Now
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    You can also access your purchase from your account dashboard.
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/products')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Continue Shopping
                </button>
                
                {orderId && (
                  <button
                    onClick={() => navigate(`/account/orders/${orderId}`)}
                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                  >
                    View Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalProductCheckout;
