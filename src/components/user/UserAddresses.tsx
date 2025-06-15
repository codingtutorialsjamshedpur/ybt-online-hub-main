import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash, 
  AlertCircle, 
  CheckCircle, 
  Home, 
  Briefcase, 
  Heart
} from 'lucide-react';
import UserSidebar from './UserSidebar';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Address {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  type: 'home' | 'work' | 'other';
  isDefault?: boolean;
}

const UserAddresses = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    type: 'home',
    isDefault: false
  });
  
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
    
    // Set up real-time listener for user document to get addresses
    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const userAddresses = userData.addresses || [];
        setAddresses(userAddresses);
      } else {
        setAddresses([]);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching addresses:', err);
      setError('Failed to load your addresses. Please try again later.');
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
      
      // Update the document with addresses data
      await updateDoc(userPanelRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        lastUpdated: new Date(),
        // Leave existing data intact
      });
    } catch (err) {
      console.error('Error updating User_Panel collection:', err);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to add an address');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Generate a unique ID for the address
      const newAddressId = Date.now().toString();
      
      // Create the new address
      const newAddress: Address = {
        ...formData,
        id: newAddressId
      };
      
      // If this is the first address or marked as default, ensure it's the only default
      if (addresses.length === 0 || formData.isDefault) {
        // Set all existing addresses to non-default
        const updatedAddresses = addresses.map(addr => ({ ...addr, isDefault: false }));
        
        // Update Firestore with all addresses plus the new one
        await updateDoc(userRef, {
          addresses: [...updatedAddresses, newAddress]
        });
      } else {
        // Simply add the new address
        await updateDoc(userRef, {
          addresses: arrayUnion(newAddress)
        });
      }
      
      // Update User_Panel collection
      await updateDoc(doc(db, 'User_Panel', currentUser.uid), {
        'addresses': arrayUnion(newAddress),
        lastUpdated: new Date()
      });
      
      // Reset form and hide it
      setFormData({
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: '',
        type: 'home',
        isDefault: false
      });
      setShowAddForm(false);
      setSuccessMessage('Address added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error adding address:', err);
      setError('Failed to add address. Please try again.');
    }
  };
  
  const handleEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !editingAddressId) {
      setError('You must be logged in to edit an address');
      return;
    }
    
    try {
      setProcessingId(editingAddressId);
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Create the updated address
      const updatedAddress: Address = {
        ...formData,
        id: editingAddressId
      };
      
      // Get current addresses and replace the edited one
      const updatedAddresses = addresses.map(addr => 
        addr.id === editingAddressId ? updatedAddress : 
        // If the edited address is now default, set others to non-default
        formData.isDefault ? { ...addr, isDefault: false } : addr
      );
      
      // Update Firestore
      await updateDoc(userRef, {
        addresses: updatedAddresses
      });
      
      // Update User_Panel collection
      await updateDoc(doc(db, 'User_Panel', currentUser.uid), {
        'addresses': updatedAddresses,
        lastUpdated: new Date()
      });
      
      // Reset form and hide it
      setFormData({
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: '',
        type: 'home',
        isDefault: false
      });
      setEditingAddressId(null);
      setProcessingId(null);
      setSuccessMessage('Address updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating address:', err);
      setError('Failed to update address. Please try again.');
      setProcessingId(null);
    }
  };
  
  const handleRemoveAddress = async (addressId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingId(addressId);
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Find the address to remove
      const addressToRemove = addresses.find(addr => addr.id === addressId);
      if (!addressToRemove) return;
      
      // Remove the address
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      
      // If the removed address was the default, set a new default if there are other addresses
      if (addressToRemove.isDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }
      
      // Update Firestore
      await updateDoc(userRef, {
        addresses: updatedAddresses
      });
      
      // Update User_Panel collection
      await updateDoc(doc(db, 'User_Panel', currentUser.uid), {
        'addresses': updatedAddresses,
        lastUpdated: new Date()
      });
      
      setProcessingId(null);
      setSuccessMessage('Address removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error removing address:', err);
      setError('Failed to remove address. Please try again.');
      setProcessingId(null);
    }
  };
  
  const startEditAddress = (address: Address) => {
    setFormData({
      name: address.name,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      type: address.type,
      isDefault: address.isDefault || false
    });
    setEditingAddressId(address.id);
    setShowAddForm(true);
  };
  
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-5 w-5 text-blue-500" />;
      case 'work':
        return <Briefcase className="h-5 w-5 text-purple-500" />;
      default:
        return <Heart className="h-5 w-5 text-red-500" />;
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
            <p className="text-gray-500">Loading your addresses...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Saved Addresses</h1>
            <p className="text-gray-600">
              Manage your delivery addresses
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Address
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}
        
        {/* Address Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddressId(null);
                  setFormData({
                    name: '',
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'India',
                    phone: '',
                    type: 'home',
                    isDefault: false
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={editingAddressId ? handleEditAddress : handleAddAddress}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street address, company name, c/o"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter state or province"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter postal code"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter country"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                      Set as default address
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  disabled={processingId !== null}
                >
                  {processingId ? 'Processing...' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Addresses List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {addresses.map((address) => (
                <div 
                  key={address.id} 
                  className={`border rounded-lg p-5 relative ${address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {address.isDefault && (
                    <span className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      Default
                    </span>
                  )}
                  
                  <div className="flex items-start mb-4">
                    <div className="mr-3">
                      {getAddressTypeIcon(address.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">{address.type} Address</h3>
                      <p className="text-gray-600">{address.name}</p>
                    </div>
                  </div>
                  
                  <div className="pl-8 mb-4">
                    <p className="text-gray-700">{address.addressLine1}</p>
                    {address.addressLine2 && <p className="text-gray-700">{address.addressLine2}</p>}
                    <p className="text-gray-700">{address.city}, {address.state} {address.postalCode}</p>
                    <p className="text-gray-700">{address.country}</p>
                    <p className="text-gray-700 mt-2">Phone: {address.phone}</p>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => startEditAddress(address)}
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      disabled={processingId !== null}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveAddress(address.id)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      disabled={processingId !== null}
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No addresses saved</h3>
              <p className="text-gray-500 mb-4">
                Add a new address to speed up your checkout process
              </p>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Address
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAddresses;
