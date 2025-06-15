import { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '../types';
import { 
  getAllBlogPosts, 
  createBlogPost, 
  updateBlogPostWithImage, 
  deleteBlogPostWithImage 
} from '../services/blogService';

/**
 * Custom hook for blog management with enhanced Firebase integration
 */
export const useBlogManagement = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all blog posts
   */
  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const blogData = await getAllBlogPosts();
      setBlogs(blogData);
    } catch (err) {
      console.error('Error loading blogs:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load blogs on mount
  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);
  
  /**
   * Force clear local blogs state and reload from Firestore
   */
  const forceClearLocalBlogs = async () => {
    console.log('Forcing clear of local blog state');
    setBlogs([]);
    return await loadBlogs();
  };

  /**
   * Add a new blog post with image handling
   */
  const addBlog = async (blog: Omit<BlogPost, 'id'>, imageFile?: File): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      // Use the blogService to create a blog post with image handling
      const blogId = await createBlogPost(blog, imageFile);
      
      // Update the local state with the new blog
      const blogWithId: BlogPost = { ...blog, id: blogId };
      setBlogs(prevBlogs => [...prevBlogs, blogWithId]);
      
      return blogId;
    } catch (err) {
      console.error('Error adding blog:', err);
      setError('Failed to create blog post');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing blog post with optional image
   */
  const updateBlog = async (id: string, blog: Partial<BlogPost>, imageFile?: File): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Use the blogService to update the blog post with image handling
      await updateBlogPostWithImage(id, blog, imageFile);
      
      // Update the local state
      setBlogs(prevBlogs => 
        prevBlogs.map(prevBlog => 
          prevBlog.id === id ? { ...prevBlog, ...blog } : prevBlog
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating blog:', err);
      setError('Failed to update blog post');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a blog post and its associated image
   */
  const deleteBlog = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Find the blog to get its image URL
      const blogToDelete = blogs.find(blog => blog.id === id);
      
      if (!blogToDelete) {
        throw new Error('Blog not found');
      }
      
      // Use the blogService to delete both the blog post and its image
      await deleteBlogPostWithImage(id, blogToDelete.image);
      
      // Update the local state
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting blog:', err);
      setError('Failed to delete blog post');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a blog post by ID
   */
  const getBlogById = (id: string): BlogPost | undefined => {
    return blogs.find(blog => blog.id === id);
  };

  /**
   * Filter blogs by search term
   */
  const filterBlogs = (searchTerm: string): BlogPost[] => {
    if (!searchTerm.trim()) return blogs;
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    return blogs.filter(blog => 
      blog.title.toLowerCase().includes(lowerCaseSearch) ||
      blog.content.toLowerCase().includes(lowerCaseSearch) ||
      blog.category.toLowerCase().includes(lowerCaseSearch) ||
      blog.author.toLowerCase().includes(lowerCaseSearch) ||
      blog.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearch))
    );
  };

  return {
    blogs,
    loading,
    error,
    loadBlogs,
    addBlog,
    updateBlog,
    deleteBlog,
    getBlogById,
    filterBlogs,
    forceClearLocalBlogs
  };
};
