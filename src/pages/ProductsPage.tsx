import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../types';
import ProductGrid from '../components/products/ProductGrid';
import ProductFilter from '../components/products/ProductFilter';
import ProductSearch from '../components/products/ProductSearch';
import Breadcrumb from '../components/Breadcrumb';
import EmptyState from '../components/products/EmptyState';
import BuyMeCoffee from '../components/products/BuyMeCoffee';
import ProductDetailModal from '../components/products/ProductDetailModal';
import { Skeleton } from '../components/ui/skeleton';
import { Helmet } from 'react-helmet-async';

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Get filter values from URL params
  const categoryFilter = searchParams.get('category') || '';
  const priceFilter = searchParams.get('price') || '';
  const stockFilter = searchParams.get('stock') || '';
  const searchQuery = searchParams.get('search') || '';

  // Fetch products from Firestore
  useEffect(() => {
    setLoading(true);
    console.log('Fetching products from Firestore...');
    
    // First try to get all products without a filter to see what's available
    const productsRef = collection(db, 'products');
    
    const fetchProducts = async () => {
      try {
        // First, try to get ALL products to understand what's available
        console.log('Getting all products without filters...');
        const allProductsUnsubscribe = onSnapshot(productsRef, (allSnapshot) => {
          console.log('ALL products snapshot received. Count:', allSnapshot.docs.length);
          
          if (allSnapshot.docs.length === 0) {
            console.log('No products found in the collection. The collection might be empty.');
            setLoading(false);
            return;
          }
          
          // Log all products to see their structure
          allSnapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`Product ${index + 1}:`, { id: doc.id, ...data });
            console.log('  - Fields:', Object.keys(data));
            console.log('  - Status:', data.status);
          });
          
          // Now try with the status filter
          const productsQuery = query(
            productsRef, 
            where('status', '==', 'Active')
          );
          
          const filteredUnsubscribe = onSnapshot(productsQuery, (filteredSnapshot) => {
            console.log('FILTERED products snapshot received. Count:', filteredSnapshot.docs.length);
            
            const productsData = filteredSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || 'Unnamed Product',
                category: data.category || 'Uncategorized',
                price: data.price || '₹0',
                stock: data.stock || '0',
                image: data.image || data.imageUrl,
                description: data.description || 'No description available',
                status: data.status || 'Inactive',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                title: data.title || data.name || 'Unnamed Product',
                imageUrl: data.imageUrl || data.image,
                rating: data.rating || 0
              } as Product;
            });
            
            console.log('Products after mapping:', productsData);
            setProducts(productsData);
            setLoading(false);
          }, (error) => {
            console.error("Error fetching filtered products: ", error);
            // If filtering fails, try to at least show all products
            const allProducts = allSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Product[];
            
            console.log('Falling back to all products:', allProducts);
            setProducts(allProducts);
            setLoading(false);
          });
          
          // Return a cleanup function for both subscriptions
          return () => {
            filteredUnsubscribe();
          };
        }, (error) => {
          console.error("Error fetching all products: ", error);
          setLoading(false);
        });
        
        return () => {
          allProductsUnsubscribe();
        };
      } catch (error) {
        console.error("Unexpected error in product fetching:", error);
        setLoading(false);
      }
    };
    
    // Execute the fetch function
    fetchProducts();
    
    // The cleanup function is returned from fetchProducts() and handled there
    // No need for a redundant return here
  }, []);

  // Apply filters whenever products or filter values change
  useEffect(() => {
    let result = [...products];

    // Apply category filter
    if (categoryFilter) {
      result = result.filter(product => 
        product.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply price filter
    if (priceFilter) {
      if (priceFilter === 'free') {
        result = result.filter(product => 
          product.price === '0' || product.price === '₹0' || product.price.toLowerCase() === 'free'
        );
      } else if (priceFilter === 'under50') {
        result = result.filter(product => {
          const numericPrice = parseFloat(product.price.replace(/[^\d.]/g, ''));
          return numericPrice > 0 && numericPrice < 50;
        });
      } else if (priceFilter === 'over50') {
        result = result.filter(product => {
          const numericPrice = parseFloat(product.price.replace(/[^\d.]/g, ''));
          return numericPrice >= 50;
        });
      }
    }

    // Apply stock filter
    if (stockFilter === 'instock') {
      result = result.filter(product => 
        parseInt(product.stock) > 0
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name?.toLowerCase().includes(query) || 
        product.title?.toLowerCase().includes(query) || 
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(result);
  }, [products, categoryFilter, priceFilter, stockFilter, searchQuery]);

  // Handle filter changes
  const handleFilterChange = (type: string, value: string) => {
    if (value) {
      searchParams.set(type, value);
    } else {
      searchParams.delete(type);
    }
    setSearchParams(searchParams);
  };

  // Handle product selection for detail view
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  // Handle closing the product detail modal
  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Digital Products | J-Digital Products</title>
        <meta name="description" content="Browse our collection of premium digital products, including eBooks, templates, tools, and courses." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }]} />
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Products</h1>
            <p className="text-gray-600">Browse our collection of premium digital products</p>
          </div>
          
          <ProductSearch 
            value={searchQuery} 
            onChange={(value) => handleFilterChange('search', value)}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <div className="lg:w-1/4">
            <ProductFilter 
              categoryFilter={categoryFilter}
              priceFilter={priceFilter}
              stockFilter={stockFilter}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Main content */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                </p>
                <ProductGrid 
                  products={filteredProducts} 
                  onProductSelect={handleProductSelect}
                />
              </>
            ) : (
              <EmptyState 
                searchQuery={searchQuery} 
                onClearFilters={() => {
                  setSearchParams({});
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={handleCloseModal}
        />
      )}

      {/* Buy Me a Coffee */}
      <BuyMeCoffee />
    </div>
  );
};

export default ProductsPage;
