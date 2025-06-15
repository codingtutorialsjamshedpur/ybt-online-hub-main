import React, { useState } from 'react';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  addDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/firestore';
import { Button, Alert, Card, Spinner } from '../../components/ui';

// New blog posts data exactly matching the Firestore collection structure
const newBlogPosts = [
  {
    title: "Welcome to Our Digital Hub!",
    content: "Main content in markdown format",
    author: "Shourav Kumar",
    category: "Announcement",
    date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
    image: "URL to featured image",
    likes: 120,
    shares: 45,
    status: "Published",
    tags: ["digital", "news"],
    id: "B001" // We'll set this explicitly to match your format
  },
  {
    title: "How to Maximize Your E-Book Sales",
    content: "This is a detailed blog post about digital products. It includes information about various digital services and products that we offer. The content is formatted with markdown to allow for rich text presentation.",
    author: "Shourav Kumar",
    category: "E-BOOKS",
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], // 7 days ago
    image: "https://firebasestorage.googleapis.com/v0/b/ctjsr-c8be4.appspot.com/o/blogs%2Fe-books-image.jpg?alt=media",
    likes: 85,
    shares: 30,
    status: "Draft",
    tags: ["ebooks", "sales", "marketing"],
    id: "B002"
  },
  {
    title: "Web Development Trends 2025",
    content: "Web development",
    author: "Shourav Kumar",
    category: "Web development",
    date: "2025-05-15", // Fixed date matching screenshot
    image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
    likes: 15,
    shares: 10,
    status: "Draft",
    tags: ["Web Development"],
    id: "twY5aZsO6WzjYVuSgP5c" // Exact ID from your screenshot
  },
  {
    title: "Modern Web Development Approaches",
    content: "A summary of modern web development approaches and techniques for 2025",
    author: "Shourav Kumar",
    category: "Technology",
    date: "2025-05-20", // Today's date in your timezone
    image: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80",
    likes: 0,
    shares: 0,
    status: "Draft",
    tags: ["development", "technology", "web"],
    id: "B003"
  }
];

const ResetBlogs = ({ onReset }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState('');
  const [progress, setProgress] = useState(0);

  // Function to remove all existing blog posts
  const removeExistingBlogs = async () => {
    try {
      setStep('Removing existing blog posts...');
      setProgress(10);
      
      const blogsRef = collection(db, COLLECTIONS.BLOGS);
      const snapshot = await getDocs(blogsRef);
      
      // Delete each document
      let completedDeletes = 0;
      const totalDocs = snapshot.docs.length;
      
      if (totalDocs === 0) {
        setProgress(30);
        setStep('No existing blog posts to remove.');
        return 0;
      }
      
      const deletePromises = snapshot.docs.map(async (docSnapshot) => {
        await deleteDoc(doc(db, COLLECTIONS.BLOGS, docSnapshot.id));
        completedDeletes++;
        // Update progress based on completed deletes
        setProgress(10 + Math.floor((completedDeletes / totalDocs) * 20));
        setStep(`Removed ${completedDeletes}/${totalDocs} blog posts...`);
      });
      
      await Promise.all(deletePromises);
      setProgress(30);
      setStep(`Removed all ${totalDocs} existing blog posts.`);
      return totalDocs;
    } catch (error) {
      console.error('Error removing blog posts:', error);
      setError(`Error removing blog posts: ${error.message}`);
      throw error;
    }
  };

  // Function to add new blog posts
  const addNewBlogs = async () => {
    try {
      setStep('Adding new blog posts...');
      setProgress(40);
      
      let addedCount = 0;
      
      for (const blog of newBlogPosts) {
        // Add timestamps
        const { id, ...blogData } = blog; // Extract ID from blog data
        
        const blogWithTimestamps = {
          ...blogData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Use setDoc with the custom ID instead of addDoc which generates a random ID
        const docRef = doc(db, COLLECTIONS.BLOGS, blogPost.id);
        await setDoc(docRef, blogWithTimestamps);
        
        addedCount++;
        
        // Update progress
        setProgress(40 + Math.floor((addedCount / newBlogPosts.length) * 50));
        setStep(`Added ${addedCount}/${newBlogPosts.length} new blog posts...`);
      }
      
      setProgress(90);
      setStep(`Added all ${addedCount} new blog posts.`);
      return addedCount;
    } catch (error) {
      console.error('Error adding blog posts:', error);
      setError(`Error adding blog posts: ${error.message}`);
      throw error;
    }
  };

  // Function to just remove all blog posts (no new ones added)
  const handleRemoveAllBlogs = async () => {
    if (!window.confirm('This will delete ALL existing blog posts WITHOUT creating new ones. Are you sure?')) {
      return;
    }
    
    try {
      setIsResetting(true);
      setError(null);
      setSuccessMessage('');
      setStatus('Removing all blog posts...');
      setProgress(5);
      
      // Remove existing blogs
      const removedCount = await removeExistingBlogs();
      
      setProgress(100);
      setStep('Removal completed successfully!');
      setSuccessMessage(`Successfully removed ${removedCount} blog posts.`);
      setStatus('Removal completed!');
      
      // Call the onReset callback to refresh the parent component's blog list
      if (typeof onReset === 'function') {
        onReset();
      }
      
      // Wait 3 seconds before allowing reset again
      setTimeout(() => {
        setIsResetting(false);
      }, 3000);
    } catch (error) {
      setStatus('Removal failed!');
      setProgress(0);
    }
  };

  // Function to reset blogs
  const handleResetBlogs = async () => {
    if (!window.confirm('This will delete all existing blog posts and create new ones. Are you sure?')) {
      return;
    }
    
    try {
      setIsResetting(true);
      setError(null);
      setSuccessMessage('');
      setStatus('Resetting blog posts...');
      setProgress(5);
      
      // Remove existing blogs
      const removedCount = await removeExistingBlogs();
      
      // Add new blogs
      const addedCount = await addNewBlogs();
      
      setProgress(100);
      setStep('Reset completed successfully!');
      setSuccessMessage(`Successfully removed ${removedCount} blog posts and added ${addedCount} new ones.`);
      setStatus('Reset completed!');
      
      // Call the onReset callback to refresh the parent component's blog list
      if (typeof onReset === 'function') {
        onReset();
      }
      
      // Wait 3 seconds before allowing reset again
      setTimeout(() => {
        setIsResetting(false);
      }, 3000);
    } catch (error) {
      setStatus('Reset failed!');
      setProgress(0);
    }
  };

  return (
    <Card className="p-6 shadow-lg rounded-lg">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Reset Blog Posts</h2>
        
        <p>
          Click the button below to delete all existing blog posts and create new ones with proper content and structure.
          New blog posts will include 3 published posts and 1 draft post across different categories.
        </p>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <p>{error}</p>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-4 bg-green-100 border-green-600 text-green-800">
            <p>{successMessage}</p>
          </Alert>
        )}
        
        {isResetting && (
          <div className="mb-4 space-y-2">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-sm">{status}</span>
              <span className="text-sm">{progress}%</span>
            </div>
            <p className="text-sm text-gray-500">{step}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <Button
            onClick={handleRemoveAllBlogs}
            disabled={isResetting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            {isResetting && status.includes('Removing') ? (
              <>
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                Removing All Blog Posts...
              </>
            ) : (
              'Remove All Blog Posts'
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-sm text-gray-500">OR</span>
            </div>
          </div>
          
          <Button
            onClick={handleResetBlogs}
            disabled={isResetting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isResetting && !status.includes('Removing') ? (
              <>
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                Resetting Blog Posts...
              </>
            ) : (
              'Reset Blog Posts'
            )}
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>Note:</strong> This will create the following new blog posts:</p>
          <ul className="list-disc pl-5 mt-2">
            {newBlogPosts.map((post, index) => (
              <li key={index}>
                {post.title} ({post.status}) - {post.category}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default ResetBlogs;
