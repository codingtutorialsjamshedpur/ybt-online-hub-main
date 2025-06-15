import { Timestamp } from 'firebase/firestore';

// Payment Gateway Configuration Interface
export interface PaymentGateway {
  id?: string;
  name: string; // e.g., 'PhonePe India'
  provider: 'phonepe' | 'razorpay' | 'stripe' | 'other';
  isActive: boolean;
  merchantId: string; // e.g., 'M23VR50UZCWH0'
  merchantKeyId: string; // API key
  merchantKeySecret: string; // Client secret
  mode: 'test' | 'production';
  callbackUrl: string; // e.g., 'https://example.com/phonepe-callback'
  redirectUrl: string; // e.g., 'https://example.com/payment/success'
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Payment Transaction Interface
export interface PaymentTransaction {
  id?: string;
  orderId: string; // e.g., 'order_12345'
  userId: string;
  amount: number; // e.g., 1000.5
  currency: string; // e.g., 'INR'
  status: 'initiated' | 'processing' | 'completed' | 'SUCCESS' | 'failed' | 'refunded';
  gatewayTransactionId: string; // e.g., 'TXN_PHONEPE_987654'
  gatewayResponse?: any; // Response from payment gateway
  paymentMethod: string; // e.g., 'UPI'
  paymentGateway: string; // e.g., 'phonepe'
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Ticket interface for user support system
export interface Ticket {
  id?: string;
  subject: string;
  description: string;
  userId: string;
  userName: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  product: string;
  orderId?: string;
  attachments?: Array<{
    localCacheKey?: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  replies?: Array<{
    content: string;
    isFromUser: boolean;
    userId: string;
    userName: string;
    createdAt: Timestamp;
    attachments?: Array<{
      localCacheKey?: string;
      name: string;
      url: string;
      type: string;
      size: number;
      uploadedAt: string;
    }>;
  }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  attachmentCount?: number;
}

// Contact Submission interface
export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  
  // Optional fields
  mobileNo?: string;
  department?: string;
  contactTime?: string;
  priority?: string;
  attachmentUrl?: string;
  
  // Admin fields
  status?: 'new' | 'in-progress' | 'resolved';
  assignedTo?: string;
  notes?: string;
  timestamp?: Timestamp | Date;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Basic User interface
export interface User {
  id?: string;
  email: string;
  username: string;
  name?: string;
  password?: string; // Only for demo purposes, never store passwords
  role: 'user' | 'admin' | 'Admin' | 'Customer' | 'Editor'; // Extended role options
  joinedDate?: string | Timestamp;
  status?: 'Active' | 'Inactive' | 'Blocked';
  lastLogin?: string | Timestamp;
  lastActive?: string | Timestamp; // Last activity timestamp
  phone?: string;
  address?: string;
  avatar?: string;
  photoURL?: string; // Alternative to avatar for Firebase Auth compatibility
  online?: boolean;
  
  // Additional fields from Firestore
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  purchases?: string[]; // Array of order IDs
  favoriteProducts?: string[]; // Array of product IDs
  newsletterSubscribed?: boolean;
  billingAddress?: string;
  shippingAddress?: string;
  membershipLevel?: 'free' | 'basic' | 'premium' | 'vip';
  totalSpent?: string; // Total amount spent on the platform
  accountType?: 'individual' | 'business';
  companyName?: string; // For business accounts
  notes?: string; // Admin notes about the user
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// Product interface
export interface Product {
  id: string; // Required
  name: string;
  category: string;
  price: string; // String type as used in the application
  stock: string;
  image?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
  // These fields are truly optional
  title?: string;
  imageUrl?: string;
  rating?: number;
  tags?: string[]; // Array of tags for filtering and categorization
  
  // Download link fields
  downloadLink?: string; // Link to the product download (e.g., Google Drive)
  isDigitalProduct?: boolean; // Indicates if the product is digital and has a download
  deliveryMethod?: 'download' | 'physical' | 'service'; // How the product is delivered
  
  // Additional fields from Firestore
  sku?: string; // Stock keeping unit
  featured?: boolean; // Whether the product is featured
  brand?: string; // Product brand name
  discountPrice?: string; // Discounted price if any
  specifications?: Record<string, string>; // Product specifications as key-value pairs
  reviewCount?: number; // Number of reviews
  weight?: string; // Product weight
  dimensions?: string; // Product dimensions
}

// Order interface
export interface Order {
  id?: string;
  orderNumber?: string;
  customer: string;
  customerEmail: string;
  products: {id: string, quantity: number}[];
  totalAmount: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  orderDate?: string | Timestamp;
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
  discountAmount?: string;
  couponCode?: string;
  fulfillmentType?: 'Delivery' | 'Digital Download' | 'Pickup';
  trackingNumber?: string;
}

// Coupon interface
export interface Coupon {
  id?: string;
  code: string;
  discount: string;
  type: 'Percentage' | 'Fixed Amount';
  validFrom: string | Timestamp;
  validUntil: string | Timestamp;
  status: 'Active' | 'Expired' | 'Scheduled';
  usageLimit?: number;
  usageCount?: number;
  minimumPurchase?: string;
  applicableProducts?: string[];
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// Cart Item interface
export interface CartItem {
  id: string; // Used for item identification in the cart
  productId: string;
  name: string;
  price: string;
  image?: string;
  quantity: number;
  description?: string; // Optional product description
}

// Cart interface
export interface Cart {
  id?: string;
  userId: string;
  items: CartItem[];
  totalAmount: string;
  status: 'active' | 'abandoned' | 'completed';
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// Blog Post interface
export interface BlogPost {
  id?: string;
  title: string;
  image?: string;
  content: string;
  date: string | Timestamp;
  likes: number;
  shares: number;
  status: 'Published' | 'Draft';
  category: string;
  tags: string[];
  author: string;
  contentFormat?: 'HTML' | 'Markdown'; // Format of the content
  rating?: number; // Rating of the blog post
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}
