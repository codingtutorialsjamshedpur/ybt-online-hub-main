// Interfaces for Firebase Firestore collections

export interface Cart {
  id?: string;
  userId: string;
  items: CartItem[];
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  imageUrl?: string;
}

export interface Coupon {
  id?: string;
  code: string;
  discountPercentage: number;
  validUntil: string;
  isActive: boolean;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface Order {
  id?: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderDate: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  title: string;
  imageUrl?: string;
}

export interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Product {
  id?: string;
  title: string;
  description?: string;
  price: string | number; // Price can be formatted with currency symbol or as number
  originalPrice?: string | number; // Original price before discount
  image?: string; // Product image URL
  imageUrl?: string; // Alternative image URL field
  category: string;
  rating?: number;
  stock?: number;
  status?: string; // Active, Inactive, Draft, etc.
  discount?: string; // Discount percentage with % sign
  url?: string; // Product detail URL
  likes?: number; // Number of likes
  shares?: number; // Number of shares
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface User {
  id?: string;
  email: string;
  username: string;
  role: "user" | "admin";
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}