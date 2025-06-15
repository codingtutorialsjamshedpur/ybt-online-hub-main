import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getActiveProducts } from '@/services/productService';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Extended product interface to work around TypeScript issues
// Using type assertion approach instead of extending the interface
type ProductWithPrices = Product & {
  originalPrice?: string | number;
  // We don't redefine 'price' here since it's already in Product
  image?: string;
  imageUrl?: string;
}

// Parse price from string or number to number
const parsePrice = (price: string | number | undefined): number => {
  if (price === undefined) return 0;
  
  if (typeof price === 'number') return price;
  
  // Remove currency symbol and commas
  const cleanedPrice = price.toString().replace(/[^0-9.]/g, '');
  return parseFloat(cleanedPrice) || 0;
};

// Calculate discount percentage
const calculateDiscount = (originalPrice: string | number | undefined, sellingPrice: string | number | undefined) => {
  const origPrice = parsePrice(originalPrice);
  const sellPrice = parsePrice(sellingPrice);
  
  if (origPrice <= 0 || sellPrice <= 0 || origPrice <= sellPrice) return null;
  
  const discount = ((origPrice - sellPrice) / origPrice) * 100;
  return Math.round(discount) + '%';
};

// Helper function to render stars
const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`w-5 h-5 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
      </svg>
    );
  }
  return <div className="flex">{stars}</div>;
};

const Products = () => {
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch latest 3 active products
        const activeProducts = await getActiveProducts(3) as ProductWithPrices[];
        setProducts(activeProducts);
        setError(null);
      } catch (err) {
        console.error("Error fetching latest products:", err);
        setError("Failed to load latest products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">
            Our Latest <span className="text-ybtBlue">Products</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
            Browse our newest and top-rated digital items curated for you.
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl overflow-hidden shadow-sm animate-pulse">
                <Skeleton className="h-48 w-full" />
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => {
              // Calculate discount if original price and selling price are available
              const discount = calculateDiscount(product.originalPrice, product.price);
                
              // Handle price formatting
              const formattedOriginalPrice = product.originalPrice 
                ? (typeof product.originalPrice === 'string' && product.originalPrice.startsWith('₹') 
                  ? product.originalPrice 
                  : `₹${product.originalPrice}`)
                : '';
                
              const formattedPrice = product.price 
                ? (typeof product.price === 'string' && product.price.startsWith('₹') 
                  ? product.price 
                  : `₹${product.price}`)
                : '';
                
              return (
                <div 
                  key={product.id} 
                  className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-in"
                  style={{animationDelay: `${index * 0.2}s`}}
                >
                  <div className="relative">
                    <img 
                      src={product.image || product.imageUrl || 'https://via.placeholder.com/500x350?text=No+Image'} 
                      alt={product.title} 
                      className="w-full h-48 object-cover"
                    />
                    {discount && (
                      <span className="absolute top-4 left-4 bg-red-600 text-white text-sm py-1 px-2 rounded-md">
                        -{discount}
                      </span>
                    )}
                    <button className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <Link to={`/product/${product.id}`} className="block">
                      <h3 className="font-semibold text-xl mb-2 hover:text-ybtBlue transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    <div className="flex items-center mb-4">
                      <StarRating rating={product.rating || 5} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {formattedOriginalPrice && (
                          <span className="text-gray-500 line-through mr-2">{formattedOriginalPrice}</span>
                        )}
                        <span className="text-ybtBlue font-bold text-xl">{formattedPrice}</span>
                      </div>
                      <Button className="bg-ybtBlue hover:bg-blue-700 btn-hover">
                        Add to cart
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <Link 
            to="/products" 
            className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            View All Products
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Products;
