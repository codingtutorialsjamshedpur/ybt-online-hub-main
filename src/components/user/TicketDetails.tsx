import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Send, 
  Paperclip, 
  X, 
  Upload,
  File,
  Download,
  ExternalLink
} from 'lucide-react';
import { 
  fetchTicket, 
  addTicketReply, 
  getImageFromLocalCache,
  updateTicket
} from '../../services/userService';
import UserSidebar from './UserSidebar';

const TicketDetails = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { userData, currentUser } = useAuth();
  
  // State
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyImages, setReplyImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  
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
    const loadTicket = async () => {
      if (!ticketId || !currentUser) return;
      
      try {
        setLoading(true);
        const ticketData = await fetchTicket(ticketId);
        
        if (!ticketData) {
          setError('Ticket not found');
          return;
        }
        
        // Verify user has permission to view this ticket
        if (ticketData.userId !== currentUser.uid) {
          setError('You do not have permission to view this ticket');
          return;
        }
        
        setTicket(ticketData);
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };
    
    loadTicket();
  }, [ticketId, currentUser]);
  
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
    setReplyImages(prev => [...prev, ...selectedFiles]);
    
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
    setReplyImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !ticketId) {
      setError('You must be logged in to reply');
      return;
    }
    
    if (!replyContent.trim()) {
      setError('Reply cannot be empty');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      const replyData = {
        content: replyContent,
        isFromUser: true,
        userId: currentUser.uid,
        userName: userData?.name || currentUser.displayName || 'User'
      };
      
      // Add reply with images
      await addTicketReply(ticketId, replyData, replyImages);
      
      setSendSuccess(true);
      
      // Clear form
      setReplyContent('');
      setReplyImages([]);
      setPreviewUrls([]);
      
      // Refresh ticket data after 1 second
      setTimeout(async () => {
        const updatedTicket = await fetchTicket(ticketId);
        if (updatedTicket) {
          setTicket(updatedTicket);
        }
        setSendSuccess(false);
      }, 1000);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const handleReopenTicket = async () => {
    if (!ticketId) return;
    
    try {
      await updateTicket(ticketId, { status: 'open' });
      
      // Refresh ticket data
      const updatedTicket = await fetchTicket(ticketId);
      if (updatedTicket) {
        setTicket(updatedTicket);
      }
    } catch (err) {
      console.error('Error reopening ticket:', err);
      setError('Failed to reopen ticket');
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Unknown';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
        <div className="flex-1 p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-500">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
        <div className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-red-700">Error</h3>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/user/tickets')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // If no ticket found
  if (!ticket) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
        <div className="flex-1 p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-yellow-700">Ticket Not Found</h3>
            </div>
            <p className="text-yellow-600 mb-4">The requested ticket could not be found.</p>
            <button
              onClick={() => navigate('/user/tickets')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Format timestamps
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
      
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar currentDate={formattedDate} currentTime={formattedTime} />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ticket Details</h1>
            <p className="text-gray-600">
              Viewing ticket #{ticketId?.substring(0, 8)}
            </p>
          </div>
          <button
            onClick={() => navigate('/user/tickets')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Tickets
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {sendSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700">Reply sent successfully!</p>
            </div>
          </div>
        )}
        
        {/* Ticket header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">{ticket.subject}</h2>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Created</p>
              <p className="font-medium">{formatTimestamp(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Last Updated</p>
              <p className="font-medium">{formatTimestamp(ticket.updatedAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Priority</p>
              <p className="font-medium capitalize">{ticket.priority}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Related To</p>
              <p className="font-medium capitalize">{ticket.product}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{ticket.description}</p>
          </div>
          
          {/* Ticket attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-800 mb-2">Attachments ({ticket.attachments.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {ticket.attachments.map((attachment: any, index: number) => (
                  <div key={index} className="relative group">
                    <div className="relative h-24 w-full border rounded-md overflow-hidden">
                      {attachment.type && attachment.type.startsWith('image/') ? (
                        // If it's an image, try to display it from local cache first, fallback to URL
                        <div className="h-full w-full">
                          {attachment.localCacheKey && getImageFromLocalCache(attachment.localCacheKey) ? (
                            <img 
                              src={getImageFromLocalCache(attachment.localCacheKey)} 
                              alt={attachment.name} 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <img 
                              src={attachment.url} 
                              alt={attachment.name} 
                              className="h-full w-full object-cover" 
                            />
                          )}
                        </div>
                      ) : (
                        // If it's not an image, show a placeholder
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <File className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Download/view button */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <a 
                          href={attachment.url} 
                          download={attachment.name}
                          className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100 ml-2"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {attachment.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Ticket conversation */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold mb-4">Conversation</h3>
          
          <div className="space-y-6 mb-6">
            {/* Initial message (the ticket description) */}
            <div className="flex">
              <div className="bg-blue-100 rounded-lg p-4 ml-auto w-4/5">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-800">{ticket.userName || 'You'}</span>
                  <span className="text-xs text-gray-500">{formatTimestamp(ticket.createdAt)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{ticket.description}</p>
              </div>
            </div>
            
            {/* Replies */}
            {ticket.replies && ticket.replies.map((reply: any, index: number) => (
              <div key={index} className="flex">
                <div className={`rounded-lg p-4 ${reply.isFromUser ? 'bg-blue-100 ml-auto' : 'bg-gray-100 mr-auto'} w-4/5`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">
                      {reply.isFromUser ? (reply.userName || 'You') : 'Support Team'}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimestamp(reply.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{reply.content}</p>
                  
                  {/* Reply attachments */}
                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {reply.attachments.map((attachment: any, attachIndex: number) => (
                        <div key={attachIndex} className="relative group">
                          <div className="relative h-20 w-full border rounded-md overflow-hidden">
                            {attachment.type && attachment.type.startsWith('image/') ? (
                              // If it's an image, try to display it from local cache first, fallback to URL
                              <div className="h-full w-full">
                                {attachment.localCacheKey && getImageFromLocalCache(attachment.localCacheKey) ? (
                                  <img 
                                    src={getImageFromLocalCache(attachment.localCacheKey)} 
                                    alt={attachment.name} 
                                    className="h-full w-full object-cover" 
                                  />
                                ) : (
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.name} 
                                    className="h-full w-full object-cover" 
                                  />
                                )}
                              </div>
                            ) : (
                              // If it's not an image, show a placeholder
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <File className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Download/view button */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <a 
                                href={attachment.url} 
                                download={attachment.name}
                                className="p-1 bg-white rounded-full text-gray-800 hover:bg-gray-100 ml-1"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 truncate">
                            {attachment.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Reply form (disabled if ticket is resolved) */}
          {ticket.status === 'resolved' ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600 mb-3">This ticket has been resolved.</p>
              <button
                onClick={handleReopenTicket}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Reopen Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Reply
                </label>
                <textarea
                  id="reply"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  placeholder="Type your reply here..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="replyImages"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                  />
                  <label 
                    htmlFor="replyImages" 
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="relative h-20 w-full border rounded-md overflow-hidden">
                            {url === 'pdf-placeholder' ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <File className="h-8 w-8 text-gray-400" />
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
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 truncate">
                            {replyImages[index]?.name || `File ${index + 1}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={sending || !replyContent.trim()}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center ${
                    sending || !replyContent.trim() ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
