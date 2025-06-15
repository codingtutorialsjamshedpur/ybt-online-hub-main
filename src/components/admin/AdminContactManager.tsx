import { useState, useEffect } from 'react';
import { 
  fetchContactSubmissions, 
  updateContactSubmission, 
  deleteContactSubmission 
} from '../../firebase/firestore';
import { ContactSubmission as TypedContactSubmission } from '../../types';
// Create a type alias that extends the imported type to handle potential string status
type ContactSubmission = Omit<TypedContactSubmission, 'status'> & {
  status?: 'new' | 'in-progress' | 'resolved' | string;
};
import { formatRelative } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Status badge component for better visualization
const StatusBadge = ({ status }: { status: string }) => {
  let color = 'bg-gray-100 text-gray-800';
  if (status === 'new') color = 'bg-blue-100 text-blue-800';
  if (status === 'in-progress') color = 'bg-yellow-100 text-yellow-800';
  if (status === 'resolved') color = 'bg-green-100 text-green-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  
  let color = 'bg-gray-100 text-gray-800';
  if (priority === 'normal') color = 'bg-blue-100 text-blue-800';
  if (priority === 'urgent') color = 'bg-red-100 text-red-800';
  if (priority === 'low') color = 'bg-green-100 text-green-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Format date helper
const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  
  try {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Timestamp ? 
      timestamp.toDate() : 
      timestamp instanceof Date ? 
        timestamp : 
        new Date(timestamp);
    
    return formatRelative(date, new Date());
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const AdminContactManager = () => {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentContact, setCurrentContact] = useState<ContactSubmission | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof ContactSubmission>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Auto-hide notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Load contact submissions from Firestore
  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      try {
        const submissions = await fetchContactSubmissions();
        // Ensure submissions have valid status values
        const typedSubmissions = submissions.map((submission) => {
          let status: 'new' | 'in-progress' | 'resolved' = 'new';
          if (submission.status === 'in-progress' || submission.status === 'resolved') {
            status = submission.status;
          }
          return {
            ...submission,
            status
          };
        });
        setContacts(typedSubmissions);
        setFilteredContacts(typedSubmissions);
      } catch (err) {
        console.error('Error loading contact submissions:', err);
        setError('Failed to load contact submissions');
      } finally {
        setLoading(false);
      }
    };
    
    loadContacts();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let result = [...contacts];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(contact => 
        contact.name?.toLowerCase().includes(term) || 
        contact.email?.toLowerCase().includes(term) ||
        contact.subject?.toLowerCase().includes(term) ||
        contact.message?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(contact => contact.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(contact => contact.priority === priorityFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      // Handle timestamp specially
      if (sortField === 'timestamp') {
        // Safely handle timestamps that might be undefined or have different formats
        const aTime = a.timestamp ? 
          (a.timestamp instanceof Timestamp ? a.timestamp.toDate().getTime() : 
           a.timestamp instanceof Date ? a.timestamp.getTime() : 0) : 0;
        const bTime = b.timestamp ? 
          (b.timestamp instanceof Timestamp ? b.timestamp.toDate().getTime() : 
           b.timestamp instanceof Date ? b.timestamp.getTime() : 0) : 0;
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      // Handle string fields
      const aValue = a[sortField] as string || '';
      const bValue = b[sortField] as string || '';
      
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    
    setFilteredContacts(result);
  }, [contacts, searchTerm, statusFilter, priorityFilter, sortField, sortDirection]);

  // View a contact's details
  const viewContact = (contact: ContactSubmission) => {
    setCurrentContact(contact);
    setShowViewModal(true);
  };

  // Open the edit modal for a contact
  const editContact = (contact: ContactSubmission) => {
    setCurrentContact(contact);
    setShowEditModal(true);
  };

  // Prepare to delete a contact
  const confirmDelete = (contact: ContactSubmission) => {
    setCurrentContact(contact);
    setShowDeleteModal(true);
  };

  // Update a contact's information
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentContact?.id) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Get status and validate it's one of the allowed values
    const statusValue = formData.get('status') as string;
    let status: 'new' | 'in-progress' | 'resolved' = 'new';
    if (statusValue === 'in-progress' || statusValue === 'resolved') {
      status = statusValue;
    }

    const updatedContact: Partial<ContactSubmission> = {
      status,
      priority: formData.get('priority') as string,
      assignedTo: formData.get('assignedTo') as string,
      notes: formData.get('notes') as string,
    };
    
    try {
      await updateContactSubmission(currentContact.id, updatedContact);
      
      // Update local state
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === currentContact.id 
            ? { ...contact, ...updatedContact } 
            : contact
        )
      );
      
      setShowEditModal(false);
      setNotification({ type: 'success', message: 'Contact updated successfully!' });
      
      // Hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error updating contact:', err);
      setNotification({ type: 'error', message: 'Failed to update contact' });
    }
  };

  // Delete a contact
  const handleDeleteContact = async () => {
    if (!currentContact?.id) return;
    
    try {
      await deleteContactSubmission(currentContact.id);
      
      // Update local state
      setContacts(prevContacts => 
        prevContacts.filter(contact => contact.id !== currentContact.id)
      );
      
      setShowDeleteModal(false);
      setNotification({ type: 'success', message: 'Contact deleted successfully!' });
      
      // Hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error deleting contact:', err);
      setNotification({ type: 'error', message: 'Failed to delete contact' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Contact Management</h2>
      
      {/* Notification */}
      {notification && (
        <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts..."
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <div className="flex space-x-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as keyof ContactSubmission)}
              className="flex-grow border rounded-md px-3 py-2"
            >
              <option value="timestamp">Date</option>
              <option value="name">Name</option>
              <option value="subject">Subject</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="border rounded-md px-3 py-2"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-gray-500 text-center py-12">No contact submissions found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{contact.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{contact.email}</div>
                    {contact.mobileNo && (
                      <div className="text-gray-500 text-sm">{contact.mobileNo}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="truncate max-w-xs">{contact.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(contact.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={contact.status || 'new'} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priority={contact.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewContact(contact)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => editContact(contact)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(contact)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* View Modal */}
      {showViewModal && currentContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Contact Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-700">Name</h4>
                  <p>{currentContact.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Email</h4>
                  <p>{currentContact.email}</p>
                </div>
                {currentContact.mobileNo && (
                  <div>
                    <h4 className="font-medium text-gray-700">Phone</h4>
                    <p>{currentContact.mobileNo}</p>
                  </div>
                )}
                {currentContact.department && (
                  <div>
                    <h4 className="font-medium text-gray-700">Department</h4>
                    <p>{currentContact.department}</p>
                  </div>
                )}
                {currentContact.contactTime && (
                  <div>
                    <h4 className="font-medium text-gray-700">Preferred Contact Time</h4>
                    <p>{currentContact.contactTime}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-700">Status</h4>
                  <StatusBadge status={currentContact.status || 'new'} />
                </div>
                {currentContact.priority && (
                  <div>
                    <h4 className="font-medium text-gray-700">Priority</h4>
                    <PriorityBadge priority={currentContact.priority} />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-700">Date Submitted</h4>
                  <p>{formatDate(currentContact.timestamp)}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700">Subject</h4>
                <p>{currentContact.subject}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700">Message</h4>
                <div className="border rounded-md p-3 bg-gray-50 whitespace-pre-wrap">
                  {currentContact.message}
                </div>
              </div>
              
              {currentContact.attachmentUrl && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Attachment</h4>
                  <a 
                    href={currentContact.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Attachment
                  </a>
                </div>
              )}
              
              {currentContact.assignedTo && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Assigned To</h4>
                  <p>{currentContact.assignedTo}</p>
                </div>
              )}
              
              {currentContact.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Internal Notes</h4>
                  <div className="border rounded-md p-3 bg-gray-50 whitespace-pre-wrap">
                    {currentContact.notes}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    editContact(currentContact);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && currentContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Contact</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleUpdateContact}>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Contact Info</h4>
                  <p>{currentContact.name} ({currentContact.email})</p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={currentContact.status || 'new'}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    name="priority"
                    defaultValue={currentContact.priority || 'normal'}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Assigned To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    defaultValue={currentContact.assignedTo || ''}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Staff member name"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Internal Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={currentContact.notes || ''}
                    rows={4}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Add notes about this inquiry..."
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Confirm Deletion</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <p className="mb-4">
                Are you sure you want to delete this contact submission from {currentContact?.name || 'this user'}?
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteContact}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactManager;
