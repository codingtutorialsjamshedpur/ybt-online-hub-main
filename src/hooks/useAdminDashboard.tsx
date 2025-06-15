import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  Timestamp,
  where,
  orderBy,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/firestore';
import { Product, Order, User, Coupon, Cart, BlogPost, ContactSubmission } from '../types';

// Helper function to format dates
const formatDate = (date: Timestamp): string => {
  return date.toDate().toLocaleDateString('en-US', { month: 'short' });
};

// Helper function to get current month range
const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: Timestamp.fromDate(startOfMonth),
    end: Timestamp.fromDate(endOfMonth)
  };
};

// Helper to get previous months
const getPreviousMonths = (count: number) => {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: month.toLocaleDateString('en-US', { month: 'short' }),
      year: month.getFullYear(),
      month: month.getMonth()
    });
  }
  
  return months;
};

export const useAdminDashboard = () => {
  // State for all entities
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  
  // State for real-time metrics
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Real-time listeners for all collections
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Set up listeners for each collection
      const unsubscribeProducts = onSnapshot(
        collection(db, COLLECTIONS.PRODUCTS),
        (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Product));
          setProducts(productsData);
          setLastUpdated(new Date());
        },
        (err) => setError(`Error loading products: ${err.message}`)
      );
      
      const unsubscribeOrders = onSnapshot(
        collection(db, COLLECTIONS.ORDERS),
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Order));
          setOrders(ordersData);
          setLastUpdated(new Date());
        },
        (err) => setError(`Error loading orders: ${err.message}`)
      );
      
      const unsubscribeUsers = onSnapshot(
        collection(db, COLLECTIONS.USERS),
        (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as User));
          setUsers(usersData);
          setLastUpdated(new Date());
        },
        (err) => setError(`Error loading users: ${err.message}`)
      );
      
      const unsubscribeCoupons = onSnapshot(
        collection(db, COLLECTIONS.COUPONS),
        (snapshot) => {
          const couponsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Coupon));
          setCoupons(couponsData);
          setLastUpdated(new Date());
        },
        (err) => setError(`Error loading coupons: ${err.message}`)
      );
      
      const unsubscribeCarts = onSnapshot(
        collection(db, COLLECTIONS.CART),
        (snapshot) => {
          const cartsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Cart));
          setCarts(cartsData);
          setLastUpdated(new Date());
        },
        (err) => setError(`Error loading carts: ${err.message}`)
      );
      
      const unsubscribeBlogs = onSnapshot(
        collection(db, COLLECTIONS.BLOG),
        (snapshot) => {
          const blogsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as BlogPost));
          setBlogs(blogsData);
          setLastUpdated(new Date());
        },
        (err) => setError(`Error loading blogs: ${err.message}`)
      );
      
      const unsubscribeContacts = onSnapshot(
        collection(db, 'contactSubmissions'),
        (snapshot) => {
          const contactsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ContactSubmission));
          setContacts(contactsData);
          setLastUpdated(new Date());
        },
        (err) => setError(`Error loading contacts: ${err.message}`)
      );
      
      setIsLoading(false);
      
      // Clean up listeners on unmount
      return () => {
        unsubscribeProducts();
        unsubscribeOrders();
        unsubscribeUsers();
        unsubscribeCoupons();
        unsubscribeCarts();
        unsubscribeBlogs();
        unsubscribeContacts();
      };
    } catch (err: any) {
      setError(`Failed to set up listeners: ${err.message}`);
      setIsLoading(false);
    }
  }, []);

  // Calculate derived metrics
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => {
      // Handle totalAmount instead of total which is used in the Order interface
      const total = typeof order.totalAmount === 'string' 
        ? parseFloat(order.totalAmount.replace(/[^0-9.-]+/g, '')) 
        : 0;
      return sum + total;
    }, 0);
    
    const activeUsers = users.filter(user => 
      user.status?.toLowerCase() === 'active').length;
    
    const activeCarts = carts.filter(cart => cart.status === 'active').length;
    
    const popularProducts = [...products]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5);
      
    const currentMonthRange = getCurrentMonthRange();
    
    const currentMonthOrders = orders.filter(order => {
      const orderDate = order.createdAt as Timestamp;
      return orderDate && 
        orderDate.seconds >= currentMonthRange.start.seconds && 
        orderDate.seconds <= currentMonthRange.end.seconds;
    });
    
    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => {
      // Handle totalAmount instead of total
      const total = typeof order.totalAmount === 'string' 
        ? parseFloat(order.totalAmount.replace(/[^0-9.-]+/g, '')) 
        : 0;
      return sum + total;
    }, 0);
    
    // Calculate product categories distribution
    const categories: Record<string, number> = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (categories[category]) {
        categories[category]++;
      } else {
        categories[category] = 1;
      }
    });
    
    const productCategoryData = Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
    
    // Calculate monthly sales data for the last 6 months
    const previousMonths = getPreviousMonths(6);
    const monthlySalesData = previousMonths.map(monthInfo => {
      const startDate = new Date(monthInfo.year, monthInfo.month, 1);
      const endDate = new Date(monthInfo.year, monthInfo.month + 1, 0, 23, 59, 59);
      
      const monthOrders = orders.filter(order => {
        const orderDate = order.createdAt as Timestamp;
        if (!orderDate) return false;
        const date = orderDate.toDate();
        return date >= startDate && date <= endDate;
      });
      
      const sales = monthOrders.reduce((sum, order) => {
        // Handle totalAmount instead of total
        const total = typeof order.totalAmount === 'string' 
          ? parseFloat(order.totalAmount.replace(/[^0-9.-]+/g, '')) 
          : 0;
        return sum + total;
      }, 0);
      
      return {
        name: monthInfo.name,
        sales
      };
    }).reverse();
    
    // Order status distribution
    const orderStatuses: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.status || 'pending';
      if (orderStatuses[status]) {
        orderStatuses[status]++;
      } else {
        orderStatuses[status] = 1;
      }
    });
    
    const orderStatusData = Object.entries(orderStatuses).map(([name, value]) => ({
      name,
      value
    }));
    
    // Recent activities (combined from various collections)
    const recentActivities = [
      ...orders.filter(order => order.createdAt).map(order => ({
        type: 'order',
        id: order.id || '',
        title: `New order #${(order.id || '').substring(0, 6)}`,
        timestamp: order.createdAt as Timestamp,
        details: `${order.status || 'pending'} - ₹${order.totalAmount || '0'}`
      })),
      ...users.filter(user => user.createdAt).map(user => ({
        type: 'user',
        id: user.id || '',
        title: `New user ${user.name || user.email || 'Unknown'}`,
        timestamp: user.createdAt as Timestamp,
        details: `${user.role || 'customer'}`
      })),
      ...blogs.filter(blog => blog.createdAt).map(blog => ({
        type: 'blog',
        id: blog.id || '',
        title: `New blog post: ${blog.title || 'Untitled'}`,
        timestamp: blog.createdAt as Timestamp,
        details: `${blog.status || 'draft'}`
      })),
      ...contacts.filter(contact => contact.createdAt).map(contact => ({
        type: 'contact',
        id: contact.id || '',
        title: `New contact: ${contact.name || 'Unknown'}`,
        timestamp: contact.createdAt as Timestamp,
        details: `${contact.status || 'new'}`
      }))
    ]
    .sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.seconds - a.timestamp.seconds;
    })
    .slice(0, 10);
    
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalCoupons: coupons.length,
      totalBlogs: blogs.length,
      totalCarts: carts.length,
      totalContacts: contacts.length,
      totalRevenue,
      activeUsers,
      activeCarts,
      currentMonthOrders: currentMonthOrders.length,
      currentMonthRevenue,
      popularProducts,
      productCategoryData,
      monthlySalesData,
      orderStatusData,
      recentActivities
    };
  }, [products, orders, users, coupons, carts, blogs, contacts]);

  return {
    isLoading,
    error,
    lastUpdated,
    metrics,
    // Original data for any component that needs it
    products,
    orders,
    users,
    coupons,
    carts,
    blogs,
    contacts
  };
};
