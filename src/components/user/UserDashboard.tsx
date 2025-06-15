import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../components/cart/CartContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  ShoppingBag, 
  User, 
  CreditCard, 
  ShoppingCart, 
  Heart, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Home, 
  TicketIcon, 
  Bell, 
  LogOut, 
  MapPin,
  CreditCard as PaymentIcon,
  HelpCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { fetchUserOrders, fetchUserTickets, getUserWishlistWithDetails } from '../../services/userService';
import { User as UserType, Order, Ticket } from '../../types';
import UserSidebar from './UserSidebar';

// Color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const CARD_COLORS = {
  orders: { bg: 'bg-blue-500', text: 'text-white', icon: 'text-blue-100', trend: 'text-blue-200' },
  cart: { bg: 'bg-green-500', text: 'text-white', icon: 'text-green-100', trend: 'text-green-200' },
  wishlist: { bg: 'bg-violet-500', text: 'text-white', icon: 'text-violet-100', trend: 'text-violet-200' },
  tickets: { bg: 'bg-amber-500', text: 'text-white', icon: 'text-amber-100', trend: 'text-amber-200' }
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { userData, currentUser, loading, logout } = useAuth();
  const { cartCount, refreshCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Current date and time: Sunday, May 25, 2025, 04:35 AM IST
  const currentDate = new Date(2025, 4, 25, 4, 35);
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (currentUser) {
          // Initialize empty arrays as fallbacks in case of errors
          let userOrders = [];
          let userTickets = [];
          let userWishlist = [];
          let notificationsData = [];
          let productRecommendations = [
            { name: 'Tools/Scripts', value: 40 },
            { name: 'Courses', value: 30 },
            { name: 'Templates', value: 20 },
            { name: 'Services', value: 10 }
          ];
          
          try {
            // Fetch user orders from Firestore
            userOrders = await fetchUserOrders(currentUser.uid);
          } catch (orderError) {
            console.error('Error fetching orders:', orderError);
            // Continue with empty orders array
          }
          
          try {
            // Fetch user tickets from Firestore
            userTickets = await fetchUserTickets(currentUser.uid);
          } catch (ticketError) {
            console.error('Error fetching tickets:', ticketError);
            // Continue with empty tickets array
          }
          
          try {
            // Fetch user wishlist items
            userWishlist = await getUserWishlistWithDetails(currentUser.uid);
          } catch (wishlistError) {
            console.error('Error fetching wishlist:', wishlistError);
            // Continue with empty wishlist array
          }
          
          try {
            // Fetch notifications from Firestore
            const notificationsRef = collection(db, 'notifications');
            const notificationsQuery = query(
              notificationsRef, 
              where('userId', '==', currentUser.uid)
            );
            const notificationsSnapshot = await getDocs(notificationsQuery);
            notificationsData = notificationsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (notificationError) {
            console.error('Error fetching notifications:', notificationError);
            // Continue with empty notifications array
          }
          
          try {
            // Get product data for recommendations
            const productsRef = collection(db, 'products');
            const productsSnapshot = await getDocs(productsRef);
            const products = productsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Only process products if we have any
            if (products.length > 0) {
              // Group products by category and count them
              const categoryCounts: {[key: string]: number} = {};
              products.forEach(product => {
                // Type assertion to handle product data from Firestore
                const typedProduct = product as any;
                const category = typedProduct.category || 'Other';
                if (categoryCounts[category]) {
                  categoryCounts[category]++;
                } else {
                  categoryCounts[category] = 1;
                }
              });
              
              // Transform category counts into chart data
              productRecommendations = Object.entries(categoryCounts).map(([name, count]) => ({
                name,
                value: count
              }));
            }
          } catch (productError) {
            console.error('Error fetching products:', productError);
            // Continue with default product recommendations
          }
          
          // Update state with all fetched data
          setOrders(userOrders);
          setTickets(userTickets);
          setWishlistItems(userWishlist);
          setNotifications(notificationsData);
          setRecommendedProducts(productRecommendations);
          
          try {
            // Refresh cart data to ensure it's up to date
            await refreshCart();
          } catch (cartError) {
            console.error('Error refreshing cart:', cartError);
            // Continue without cart refresh
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setDashboardLoading(false);
      }
    };
    
    if (!loading) {
      loadUserData();
    }
  }, [currentUser, loading]);
  
  // The data is now loaded from Firestore in the useEffect
  
  // Loading state
  if (loading || dashboardLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    );
  }
  
  // Stats cards data
  const statsCards = [
    {
      title: 'Total Orders',
      value: orders.length || 0,
      trend: '10% from last month',
      trendDirection: 'up',
      icon: <ShoppingBag className="h-6 w-6" />,
      colorScheme: CARD_COLORS.orders,
      type: 'orders',
      onClick: () => navigate('/user/orders')
    },
    {
      title: 'Items in Cart',
      value: cartCount, // Using the real cart count from CartContext
      trend: 'View Cart',
      trendDirection: 'neutral',
      icon: <ShoppingCart className="h-6 w-6" />,
      colorScheme: CARD_COLORS.cart,
      type: 'cart',
      onClick: () => navigate('/cart')
    },
    {
      title: 'Wishlist Items',
      value: wishlistItems.length,
      trend: 'View Wishlist',
      trendDirection: 'neutral',
      icon: <Heart className="h-6 w-6" />,
      colorScheme: CARD_COLORS.wishlist,
      type: 'wishlist',
      onClick: () => navigate('/user/wishlist')
    },
    {
      title: 'Open Tickets',
      value: tickets.filter(ticket => ticket.status !== 'resolved').length || 0,
      trend: 'View Tickets',
      trendDirection: 'neutral',
      icon: <TicketIcon className="h-6 w-6" />,
      colorScheme: CARD_COLORS.tickets,
      type: 'tickets',
      onClick: () => navigate('/user/tickets')
    }
  ];
  
  // Recent orders data
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userData?.name || 'User'}!</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={card.onClick}
            >
              <div className={`h-2 ${card.colorScheme.bg} w-full`}></div>
              <div className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-full ${card.colorScheme.bg} flex items-center justify-center`}>
                    <span className={card.colorScheme.icon}>{card.icon}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`
                    text-sm
                    ${card.trendDirection === 'up' ? 'text-green-500' : 
                      card.trendDirection === 'down' ? 'text-red-500' : 
                      'text-blue-500 hover:underline'
                    }
                  `}>
                    {card.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <button 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => navigate('/user/orders')}
              >
                View All Orders
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id?.substring(0, 8) || `ORDER-${idx}`}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt ? 
                            (typeof order.createdAt === 'object' && 'seconds' in order.createdAt) ? 
                              new Date(order.createdAt.seconds * 1000).toLocaleDateString() :
                              new Date(order.createdAt as string).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                              order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : 
                              order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}`
                          }>
                            {order.status || 'Processing'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">₹{order.totalAmount || '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => navigate(`/user/tickets/create?orderId=${order.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Report Issue
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        You haven't placed any orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Recommended Products */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recommended Products</h3>
              <button 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => navigate('/products')}
              >
                Browse All Products
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recommendedProducts}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {recommendedProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Ticket Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ticket Overview</h3>
            <div className="flex space-x-2">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                onClick={() => navigate('/user/tickets/create')}
              >
                Create New Ticket
              </button>
              <button 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => navigate('/user/tickets')}
              >
                View All Tickets
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.length > 0 ? (
                  tickets.slice(0, 5).map((ticket, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{ticket.id?.substring(0, 8) || `TICKET-${idx}`}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{ticket.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'}`
                        }>
                          {ticket.status === 'resolved' ? 'Resolved' : 
                           ticket.status === 'in_progress' ? 'In Progress' : 
                           'Open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/user/tickets/${ticket.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      You haven't created any tickets yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Profile Completion */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Profile Completion</h3>
          <div className="flex items-center mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-4">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <span className="text-sm text-gray-600 font-medium">80%</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Complete your profile to enhance your shopping experience.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              onClick={() => navigate('/user/profile')}
            >
              <User size={16} />
              <span>Update Profile</span>
            </button>
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              onClick={() => navigate('/user/addresses')}
            >
              <MapPin size={16} />
              <span>Add Address</span>
            </button>
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              onClick={() => navigate('/user/payment-methods')}
            >
              <PaymentIcon size={16} />
              <span>Add Payment Method</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
