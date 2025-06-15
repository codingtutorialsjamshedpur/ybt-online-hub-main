import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  fetchProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '../../firebase/firestore';
import { uploadProductImage } from '../../firebase/storage';
import { saveImageLocally, getImageUrl } from '../../utils/localImageStorage';
import { Product } from '../../types';
import { Timestamp, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Icons for product management
const Icons = {
  Add: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  ),
  Delete: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
    </svg>
  ),
  Sort: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
    </svg>
  ),
  Success: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  Error: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  Tag: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
};

const AdminProductManager = () => {
  // Core state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string, icon?: JSX.Element} | null>(null);
  
  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Image handling state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useDirectImageUrl, setUseDirectImageUrl] = useState(false);
  const [imageStorageType, setImageStorageType] = useState<'local' | 'firebase'>('local');
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Derived state for categories and tags
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.category) categorySet.add(product.category);
    });
    return ['all', ...Array.from(categorySet)];
  }, [products]);
  
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach(product => {
      if (product.tags) product.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [products]);
  
  // Manually load products from Firestore
  const loadProducts = async () => {
    setLoading(true);
    try {
      const productData = await fetchProducts();
      setProducts(productData);
      console.log('Products loaded:', productData.length);
      setNotification({
        type: 'success',
        message: 'Products loaded successfully!',
        icon: <Icons.Success />
      });
    } catch (error) {
      console.error('Error loading products:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load products. Please try again.',
        icon: <Icons.Error />
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load products when component mounts
  useEffect(() => {
    loadProducts();
  }, []);

  // Filtering and sorting logic
  const filteredProducts = useMemo(() => {
    return products
      // Apply category filter
      .filter(product => {
        if (selectedCategory === 'all') return true;
        return product.category === selectedCategory;
      })
      // Apply tag filter
      .filter(product => {
        if (selectedTags.length === 0) return true;
        if (!product.tags) return false;
        return selectedTags.some(tag => product.tags?.includes(tag));
      })
      // Apply search term filter across multiple fields
      .filter(product => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          product.id.toLowerCase().includes(searchLower) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower))
        );
      })
      // Apply sorting
      .sort((a, b) => {
        let fieldA: any = a[sortField as keyof Product] || '';
        let fieldB: any = b[sortField as keyof Product] || '';
        
        // Handle timestamps for sorting
        if (fieldA && typeof fieldA !== 'string' && 'seconds' in fieldA) {
          fieldA = fieldA.seconds;
          fieldB = fieldB.seconds;
        }
        
        // Handle price as number
        if (sortField === 'price' || sortField === 'stock') {
          fieldA = parseFloat(fieldA) || 0;
          fieldB = parseFloat(fieldB) || 0;
        }
        
        // Apply sort direction
        if (sortDirection === 'asc') {
          return fieldA > fieldB ? 1 : -1;
        } else {
          return fieldA < fieldB ? 1 : -1;
        }
      });
  }, [products, selectedCategory, selectedTags, searchTerm, sortField, sortDirection]);
  
  // Pagination logic
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);
  
  // Total pages calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };
  
  // Toggle category filter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page
  };
  
  // Toggle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
    setCurrentPage(1); // Reset to first page
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setCurrentPage(1);
  };
  
  // Tag input handlers
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };
  
  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    
    if (currentProduct && !currentProduct.tags?.includes(tag)) {
      setCurrentProduct(prev => ({
        ...prev as Product,
        tags: [...(prev?.tags || []), tag]
      }));
    }
    setTagInput('');
  };
  
  const removeTag = (tag: string) => {
    if (currentProduct && currentProduct.tags) {
      setCurrentProduct(prev => ({
        ...prev as Product,
        tags: prev?.tags?.filter(t => t !== tag) || []
      }));
    }
  };

  // Handle form input changes with improved type handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs specifically
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentProduct(prev => prev ? { ...prev, [name]: checked } : null);
      return;
    }
    
    // Handle numeric inputs
    if (name === 'price' || name === 'stock' || name === 'rating') {
      // Store as string for consistency with Firestore
      setCurrentProduct(prev => prev ? { ...prev, [name]: value } : null);
      return;
    }
    
    // Handle all other inputs
    setCurrentProduct(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle image selection with improved preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setNotification({
          type: 'error',
          message: 'Please select an image file (JPEG, PNG, etc.)',
          icon: <Icons.Error />
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          type: 'error',
          message: 'Image size should be less than 5MB',
          icon: <Icons.Error />
        });
        return;
      }
      
      setImageFile(file);
      setUseDirectImageUrl(false);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle between file upload and direct URL input
  const toggleImageInputMethod = () => {
    setUseDirectImageUrl(!useDirectImageUrl);
    if (useDirectImageUrl) {
      // Switching to file upload, clear the image URL
      setCurrentProduct(prev => prev ? { ...prev, image: '' } : null);
    } else {
      // Switching to direct URL, clear the file
      setImageFile(null);
    }
  };
  
  // Toggle between local and Firebase storage
  const toggleImageStorageType = () => {
    setImageStorageType(prev => prev === 'local' ? 'firebase' : 'local');
  };

  // Reset form and close modal
  const resetForm = () => {
    setCurrentProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setUseDirectImageUrl(false);
    setImageStorageType('local'); // Default to local storage
    setTagInput('');
    setShowModal(false);
  };

  // Open modal for adding new product
  const handleAddNew = () => {
    setCurrentProduct({
      id: '',
      name: '',
      title: '',
      category: '',
      description: '',
      price: '0',
      stock: '0',
      status: 'Active',
      image: '',
      imageUrl: '',
      rating: 0,
      tags: [],
      downloadLink: '',
      isDigitalProduct: false,
      deliveryMethod: 'physical',
      sku: '',
      featured: false,
      brand: '',
      discountPrice: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    setShowModal(true);
  };

  // Open modal for editing existing product
  const handleEdit = (product: Product) => {
    setCurrentProduct({ ...product });
    setImagePreview(product.image || product.imageUrl);
    setShowModal(true);
  };

  // Handle product deletion with confirmation dialog
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteProduct(id);
        // No need to update products array as the real-time listener will handle it
        setNotification({
          type: 'success',
          message: 'Product deleted successfully!',
          icon: <Icons.Success />
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        setNotification({
          type: 'error',
          message: 'Failed to delete product. Please try again.',
          icon: <Icons.Error />
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle form submission with improved validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProduct) return;
    
    // Basic validation
    if (!currentProduct.name.trim()) {
      setNotification({
        type: 'error',
        message: 'Product name is required',
        icon: <Icons.Error />
      });
      return;
    }
    
    if (!currentProduct.category.trim()) {
      setNotification({
        type: 'error',
        message: 'Product category is required',
        icon: <Icons.Error />
      });
      return;
    }
    
    try {
      setLoading(true);
      let imageUrl = currentProduct.image || currentProduct.imageUrl || '';
      
      // If using direct URL input, use that instead of file upload
      if (useDirectImageUrl) {
        // Validate URL format
        if (currentProduct.image && !isValidUrl(currentProduct.image)) {
          setNotification({
            type: 'error',
            message: 'Please enter a valid image URL',
            icon: <Icons.Error />
          });
          setLoading(false);
          return;
        }
        imageUrl = currentProduct.image || '';
      }
      // Otherwise upload image if a new one is selected
      else if (imageFile) {
        const timestamp = new Date().getTime();
        const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `product_${timestamp}_${safeFileName}`;
        
        try {
          // Choose between local storage and Firebase storage
          if (imageStorageType === 'local') {
            // Save image locally
            imageUrl = await saveImageLocally(imageFile, 'products', (progress) => {
              setUploadProgress(progress);
            });
            
            // Convert relative path to absolute URL for display
            // This assumes the app is running at the root level of the domain
            const baseUrl = window.location.origin;
            if (!imageUrl.startsWith('http')) {
              imageUrl = `${baseUrl}${imageUrl}`;
            }
          } else {
            // Use Firebase Storage
            imageUrl = await uploadProductImage(imageFile, filename, (progress) => {
              setUploadProgress(progress);
            });
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setNotification({
            type: 'error',
            message: `Failed to upload image to ${imageStorageType === 'local' ? 'local storage' : 'Firebase'}. Please try again.`,
            icon: <Icons.Error />
          });
          setLoading(false);
          return;
        }
      }
      
      // For digital products, validate download link
      if (currentProduct.isDigitalProduct && !currentProduct.downloadLink?.trim()) {
        setNotification({
          type: 'error',
          message: 'Download link is required for digital products',
          icon: <Icons.Error />
        });
        setLoading(false);
        return;
      }
      
      // Prepare product data with timestamp
      const now = Timestamp.now();
      const productData: Product = {
        ...currentProduct as Product,
        name: currentProduct.name.trim(),
        category: currentProduct.category.trim(),
        image: imageUrl,
        imageUrl: imageUrl,
        updatedAt: now,
        // Set createdAt only for new products
        createdAt: currentProduct.id ? currentProduct.createdAt : now
      };
      
      // Add or update product
      if (!currentProduct.id) {
        // Create new product
        const newId = await addProduct(productData);
        setNotification({
          type: 'success',
          message: 'Product added successfully!',
          icon: <Icons.Success />
        });
      } else {
        // Update existing product
        await updateProduct(currentProduct.id, productData);
        setNotification({
          type: 'success',
          message: 'Product updated successfully!',
          icon: <Icons.Success />
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save product. Please try again.',
        icon: <Icons.Error />
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Utility function to validate URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
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
          <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your digital products inventory</p>
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
              placeholder="Search products..."
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
            Add New Product
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all"
            onClick={loadProducts}
            disabled={loading}
          >
            <svg className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
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
      
      {/* Products table */}
      {!loading && (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
          {filteredProducts.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img 
                          className="h-12 w-12 rounded-md object-cover shadow-sm border border-gray-200" 
                          src={getImageUrl(product.image || product.imageUrl) || 'https://via.placeholder.com/100?text=No+Image'} 
                          alt={product.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/100?text=No+Image';
                            console.log('Image failed to load:', product.image || product.imageUrl);
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{product.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.stock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        <span 
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            product.status === 'Active' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {product.status}
                        </span>
                        {product.isDigitalProduct && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            Digital
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${                            
                          product.deliveryMethod === 'download'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : product.deliveryMethod === 'service'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {product.deliveryMethod === 'download' ? 'Digital' : 
                          product.deliveryMethod === 'service' ? 'Service' : 'Physical'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 font-medium mb-2">
                  {searchTerm ? 'No products match your search criteria.' : 'No products available yet'}
                </p>
                <button 
                  onClick={handleAddNew} 
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add your first product
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {currentProduct?.id ? 'Edit Product' : 'Add New Product'}
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
                      Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentProduct?.name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category*
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentProduct?.category || ''}
                      onChange={(e) => {
                        const category = e.target.value;
                        // When category changes, automatically add it as a tag
                        let currentTags = currentProduct?.tags || [];
                        if (category && !currentTags.includes(category)) {
                          currentTags = [...currentTags, category];
                        }
                        setCurrentProduct(prev => prev ? { ...prev, category, tags: currentTags } : null);
                      }}
                    >
                      <option value="">Select a category</option>
                      <option value="E-Books">E-Books</option>
                      <option value="Packs">Packs</option>
                      <option value="Templates">Templates</option>
                      <option value="Tools/Scripts">Tools & Scripts</option>
                      <option value="Video-Courses">Video Courses</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Selecting a category will automatically add it as a tag</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price*
                    </label>
                    <input
                      type="text"
                      name="price"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentProduct?.price || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock*
                    </label>
                    <input
                      type="text"
                      name="stock"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentProduct?.stock || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status*
                    </label>
                    <select
                      name="status"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentProduct?.status || 'Active'}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Method*
                    </label>
                    <select
                      name="deliveryMethod"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentProduct?.deliveryMethod || 'physical'}
                      onChange={handleInputChange}
                    >
                      <option value="physical">Physical Product</option>
                      <option value="download">Digital Download</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>
                
                {/* Digital Product Section */}
                {currentProduct?.deliveryMethod === 'download' && (
                  <div className="mb-4 p-4 border rounded-md bg-blue-50">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="isDigitalProduct"
                        name="isDigitalProduct"
                        checked={currentProduct?.isDigitalProduct || false}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setCurrentProduct(prev => prev ? { ...prev, isDigitalProduct: checked } : null);
                        }}
                        className="mr-2"
                      />
                      <label htmlFor="isDigitalProduct" className="text-sm font-medium text-gray-700">
                        This is a digital product with downloadable content
                      </label>
                    </div>
                    
                    {currentProduct?.isDigitalProduct && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Download Link*
                        </label>
                        <input
                          type="text"
                          name="downloadLink"
                          className="w-full px-3 py-2 border rounded-md"
                          value={currentProduct?.downloadLink || ''}
                          onChange={handleInputChange}
                          placeholder="Enter download link (e.g., Google Drive URL)"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          This link will be provided to customers after successful payment via Razorpay.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    value={currentProduct?.description || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="mb-2">
                    <input
                      type="text"
                      name="tags"
                      className="w-full px-3 py-2 border rounded-md"
                      value={Array.isArray(currentProduct?.tags) ? currentProduct?.tags.join(', ') : ''}
                      onChange={(e) => {
                        const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                        setCurrentProduct(prev => prev ? { ...prev, tags: tagsArray } : null);
                      }}
                      placeholder="E.g. premium, free, beginner, advanced"
                    />
                    <p className="text-xs text-gray-500 mt-1">Add multiple tags separated by commas to help with filtering and categorization.</p>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Suggested Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {['E-Books', 'Packs', 'Templates', 'Tools/Scripts', 'Video-Courses', 'premium', 'free', 'beginner', 'advanced'].map(tag => {
                        const isSelected = currentProduct?.tags?.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`px-3 py-1 rounded-full text-sm ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => {
                              const currentTags = currentProduct?.tags || [];
                              const newTags = isSelected
                                ? currentTags.filter(t => t !== tag)
                                : [...currentTags, tag];
                              setCurrentProduct(prev => prev ? { ...prev, tags: newTags } : null);
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image
                  </label>
                  
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="useDirectUrl"
                      checked={useDirectImageUrl}
                      onChange={toggleImageInputMethod}
                      className="mr-2"
                    />
                    <label htmlFor="useDirectUrl" className="text-sm text-gray-600">
                      Use direct image URL instead of file upload
                    </label>
                  </div>
                  
                  {!useDirectImageUrl && (
                    <div className="mb-3 border rounded-md p-3 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700 mb-2">Image Storage Location:</p>
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="localStorage"
                            name="imageStorageType"
                            value="local"
                            checked={imageStorageType === 'local'}
                            onChange={() => setImageStorageType('local')}
                            className="mr-2"
                          />
                          <label htmlFor="localStorage" className="text-sm text-gray-600">
                            Local Storage (public/images)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="firebaseStorage"
                            name="imageStorageType"
                            value="firebase"
                            checked={imageStorageType === 'firebase'}
                            onChange={() => setImageStorageType('firebase')}
                            className="mr-2"
                          />
                          <label htmlFor="firebaseStorage" className="text-sm text-gray-600">
                            Firebase Storage
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {imageStorageType === 'local' 
                          ? 'Images will be saved in your public/images directory for local development.'
                          : 'Images will be uploaded to Firebase Storage (requires Firebase setup).'}
                      </p>
                    </div>
                  )}
                  
                  {useDirectImageUrl ? (
                    <input
                      type="text"
                      name="image"
                      placeholder="Enter image URL"
                      className="w-full px-3 py-2 border rounded-md"
                      value={currentProduct?.image || ''}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full"
                    />
                  )}
                  
                  {!useDirectImageUrl && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {(imagePreview || currentProduct?.image || currentProduct?.imageUrl) && (
                    <div className="mt-2">
                      <img
                        src={imagePreview || getImageUrl(currentProduct?.image || currentProduct?.imageUrl || '')}
                        alt="Product preview"
                        className="h-32 w-32 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://via.placeholder.com/100?text=No+Image';
                        }}
                      />
                    </div>
                  )}
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
                    {loading ? 'Saving...' : 'Save Product'}
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

export default AdminProductManager;
