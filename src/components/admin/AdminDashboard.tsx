import React from 'react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  ShoppingBag, Users, CreditCard, Tag, ShoppingCart, Book, MessageCircle, 
  TrendingUp, ArrowUp, ArrowDown, Clock, AlertCircle, CheckCircle
} from 'lucide-react';

// Color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const CARD_COLORS = {
  users: { bg: 'bg-blue-500', text: 'text-white', icon: 'text-blue-100', trend: 'text-blue-200' },
  products: { bg: 'bg-green-500', text: 'text-white', icon: 'text-green-100', trend: 'text-green-200' },
  sales: { bg: 'bg-violet-500', text: 'text-white', icon: 'text-violet-100', trend: 'text-violet-200' },
  carts: { bg: 'bg-amber-500', text: 'text-white', icon: 'text-amber-100', trend: 'text-amber-200' }
};
const TREND_COLORS = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-gray-500'
};

const AdminDashboard = () => {
  const {
    isLoading,
    error,
    lastUpdated,
    metrics = {
      totalProducts: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalCoupons: 0,
      totalBlogs: 0,
      totalCarts: 0,
      totalContacts: 0,
      totalRevenue: 0,
      activeUsers: 0,
      activeCarts: 0,
      currentMonthOrders: 0,
      currentMonthRevenue: 0,
      popularProducts: [],
      productCategoryData: [],
      monthlySalesData: [],
      orderStatusData: [],
      recentActivities: []
    }
  } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

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

  // Stats cards with real-time data
  const statsCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      trend: '12% From last month',
      trendDirection: 'up',
      icon: <Users className="h-6 w-6" />,
      colorScheme: CARD_COLORS.users,
      type: 'users'
    },
    {
      title: 'Total Products',
      value: metrics.totalProducts,
      trend: '8% From last month',
      trendDirection: 'up',
      icon: <ShoppingBag className="h-6 w-6" />,
      colorScheme: CARD_COLORS.products,
      type: 'products'
    },
    {
      title: 'Total Sales',
      value: `₹${metrics.totalRevenue.toFixed(0)}`,
      trend: '23% From last month',
      trendDirection: 'up',
      icon: <CreditCard className="h-6 w-6" />,
      colorScheme: CARD_COLORS.sales,
      type: 'sales'
    },
    {
      title: 'Active Carts',
      value: metrics.activeCarts || 1,
      trend: '3% From last month',
      trendDirection: 'down',
      icon: <ShoppingCart className="h-6 w-6" />,
      colorScheme: CARD_COLORS.carts,
      type: 'carts'
    }
  ];

  // Calculate growth metrics
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 100, trend: 'positive' };
    const growth = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(growth).toFixed(1),
      trend: growth > 0 ? 'positive' : growth < 0 ? 'negative' : 'neutral'
    };
  };

  // Enhanced stats for current month
  const currentMonthStats = [
    {
      title: 'Orders This Month',
      value: metrics.currentMonthOrders,
      previousValue: Math.round(metrics.totalOrders / 2), // Simplified for demo
      icon: <ShoppingCart className="h-5 w-5 text-blue-500" />
    },
    {
      title: 'Revenue This Month',
      value: `₹${metrics.currentMonthRevenue.toFixed(2)}`,
      previousValue: metrics.totalRevenue / 2, // Simplified for demo
      icon: <CreditCard className="h-5 w-5 text-green-500" />
    },
    {
      title: 'Active Carts',
      value: metrics.activeCarts,
      previousValue: Math.round(metrics.totalCarts / 2), // Simplified for demo
      icon: <ShoppingCart className="h-5 w-5 text-indigo-500" />
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      previousValue: Math.round(metrics.totalUsers / 2), // Simplified for demo
      icon: <Users className="h-5 w-5 text-amber-500" />
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Last updated indicator */}
      <div className="flex justify-end mb-5">
        <div className="text-sm text-gray-500 flex items-center">
          <Clock className="h-4 w-4 mr-1" /> 
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((card, index) => (
          <div key={index} className={`rounded-lg ${card.colorScheme.bg} p-4 shadow-sm`}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-medium ${card.colorScheme.text}`}>{card.title}</h3>
                <div className={`rounded-full p-2 ${card.colorScheme.icon}`}>
                  {card.icon}
                </div>
              </div>
              <p className={`text-3xl font-bold mt-1 ${card.colorScheme.text}`}>{card.value}</p>
              <div className="flex items-center mt-auto pt-2">
                {card.trendDirection === 'up' ? (
                  <ArrowUp className={`h-4 w-4 ${card.colorScheme.trend} mr-1`} />
                ) : (
                  <ArrowDown className={`h-4 w-4 ${card.colorScheme.trend} mr-1`} />
                )}
                <span className={`text-sm ${card.colorScheme.trend}`}>{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Overview Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Sales Overview</h3>
            <div className="inline-flex items-center px-2 py-1 border border-gray-200 rounded-md">
              <span className="text-sm text-gray-600">Last 6 Months</span>
              <svg className="ml-1 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.monthlySalesData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
              <Bar dataKey="sales" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Categories Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Product Categories</h3>
            <div className="inline-flex items-center px-2 py-1 border border-gray-200 rounded-md">
              <span className="text-sm text-gray-600">By Volume</span>
              <svg className="ml-1 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="flex justify-center items-center relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.productCategoryData.length > 0 ? metrics.productCategoryData : [
                    { name: 'eBooks', value: 35 },
                    { name: 'Courses', value: 45 },
                    { name: 'Subscriptions', value: 20 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  <Cell fill="#0088FE" /> {/* Blue */}
                  <Cell fill="#00C49F" /> {/* Green */}
                  <Cell fill="#FFBB28" /> {/* Yellow/Gold */}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>



      {/* Recent Activity & Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Popular Products</h3>
          <div className="space-y-4">
            {(metrics.popularProducts.length > 0 ? metrics.popularProducts : [
              { name: 'Advanced React Course', category: 'Courses', price: '2499.00', sales: 24, image: '' },
              { name: 'JavaScript Essentials', category: 'eBooks', price: '499.00', sales: 18, image: '' },
              { name: 'Web Development Pro', category: 'Subscriptions', price: '999.00', sales: 12, image: '' }
            ]).map((product, index) => (
              <div key={index} className="flex items-center py-3 last:border-0">
                <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center mr-4 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{product.name || 'Unnamed Product'}</h4>
                  <p className="text-xs text-gray-500">{product.category || 'Uncategorized'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{product.price || '0.00'}</p>
                  <p className="text-xs text-gray-500">{product.sales || 0} sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {(metrics.recentActivities.length > 0 ? metrics.recentActivities : [
              { type: 'order', title: 'New Order Placed', details: 'Order #38293 for ₹1,200.00', timestamp: { seconds: Date.now()/1000 } },
              { type: 'user', title: 'New User Registered', details: 'user@example.com joined the platform', timestamp: { seconds: (Date.now()-3600000)/1000 } },
              { type: 'blog', title: 'Blog Post Published', details: 'React Hooks Tutorial has been published', timestamp: { seconds: (Date.now()-7200000)/1000 } }
            ]).map((activity, index) => (
              <div key={index} className="flex items-start py-3 border-b border-gray-100 last:border-0">
                <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center mr-4 ${
                  activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'user' ? 'bg-green-100 text-green-600' :
                  activity.type === 'blog' ? 'bg-purple-100 text-purple-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {activity.type === 'order' ? <CreditCard size={18} /> :
                   activity.type === 'user' ? <Users size={18} /> :
                   activity.type === 'blog' ? <Book size={18} /> :
                   <MessageCircle size={18} />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {activity.timestamp ? 
                      new Date(activity.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.timestamp ? 
                      new Date(activity.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
