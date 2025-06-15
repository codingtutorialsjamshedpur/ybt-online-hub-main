import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, 
  AlertCircle, 
  ShoppingBag, 
  Tag, 
  MessageSquare, 
  CheckCircle, 
  Trash 
} from 'lucide-react';
import UserSidebar from './UserSidebar';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  orderBy, 
  Timestamp,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'ticket' | 'system';
  read: boolean;
  link?: string;
  createdAt: Timestamp;
}

const UserNotifications = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Current date and time
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
    
    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching notifications:', err);
      setError('Failed to load your notifications. Please try again later.');
      setLoading(false);
    });
    
    // Add data to User_Panel collection
    addToUserPanel();
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);
  
  // Add data to User_Panel collection
  const addToUserPanel = async () => {
    if (!currentUser) return;
    
    try {
      // Create or update document in User_Panel collection
      const userPanelRef = doc(db, 'User_Panel', currentUser.uid);
      
      // Update the document with notification data
      await updateDoc(userPanelRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        hasNotifications: true,
        lastUpdated: new Date(),
        // Leave existing data intact
      });
    } catch (err) {
      console.error('Error updating User_Panel collection:', err);
    }
  };
  
  // Get filtered notifications
  const getFilteredNotifications = () => {
    if (selectedFilter === 'all') {
      return notifications;
    }
    
    if (selectedFilter === 'unread') {
      return notifications.filter(notification => !notification.read);
    }
    
    return notifications.filter(notification => notification.type === selectedFilter);
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingId(notificationId);
      const notificationRef = doc(db, 'notifications', notificationId);
      
      // Update notification
      await updateDoc(notificationRef, {
        read: true
      });
      
      setProcessingId(null);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification. Please try again.');
      setProcessingId(null);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      // Get unread notifications
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      // Mark each as read
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, {
          read: true
        });
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to update notifications. Please try again.');
    }
  };
  
  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingId(notificationId);
      const notificationRef = doc(db, 'notifications', notificationId);
      
      // Delete notification
      await deleteDoc(notificationRef);
      
      setProcessingId(null);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification. Please try again.');
      setProcessingId(null);
    }
  };
  
  const handleClearAll = async () => {
    if (!currentUser) return;
    
    try {
      // Get notifications based on current filter
      const notificationsToDelete = getFilteredNotifications();
      
      // Delete each notification
      for (const notification of notificationsToDelete) {
        const notificationRef = doc(db, 'notifications', notification.id);
        await deleteDoc(notificationRef);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError('Failed to clear notifications. Please try again.');
    }
  };
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case 'promotion':
        return <Tag className="h-5 w-5 text-purple-500" />;
      case 'ticket':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Create sample notifications if none exist
  const createSampleNotifications = async () => {
    if (!currentUser) return;
    
    try {
      // Create sample notifications collection
      const notificationsRef = collection(db, 'notifications');
      
      const sampleNotifications = [
        {
          userId: currentUser.uid,
          title: 'Order Confirmed',
          message: 'Your order #ORD-123456 has been confirmed and is being processed.',
          type: 'order',
          read: false,
          link: '/user/orders',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)) // 30 minutes ago
        },
        {
          userId: currentUser.uid,
          title: 'Special Offer',
          message: 'Enjoy 20% off on all digital products this weekend!',
          type: 'promotion',
          read: false,
          link: '/products',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 3)) // 3 hours ago
        },
        {
          userId: currentUser.uid,
          title: 'Ticket Response',
          message: 'Your support ticket #T-789012 has received a response.',
          type: 'ticket',
          read: true,
          link: '/user/tickets',
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 24)) // 1 day ago
        },
        {
          userId: currentUser.uid,
          title: 'Account Update',
          message: 'Your account details have been successfully updated.',
          type: 'system',
          read: true,
          createdAt: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)) // 3 days ago
        }
      ];
      
      // Check if notifications already exist
      const q = query(
        notificationsRef,
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Add sample notifications
        for (const notification of sampleNotifications) {
          await addDoc(notificationsRef, notification);
        }
      }
    } catch (err) {
      console.error('Error creating sample notifications:', err);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-500">Loading your notifications...</p>
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600">
              Manage your alerts and updates
            </p>
          </div>
          
          <div className="flex space-x-2">
            {notifications.some(notification => !notification.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
            
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              >
                Clear {selectedFilter === 'all' ? 'all' : selectedFilter}
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-3 text-sm font-medium ${
                selectedFilter === 'all' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('unread')}
              className={`px-4 py-3 text-sm font-medium ${
                selectedFilter === 'unread' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setSelectedFilter('order')}
              className={`px-4 py-3 text-sm font-medium ${
                selectedFilter === 'order' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setSelectedFilter('promotion')}
              className={`px-4 py-3 text-sm font-medium ${
                selectedFilter === 'promotion' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Promotions
            </button>
            <button
              onClick={() => setSelectedFilter('ticket')}
              className={`px-4 py-3 text-sm font-medium ${
                selectedFilter === 'ticket' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tickets
            </button>
            <button
              onClick={() => setSelectedFilter('system')}
              className={`px-4 py-3 text-sm font-medium ${
                selectedFilter === 'system' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              System
            </button>
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {getFilteredNotifications().length > 0 ? (
            <div className="divide-y divide-gray-200">
              {getFilteredNotifications().map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-5 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                      <div className="flex justify-between">
                        <h3 className={`text-base font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-start space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={processingId === notification.id}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={processingId === notification.id}
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500 mb-4">
                {selectedFilter === 'all'
                  ? 'You don\'t have any notifications yet'
                  : `You don't have any ${selectedFilter === 'unread' ? 'unread' : selectedFilter} notifications`}
              </p>
              {notifications.length === 0 && (
                <button
                  onClick={createSampleNotifications}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Sample Notifications
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserNotifications;
