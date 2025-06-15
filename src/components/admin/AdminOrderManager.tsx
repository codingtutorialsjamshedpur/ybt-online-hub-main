import { useState, useEffect } from 'react';
import { 
  fetchOrders, 
  addOrder, 
  updateOrder, 
  deleteOrder,
  fetchProducts
} from '../../firebase/firestore';
import { Order, Product } from '../../types';
import { Timestamp } from 'firebase/firestore';

const AdminOrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [orderProducts, setOrderProducts] = useState<{id: string, name: string, quantity: number}[]>([]);

  // Load orders and products from Firestore
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [orderData, productData] = await Promise.all([
          fetchOrders(),
          fetchProducts()
        ]);
        
        setOrders(orderData);
        setProducts(productData);
        console.log('Orders loaded:', orderData.length);
        console.log('Products loaded:', productData.length);
      } catch (error) {
        console.error('Error loading data:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load orders. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const customerMatch = order.customer ? order.customer.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const emailMatch = order.customerEmail ? order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const statusMatch = order.status ? order.status.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return customerMatch || emailMatch || statusMatch;
  });

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
    setCurrentOrder(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle product selection for the order
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    if (productId === '') return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product already exists in order
    const existingProduct = orderProducts.find(p => p.id === productId);
    if (existingProduct) {
      // Update quantity
      setOrderProducts(orderProducts.map(p => 
        p.id === productId 
          ? { ...p, quantity: p.quantity + 1 } 
          : p
      ));
    } else {
      // Add new product
      setOrderProducts([...orderProducts, {
        id: productId,
        name: product.name,
        quantity: 1
      }]);
    }
    
    // Reset select
    e.target.value = '';
  };

  // Remove product from order
  const handleRemoveProduct = (productId: string) => {
    setOrderProducts(orderProducts.filter(p => p.id !== productId));
  };

  // Update product quantity
  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setOrderProducts(orderProducts.map(p => 
      p.id === productId 
        ? { ...p, quantity } 
        : p
    ));
  };

  // Calculate order total
  const calculateTotal = () => {
    let total = 0;
    
    orderProducts.forEach(orderProduct => {
      const product = products.find(p => p.id === orderProduct.id);
      if (product) {
        // Convert price to number
        const price = parseFloat(product.price.replace(/[^\d.-]/g, ''));
        if (!isNaN(price)) {
          total += price * orderProduct.quantity;
        }
      }
    });
    
    return total.toFixed(2);
  };

  // Reset form and close modal
  const resetForm = () => {
    setCurrentOrder(null);
    setOrderProducts([]);
    setShowModal(false);
  };

  // Open modal for adding new order
  const handleAddNew = () => {
    const now = Timestamp.now();
    
    setCurrentOrder({
      customer: '',
      customerEmail: '',
      products: [] as {id: string, quantity: number}[],
      totalAmount: '0',
      orderDate: now,
      status: 'Processing' as 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled',
      paymentStatus: 'Pending' as 'Paid' | 'Pending' | 'Failed' | 'Refunded',
      paymentMethod: 'Credit Card'
    });
    
    setOrderProducts([]);
    setShowModal(true);
  };

  // Open modal for editing existing order
  const handleEdit = (order: Order) => {
    // Parse products if it's a JSON string from Firestore
    const parsedProducts = parseOrderProducts(order.products);
    
    setCurrentOrder(order);
    setOrderProducts(parsedProducts);
    setShowModal(true);
  };

  // Handle JSON string or array in Firestore
  const parseOrderProducts = (products: string | {id: string, quantity: number}[] | {id: string, name: string, quantity: number}[]) => {
    if (typeof products === 'string') {
      try {
        // Parse the JSON string and map to ensure all required fields are present
        const parsed = JSON.parse(products);
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            id: item.id,
            name: item.name || 'Unknown Product', // Add name if missing
            quantity: item.quantity
          }));
        }
        return [] as {id: string, name: string, quantity: number}[];
      } catch (error) {
        console.error('Error parsing order products:', error);
        return [] as {id: string, name: string, quantity: number}[];
      }
    }
    
    // If it's already an array, ensure all items have a name property
    if (Array.isArray(products)) {
      return products.map(item => ({
        id: item.id,
        name: (item as any).name || 'Unknown Product',
        quantity: item.quantity
      }));
    }
    
    return [] as {id: string, name: string, quantity: number}[];
  };

  // Handle order deletion
  const handleDelete = async (id: string) => {
    if (!id) {
      setNotification({
        type: 'error',
        message: 'Order ID is missing.'
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id);
        setOrders(orders.filter(order => order.id !== id));
        setNotification({
          type: 'success',
          message: 'Order deleted successfully!'
        });
      } catch (error) {
        console.error('Error deleting order:', error);
        setNotification({
          type: 'error',
          message: 'Failed to delete order. Please try again.'
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrder) return;
    
    try {
      setLoading(true);
      
      // Calculate total
      const total = calculateTotal();
      
      // Prepare order data with timestamps
      const orderData: Order = {
        ...currentOrder as Order,
        // Convert orderProducts to the format expected by Order interface
        products: orderProducts.map(p => ({ id: p.id, quantity: p.quantity })),
        totalAmount: total,
        updatedAt: Timestamp.now()
      };
      
      // Add or update order
      if (!currentOrder.id) {
        // Create new order
        const newId = await addOrder(orderData);
        const newOrder = { ...orderData, id: newId };
        setOrders([...orders, newOrder]);
        setNotification({
          type: 'success',
          message: 'Order added successfully!'
        });
      } else {
        // Update existing order
        await updateOrder(currentOrder.id, orderData);
        setOrders(orders.map(o => o.id === currentOrder.id ? { ...orderData, id: currentOrder.id } : o));
        setNotification({
          type: 'success',
          message: 'Order updated successfully!'
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving order:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save order. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 mb-4 rounded-md shadow-sm flex justify-between items-center ${
          notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && (
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage customer orders and track status</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all"
            onClick={handleAddNew}
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Order
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && !showModal && (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {/* Orders table */}
      {!loading && (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
          {filteredOrders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.totalAmount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(order.orderDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'Delivered' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : order.status === 'Processing'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : order.status === 'Shipped'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(order.id || '')}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center bg-gray-50">
              <div className="flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-500 font-medium mb-2">
                  {searchTerm ? 'No orders match your search criteria.' : 'No orders available yet'}
                </p>
                <button 
                  onClick={handleAddNew} 
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add your first order
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {currentOrder?.id ? 'Edit Order' : 'Add New Order'}
                </h2>
                <button 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name*
                    </label>
                    <input
                      type="text"
                      name="customer"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentOrder?.customer || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Email*
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentOrder?.customerEmail || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method*
                    </label>
                    <select
                      name="paymentMethod"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentOrder?.paymentMethod || 'Credit Card'}
                      onChange={handleInputChange}
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
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
                      value={currentOrder?.status || 'Processing'}
                      onChange={handleInputChange}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Products*
                  </label>
                  
                  <div className="flex mb-2">
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      onChange={handleProductChange}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a product to add</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {orderProducts.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orderProducts.map(orderProduct => {
                            const product = products.find(p => p.id === orderProduct.id);
                            return (
                              <tr key={orderProduct.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  {orderProduct.name}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      className="px-2 py-1 bg-gray-200 rounded-l-md"
                                      onClick={() => handleQuantityChange(orderProduct.id, orderProduct.quantity - 1)}
                                    >
                                      -
                                    </button>
                                    <span className="px-3 py-1 border-t border-b">
                                      {orderProduct.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      className="px-2 py-1 bg-gray-200 rounded-r-md"
                                      onClick={() => handleQuantityChange(orderProduct.id, orderProduct.quantity + 1)}
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  {product ? product.price : 'N/A'}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  <button
                                    type="button"
                                    className="text-red-600"
                                    onClick={() => handleRemoveProduct(orderProduct.id)}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-4 py-2 text-sm font-medium text-right">
                              Total:
                            </td>
                            <td colSpan={2} className="px-4 py-2 text-sm font-medium">
                              {calculateTotal()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md">
                      <p className="text-gray-500">No products added to this order yet.</p>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Address
                  </label>
                  <textarea
                    name="shippingAddress"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    value={currentOrder?.shippingAddress || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    value={currentOrder?.notes || ''}
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
                    disabled={loading || orderProducts.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {loading ? 'Saving...' : 'Save Order'}
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

export default AdminOrderManager;
