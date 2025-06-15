import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  Camera
} from 'lucide-react';
import { updateUserProfile } from '../../services/userService';
import UserSidebar from './UserSidebar';

const UserProfile = () => {
  const navigate = useNavigate();
  const { userData, currentUser, refreshUserData } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
  
  // Load user data
  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
      setAddress(userData.address || '');
      setAvatar(userData.photoURL || userData.avatar || null);
    }
  }, [userData]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }
    
    setProfileImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatar(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to update your profile');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare profile updates
      const updates: any = {
        name,
        phone,
        address
      };
      
      // If there's a new profile image, upload it (handled by updateUserProfile)
      if (profileImage) {
        updates.profileImage = profileImage;
      }
      
      // Update profile
      await updateUserProfile(currentUser.uid, updates);
      
      // Refresh user data in context
      await refreshUserData();
      
      // Show success message
      setSuccess(true);
      
      // Exit edit mode after 2 seconds
      setTimeout(() => {
        setIsEditing(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 4; // Name, email, phone, address
    
    if (name) completed++;
    if (email) completed++; // Email is required anyway
    if (phone) completed++;
    if (address) completed++;
    
    return Math.round((completed / total) * 100);
  };
  
  const profileCompletion = calculateProfileCompletion();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600">
            View and manage your account information
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
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">Profile updated successfully!</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-24 bg-blue-600"></div>
              <div className="p-6 relative">
                <div className="absolute -top-12 left-6">
                  <div className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-100">
                        <User className="h-12 w-12 text-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-14">
                  <h2 className="text-xl font-bold text-gray-800">{name || 'User'}</h2>
                  <p className="text-gray-500">{userData?.role || 'Member'}</p>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-5 w-5 mr-2" />
                      <span>{email || 'No email'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-5 w-5 mr-2" />
                      <span>{phone || 'No phone number'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span>
                        Joined {userData?.joinedDate 
                          ? new Date(userData.joinedDate as any).toLocaleDateString() 
                          : 'Recently'}
                      </span>
                    </div>
                  </div>
                  
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Profile Completion */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Profile Completion</h3>
              <div className="flex items-center mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-4">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 font-medium">{profileCompletion}%</span>
              </div>
              <p className="text-sm text-gray-600">
                Complete your profile to enhance your shopping experience.
              </p>
            </div>
          </div>
          
          {/* Edit Profile Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {isEditing ? 'Edit Profile Information' : 'Profile Information'}
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="mb-8 flex flex-col items-center">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border border-gray-200">
                      {avatar ? (
                        <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                          <User className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <label
                        htmlFor="profile-image"
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </label>
                      <input
                        type="file"
                        id="profile-image"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Click to upload a profile picture
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      placeholder="Your email address"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email address cannot be changed
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                      placeholder="Your address"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4>
                    <p className="text-gray-800">{name || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email Address</h4>
                    <p className="text-gray-800">{email || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h4>
                    <p className="text-gray-800">{phone || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                    <p className="text-gray-800 whitespace-pre-line">{address || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
