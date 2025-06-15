import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBlogManagement } from '../../hooks/useBlogManagement';
import { BlogPost } from '../../types';
import './BlogManagement.css';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Rich text editor
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import custom CSS for enhanced editor
import './EnhancedEditor.css';

interface BlogFormData {
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  status: 'Published' | 'Draft';
}

interface ValidationErrors {
  title?: string;
  content?: string;
  author?: string;
  category?: string;
  image?: string;
}

// Pagination settings
const ITEMS_PER_PAGE = 10;

// Format Firebase timestamp to readable date
const formatDate = (date: string | Timestamp | Date | undefined): string => {
  if (!date) return '';
  
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  } else if (date instanceof Date) {
    return date.toLocaleDateString();
  } else if (typeof date === 'string') {
    return new Date(date).toLocaleDateString();
  }
  
  return '';
};

const BlogManagement: React.FC = () => {
  const {
    blogs,
    loading,
    error,
    loadBlogs,
    addBlog,
    updateBlog,
    deleteBlog,
    filterBlogs
  } = useBlogManagement();
  
  // Get user data for authentication check
  const { userData } = useAuth();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [imageCompressing, setImageCompressing] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Enhanced editor states
  const [inlineImageLoading, setInlineImageLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [quillRef, setQuillRef] = useState<any>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkSelection, setLinkSelection] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const quillEditorRef = useRef<any>(null);
  
  // Filter blogs based on search term
  const filteredBlogs = searchTerm ? filterBlogs(searchTerm) : blogs;
  
  // Register Quill modules when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use dynamic imports for Quill modules
      const setupQuillModules = async () => {
        try {
          const Quill = ReactQuill.Quill;
          const ImageResize = (await import('quill-image-resize-module-react')).default;
          const { ImageDrop } = await import('quill-image-drop-module');
          const BlotFormatter = (await import('quill-blot-formatter')).default;
          const QuillBetterTable = (await import('quill-better-table')).default;
          
          Quill.register('modules/imageResize', ImageResize);
          Quill.register('modules/imageDrop', ImageDrop);
          Quill.register('modules/blotFormatter', BlotFormatter);
          Quill.register('modules/table', QuillBetterTable);
          
          console.log('Quill modules registered successfully');
        } catch (error) {
          console.error('Error registering Quill modules:', error);
        }
      };
      
      setupQuillModules();
    }
  }, []);
  
  // Calculate total pages based on filtered blogs
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE)));
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filteredBlogs.length]);
  
  // Get current page blogs
  const indexOfLastBlog = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstBlog = indexOfLastBlog - ITEMS_PER_PAGE;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Set up editor reference when component mounts
  useEffect(() => {
    if (quillEditorRef.current) {
      const editor = quillEditorRef.current.getEditor();
      setQuillRef(editor);
    }
  }, [quillEditorRef.current]);

  // Handle rich text editor changes
  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
  };
  
  // Handler for inserting images through the toolbar button
  const handleImageInsert = () => {
    // Create and trigger click on a hidden file input
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    // Handle file selection
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        await uploadAndInsertImage(input.files[0]);
      }
    };
  };
  
  // Handler for inserting images through the custom button
  const handleInsertImage = () => {
    if (inlineImageInputRef.current) {
      inlineImageInputRef.current.click();
    }
  };
  
  // Handle inline image file selection
  const handleInlineImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadAndInsertImage(file);
      // Clear the input so the same file can be selected again
      e.target.value = '';
    }
  };
  
  // Upload image and insert at cursor position
  const uploadAndInsertImage = async (file: File) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        message: 'Image size must be less than 5MB',
        type: 'error'
      });
      return;
    }
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setNotification({
        message: 'File must be an image',
        type: 'error'
      });
      return;
    }
    
    setInlineImageLoading(true);
    setUploadProgress(0);
    
    try {
      // Generate a unique file name
      const timestamp = Date.now();
      const fileName = `blog_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `blog-images/${fileName}`);
      
      // Upload to Firebase storage with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Track upload progress
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          // Handle errors
          console.error('Error uploading image:', error);
          setNotification({
            message: 'Failed to upload image. Please try again.',
            type: 'error'
          });
          setInlineImageLoading(false);
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Insert image at current cursor position
          if (quillRef) {
            const range = quillRef.getSelection(true);
            quillRef.insertEmbed(range.index, 'image', downloadURL);
            quillRef.setSelection(range.index + 1, 0);
          }
          
          setInlineImageLoading(false);
          setNotification({
            message: 'Image inserted successfully',
            type: 'success'
          });
        }
      );
    } catch (error) {
      console.error('Error in image upload process:', error);
      setNotification({
        message: 'Error uploading image. Please try again.',
        type: 'error'
      });
      setInlineImageLoading(false);
    }
  };
  
  // Handler for inserting links
  const handleInsertLink = () => {
    if (quillRef) {
      const selection = quillRef.getSelection();
      if (selection) {
        // Get selected text if any
        let text = '';
        if (selection.length > 0) {
          text = quillRef.getText(selection.index, selection.length);
        }
        
        // Save the selection and set the link text
        setLinkSelection(selection);
        setLinkText(text);
        setLinkUrl('');
        setShowLinkModal(true);
      } else {
        setNotification({
          message: 'Please position your cursor where you want to insert the link',
          type: 'error'
        });
      }
    }
  };
  
  // Handler for inserting the link into the editor
  const handleLinkSubmit = () => {
    if (quillRef && linkSelection) {
      // Format URL if needed
      let url = linkUrl;
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Insert the link
      quillRef.deleteText(linkSelection.index, linkSelection.length);
      quillRef.insertText(linkSelection.index, linkText || url, 'link', url);
      quillRef.setSelection(linkSelection.index + (linkText || url).length, 0);
      
      // Close the modal
      setShowLinkModal(false);
      
      // Show notification
      setNotification({
        message: 'Link inserted successfully',
        type: 'success'
      });
    }
  };
  
  // Handler for inserting a new paragraph at cursor position
  const handleInsertParagraph = () => {
    if (quillRef) {
      const range = quillRef.getSelection(true);
      if (range) {
        // Insert two newlines to create a paragraph break
        quillRef.insertText(range.index, '\n\n');
        quillRef.setSelection(range.index + 2, 0);
        
        // Focus the editor after inserting paragraph
        quillRef.focus();
        
        // Show notification
        setNotification({
          message: 'New paragraph inserted',
          type: 'success'
        });
      } else {
        setNotification({
          message: 'Please position your cursor where you want to insert a paragraph break',
          type: 'error'
        });
      }
    }
  };
  
  // Handler for inserting a tab at cursor position
  const handleInsertTab = () => {
    if (quillRef) {
      const range = quillRef.getSelection(true);
      if (range) {
        // Insert a tab character (4 spaces for better compatibility)
        quillRef.insertText(range.index, '    ');
        quillRef.setSelection(range.index + 4, 0);
        
        // Focus the editor after inserting tab
        quillRef.focus();
      } else {
        setNotification({
          message: 'Please position your cursor where you want to insert a tab',
          type: 'error'
        });
      }
    }
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

  // Handle image file selection with compression
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 5MB'
        }));
        return;
      }
      
      // Validate file type
      if (!file.type.match('image.*')) {
        setValidationErrors(prev => ({
          ...prev,
          image: 'File must be an image'
        }));
        return;
      }
      
      setImageFile(file);
      setValidationErrors(prev => ({ ...prev, image: undefined }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        
        // Compress image if larger than 1MB
        if (file.size > 1024 * 1024) {
          compressImage(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Compress image to reduce size
  const compressImage = (file: File) => {
    setImageCompressing(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        const maxHeight = 1200;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas with new dimensions
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              setImageFile(compressedFile);
              setNotification({
                message: `Image compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                type: 'success'
              });
            }
            setImageCompressing(false);
          },
          'image/jpeg',
          0.7 // 70% quality
        );
      };
    };
  };

  // Open modal for creating a new blog
  const openCreateModal = () => {
    setFormData({
      title: '',
      content: '',
      author: '',
      category: '',
      tags: [],
      image: '',
      status: 'Draft'
    });
    setImageFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open modal for editing a blog
  const openEditModal = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      tags: blog.tags || [],
      image: blog.image || '',
      status: blog.status as 'Published' | 'Draft'
    });
    setPreviewUrl(blog.image || null);
    setImageFile(null);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Open modal for viewing a blog
  const openViewModal = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setIsViewModalOpen(true);
  };

  // Open modal for confirming blog deletion
  const openDeleteModal = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setIsDeleteModalOpen(true);
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Required fields validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }
    
    if (!formData.author.trim()) {
      errors.author = 'Author is required';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setNotification({ message: 'Please fix the errors in the form', type: 'error' });
      return;
    }
    
    setSubmitting(true);
    setNetworkError(null);
    
    try {
      const blogData: Omit<BlogPost, 'id'> = {
        ...formData,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: isEditing ? currentBlog?.likes || 0 : 0,
        shares: isEditing ? currentBlog?.shares || 0 : 0,
      };

      let success = false;
      
      if (isEditing && currentBlog) {
        // Update existing blog
        success = await updateBlog(currentBlog.id, blogData, imageFile || undefined);
        if (success) {
          setNotification({ message: 'Blog updated successfully', type: 'success' });
        }
      } else {
        // Create new blog
        const blogId = await addBlog(blogData, imageFile || undefined);
        success = !!blogId;
        if (success) {
          setNotification({ message: 'Blog created successfully', type: 'success' });
        }
      }

      if (success) {
        // Close modal and refresh blogs
        setIsModalOpen(false);
        loadBlogs();
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      setNetworkError(error instanceof Error ? error.message : 'Unknown error occurred');
      setNotification({ message: 'Error saving blog post', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle blog deletion
  const handleDelete = async () => {
    if (!currentBlog) return;
    
    setSubmitting(true);
    
    try {
      const success = await deleteBlog(currentBlog.id);
      
      if (success) {
        setNotification({ message: 'Blog deleted successfully', type: 'success' });
        setIsDeleteModalOpen(false);
        loadBlogs();
      } else {
        setNotification({ message: 'Failed to delete blog', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      setNotification({ message: 'Error deleting blog post', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check if user is authenticated and has admin role
  const isAdmin = userData?.role === 'admin';
  
  // Handle loading state for authentication and force refresh from Firebase
  useEffect(() => {
    // Re-load blogs data when user authentication is confirmed
    if (userData && isAdmin) {
      // Force clear any local blog data and reload directly from Firebase
      // This ensures we're showing the actual Firebase data, not local dummy data
      console.log('Forcing reload of blogs from Firebase');
      loadBlogs();
    }
  }, [userData, isAdmin]);
  
  // Add a force refresh button to manually reload from Firebase
  const forceRefreshFromFirebase = () => {
    setNotification({ message: 'Refreshing blogs from Firebase...', type: 'success' });
    loadBlogs();
  };
  
  // If not admin, show access denied message
  if (userData && !isAdmin) {
    return (
      <div className="access-denied">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h2>Access Denied</h2>
        <p>You don't have permission to access blog management. Only administrators can manage blog posts.</p>
      </div>
    );
  }
  
  // If authentication is still loading, show a loading state
  if (!userData) {
    return (
      <div className="blog-management-loading">
        <div className="loading-spinner">Loading authentication...</div>
      </div>
    );
  }
  
  return (
    <div className="blog-management">
      {/* Header and search */}
      <div className="blog-management-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={() => setSearchTerm('')} className="clear-button">
            {searchTerm && 'Clear'}
          </button>
        </div>
        <div className="button-group">
          <button onClick={forceRefreshFromFirebase} className="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Refresh from Firebase
          </button>
          <button onClick={openCreateModal} className="create-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Blog Post
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Network error display */}
      {networkError && (
        <div className="error-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
          <span>Network Error: {networkError}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && <div className="loading-spinner">Loading...</div>}

      {/* Blog list */}
      <div className="blog-list">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Author</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBlogs.length > 0 ? (
              currentBlogs.map(blog => (
                <tr key={blog.id}>
                  <td className="blog-title">{blog.title}</td>
                  <td>{blog.category}</td>
                  <td>{blog.author}</td>
                  <td>
                    <span className={`status ${blog.status?.toLowerCase()}`}>
                      {blog.status}
                    </span>
                  </td>
                  <td>{formatDate(blog.date)}</td>
                  <td className="actions">
                    <button
                      onClick={() => openViewModal(blog)}
                      className="view-button"
                      title="View"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      onClick={() => openEditModal(blog)}
                      className="edit-button"
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => openDeleteModal(blog)}
                      className="delete-button"
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-blogs">
                  {searchTerm
                    ? "No blogs found matching your search"
                    : "No blogs available. Create your first blog post!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <div className="pagination-pages">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`pagination-page ${currentPage === index + 1 ? 'active' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {/* Hidden file input for inline images */}
      <input
        type="file"
        ref={inlineImageInputRef}
        onChange={handleInlineImageChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      {/* Link insertion modal */}
      {showLinkModal && (
        <div className="modal-overlay">
          <div className="modal-content link-modal">
            <div className="modal-header">
              <h3>Insert Link</h3>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            <div className="link-form">
              <div className="form-group">
                <label htmlFor="linkText">Link Text</label>
                <input
                  type="text"
                  id="linkText"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text to display"
                  className="link-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="linkUrl">URL</label>
                <input
                  type="text"
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="link-input"
                  required
                />
              </div>
              <div className="link-actions">
                <button 
                  type="button" 
                  onClick={() => setShowLinkModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleLinkSubmit}
                  className="submit-button"
                  disabled={!linkUrl.trim()}
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Blog form modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isEditing ? "Edit Blog Post" : "Create New Blog Post"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  className={validationErrors.title ? 'input-error' : ''}
                />
                {validationErrors.title && (
                  <span className="field-error">{validationErrors.title}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="author">Author *</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    className={validationErrors.author ? 'input-error' : ''}
                  />
                  {validationErrors.author && (
                    <span className="field-error">{validationErrors.author}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className={validationErrors.category ? 'input-error' : ''}
                  />
                  {validationErrors.category && (
                    <span className="field-error">{validationErrors.category}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    id="tagInput"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="add-tag-button"
                  >
                    Add
                  </button>
                </div>
                <div className="tags-container">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">Featured Image</label>
                <input
                  type="file"
                  id="image"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div className="image-upload-container">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="image-upload-button"
                    disabled={imageCompressing}
                  >
                    {imageCompressing ? 'Compressing...' : (previewUrl ? 'Change Image' : 'Upload Image')}
                  </button>
                  {validationErrors.image && (
                    <span className="field-error">{validationErrors.image}</span>
                  )}
                  {previewUrl && (
                    <div className="image-preview">
                      <img src={previewUrl} alt="Preview" />
                      <div className="image-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(null);
                            setImageFile(null);
                            setFormData({ ...formData, image: '' });
                            setValidationErrors(prev => ({ ...prev, image: undefined }));
                          }}
                          className="remove-image"
                          disabled={imageCompressing}
                        >
                          Remove Image
                        </button>
                        {imageFile && (
                          <span className="image-info">
                            {(imageFile.size / 1024 / 1024).toFixed(2)}MB - {imageFile.type.split('/')[1].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="content">Content *</label>
                <div className="enhanced-editor-container">
                  <ReactQuill
                    ref={quillEditorRef}
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={{
                      toolbar: {
                        container: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'align': [] }],
                          ['blockquote', 'code-block'],
                          ['link', 'image', 'video'],
                          ['table'],
                          ['clean']
                        ],
                        handlers: {
                          image: handleImageInsert
                        }
                      },
                      imageResize: {
                        modules: ['Resize', 'DisplaySize']
                      },
                      imageDrop: true,
                      blotFormatter: {},
                      table: true
                    }}
                    formats={[
                      'header',
                      'bold', 'italic', 'underline', 'strike',
                      'list', 'bullet', 'indent',
                      'link', 'image', 'video',
                      'color', 'background',
                      'align', 'blockquote', 'code-block',
                      'table', 'table-cell', 'table-row', 'table-header',
                      'caption'
                    ]}
                    className={`enhanced-quill ${validationErrors.content ? 'quill-error' : ''}`}
                    placeholder="Start writing your blog post here..."
                  />
                  {inlineImageLoading && (
                    <div className="image-upload-progress">
                      <div 
                        className="image-upload-progress-bar" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                {validationErrors.content && (
                  <span className="field-error">{validationErrors.content}</span>
                )}
                <div className="content-toolbar">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={handleInsertImage}
                    title="Insert image at cursor position"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M20.4 14.5L16 10 4 20" />
                    </svg>
                    Insert Image
                  </button>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={handleInsertLink}
                    title="Insert link at cursor position"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Insert Link
                  </button>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={handleInsertParagraph}
                    title="Insert a new paragraph at cursor position"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10H3" />
                      <path d="M21 6H3" />
                      <path d="M21 14H3" />
                      <path d="M21 18H3" />
                    </svg>
                    New Paragraph
                  </button>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={handleInsertTab}
                    title="Insert a tab at cursor position"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 17l-5-5 5-5" />
                      <path d="M18 17V7" />
                    </svg>
                    Tab
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cancel-button"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View blog modal */}
      {isViewModalOpen && currentBlog && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h2>Blog Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            <div className="blog-view">
              {currentBlog.image && (
                <div className="blog-image">
                  <img src={currentBlog.image} alt={currentBlog.title} />
                </div>
              )}
              <h1 className="blog-title">{currentBlog.title}</h1>
              <div className="blog-meta">
                <span className="author">By {currentBlog.author}</span>
                <span className="date">Published on {formatDate(currentBlog.date)}</span>
                <span className={`status ${currentBlog.status?.toLowerCase()}`}>
                  {currentBlog.status}
                </span>
              </div>
              <div className="blog-categories">
                <span className="category">{currentBlog.category}</span>
                {currentBlog.tags && currentBlog.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div className="blog-stats">
                <span className="likes">{currentBlog.likes} Likes</span>
                <span className="shares">{currentBlog.shares} Shares</span>
              </div>
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: currentBlog.content }}
              />
            </div>
            <div className="form-actions">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(currentBlog);
                }}
                className="edit-button"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openDeleteModal(currentBlog);
                }}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && currentBlog && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            <p>
              Are you sure you want to delete the blog post "{currentBlog.title}"?
              This action cannot be undone.
            </p>
            <div className="form-actions">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="cancel-button"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="delete-button"
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
