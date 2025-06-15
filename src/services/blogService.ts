import { 
  fetchBlogPosts, 
  addBlogPost, 
  updateBlogPost, 
  deleteBlogPost, 
  COLLECTIONS 
} from '../firebase/firestore';
import { uploadBlogImage, uploadBase64Image, deleteFile } from '../firebase/storage';
import { BlogPost } from '../types';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Get all blog posts
 * @returns Array of blog posts
 */
export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  return fetchBlogPosts() as Promise<BlogPost[]>;
};

/**
 * Get published blog posts
 * @param limitCount Optional number of posts to return
 * @returns Array of published blog posts
 */
export const getPublishedBlogPosts = async (limitCount?: number): Promise<BlogPost[]> => {
  try {
    // First, get all blog posts
    const allBlogPosts = await fetchBlogPosts();
    
    // Filter for published posts (case-insensitive)
    const publishedPosts = allBlogPosts.filter(blog => {
      // Handle different formats of status (string, with quotes, etc.)
      const status = String(blog.status || '').toLowerCase();
      return status.includes('publish');
    });
    
    // Sort by createdAt in descending order
    const sortedPosts = [...publishedPosts].sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 
                    a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 
                    b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Apply limit if provided
    const result = limitCount ? sortedPosts.slice(0, limitCount) : sortedPosts;
    
    // Log the number of published posts found
    console.log(`Found ${result.length} published blog posts`);
    
    return result;
  } catch (error) {
    console.error('Error fetching published blog posts:', error);
    return [];
  }
};

/**
 * Get blog posts by category
 * @param category Category to filter by
 * @param limitCount Optional number of posts to return
 * @returns Array of blog posts in the specified category
 */
export const getBlogPostsByCategory = async (
  category: string, 
  limitCount?: number
): Promise<BlogPost[]> => {
  try {
    // First, get all blog posts
    const allBlogPosts = await fetchBlogPosts();
    
    // Filter for published posts in the requested category (case-insensitive)
    const publishedCategoryPosts = allBlogPosts.filter(blog => {
      // Match category case-insensitively
      const blogCategory = String(blog.category || '').toLowerCase();
      const searchCategory = category.toLowerCase();
      
      // Match status (handling different formats)
      const status = String(blog.status || '').toLowerCase();
      
      return blogCategory === searchCategory && status.includes('publish');
    });
    
    // Sort by createdAt in descending order
    const sortedPosts = [...publishedCategoryPosts].sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 
                    a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 
                    b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Apply limit if provided
    const result = limitCount ? sortedPosts.slice(0, limitCount) : sortedPosts;
    
    return result;
  } catch (error) {
    console.error('Error fetching category blog posts:', error);
    return [];
  }
};

/**
 * Get a single blog post by ID
 * @param id Blog post ID
 * @returns Blog post or null if not found
 */
export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const posts = await getAllBlogPosts();
    const post = posts.find(post => post.id === id);
    return post || null;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
};

/**
 * Create a new blog post
 * @param blog Blog post data
 * @param imageFile Optional image file to upload
 * @returns ID of the created blog post
 */
export const createBlogPost = async (
  blog: Omit<BlogPost, 'id'>, 
  imageFile?: File
): Promise<string> => {
  try {
    // Upload image if provided
    let imageUrl = blog.image;
    
    if (imageFile) {
      // Generate a temporary ID for the blog post
      const tempId = `temp_${Date.now()}`;
      imageUrl = await uploadBlogImage(imageFile, tempId);
    } else if (blog.image && blog.image.startsWith('data:image')) {
      // Handle base64 image strings
      const tempId = `temp_${Date.now()}`;
      const fileName = `blog_${Date.now()}.jpg`;
      imageUrl = await uploadBase64Image(blog.image, `blogs/${tempId}`, fileName);
    }
    
    // Create blog post with image URL and ensure all required fields are present
    const blogData = {
      ...blog,
      author: blog.author || 'Admin',
      category: blog.category || 'Uncategorized',
      content: blog.content || '',
      image: imageUrl || '',
      likes: blog.likes || 0,
      shares: blog.shares || 0,
      status: blog.status || 'Draft',
      tags: blog.tags || [],
      title: blog.title || 'Untitled Post',
      date: blog.date || new Date().toISOString()
    };
    
    // Add blog to Firestore
    const blogId = await addBlogPost(blogData);
    
    return blogId;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

/**
 * Update an existing blog post
 * @param id Blog post ID
 * @param blog Updated blog post data
 * @param imageFile Optional new image file
 * @returns Promise that resolves when update is complete
 */
export const updateBlogPostWithImage = async (
  id: string,
  blog: Partial<BlogPost>,
  imageFile?: File
): Promise<void> => {
  try {
    let imageUrl = blog.image;
    
    // If there's a new image file, upload it
    if (imageFile) {
      imageUrl = await uploadBlogImage(imageFile, id);
    } else if (blog.image && blog.image.startsWith('data:image')) {
      // Handle base64 image strings
      const fileName = `blog_${Date.now()}.jpg`;
      imageUrl = await uploadBase64Image(blog.image, `blogs/${id}`, fileName);
    }
    
    // Update blog with new image URL if applicable and ensure all fields are properly formatted
    const blogData = {
      ...blog,
      ...(imageUrl !== blog.image ? { image: imageUrl } : {}),
      // Only update these fields if they are provided in the blog parameter
      ...(blog.author !== undefined ? { author: blog.author } : {}),
      ...(blog.category !== undefined ? { category: blog.category } : {}),
      ...(blog.content !== undefined ? { content: blog.content } : {}),
      ...(blog.status !== undefined ? { status: blog.status } : {}),
      ...(blog.tags !== undefined ? { tags: blog.tags } : {}),
      ...(blog.title !== undefined ? { title: blog.title } : {}),
      ...(blog.likes !== undefined ? { likes: blog.likes } : {}),
      ...(blog.shares !== undefined ? { shares: blog.shares } : {}),
      ...(blog.date !== undefined ? { date: blog.date } : {})
    };
    
    // Update blog in Firestore
    await updateBlogPost(id, blogData);
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
};

/**
 * Delete a blog post and its associated image
 * @param id Blog post ID
 * @param imageUrl Optional image URL to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteBlogPostWithImage = async (
  id: string, 
  imageUrl?: string
): Promise<void> => {
  try {
    // Delete the blog post from Firestore
    await deleteBlogPost(id);
    
    // If there's an image URL, delete the image from storage
    if (imageUrl) {
      await deleteFile(imageUrl).catch(err => {
        console.warn('Failed to delete image:', err);
        // Continue even if image deletion fails
      });
    }
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
};
