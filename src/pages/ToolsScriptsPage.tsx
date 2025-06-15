import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

const ToolsScriptsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Get filter values from URL params
  const priceFilter = searchParams.get('price') || '';
  const stockFilter = searchParams.get('stock') || '';
  const searchQuery = searchParams.get('search') || '';

  // Fetch products from Firestore filtered by Tools/Scripts category
  useEffect(() => {
    setLoading(true);
    console.log('Fetching Tools/Scripts from Firestore...');
    
    const productsRef = collection(db, 'products');
    
    // Create a query to filter products by Active status - we'll filter by tags in the client
    const productsQuery = query(
      productsRef, 
      where('status', '==', 'Active')
    );
    
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      console.log('Tools/Scripts snapshot received. Count:', snapshot.docs.length);
      
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Product',
          category: data.category || 'Tools/Scripts',
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
      
      console.log('Tools/Scripts after mapping:', productsData);
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching Tools/Scripts: ", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Apply filters whenever products or filter values change
  useEffect(() => {
    // First filter for Tools & Scripts category or tags
    let result = products.filter(product => {
      // Check if the product is in the Tools/Scripts category
      if (product.category === 'Tools/Scripts') {
        return true;
      }
      
      // Check if the product has relevant tags
      if (product.tags && Array.isArray(product.tags)) {
        const toolsRelatedTags = ['tools', 'scripts', 'tool', 'script', 'utility', 'automation'];
        return product.tags.some(tag => 
          toolsRelatedTags.includes(tag.toLowerCase())
        );
      }
      
      return false;
    });

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
        (product.tags && Array.isArray(product.tags) && 
         product.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredProducts(result);
  }, [products, priceFilter, stockFilter, searchQuery]);

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
        <title>Tools & Scripts | CTJ Digital Products</title>
        <meta name="description" content="Browse our collection of premium tools and scripts to enhance your productivity and automate tasks." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }, { label: 'Tools & Scripts', path: '/products/category/tools-scripts' }]} />
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tools & Scripts Collection</h1>
            <p className="text-gray-600">Browse our collection of premium tools and scripts to enhance your productivity</p>
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
              categoryFilter="Tools/Scripts" // Pre-selected category
              priceFilter={priceFilter}
              stockFilter={stockFilter}
              onFilterChange={handleFilterChange}
              hideCategories={true} // Hide category filter since we're already on Tools/Scripts page
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
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'Tool/Script' : 'Tools/Scripts'}
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
                message="No Tools or Scripts found matching your criteria."
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

export default ToolsScriptsPage;
