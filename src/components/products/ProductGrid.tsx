import { Product } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ShoppingCart, Heart, Star, Check } from 'lucide-react';
import { getImageUrl } from '../../utils/localImageStorage';
import { useCart } from '../cart/CartContext';
import { useState } from 'react';

interface ProductGridProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

const ProductGrid = ({ products, onProductSelect }: ProductGridProps) => {
  const { addToCart, loading: cartLoading } = useCart();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  
  // Handle Add to Cart action
  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering product selection
    
    // Don't allow adding if out of stock
    if (parseInt(product.stock) === 0) return;
    
    setAddingProductId(product.id);
    
    try {
      await addToCart(product, 1);
      // Success animation will happen via state
      setTimeout(() => {
        setAddingProductId(null);
      }, 1500);
    } catch (error) {
      setAddingProductId(null);
    }
  };
  
  // Format date helper function
  const formatProductDate = (timestamp: string | Timestamp | undefined) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Helper function to convert category to badge variant
  const getCategoryVariant = (category: string) => {
    const categoryMap: Record<string, string> = {
      'E-Book': 'default',
      'PACK': 'secondary',
      'Template': 'outline',
      'Tools/Scripts': 'destructive',
      'Video Course': 'blue'
    };
    
    return categoryMap[category] || 'default';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div 
          key={product.id}
          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in flex flex-col"
          data-aos="fade-up"
        >
          {/* Image container with category badge and stock indicator */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src={getImageUrl(product.imageUrl || product.image) || 'https://placehold.co/600x400?text=No+Image'} 
              alt={product.title || product.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/600x400?text=No+Image';
              }}
            />
            
            {/* Category badge */}
            <Badge 
              className="absolute top-3 left-3 z-10" 
              variant={getCategoryVariant(product.category) as any}
            >
              {product.category}
            </Badge>
            
            {/* Out of stock overlay */}
            {parseInt(product.stock) === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white font-medium text-lg">Out of Stock</span>
              </div>
            )}
            
            {/* Wishlist button */}
            <button 
              className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          {/* Product details */}
          <div className="p-5 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
              <h3 
                className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer"
                onClick={() => onProductSelect(product)}
              >
                {product.title || product.name}
              </h3>
              
              {/* Price tag */}
              <span className="font-bold text-blue-600">
                {product.price}
              </span>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {product.description || 'No description available'}
            </p>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center mb-3">
                <div className="flex mr-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
              </div>
            )}
            
            {/* Meta information */}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
              <span>Stock: {product.stock}</span>
              {product.createdAt && (
                <span>Added {formatProductDate(product.createdAt)}</span>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex mt-auto">
              <Button 
                className="w-1/2 mr-2"
                variant="outline"
                onClick={() => onProductSelect(product)}
              >
                View Details
              </Button>
              <Button 
                className="w-1/2 bg-blue-600 hover:bg-blue-700 relative overflow-hidden"
                disabled={parseInt(product.stock) === 0 || addingProductId === product.id || cartLoading}
                onClick={(e) => handleAddToCart(product, e)}
              >
                {addingProductId === product.id ? (
                  <>
                    <Check className="h-4 w-4 mr-2 animate-pulse" /> Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
