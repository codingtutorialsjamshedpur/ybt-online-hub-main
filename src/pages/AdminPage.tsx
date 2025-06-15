import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  fetchProducts, addProduct as fbAddProduct, updateProduct as fbUpdateProduct, deleteProduct as fbDeleteProduct,
  fetchOrders, addOrder as fbAddOrder, updateOrder as fbUpdateOrder, deleteOrder as fbDeleteOrder,
  fetchUsers, addUser as fbAddUser, updateUser as fbUpdateUser, deleteUser as fbDeleteUser,
  fetchCoupons, addCoupon as fbAddCoupon, updateCoupon as fbUpdateCoupon, deleteCoupon as fbDeleteCoupon,
  fetchCarts, addCart as fbAddCart, updateCart as fbUpdateCart, deleteCart as fbDeleteCart,
  fetchContactSubmissions
} from '../firebase/firestore';
import { uploadProductImage } from '../firebase/storage';
import AdminBlogManager from '../components/admin/AdminBlogManager';
import AdminContactManager from '../components/admin/AdminContactManager';
import AdminProductManager from '../components/admin/AdminProductManager';
import AdminCartManager from '../components/admin/AdminCartManager';
import AdminOrderManager from '../components/admin/AdminOrderManager';
import AdminCouponManager from '../components/admin/AdminCouponManager';
import AdminUserManager from '../components/admin/AdminUserManager';
import AdminPaymentGatewayManager from '../components/admin/AdminPaymentGatewayManager';
import AdminDashboard from '../components/admin/AdminDashboard';
import { Timestamp } from 'firebase/firestore';
import { User, Product, Order, Coupon, Cart, BlogPost, ContactSubmission as TypedContactSubmission } from '../types';

// Create a compatible contact submission type
type ContactSubmission = Omit<TypedContactSubmission, 'status'> & {
  status?: 'new' | 'in-progress' | 'resolved' | string;
};

// Dashboard chart data
const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 8000 },
  { name: 'May', sales: 7000 },
  { name: 'Jun', sales: 9000 },
];

const productCategoryData = [
  { name: 'eBooks', value: 35 },
  { name: 'Courses', value: 45 },
  { name: 'Subscriptions', value: 20 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Utility function to format dates and handle Firebase Timestamp objects
const formatDate = (date: string | Timestamp | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  try {
    return date.toDate().toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const AdminPage = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // State for Contact Management
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [contactCount, setContactCount] = useState(0);
  
  // State for CRUD operations - Users
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // State for CRUD operations - Products
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // State for CRUD operations - Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // State for CRUD operations - Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  
  // State for CRUD operations - Carts
  const [carts, setCarts] = useState<Cart[]>([]);
  const [currentCart, setCurrentCart] = useState<Cart | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  
  // Function to load all data from Firebase
  const loadAllData = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel
      const [
        productData, 
        orderData, 
        userData, 
        couponData, 
        cartData,
        contactData
      ] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchUsers(),
        fetchCoupons(),
        fetchCarts(),
        fetchContactSubmissions()
      ]);
      
      // Update state with fetched data
      setProducts(productData);
      setOrders(orderData);
      setUsers(userData);
      setCoupons(couponData);
      setCarts(cartData);
      
      // Ensure contact submissions have proper status values
      const typedContacts = contactData.map((contact) => {
        let status: 'new' | 'in-progress' | 'resolved' = 'new';
        if (contact.status === 'in-progress' || contact.status === 'resolved') {
          status = contact.status;
        }
        return {
          ...contact,
          status
        };
      });
      setContactSubmissions(typedContacts);
      setContactCount(contactData.length);
      
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({
        type: 'error', 
        message: 'Failed to load data. Please refresh the page.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Call loadAllData when component mounts
  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-hide notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // If user is not authenticated or not an admin, redirect to the homepage
  if (!userData || userData.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Admin Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">CTJ - Digital Products</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm text-gray-600">Support</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-medium">{userData.name}</span>
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm border border-blue-200">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Dashboard Layout */}
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="mx-2 text-gray-300">|</div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-500">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        {/* Notification display */}
        {notification && (
          <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {notification.message}
          </div>
        )}
        
        {/* Loading indicator */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : (
          <div>
            {/* Card-based Navigation */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {/* Overview Card */}
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'overview' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Overview</span>
                </button>

                {/* Product Management Card */}
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'products' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Product Management</span>
                </button>

                {/* Order Management Card */}
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'orders' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Order Management</span>
                </button>

                {/* User Management Card */}
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'users' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">User Management</span>
                </button>

                {/* Coupon Management Card */}
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'coupons' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Coupon Management</span>
                </button>

                {/* Cart Management Card */}
                <button
                  onClick={() => setActiveTab('carts')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'carts' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Cart Management</span>
                </button>

                {/* Blog Management Card */}
                <button
                  onClick={() => setActiveTab('blog')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'blog' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Blog Management</span>
                </button>

                {/* Contact Management Card */}
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'contact' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'} relative`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {contactCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {contactCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">Contact Management</span>
                </button>
                
                {/* Payment Gateway Card */}
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`flex flex-col items-center py-3 px-6 rounded-md transition-all ${activeTab === 'payment' ? 'bg-blue-100 text-blue-700 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}
                >
                  <div className="text-xl mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Payment Gateway</span>
                </button>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && <AdminDashboard />}

            {/* Product Management Tab */}
            {activeTab === 'products' && (
              <AdminProductManager />
            )}
            
            {/* Order Management Tab */}
            {activeTab === 'orders' && (
              <AdminOrderManager />
            )}
            
            {/* User Management Tab */}
            {activeTab === 'users' && (
              <AdminUserManager />
            )}
            
            {/* Coupon Management Tab */}
            {activeTab === 'coupons' && (
              <AdminCouponManager />
            )}
            
            {/* Cart Management Tab */}
            {activeTab === 'carts' && (
              <AdminCartManager />
            )}
            
            {/* Blog Management Tab */}
            {activeTab === 'blog' && (
              <AdminBlogManager />
            )}
            
            {/* Contact Management Tab */}
            {activeTab === 'contact' && (
              <AdminContactManager />
            )}
            
            {/* Payment Gateway Management Tab */}
            {activeTab === 'payment' && (
              <AdminPaymentGatewayManager />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
