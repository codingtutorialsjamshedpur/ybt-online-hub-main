import { useState, useEffect } from 'react';
import { 
  fetchCoupons, 
  addCoupon, 
  updateCoupon, 
  deleteCoupon 
} from '../../firebase/firestore';
import { Coupon } from '../../types';
import { Timestamp } from 'firebase/firestore';

const AdminCouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load coupons from Firestore
  useEffect(() => {
    const loadCoupons = async () => {
      setLoading(true);
      try {
        const couponData = await fetchCoupons();
        setCoupons(couponData);
        console.log('Coupons loaded:', couponData.length);
      } catch (error) {
        console.error('Error loading coupons:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load coupons. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  // Filter coupons based on search term
  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coupon.status && coupon.status.toLowerCase().includes(searchTerm.toLowerCase()))
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
    setCurrentCoupon(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert date string to timestamp
    if (value) {
      const date = new Date(value);
      const timestamp = Timestamp.fromDate(date);
      setCurrentCoupon(prev => prev ? { ...prev, [name]: timestamp } : null);
    }
  };

  // Reset form and close modal
  const resetForm = () => {
    setCurrentCoupon(null);
    setShowModal(false);
  };

  // Open modal for adding new coupon
  const handleAddNew = () => {
    // Current dates for range
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    setCurrentCoupon({
      code: '',
      discount: '',
      type: 'Percentage',
      validFrom: Timestamp.fromDate(today),
      validUntil: Timestamp.fromDate(nextMonth),
      status: 'Active',
      usageLimit: 100,
      usageCount: 0
    });
    setShowModal(true);
  };

  // Open modal for editing existing coupon
  const handleEdit = (coupon: Coupon) => {
    setCurrentCoupon({ ...coupon });
    setShowModal(true);
  };

  // Handle coupon deletion
  const handleDelete = async (id: string) => {
    if (!id) {
      setNotification({
        type: 'error',
        message: 'Coupon ID is missing.'
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id);
        setCoupons(coupons.filter(coupon => coupon.id !== id));
        setNotification({
          type: 'success',
          message: 'Coupon deleted successfully!'
        });
      } catch (error) {
        console.error('Error deleting coupon:', error);
        setNotification({
          type: 'error',
          message: 'Failed to delete coupon. Please try again.'
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCoupon) return;
    
    try {
      setLoading(true);
      
      // Prepare coupon data with timestamps
      const couponData: Coupon = {
        ...currentCoupon as Coupon,
        updatedAt: Timestamp.now()
      };
      
      // Convert usage limit to number if it's a string
      if (typeof couponData.usageLimit === 'string') {
        couponData.usageLimit = parseInt(couponData.usageLimit as string, 10) || 0;
      }
      
      // Convert usage count to number if it's a string
      if (typeof couponData.usageCount === 'string') {
        couponData.usageCount = parseInt(couponData.usageCount as string, 10) || 0;
      }
      
      // Handle applicable products if it's a string
      if (typeof couponData.applicableProducts === 'string') {
        couponData.applicableProducts = (couponData.applicableProducts as string)
          .split(',')
          .map(id => id.trim())
          .filter(id => id);
      }
      
      // Add or update coupon
      if (!currentCoupon.id) {
        // Create new coupon
        couponData.createdAt = Timestamp.now();
        const newId = await addCoupon(couponData);
        const newCoupon = { ...couponData, id: newId };
        setCoupons([...coupons, newCoupon]);
        setNotification({
          type: 'success',
          message: 'Coupon added successfully!'
        });
      } else {
        // Update existing coupon
        await updateCoupon(currentCoupon.id, couponData);
        setCoupons(coupons.map(c => c.id === currentCoupon.id ? { ...couponData, id: currentCoupon.id } : c));
        setNotification({
          type: 'success',
          message: 'Coupon updated successfully!'
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving coupon:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save coupon. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to date input value
  const formatDateForInput = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
          <button 
            className="float-right"
            onClick={() => setNotification(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Coupon Management</h1>
        <div className="flex w-full md:w-auto gap-4">
          <input
            type="text"
            placeholder="Search coupons..."
            className="px-4 py-2 border rounded-md w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleAddNew}
          >
            Add New Coupon
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && !showModal && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Coupons table */}
      {!loading && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {filteredCoupons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{coupon.discount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{coupon.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(coupon.validFrom)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(coupon.validUntil)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {coupon.usageCount || 0}/{coupon.usageLimit || 'Unlimited'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              coupon.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : coupon.status === 'Expired'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {coupon.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id || '')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-500">
                  {searchTerm ? 'No coupons match your search criteria.' : 'No coupons available. Add your first coupon!'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {currentCoupon?.id ? 'Edit Coupon' : 'Add New Coupon'}
                </h2>
                <button 
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code*
                    </label>
                    <input
                      type="text"
                      name="code"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentCoupon?.code || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount*
                    </label>
                    <input
                      type="text"
                      name="discount"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentCoupon?.discount || ''}
                      onChange={handleInputChange}
                      placeholder={currentCoupon?.type === 'Percentage' ? 'e.g. 10%' : 'e.g. ₹100'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type*
                    </label>
                    <select
                      name="type"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentCoupon?.type || 'Percentage'}
                      onChange={handleInputChange}
                    >
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed Amount">Fixed Amount</option>
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
                      value={currentCoupon?.status || 'Active'}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From*
                    </label>
                    <input
                      type="date"
                      name="validFrom"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={formatDateForInput(currentCoupon?.validFrom)}
                      onChange={handleDateChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until*
                    </label>
                    <input
                      type="date"
                      name="validUntil"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={formatDateForInput(currentCoupon?.validUntil)}
                      onChange={handleDateChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      min="0"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentCoupon?.usageLimit || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Count
                    </label>
                    <input
                      type="number"
                      name="usageCount"
                      min="0"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentCoupon?.usageCount || '0'}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Purchase
                  </label>
                  <input
                    type="text"
                    name="minimumPurchase"
                    className="w-full px-3 py-2 border rounded-md"
                    value={currentCoupon?.minimumPurchase || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. ₹500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applicable Products (comma separated product IDs)
                  </label>
                  <textarea
                    name="applicableProducts"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    value={Array.isArray(currentCoupon?.applicableProducts) 
                      ? currentCoupon?.applicableProducts.join(', ') 
                      : currentCoupon?.applicableProducts || ''}
                    onChange={handleInputChange}
                    placeholder="Leave empty for all products"
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
                    {loading ? 'Saving...' : 'Save Coupon'}
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

export default AdminCouponManager;
