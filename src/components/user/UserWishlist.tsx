import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, Trash, ShoppingCart, AlertCircle, Search } from 'lucide-react';
import UserSidebar from './UserSidebar';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  arrayRemove, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getUserWishlistWithDetails, removeFromWishlist } from '../../services/userService';
import { User, Product } from '../../types';

const UserWishlist = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  // State
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [filteredItems, setFilteredItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  
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
    
    // Set up real-time listener for user document to get wishlist
    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data() as any;
        const wishlistIds = userData.wishlist || [];
        
        if (wishlistIds.length === 0) {
          setWishlistItems([]);
          setFilteredItems([]);
          setLoading(false);
          return;
        }
        
        try {
          // Fetch detailed product information for each wishlist item
          const wishlistDetails = await getUserWishlistWithDetails(currentUser.uid);
          setWishlistItems(wishlistDetails);
          setFilteredItems(wishlistDetails);
        } catch (err) {
          console.error('Error fetching wishlist details:', err);
          setError('Failed to load wishlist details');
        } finally {
          setLoading(false);
        }
      } else {
        setWishlistItems([]);
        setFilteredItems([]);
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching wishlist:', err);
      setError('Failed to load your wishlist. Please try again later.');
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);
  
  // Filter wishlist items when search changes
  useEffect(() => {
    if (!wishlistItems.length) return;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = wishlistItems.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(wishlistItems);
    }
  }, [wishlistItems, searchQuery]);
  
  const handleRemoveFromWishlist = async (productId: string) => {
    if (!currentUser) return;
    
    try {
      setRemovingItem(productId);
      await removeFromWishlist(currentUser.uid, productId);
      // No need to update state manually since we're using real-time listeners
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError('Failed to remove item from wishlist');
    } finally {
      setRemovingItem(null);
    }
  };
  
  const handleAddToCart = (productId: string) => {
    // Implementation for adding to cart would go here
    // For now, just navigate to the product page
    navigate(`/products/${productId}`);
  };
  
  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
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
            <p className="text-gray-500">Loading your wishlist...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
          <p className="text-gray-600">
            Manage your favorite products
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search wishlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Wishlist Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full"
                >
                  <div 
                    className="h-48 bg-gray-100 relative cursor-pointer"
                    onClick={() => handleViewProduct(item.id)}
                  >
                    {item.image || item.imageUrl ? (
                      <img 
                        src={item.image || item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWishlist(item.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      disabled={removingItem === item.id}
                    >
                      <Trash className={`h-4 w-4 ${removingItem === item.id ? 'text-gray-400' : 'text-red-500'}`} />
                    </button>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 
                      className="text-lg font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600"
                      onClick={() => handleViewProduct(item.id)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                    <p className="text-lg font-bold text-gray-900 mb-4">{formatCurrency(item.price)}</p>
                    
                    <div className="mt-auto">
                      <button
                        onClick={() => handleAddToCart(item.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? 'No items match your search criteria'
                  : 'Add items to your wishlist to keep track of products you love'}
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
      </div>
    </div>
  );
};

export default UserWishlist;
