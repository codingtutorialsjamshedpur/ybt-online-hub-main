import {
  fetchCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS
} from '../firebase/firestore';
import { 
  Product, 
  Order, 
  User, 
  Coupon, 
  Cart 
} from '../types';

// Product Services
export const getAllProducts = async (): Promise<Product[]> => {
  return fetchCollection(COLLECTIONS.PRODUCTS) as Promise<Product[]>;
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const products = await getAllProducts();
    const product = products.find(product => product.id === id);
    return product || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  return addDocument(COLLECTIONS.PRODUCTS, product);
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  return updateDocument(COLLECTIONS.PRODUCTS, id, product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.PRODUCTS, id);
};

// Order Services
export const getAllOrders = async (): Promise<Order[]> => {
  return fetchCollection(COLLECTIONS.ORDERS) as Promise<Order[]>;
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const orders = await getAllOrders();
    const order = orders.find(order => order.id === id);
    return order || null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const orders = await getAllOrders();
    return orders.filter(order => order.userId === userId);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<string> => {
  return addDocument(COLLECTIONS.ORDERS, order);
};

export const updateOrder = async (id: string, order: Partial<Order>): Promise<void> => {
  return updateDocument(COLLECTIONS.ORDERS, id, order);
};

export const deleteOrder = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.ORDERS, id);
};

// User Services
export const getAllUsers = async (): Promise<User[]> => {
  return fetchCollection(COLLECTIONS.USERS) as Promise<User[]>;
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const users = await getAllUsers();
    const user = users.find(user => user.id === id);
    return user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const createUser = async (user: Omit<User, 'id'>): Promise<string> => {
  return addDocument(COLLECTIONS.USERS, user);
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
  return updateDocument(COLLECTIONS.USERS, id, user);
};

export const deleteUser = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.USERS, id);
};

// Coupon Services
export const getAllCoupons = async (): Promise<Coupon[]> => {
  return fetchCollection(COLLECTIONS.COUPONS) as Promise<Coupon[]>;
};

export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    const coupons = await getAllCoupons();
    const coupon = coupons.find(coupon => coupon.code === code);
    return coupon || null;
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return null;
  }
};

export const createCoupon = async (coupon: Omit<Coupon, 'id'>): Promise<string> => {
  return addDocument(COLLECTIONS.COUPONS, coupon);
};

export const updateCoupon = async (id: string, coupon: Partial<Coupon>): Promise<void> => {
  return updateDocument(COLLECTIONS.COUPONS, id, coupon);
};

export const deleteCoupon = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.COUPONS, id);
};

// Cart Services
export const getAllCarts = async (): Promise<Cart[]> => {
  return fetchCollection(COLLECTIONS.CARTS) as Promise<Cart[]>;
};

export const getCartByUserId = async (userId: string): Promise<Cart | null> => {
  try {
    const carts = await getAllCarts();
    const cart = carts.find(cart => cart.userId === userId);
    return cart || null;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

export const createCart = async (cart: Omit<Cart, 'id'>): Promise<string> => {
  return addDocument(COLLECTIONS.CARTS, cart);
};

export const updateCart = async (id: string, cart: Partial<Cart>): Promise<void> => {
  return updateDocument(COLLECTIONS.CARTS, id, cart);
};

export const deleteCart = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.CARTS, id);
};