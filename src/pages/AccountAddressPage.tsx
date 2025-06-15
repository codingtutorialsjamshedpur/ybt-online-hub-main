import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { ShippingAddress } from '../types/address';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AccountAddressPage: React.FC = () => {
  const { userData, currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    country: 'India',
    isDefault: true
  });

  useEffect(() => {
    // Initialize form with existing data
    if (userData) {
      // Check if user has a structured shipping address
      if (userData.shippingAddress && typeof userData.shippingAddress === 'object') {
        setAddress(userData.shippingAddress as ShippingAddress);
      }
      // If not, but has simple address field
      else if (userData.address) {
        setAddress({
          ...address,
          name: userData.name || userData.displayName || '',
          address: userData.address || '',
          phone: userData.phone || ''
        });
      }
      // Set name from user data if available
      else if (userData.name || userData.displayName) {
        setAddress({
          ...address,
          name: userData.name || userData.displayName || ''
        });
      }
    }
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.uid) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update your address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!address.name || !address.address || !address.city || !address.postalCode || !address.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Update user document in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Get current user data
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update the document with new shipping address
        await updateDoc(userRef, {
          shippingAddress: address,
          // Also update the simple address field for backward compatibility
          address: `${address.address}, ${address.city}, ${address.postalCode}`,
          updatedAt: new Date()
        });
        
        // Refresh user data in context
        await refreshUserData();
        
        toast({
          title: "Address Updated",
          description: "Your shipping address has been updated successfully"
        });
        
        // Navigate back to cart if coming from there
        navigate(-1);
      } else {
        throw new Error("User document not found");
      }
    } catch (error: any) {
      console.error("Error updating address:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update your address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Shipping Address</h1>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={address.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={address.address}
                  onChange={handleInputChange}
                  placeholder="Street address, building, etc."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={address.state || ''}
                    onChange={handleInputChange}
                    placeholder="State/Province/Region"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleInputChange}
                    placeholder="Postal/ZIP code"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={address.country || 'India'}
                    onChange={handleInputChange}
                    placeholder="Country"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={address.phone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-[#1A3C5E] hover:bg-[#2D4E6F]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Address
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AccountAddressPage;
