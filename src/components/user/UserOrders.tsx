import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, AlertCircle, Search, Filter, ChevronDown, Package, Truck, Check } from 'lucide-react';
import { fetchUserOrders } from '../../services/userService';
import UserSidebar from './UserSidebar';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const UserOrders = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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
    if (!currentUser) return;
    
    setLoading(true);
    
    let unsubscribe = () => {};
    
    try {
      // Set up real-time listener for orders
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(
        ordersRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      unsubscribe = onSnapshot(ordersQuery, 
        (snapshot) => {
          // Clear any previous errors
          setError('');
          
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersData);
          setFilteredOrders(ordersData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching orders:', err);
          setError('Failed to load your orders. Please try again later.');
          // Don't show the empty state UI when there's an error
          setOrders([]);
          setFilteredOrders([]);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up orders listener:', error);
      setError('Failed to load your orders. Please try again later.');
      setLoading(false);
    }
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);
  
  // Filter orders when search or status filter changes
  useEffect(() => {
    if (!orders.length) return;
    
    let filtered = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id?.toLowerCase().includes(query) || 
        order.orderNumber?.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);
  
  const handleViewOrder = (orderId: string) => {
    // Navigate to order details page (to be implemented)
    navigate(`/user/orders/${orderId}`);
  };
  
  const handleCreateTicket = (orderId: string) => {
    navigate(`/user/tickets/create?orderId=${orderId}`);
  };
  
  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed') {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (statusLower === 'shipped') {
      return <Truck className="h-4 w-4 text-blue-500" />;
    } else {
      return <Package className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed') {
      return 'bg-green-100 text-green-800';
    } else if (statusLower === 'shipped') {
      return 'bg-blue-100 text-blue-800';
    } else if (statusLower === 'processing') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower === 'cancelled') {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
      
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium'
    }).format(date);
  };
  
  // Format currency
  const formatCurrency = (amount: string | number) => {
    if (!amount) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount));
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
          <p className="text-gray-600">
            View and track all your past orders
          </p>
        </div>
        
        {/* Error State - Only show this if there's an error */}
        {error && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="bg-red-50 p-4 border-l-4 border-red-400">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 font-medium">Error Loading Orders</p>
              </div>
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Only show filters and content if there's no error */}
        {!error && (
          <>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="relative">
                  <div className="flex items-center">
                    <Filter className="text-gray-400 h-5 w-5 mr-2" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-2 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Orders List - Only shown if no error */}
        {!error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderNumber || order.id?.substring(0, 8) || `ORDER-${index}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status || 'Processing'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.products?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleCreateTicket(order.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Report Issue
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'You haven\'t placed any orders yet'}
              </p>
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrders;
