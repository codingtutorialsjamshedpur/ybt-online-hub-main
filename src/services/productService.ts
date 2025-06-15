import { fetchProducts } from '../firebase/firestore';
import { Product } from '../types';
import { Timestamp } from 'firebase/firestore';

/**
 * Get all products
 * @returns Array of products
 */
export const getAllProducts = async (): Promise<Product[]> => {
  return fetchProducts() as Promise<Product[]>;
};

/**
 * Get active products
 * @param limitCount Optional number of products to return
 * @returns Array of active products
 */
export const getActiveProducts = async (limitCount?: number): Promise<Product[]> => {
  try {
    // First, get all products
    const allProducts = await fetchProducts();
    
    // Filter for active products (case-insensitive)
    const activeProducts = allProducts.filter(product => {
      // Handle different formats of status (string, with quotes, etc.)
      const status = String(product.status || '').toLowerCase();
      return status.includes('active');
    });
    
    // Sort by createdAt in descending order (newest first)
    const sortedProducts = [...activeProducts].sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 
                    a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 
                    b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Apply limit if provided
    const result = limitCount ? sortedProducts.slice(0, limitCount) : sortedProducts;
    
    // Log the number of active products found
    console.log(`Found ${result.length} active products`);
    
    return result;
  } catch (error) {
    console.error('Error fetching active products:', error);
    return [];
  }
};

/**
 * Get products by category
 * @param category Category to filter by
 * @param limitCount Optional number of products to return
 * @returns Array of products in the specified category
 */
export const getProductsByCategory = async (
  category: string, 
  limitCount?: number
): Promise<Product[]> => {
  try {
    // First, get all products
    const allProducts = await fetchProducts();
    
    // Filter for active products in the requested category (case-insensitive)
    const activeCategoryProducts = allProducts.filter(product => {
      // Match category case-insensitively
      const productCategory = String(product.category || '').toLowerCase();
      const searchCategory = category.toLowerCase();
      
      // Match status (handling different formats)
      const status = String(product.status || '').toLowerCase();
      
      return productCategory === searchCategory && status.includes('active');
    });
    
    // Sort by createdAt in descending order
    const sortedProducts = [...activeCategoryProducts].sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 
                    a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 
                    b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Apply limit if provided
    const result = limitCount ? sortedProducts.slice(0, limitCount) : sortedProducts;
    
    return result;
  } catch (error) {
    console.error('Error fetching category products:', error);
    return [];
  }
};

/**
 * Get a product by ID
 * @param id Product ID
 * @returns Product or null if not found
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const products = await fetchProducts();
    const product = products.find(product => product.id === id);
    return product || null;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return null;
  }
};
