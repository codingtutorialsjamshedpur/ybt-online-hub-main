import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBlogPostById, getPublishedBlogPosts, updateBlogPostWithImage } from '../services/blogService';
import { BlogPost } from '../types';
import { Timestamp } from 'firebase/firestore';
import '../styles/Blog.css';
import '../styles/BlogPost.css';

// Import markdown parser if using markdown content
import ReactMarkdown from 'react-markdown';

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]); // Placeholder for comments
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  
  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Fetch the blog post and related posts on component mount
  useEffect(() => {
    if (!id) return;
    
    const fetchBlogPost = async () => {
      try {
        setLoading(true);
        const blogPost = await getBlogPostById(id);
        
        if (!blogPost) {
          setError("Blog post not found");
          return;
        }
        
        if (blogPost.status !== 'Published') {
          setError("This blog post is not published");
          return;
        }
        
        setBlog(blogPost);
        
        // Check if post is liked or favorited in localStorage
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        const favoritePosts = JSON.parse(localStorage.getItem('favoritePosts') || '[]');
        
        setIsLiked(likedPosts.includes(blogPost.id));
        setIsFavorite(favoritePosts.includes(blogPost.id));
        
        // Fetch related posts (same category or tags)
        fetchRelatedPosts(blogPost);
      } catch (err) {
        setError("Failed to load blog post: " + String(err));
        console.error("Error loading blog post:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogPost();

    // Show support prompt after user reads 50% of content
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show prompt when user has scrolled 50% of the page
      if (scrollPosition > (documentHeight - windowHeight) * 0.5) {
        setShowSupportPrompt(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);
  
  // Fetch related posts
  const fetchRelatedPosts = async (currentBlog: BlogPost) => {
    try {
      const allPosts = await getPublishedBlogPosts();
      
      // Filter out current blog
      const otherPosts = allPosts.filter(post => post.id !== currentBlog.id);
      
      // Find posts with same category or matching tags
      const sameCategoryPosts = otherPosts.filter(post => post.category === currentBlog.category);
      
      const currentTags = currentBlog.tags || [];
      const matchingTagPosts = otherPosts.filter(post => {
        const postTags = post.tags || [];
        return postTags.some(tag => currentTags.includes(tag));
      });
      
      // Combine and deduplicate
      const combinedPosts = [...sameCategoryPosts, ...matchingTagPosts];
      const uniquePosts = Array.from(new Map(combinedPosts.map(post => [post.id, post])).values());
      
      // Limit to 3 posts
      setRelatedPosts(uniquePosts.slice(0, 3));
    } catch (err) {
      console.error("Error fetching related posts:", err);
    }
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
  
  // Calculate reading time
  const calculateReadingTime = (content: string) => {
    if (!content) return '1 min read';
    
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };
  
  // Handle like button click
  const handleLike = async () => {
    if (!blog || !blog.id) return;
    
    // Toggle like state
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Update localStorage
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    
    if (newLikedState) {
      if (!likedPosts.includes(blog.id)) {
        likedPosts.push(blog.id);
      }
    } else {
      const index = likedPosts.indexOf(blog.id);
      if (index !== -1) {
        likedPosts.splice(index, 1);
      }
    }
    
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    
    // Update blog post in database
    try {
      const updatedLikes = newLikedState ? (blog.likes || 0) + 1 : Math.max((blog.likes || 0) - 1, 0);
      
      // Update local state
      setBlog({
        ...blog,
        likes: updatedLikes
      });
      
      // Update in Firestore
      await updateBlogPostWithImage(blog.id, { likes: updatedLikes });
    } catch (err) {
      console.error("Error updating likes:", err);
      // Revert UI state if update fails
      setIsLiked(!newLikedState);
    }
  };
  
  // Handle favorite button click
  const handleFavorite = () => {
    if (!blog || !blog.id) return;
    
    // Toggle favorite state
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // Update localStorage
    const favoritePosts = JSON.parse(localStorage.getItem('favoritePosts') || '[]');
    
    if (newFavoriteState) {
      if (!favoritePosts.includes(blog.id)) {
        favoritePosts.push(blog.id);
      }
    } else {
      const index = favoritePosts.indexOf(blog.id);
      if (index !== -1) {
        favoritePosts.splice(index, 1);
      }
    }
    
    localStorage.setItem('favoritePosts', JSON.stringify(favoritePosts));
  };
  
  // Handle share button click
  const handleShare = (platform: string) => {
    if (!blog) return;
    
    const url = window.location.href;
    const title = blog.title;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    
    // Update share count
    if (blog.id) {
      try {
        const updatedShares = (blog.shares || 0) + 1;
        
        // Update local state
        setBlog({
          ...blog,
          shares: updatedShares
        });
        
        // Update in Firestore
        updateBlogPostWithImage(blog.id, { shares: updatedShares });
      } catch (err) {
        console.error("Error updating shares:", err);
      }
    }
  };
  
  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !blog) return;
    
    // Here you would typically save the comment to the database
    // For now, we'll just add it to local state
    const newComment = {
      id: `comment-${Date.now()}`,
      author: 'You', // In a real app, this would be the logged-in user
      content: comment,
      date: new Date().toISOString(),
      likes: 0
    };
    
    setComments([newComment, ...comments]);
    setComment('');
  };
  
  // Copy UPI ID to clipboard
  const copyUpiId = () => {
    navigator.clipboard.writeText('7762953796@ybl')
      .then(() => {
        alert('UPI ID copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy UPI ID:', err);
      });
  };

  // Close support prompt
  const closeSupportPrompt = () => {
    setShowSupportPrompt(false);
  };
  
  if (loading) {
    return (
      <div className={`blog-post-page ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }
  
  if (error || !blog) {
    return (
      <div className={`blog-post-page ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error || "Blog post not found"}</p>
          <button onClick={() => navigate('/blog')} className="back-button">
            ← Back to Blog
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`blog-post-page ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Support prompt */}
      {showSupportPrompt && (
        <div className="support-prompt">
          <div className="support-content">
            <button className="close-support" onClick={closeSupportPrompt}>×</button>
            <h3>Enjoying our content?</h3>
            <p>Buy Me A Coffee – a small token if you like our work.</p>
            <div className="upi-container">
              <code>7762953796@ybl</code>
              <button onClick={copyUpiId} className="copy-button">Copy</button>
            </div>
            <div className="support-buttons">
              <button onClick={closeSupportPrompt} className="maybe-later">Maybe Later</button>
              <a
                href="https://www.phonepe.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="phonepe-button"
              >
                Open PhonePe
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Header with dark mode toggle */}
      <div className="post-header-actions">
        <button onClick={() => navigate('/blog')} className="back-button">
          ← Back to Blog
        </button>
        <button 
          className="theme-toggle" 
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Breadcrumb navigation */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> {" / "}
        <Link to="/blog">Blog</Link> {" / "}
        <span>{blog.title}</span>
      </div>
      
      <article className="blog-post">
        {/* Post header */}
        <header className="post-header">
          <h1 className="post-title">{blog.title}</h1>
          
          <div className="post-meta">
            <div className="author">
              <div className="author-avatar">
                {/* Default avatar icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span>{blog.author}</span>
            </div>
            <div className="post-info">
              <span className="date">{formatDate(blog.createdAt || blog.date)}</span>
              <span className="reading-time">{calculateReadingTime(blog.content)}</span>
              <span className="category">{blog.category}</span>
            </div>
          </div>
        </header>
        
        {/* Featured image */}
        {blog.image && (
          <div className="featured-image">
            <img src={blog.image} alt={blog.title} />
          </div>
        )}
        
        {/* Content */}
        <div className="post-content">
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>
        
        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="post-tags">
            {blog.tags.map(tag => (
              <Link 
                key={tag} 
                to={`/blog`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/blog', { state: { tag } });
                }}
                className="post-tag"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Engagement tools */}
        <div className="post-engagement">
          <div className="engagement-buttons">
            <button 
              className={`like-button ${isLiked ? 'active' : ''}`} 
              onClick={handleLike}
            >
              {isLiked ? '❤️' : '🤍'} <span>{blog.likes || 0}</span>
            </button>
            
            <button 
              className={`favorite-button ${isFavorite ? 'active' : ''}`} 
              onClick={handleFavorite}
            >
              {isFavorite ? '⭐' : '☆'} <span>{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
          
          <div className="share-buttons">
            <span>Share:</span>
            <button onClick={() => handleShare('twitter')} className="share-button twitter">
              Twitter
            </button>
            <button onClick={() => handleShare('facebook')} className="share-button facebook">
              Facebook
            </button>
            <button onClick={() => handleShare('linkedin')} className="share-button linkedin">
              LinkedIn
            </button>
            <button onClick={() => handleShare('whatsapp')} className="share-button whatsapp">
              WhatsApp
            </button>
          </div>
        </div>
        
        {/* Author information */}
        <div className="author-section">
          <div className="author-avatar large">
            {/* Default avatar icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="author-info">
            <h3 className="author-name">{blog.author}</h3>
            <p className="author-bio">
              Tech writer and developer passionate about creating innovative solutions and sharing knowledge.
            </p>
          </div>
        </div>
        
        {/* Comment section */}
        <section className="comment-section">
          <h2>Comments</h2>
          
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              placeholder="Leave a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              className="comment-input"
            ></textarea>
            <button type="submit" className="submit-comment">
              Post Comment
            </button>
          </form>
          
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <div className="comment-avatar">
                      {/* Default avatar icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="comment-meta">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-date">
                        {new Date(comment.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                  <div className="comment-actions">
                    <button className="comment-action">
                      🤍 <span>{comment.likes}</span>
                    </button>
                    <button className="comment-action">Reply</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        
        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="related-posts">
            <h2>Related Posts</h2>
            
            <div className="related-posts-grid">
              {relatedPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.id}`} className="related-post-card">
                  <div className="related-post-image">
                    {post.image ? (
                      <img src={post.image} alt={post.title} loading="lazy" />
                    ) : (
                      <div className="image-placeholder">
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="related-post-content">
                    <h3 className="related-post-title">{post.title}</h3>
                    <div className="related-post-meta">
                      <span className="date">{formatDate(post.createdAt || post.date)}</span>
                      <span className="reading-time">{calculateReadingTime(post.content)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* Post navigation */}
        <div className="post-navigation">
          <button onClick={() => navigate('/blog')} className="back-to-blog">
            ← Back to Blog
          </button>
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;
