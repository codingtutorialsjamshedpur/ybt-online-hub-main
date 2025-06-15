import React, { useState, useEffect, useRef } from 'react';
import { fetchBlogPosts, addBlogPost, updateBlogPost, deleteBlogPost } from '../../firebase/firestore';
import { uploadProductImage } from '../../firebase/storage';
import { BlogPost } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ImageInputSection from './ImageInputSection';

// Rich text editor
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Format Firebase timestamp to readable date
const formatDate = (date: string | Timestamp | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  try {
    return date.toDate().toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Blog form data interface
interface BlogFormData {
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  status: 'Published' | 'Draft';
}

const AdminBlogManager: React.FC = () => {
  const { userData } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogPost | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    author: '',
    category: '',
    tags: [],
    image: '',
    status: 'Draft'
  });
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url'); // Default to URL input
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load blogs from Firebase
  const loadBlogs = async () => {
    setLoading(true);
    try {
      const blogsData = await fetchBlogPosts();
      console.log('Blogs loaded from Firestore:', blogsData.length);
      setBlogs(blogsData as BlogPost[]);
      if (blogsData.length > 0) {
        setNotification({
          type: 'success',
          message: `Loaded ${blogsData.length} blogs from Firebase`
        });
      } else {
        setNotification({
          type: 'success',
          message: 'No blogs found in Firebase database'
        });
      }
    } catch (error) {
      console.error('Error loading blogs from Firestore:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load blogs from Firestore'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load blogs on component mount
  useEffect(() => {
    loadBlogs();
  }, []);

  // Handle blog view
  const handleViewBlog = (blog: BlogPost) => {
    console.log('Viewing blog:', blog);
    // Open blog in new tab
    window.open(`/blog/${blog.id}`, '_blank');
  };
  
  // Handle creating a new blog
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Handle image based on input type
      let imageUrl = formData.image;
      if (imageInputType === 'file' && imageFile) {
        const tempId = `blog_${Date.now()}`;
        imageUrl = await uploadProductImage(imageFile, tempId);
      }
      // When imageInputType is 'url', use the URL directly from formData.image
      
      // Create blog data with image URL
      const blogData = {
        ...formData,
        image: imageUrl,
        date: new Date().toISOString().split('T')[0], // Format to match Firestore format (YYYY-MM-DD)
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        shares: 0,
        // Ensure the structure matches exactly what's in Firestore
        status: formData.status || 'Published'
      };
      
      // Add to Firestore
      const blogId = await addBlogPost(blogData);
      
      setNotification({
        type: 'success',
        message: 'Blog post created successfully'
      });
      
      // Close modal and refresh blogs
      setShowCreateModal(false);
      resetFormData();
      loadBlogs();
      
    } catch (error) {
      console.error('Error adding blog:', error);
      setNotification({
        type: 'error',
        message: 'Failed to create blog post'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle updating a blog
  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBlog) return;
    
    setLoading(true);
    
    try {
      // Handle image based on input type
      let imageUrl = formData.image;
      if (imageInputType === 'file' && imageFile) {
        const tempId = `blog_${Date.now()}`;
        imageUrl = await uploadProductImage(imageFile, tempId);
      }
      // When imageInputType is 'url', use the URL directly from formData.image
      
      // Create updated blog data
      const updatedBlogData = {
        ...formData,
        image: imageUrl,
        updatedAt: new Date().toISOString()
      };
      
      // Update in Firestore
      await updateBlogPost(currentBlog.id, updatedBlogData);
      
      setNotification({
        type: 'success',
        message: 'Blog post updated successfully'
      });
      
      // Close modal and refresh blogs
      setShowEditModal(false);
      resetFormData();
      loadBlogs();
      
    } catch (error) {
      console.error('Error updating blog:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update blog post'
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      title: '',
      content: '',
      author: userData?.name || '',
      category: '',
      tags: [],
      image: '',
      status: 'Draft'
    });
    setTagInput('');
    setImageFile(null);
    setPreviewUrl(null);
    setImageInputType('url'); // Reset to URL input by default
  };

  // Open create blog modal
  const openCreateModal = () => {
    resetFormData();
    setCurrentBlog(null);
    setShowCreateModal(true);
  };

  // Open edit blog modal
  const handleEditBlog = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title || '',
      content: blog.content || '',
      author: blog.author || '',
      category: blog.category || '',
      tags: blog.tags || [],
      image: blog.image || '',
      status: blog.status as 'Published' | 'Draft' || 'Draft'
    });
    setPreviewUrl(blog.image || null);
    setShowEditModal(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle rich text editor changes
  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle image URL input
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, image: url });
    setPreviewUrl(url);
  };
  
  // Toggle between URL and file upload
  const toggleImageInputType = () => {
    setImageInputType(prev => prev === 'url' ? 'file' : 'url');
    // Clear existing values when switching
    if (imageInputType === 'file') {
      setImageFile(null);
    } else {
      setFormData({ ...formData, image: '' });
    }
    setPreviewUrl(null);
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // Handle tag input keypress
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle blog delete
  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteBlogPost(id);
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== id));
      setNotification({
        type: 'success',
        message: 'Blog post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting blog:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete blog post'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter blogs based on search term
  const filteredBlogs = searchTerm 
    ? blogs.filter(blog => 
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : blogs;

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Blog Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your blog posts and articles</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadBlogs}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all border border-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button 
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all"
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Blog
          </button>
        </div>
      </div>

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

      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search blogs..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBlogs.length > 0 ? (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-[200px] truncate">{blog.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {blog.image && (
                        <img src={blog.image} alt={blog.title} className="h-10 w-16 object-cover rounded-md shadow-sm" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {blog.tags && blog.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(blog.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.likes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.shares}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        blog.status === 'Published' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewBlog(blog)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditBlog(blog)}
                          className="text-gray-400 hover:text-yellow-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
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
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p className="font-medium">
                        {searchTerm ? 'No blogs found matching your search criteria.' : 'No blogs found in Firebase database.'}
                      </p>
                      <button 
                        onClick={openCreateModal} 
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create your first blog post
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Blog Modal */}
      {showCreateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Create New Blog Post</h3>
            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleCreateBlog}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="author">
                  Author *
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Category *
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Tags</label>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 rounded-full px-3 py-1 text-sm flex items-center">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Featured Image</label>
              
              {/* Toggle between URL and file upload */}
              <div className="flex mb-3">
                <button
                  type="button"
                  onClick={() => setImageInputType('url')}
                  className={`mr-1 px-4 py-2 rounded-l ${imageInputType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('file')}
                  className={`px-4 py-2 rounded-r ${imageInputType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Upload File
                </button>
              </div>
              
              {/* Show URL input when URL mode is selected */}
              {imageInputType === 'url' && (
                <input
                  type="url"
                  value={formData.image || ''}
                  onChange={handleImageUrlChange}
                  placeholder="Enter image URL"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                />
              )}
              
              {/* Show file upload when file mode is selected */}
              {imageInputType === 'file' && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded mb-2"
                  >
                    {imageFile ? 'Change Image' : 'Select Image'}
                  </button>
                </>
              )}
              
              {/* Image preview (shown for both URL and file inputs) */}
              {previewUrl && (
                <div className="mt-2">
                  <img src={previewUrl} alt="Preview" className="max-h-40 rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setImageFile(null);
                      setFormData({ ...formData, image: '' });
                    }}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs mt-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Content *</label>
              <ReactQuill
                value={formData.content}
                onChange={handleContentChange}
                theme="snow"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{'list': 'ordered'}, {'list': 'bullet'}],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
                className="h-64 mb-10"
              />
            </div>
            
            <div className="flex justify-end mt-8 pt-5 border-t border-gray-200">
              <button
                type="button"
                className="mr-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : 'Create Blog Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Edit Blog Modal */}
    {showEditModal && currentBlog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Edit Blog Post</h3>
            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleUpdateBlog}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-title">
                Title *
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-author">
                  Author *
                </label>
                <input
                  type="text"
                  id="edit-author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-category">
                  Category *
                </label>
                <input
                  type="text"
                  id="edit-category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-status">
                Status
              </label>
              <select
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Tags</label>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 rounded-full px-3 py-1 text-sm flex items-center">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Featured Image</label>
              
              {/* Toggle between URL and file upload */}
              <div className="flex mb-3">
                <button
                  type="button"
                  onClick={() => setImageInputType('url')}
                  className={`mr-1 px-4 py-2 rounded-l ${imageInputType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('file')}
                  className={`px-4 py-2 rounded-r ${imageInputType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Upload File
                </button>
              </div>
              
              {/* Show URL input when URL mode is selected */}
              {imageInputType === 'url' && (
                <input
                  type="url"
                  value={formData.image || ''}
                  onChange={handleImageUrlChange}
                  placeholder="Enter image URL"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                />
              )}
              
              {/* Show file upload when file mode is selected */}
              {imageInputType === 'file' && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded mb-2"
                  >
                    {imageFile ? 'Change Image' : 'Select Image'}
                  </button>
                </>
              )}
              
              {/* Image preview (shown for both URL and file inputs) */}
              {previewUrl && (
                <div className="mt-2">
                  <img src={previewUrl} alt="Preview" className="max-h-40 rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setImageFile(null);
                      setFormData({ ...formData, image: '' });
                    }}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs mt-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Content *</label>
              <ReactQuill
                value={formData.content}
                onChange={handleContentChange}
                theme="snow"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{'list': 'ordered'}, {'list': 'bullet'}],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
                className="h-64 mb-10"
              />
            </div>
            
            <div className="flex justify-end mt-8 pt-5 border-t border-gray-200">
              <button
                type="button"
                className="mr-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : 'Update Blog Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
  );
};

export default AdminBlogManager;
