import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  User, 
  Clock, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  CreditCard, 
  TicketIcon, 
  LogOut, 
  Bell, 
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface UserSidebarProps {
  currentDate: string;
  currentTime: string;
}

const UserSidebar = ({ currentDate, currentTime }: UserSidebarProps) => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Fetch notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef, 
          where('userId', '==', currentUser.uid),
          where('read', '==', false),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        setNotificationCount(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
    // Set up a timer to periodically check for new notifications
    const intervalId = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [currentUser]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const menuItems = [
    { 
      icon: <User size={20} />, 
      label: 'My Account', 
      path: '/user/profile',
      notifications: 0
    },
    { 
      icon: <ShoppingBag size={20} />, 
      label: 'Order History', 
      path: '/user/orders',
      notifications: 0
    },
    { 
      icon: <Heart size={20} />, 
      label: 'Wishlist', 
      path: '/user/wishlist',
      notifications: 0
    },
    { 
      icon: <MapPin size={20} />, 
      label: 'Saved Addresses', 
      path: '/user/addresses',
      notifications: 0
    },
    { 
      icon: <CreditCard size={20} />, 
      label: 'Payment Methods', 
      path: '/user/payment-methods',
      notifications: 0
    },
    { 
      icon: <TicketIcon size={20} />, 
      label: 'Tickets', 
      path: '/user/tickets',
      notifications: 1 // Example ticket update notification
    },
  ];
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button 
          onClick={toggleMobileSidebar}
          className="p-2 rounded-md bg-white shadow-md text-gray-700"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Sidebar for larger screens */}
      <div 
        className={`
          fixed lg:relative 
          h-full bg-gray-100 shadow-md 
          transition-all duration-300 ease-in-out
          z-40
          ${isCollapsed ? 'w-20' : 'w-64'} 
          ${isMobileOpen ? 'left-0' : '-left-64 lg:left-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Date and time */}
          <div className="p-4 border-b border-gray-200">
            <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-medium text-gray-800">{currentDate}</p>
                  <p className="text-xs text-gray-600">{currentTime}</p>
                </div>
              )}
              <button 
                onClick={toggleSidebar}
                className="p-1 rounded-md hover:bg-gray-200 text-gray-500 hidden lg:block"
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Menu items */}
          <div className="flex-1 py-6">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                    }}
                    className={`
                      flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700
                      ${location.pathname === item.path ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : ''}
                    `}
                  >
                    <div className="relative">
                      {item.icon}
                      {item.notifications > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                    {!isCollapsed && item.notifications > 0 && (
                      <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.notifications}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Notifications */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className={`
              flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-700
              p-3 rounded-md cursor-pointer
            `}>
              <div className="relative">
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">{notificationCount}</span>
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="ml-3">Notifications</span>
              )}
            </div>
          </div>
          
          {/* Logout button */}
          <div className="px-4 py-3 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className={`
                flex items-center text-gray-700 hover:bg-red-50 hover:text-red-700
                p-3 rounded-md w-full
              `}
            >
              <LogOut size={20} />
              {!isCollapsed && (
                <span className="ml-3">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile menu */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}
    </>
  );
};

export default UserSidebar;
