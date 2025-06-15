import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedBlogPosts, getBlogPostsByCategory } from '../services/blogService';
import { BlogPost } from '../types';
import { Timestamp } from 'firebase/firestore';
import '../styles/Blog.css';
import '../styles/Blog-grid.css';
import Breadcrumb from '../components/Breadcrumb';
import { Helmet } from 'react-helmet-async';
import { Skeleton } from '../components/ui/skeleton';
import BuyMeCoffee from '../components/products/BuyMeCoffee';

const BlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Add dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Load blog posts on component mount
  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, selectedTag]);
  
  // Filter blogs based on search term
  useEffect(() => {
    if (blogs.length > 0) {
      filterBlogs();
    }
  }, [searchTerm, blogs]);
  
  // Fetch published blog posts
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      
      let fetchedBlogs: BlogPost[];
      
      // Fetch blogs by category or all published blogs
      if (selectedCategory) {
        fetchedBlogs = await getBlogPostsByCategory(selectedCategory);
      } else {
        fetchedBlogs = await getPublishedBlogPosts();
      }
      
      // Filter by tag if selected
      if (selectedTag) {
        fetchedBlogs = fetchedBlogs.filter(blog => 
          blog.tags && blog.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
        );
      }
      
      // Extract all categories and tags
      const categories = Array.from(new Set(fetchedBlogs.map(blog => blog.category)));
      
      const tags = Array.from(
        new Set(
          fetchedBlogs.flatMap(blog => blog.tags || [])
        )
      );
      
      setAllCategories(categories);
      setAllTags(tags);
      setBlogs(fetchedBlogs);
      setFilteredBlogs(fetchedBlogs);
      setError(null);
    } catch (err) {
      setError("Failed to load blog posts: " + String(err));
      console.error("Error loading blogs:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter blogs based on search term
  const filterBlogs = () => {
    if (!searchTerm.trim()) {
      setFilteredBlogs(blogs);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = blogs.filter(blog => {
      const titleMatch = blog.title.toLowerCase().includes(searchTermLower);
      const contentMatch = blog.content.toLowerCase().includes(searchTermLower);
      const authorMatch = blog.author.toLowerCase().includes(searchTermLower);
      const categoryMatch = blog.category.toLowerCase().includes(searchTermLower);
      const tagMatch = blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchTermLower));
      
      return titleMatch || contentMatch || authorMatch || categoryMatch || tagMatch;
    });
    
    setFilteredBlogs(filtered);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Format date for display
  const formatDate = (date: string | Timestamp | undefined) => {
    if (!date) return 'Unknown date';
    
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle category filter click
  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory('');
    } else {
      setSelectedCategory(category);
      setSelectedTag('');
    }
  };
  
  // Handle tag filter click
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag('');
    } else {
      setSelectedTag(tag);
    }
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedTag('');
  };
  
  // Create excerpt from content
  const createExcerpt = (content: string, maxLength: number = 150) => {
    if (!content) return '';
    
    // Remove HTML tags if any
    const textContent = content.replace(/<[^>]+>/g, '');
    
    if (textContent.length <= maxLength) return textContent;
    
    return textContent.substring(0, maxLength) + '...';
  };
  
  // Calculate reading time
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog | CTJ Digital Products</title>
        <meta name="description" content="Explore the latest in tech with insights, tutorials, and trends in technology, programming, and design." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Blog', path: '/blog' }]} />
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore the Latest in Tech</h1>
            <p className="text-gray-600">Discover insights, tutorials, and trends in technology, programming, and design.</p>
          </div>
          
          <div className="relative w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search posts..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-3 pr-10 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Filters</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {allCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedCategory === category ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                {(selectedCategory || selectedTag || searchTerm) && (
                  <button 
                    className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4">
                      <Skeleton className="h-4 w-1/4 mb-2" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p>{error}</p>
                <button 
                  onClick={fetchBlogs}
                  className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={resetFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'post' : 'posts'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredBlogs.map(blog => (
                    <Link to={`/blog/${blog.id}`} key={blog.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-video relative overflow-hidden">
                        {blog.image ? (
                          <img src={blog.image} alt={blog.title} className="object-cover w-full h-full" loading="lazy" />
                        ) : (
                          <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                          {blog.category}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <span className="mr-3">{blog.author}</span>
                          <span>{formatDate(blog.createdAt || blog.date)}</span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{blog.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{createExcerpt(blog.content)}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2 text-xs text-gray-500">
                            <span>❤️ {blog.likes || 0}</span>
                            <span>🔄 {blog.shares || 0}</span>
                            <span>{calculateReadingTime(blog.content)}</span>
                          </div>
                          <span className="text-blue-600 text-sm font-medium">Read More →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Buy Me a Coffee */}
      <BuyMeCoffee />
    </div>
  );
};

export default BlogPage;
