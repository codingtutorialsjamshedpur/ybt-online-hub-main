import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Paperclip, X, Upload, Image, File, CheckCircle } from 'lucide-react';
import { createTicket } from '../../services/userService';
import UserSidebar from './UserSidebar';

const TicketCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, currentUser } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  
  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [product, setProduct] = useState(orderId ? 'order' : '');
  const [priority, setPriority] = useState('medium');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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
  
  useEffect(() => {
    // If order ID is provided, pre-fill some fields
    if (orderId) {
      setSubject(`Issue with Order #${orderId}`);
      setProduct('order');
    }
  }, [orderId]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file size (max 5MB)
    const oversizedFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const invalidFiles = selectedFiles.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Only JPG, PNG, and PDF are allowed.`);
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Add new files to state
    setImages(prev => [...prev, ...selectedFiles]);
    
    // Generate preview URLs for images
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files like PDFs, use a placeholder
        setPreviewUrls(prev => [...prev, 'pdf-placeholder']);
      }
    });
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to create a ticket');
      return;
    }
    
    if (!subject.trim() || !description.trim() || !product || !priority) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const ticketData = {
        subject,
        description,
        product,
        priority,
        userId: currentUser.uid,
        userName: userData?.name || currentUser.displayName || 'User',
        orderId: orderId || undefined,
        attachmentCount: images.length
      };
      
      // Create ticket with images
      const ticketId = await createTicket(ticketData, images);
      
      setUploadSuccess(true);
      
      // Reset form after 2 seconds and redirect to ticket view
      setTimeout(() => {
        navigate(`/user/tickets/${ticketId}`);
      }, 2000);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Create New Ticket</h1>
          <p className="text-gray-600">
            Submit a new support ticket to get help with your issue
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
        
        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">Ticket created successfully! Redirecting...</p>
            </div>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your issue"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                placeholder="Detailed explanation of your issue"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                  Related Product/Service *
                </label>
                <select
                  id="product"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a product/service</option>
                  <option value="order">Order</option>
                  <option value="website">Website</option>
                  <option value="account">Account</option>
                  <option value="payment">Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments (optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="images"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/jpeg,image/png,application/pdf"
                />
                <label 
                  htmlFor="images" 
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, PDF (max 5MB each)
                  </p>
                </label>
              </div>
              
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative h-24 w-full border rounded-md overflow-hidden">
                          {url === 'pdf-placeholder' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                              <File className="h-10 w-10 text-gray-400" />
                            </div>
                          ) : (
                            <img 
                              src={url} 
                              alt={`Preview ${index + 1}`} 
                              className="h-full w-full object-cover" 
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 truncate">
                          {images[index]?.name || `File ${index + 1}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={uploading || uploadSuccess}
                className={`w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  (uploading || uploadSuccess) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Creating Ticket...' : uploadSuccess ? 'Ticket Created!' : 'Submit Ticket'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/user/tickets')}
                className="ml-4 px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketCreate;
