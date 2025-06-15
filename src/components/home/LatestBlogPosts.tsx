import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedBlogPosts } from '../../services/blogService';
import { BlogPost } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '../../components/ui/skeleton';

const LatestBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        // Fetch latest 3 blog posts
        const latestPosts = await getPublishedBlogPosts(3);
        setPosts(latestPosts);
        setError(null);
      } catch (err) {
        console.error("Error fetching latest blog posts:", err);
        setError("Failed to load latest blog posts");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

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

  // Create excerpt from content
  const createExcerpt = (content: string, maxLength: number = 100) => {
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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">
            Our Latest <span className="text-ybtBlue">Blog Posts</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
            Discover insights, tutorials, and trends in technology, programming, and design.
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <Skeleton className="h-48 w-full" />
                <div className="p-6">
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600">No blog posts available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Link 
                to={`/blog/${post.id}`} 
                key={post.id} 
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-in"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="relative aspect-video">
                  {post.image ? (
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-blue-100 w-full h-full flex items-center justify-center">
                      <span className="text-blue-500 text-sm font-medium">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                    {post.category || 'E-BOOKS'}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span className="mr-3">{post.author}</span>
                    <span>{formatDate(post.createdAt || post.date)}</span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-ybtBlue transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {createExcerpt(post.content)}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2 text-xs text-gray-500">
                      <span>❤️ {post.likes || 0}</span>
                      <span>🔄 {post.shares || 0}</span>
                      <span>{calculateReadingTime(post.content)}</span>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">Read More →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="text-center mt-10">
          <Link 
            to="/blog" 
            className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            View All Posts
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestBlogPosts;
