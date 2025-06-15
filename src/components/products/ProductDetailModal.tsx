import { useState } from 'react';
import { Product, Cart } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp, doc, getDoc, setDoc, updateDoc, collection, addDoc, query, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/firestore';
import { getImageUrl } from '../../utils/localImageStorage';
import { 
  X, 
  ShoppingCart, 
  Share, 
  Star, 
  Bookmark,
  ArrowLeft,
  Copy,
  Download
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { Separator } from '../ui/separator';
import DigitalProductCheckout from '../checkout/DigitalProductCheckout';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

const ProductDetailModal = ({ product, onClose }: ProductDetailModalProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Format date helper function
  const formatProductDate = (timestamp: string | Timestamp | undefined) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    return format(date, 'MMMM dd, yyyy');
  };

  // Share product link
  const handleShare = async () => {
    setIsSharing(true);
    
    // Construct share URL
    const shareUrl = `${window.location.origin}/products?id=${product.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title || product.name,
          text: product.description || 'Check out this product!',
          url: shareUrl,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Product link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Convert linebreaks in description to paragraphs
  const formatDescription = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((paragraph, index) => (
      paragraph.trim() ? <p key={index} className="mb-4">{paragraph}</p> : null
    ));
  };

  // Stop propagation on modal content click
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  // Handle adding product to cart
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : 'guest';
      
      // Check if a cart already exists for this user
      const cartsRef = collection(db, COLLECTIONS.CARTS);
      const cartQuery = query(cartsRef, where('userId', '==', userId), where('status', '==', 'active'));
      const cartSnapshot = await getDocs(cartQuery);
      
      let cartId;
      let cartData;
      let existingItems = [];
      
      // If cart exists, update it
      if (!cartSnapshot.empty) {
        const cartDoc = cartSnapshot.docs[0];
        cartId = cartDoc.id;
        cartData = cartDoc.data();
        existingItems = cartData.items || [];
        
        // Check if item already exists in cart
        const existingItemIndex = existingItems.findIndex(item => item.productId === product.id);
        
        if (existingItemIndex >= 0) {
          // Update quantity if product already in cart
          existingItems[existingItemIndex].quantity += 1;
        } else {
          // Add new item to cart
          existingItems.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.imageUrl || product.image,
            quantity: 1
          });
        }
        
        // Update the cart document
        await updateDoc(doc(db, 'carts', cartId), {
          items: existingItems,
          updatedAt: Timestamp.now(),
          totalAmount: calculateTotal(existingItems)
        });
      } else {
        // Create a new cart
        const newCart = {
          userId: userId,
          status: 'active',
          items: [{
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.imageUrl || product.image,
            quantity: 1
          }],
          totalAmount: product.price,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const newCartRef = await addDoc(cartsRef, newCart);
        cartId = newCartRef.id;
      }
      
      toast({
        title: "Added to cart!",
        description: `${product.name} has been added to your cart.`,
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              window.location.href = '/cart';
              onClose();
            }}
          >
            View Cart
          </Button>
        )
      });
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "There was a problem adding this item to your cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  // Helper function to calculate total cart amount
  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const price = typeof item.price === 'string' ? 
        parseFloat(item.price.replace(/[^\d.]/g, '')) : 
        parseFloat(item.price);
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-slide-up"
          onClick={handleContentClick}
        >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-sm hover:bg-gray-100 z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
        
        {/* Back button (mobile only) */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 md:hidden bg-white rounded-full p-2 shadow-sm hover:bg-gray-100 z-10"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        
        <div className="flex flex-col md:flex-row">
          {/* Product image */}
          <div className="md:w-1/2 h-96 md:h-auto relative">
            <img 
              src={getImageUrl(product.imageUrl || product.image) || 'https://placehold.co/600x400?text=No+Image'} 
              alt={product.title || product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/600x400?text=No+Image';
              }}
            />
            
            {/* Category badge */}
            <Badge className="absolute top-4 left-4">
              {product.category}
            </Badge>
            {(product.isDigitalProduct || product.deliveryMethod === 'download') && (
              <Badge className="absolute top-4 left-24 ml-2 bg-purple-600">
                Digital Product
              </Badge>
            )}
            
            {/* Out of stock overlay */}
            {parseInt(product.stock) === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white font-medium text-xl">Out of Stock</span>
              </div>
            )}
          </div>
          
          {/* Product details */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col h-full">
            <div className="mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.title || product.name}
              </h2>
              
              <div className="flex items-center mb-4">
                {/* Rating stars */}
                {product.rating && (
                  <div className="flex items-center mr-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Stock status */}
                <span className={`text-sm ${parseInt(product.stock) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseInt(product.stock) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              
              {/* Price */}
              <div className="flex items-end gap-2 mb-6">
                <span className="text-3xl font-bold text-blue-600">{product.price}</span>
                {product.price !== '₹0' && product.price !== 'Free' && (
                  <span className="text-sm text-gray-500 pb-1">
                    (Includes all taxes)
                  </span>
                )}
              </div>
              
              <Separator className="mb-6" />
            </div>
            
            {/* Product description */}
            <div className="prose prose-sm max-w-none mb-6 flex-grow">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="text-gray-700">
                {formatDescription(product.description || 'No description available')}
              </div>

              {/* Digital Product Information */}
              {(product.isDigitalProduct || product.deliveryMethod === 'download') && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Digital Product</h4>
                  <p className="text-xs text-blue-700">
                    This is a digital product. After purchase, you will receive a download link.
                  </p>
                </div>
              )}
            </div>
            
            {/* Metadata and actions */}
            <div className="mt-auto">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-6">
                <div>ID: {product.id.slice(0, 8)}...</div>
                {product.createdAt && (
                  <div>Added on {formatProductDate(product.createdAt)}</div>
                )}
                <div>Category: {product.category}</div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {product.isDigitalProduct || product.deliveryMethod === 'download' ? (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={parseInt(product.stock) === 0}
                    onClick={() => setShowCheckout(true)}
                  >
                    <Download className="h-4 w-4 mr-2" /> Buy Now
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={parseInt(product.stock) === 0 || isAddingToCart}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> 
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                )}
                
                <Button variant="outline" onClick={handleShare} disabled={isSharing}>
                  {isSharing ? 'Sharing...' : <><Share className="h-4 w-4 mr-2" /> Share</>}
                </Button>
                
                <Button variant="ghost">
                  <Bookmark className="h-4 w-4 mr-2" /> Save
                </Button>
              </div>
              
              {/* Copy UPI section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Direct Payment</h4>
                    <p className="text-sm text-gray-600">UPI: 7762953796@ybl</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText('7762953796@ybl');
                      toast({
                        title: "UPI Copied!",
                        description: "UPI ID copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy UPI
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Digital Product Checkout Modal */}
      {showCheckout && (
        <DigitalProductCheckout
          product={product}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderId) => {
            setShowCheckout(false);
            toast({
              title: "Purchase Complete!",
              description: "Thank you for your purchase. You can now download your digital product.",
            });
          }}
        />
      )}
    </>
  );
};

export default ProductDetailModal;
