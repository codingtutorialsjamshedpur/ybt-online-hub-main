import { useState, useEffect } from 'react';
import { 
  fetchUsers, 
  addUser, 
  updateUser, 
  deleteUser 
} from '../../firebase/firestore';
import { User } from '../../types';
import { Timestamp } from 'firebase/firestore';

const AdminUserManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load users from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const userData = await fetchUsers();
        setUsers(userData);
        console.log('Users loaded:', userData.length);
      } catch (error) {
        console.error('Error loading users:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load users. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
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

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email.toLowerCase()).includes(searchTerm.toLowerCase()) ||
    (user.username.toLowerCase()).includes(searchTerm.toLowerCase()) ||
    (user.role.toLowerCase()).includes(searchTerm.toLowerCase())
  );

  // Format timestamp for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    return 'Invalid date';
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentUser(prev => prev ? { ...prev, [name]: checked } : null);
  };

  // Reset form and close modal
  const resetForm = () => {
    setCurrentUser(null);
    setShowModal(false);
  };

  // Open modal for adding new user
  const handleAddNew = () => {
    // Current timestamp for creation date
    const now = Timestamp.now();
    
    setCurrentUser({
      email: '',
      username: '',
      name: '',
      role: 'user',
      status: 'Active',
      joinedDate: now,
      lastLogin: now,
      online: false
    });
    setShowModal(true);
  };

  // Open modal for editing existing user
  const handleEdit = (user: User) => {
    setCurrentUser({ ...user });
    setShowModal(true);
  };

  // Handle user deletion
  const handleDelete = async (id: string) => {
    if (!id) {
      setNotification({
        type: 'error',
        message: 'User ID is missing.'
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(id);
        setUsers(users.filter(user => user.id !== id));
        setNotification({
          type: 'success',
          message: 'User deleted successfully!'
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        setNotification({
          type: 'error',
          message: 'Failed to delete user. Please try again.'
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Prepare user data with timestamps
      const userData: User = {
        ...currentUser as User,
        updatedAt: Timestamp.now()
      };
      
      // For new users ensure createdAt is set
      if (!userData.id) {
        userData.createdAt = Timestamp.now();
      }
      
      if (userData.id) {
        // Update existing user
        await updateUser(userData.id, userData);
        // Update the local state with the updated user
        setUsers(users.map(user => user.id === userData.id ? userData : user));
        setNotification({
          type: 'success',
          message: 'User updated successfully!'
        });
      } else {
        // Add new user
        const newUser = await addUser(userData);
        if (newUser) {
          // Using type assertion to handle the conversion safely
          const typedNewUser = typeof newUser === 'string' ? userData : newUser as User;
          setUsers([...users, typedNewUser]);
          setNotification({
            type: 'success',
            message: 'User added successfully!'
          });
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save user. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      {/* Search and Add New */}
      <div className="flex justify-between items-center">
        <div className="w-64">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add New User
        </button>
      </div>
      
      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={user.avatar || user.photoURL || "https://via.placeholder.com/40"} 
                          alt={user.name || user.username} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' || user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                      ${user.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : ''}
                      ${user.status === 'Blocked' ? 'bg-red-100 text-red-800' : ''}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.joinedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {currentUser?.id ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-600 hover:text-gray-800"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email*
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.email || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username*
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.username || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role*
                    </label>
                    <select
                      name="role"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.role || 'user'}
                      onChange={handleInputChange}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="Admin">Admin (Legacy)</option>
                      <option value="Customer">Customer</option>
                      <option value="Editor">Editor</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status*
                    </label>
                    <select
                      name="status"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.status || 'Active'}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.phone || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      name="avatar"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.avatar || ''}
                      onChange={handleInputChange}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photo URL (alt)
                    </label>
                    <input
                      type="text"
                      name="photoURL"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.photoURL || ''}
                      onChange={handleInputChange}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <select
                      name="accountType"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.accountType || 'individual'}
                      onChange={handleInputChange}
                    >
                      <option value="individual">Individual</option>
                      <option value="business">Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.companyName || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Membership Level
                    </label>
                    <select
                      name="membershipLevel"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.membershipLevel || 'free'}
                      onChange={handleInputChange}
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Spent
                    </label>
                    <input
                      type="text"
                      name="totalSpent"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.totalSpent || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="flex items-center h-full mt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="online"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={currentUser?.online || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="text-sm text-gray-700">User is Online</span>
                    </label>
                  </div>

                  <div className="flex items-center h-full mt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="newsletterSubscribed"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={currentUser?.newsletterSubscribed || false}
                        onChange={handleCheckboxChange}
                      />
                      <span className="text-sm text-gray-700">Subscribed to Newsletter</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Address
                    </label>
                    <textarea
                      name="billingAddress"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.billingAddress || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Address
                    </label>
                    <textarea
                      name="shippingAddress"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentUser?.shippingAddress || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    value={currentUser?.notes || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {loading ? 'Saving...' : currentUser?.id ? 'Update User' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;
