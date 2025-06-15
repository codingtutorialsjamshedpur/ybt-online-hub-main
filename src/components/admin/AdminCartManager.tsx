import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, Timestamp, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/firestore';
import { Cart, CartItem } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from '../ui/use-toast';
import { ShoppingCart, Search, Trash2, RefreshCw, ShoppingBag, User, Calendar, Clock, Package, DollarSign } from 'lucide-react';

const AdminCartManager = () => {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Load carts from Firestore
  const loadCarts = async () => {
    setRefreshing(true);
    try {
      // Create a query to get all carts
      const cartsRef = collection(db, COLLECTIONS.CART);
      let cartsQuery = query(cartsRef, orderBy('createdAt', 'desc'));
      
      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        cartsQuery = query(cartsRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
      }
      
      const cartSnapshot = await getDocs(cartsQuery);
      const cartData: Cart[] = [];
      
      cartSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Cart, 'id'>;
        cartData.push({
          id: doc.id,
          ...data,
          items: data.items || [],
        });
      });
      
      setCarts(cartData);
      toast({
        title: "Carts loaded",
        description: `${cartData.length} carts retrieved successfully.`,
      });
    } catch (error) {
      console.error('Error loading carts:', error);
      toast({
        title: "Error",
        description: "Failed to load carts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load carts on component mount and when filters change
  useEffect(() => {
    loadCarts();
  }, [statusFilter]);

  // Filter carts based on search term
  const filteredCarts = carts.filter(cart => {
    const userIdMatch = cart.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = cart.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const totalMatch = cart.totalAmount?.toString().includes(searchTerm);
    
    return userIdMatch || statusMatch || totalMatch;
  });

  // Format timestamp for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    
    return timestamp.toString();
  };

  // Handle cart status update
  const updateCartStatus = async (cartId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CART, cartId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setCarts(prevCarts => 
        prevCarts.map(cart => 
          cart.id === cartId ? { ...cart, status: newStatus, updatedAt: Timestamp.now() } : cart
        )
      );
      
      // Dispatch a custom event to notify other components about the cart update
      window.dispatchEvent(new CustomEvent('cart-modified', {
        detail: { action: 'update', cartId, newStatus }
      }));
      
      toast({
        title: "Status Updated",
        description: `Cart status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating cart status:', error);
      toast({
        title: "Update Failed",
        description: "Could not update cart status.",
        variant: "destructive"
      });
    }
  };

  // Handle cart update
  const handleUpdateCart = async (cartId: string, updatedItems: CartItem[]) => {
    try {
      // Get the cart before updating to check if it's the current user's
      const cartDoc = await getDocs(query(collection(db, COLLECTIONS.CART), where('__name__', '==', cartId)));
      let userId = '';
      
      if (!cartDoc.empty) {
        const cartData = cartDoc.docs[0].data();
        userId = cartData.userId;
      }
      
      // Calculate new total
      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Update in Firestore
      await updateDoc(doc(db, COLLECTIONS.CART, cartId), {
        items: updatedItems,
        totalAmount: totalAmount.toString(),
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setCarts(prevCarts => 
        prevCarts.map(cart => 
          cart.id === cartId ? 
          { ...cart, items: updatedItems, totalAmount: totalAmount.toString() } : 
          cart
        )
      );
      
      // Dispatch event to notify other components that a cart was modified
      window.dispatchEvent(new CustomEvent('cart-modified', { 
        detail: { 
          action: 'update', 
          cartId,
          userId
        } 
      }));
      
      setSelectedCart(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Cart updated",
        description: "Cart items have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating cart:', error);
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle cart deletion
  const handleDeleteCart = async (cartId: string) => {
    try {
      // Get the cart before deleting to check if it's the current user's
      const cartDoc = await getDocs(query(collection(db, COLLECTIONS.CART), where('__name__', '==', cartId)));
      let isCurrentUserCart = false;
      let userId = '';
      
      if (!cartDoc.empty) {
        const cartData = cartDoc.docs[0].data();
        userId = cartData.userId;
        isCurrentUserCart = userId === auth.currentUser?.uid;
      }
      
      // Delete the cart
      await deleteDoc(doc(db, COLLECTIONS.CART, cartId));
      
      // Update local state
      setCarts(prevCarts => prevCarts.filter(cart => cart.id !== cartId));
      
      // Dispatch event to notify other components that a cart was modified
      window.dispatchEvent(new CustomEvent('cart-modified', { 
        detail: { 
          action: 'delete', 
          cartId,
          userId
        } 
      }));
      
      toast({
        title: "Cart deleted",
        description: "Cart has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting cart:', error);
      toast({
        title: "Error",
        description: "Failed to delete cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Open cart details dialog
  const handleViewCart = (cart: Cart) => {
    setSelectedCart(cart);
    setIsDialogOpen(true);
  };

  // Calculate cart totals
  const calculateCartTotal = (items: CartItem[]) => {
    if (!items || items.length === 0) return "0.00";
    
    return items.reduce((total, item) => {
      const price = typeof item.price === 'string' ? 
        parseFloat(item.price.replace(/[^\d.]/g, '')) : 
        parseFloat(item.price as string);
      
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Cart Management</h2>
        <Button 
          onClick={loadCarts} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by user or status..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Total carts: {filteredCarts.length}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Cart ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarts.length > 0 ? (
                filteredCarts.map(cart => (
                  <TableRow key={cart.id}>
                    <TableCell className="font-medium">{cart.id?.substring(0, 6)}...</TableCell>
                    <TableCell>{cart.userId || 'guest'}</TableCell>
                    <TableCell>{getStatusBadge(cart.status || 'active')}</TableCell>
                    <TableCell className="text-center">{cart.items?.length || 0}</TableCell>
                    <TableCell className="text-right">₹{cart.totalAmount || calculateCartTotal(cart.items || [])}</TableCell>
                    <TableCell>{formatDate(cart.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewCart(cart)}
                        >
                          <ShoppingBag size={16} />
                        </Button>
                        
                        <Select 
                          value={cart.status || 'active'} 
                          onValueChange={(value) => updateCartStatus(cart.id!, value)}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => handleDeleteCart(cart.id!)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart size={32} className="text-gray-400" />
                      <p className="text-gray-500">No carts found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Cart Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cart Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected cart
            </DialogDescription>
          </DialogHeader>
          
          {selectedCart && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500 flex items-center">
                      <User size={14} className="mr-1" /> User
                    </span>
                    <span className="font-semibold">{selectedCart.userId || 'Guest'}</span>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500 flex items-center">
                      <Package size={14} className="mr-1" /> Items
                    </span>
                    <span className="font-semibold">{selectedCart.items?.length || 0}</span>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500 flex items-center">
                      <DollarSign size={14} className="mr-1" /> Total
                    </span>
                    <span className="font-semibold">₹{selectedCart.totalAmount || calculateCartTotal(selectedCart.items || [])}</span>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock size={14} className="mr-1" /> Status
                    </span>
                    <span className="font-semibold">{getStatusBadge(selectedCart.status || 'active')}</span>
                  </div>
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Order Timeline</h3>
                <Card className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span>Created</span>
                    </div>
                    <span>{formatDate(selectedCart.createdAt)}</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span>Last Updated</span>
                    </div>
                    <span>{formatDate(selectedCart.updatedAt)}</span>
                  </div>
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Cart Items</h3>
                {selectedCart.items && selectedCart.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCart.items.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package size={24} className="text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-gray-500">Quantity: {item.quantity}</span>
                              <span className="font-medium">₹{item.price}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart size={32} className="text-gray-400" />
                      <p className="text-gray-500">No items in this cart</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCartManager;
