import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Coffee, Copy, X } from 'lucide-react';
import { useToast } from '../ui/use-toast';

const BuyMeCoffee = () => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const upiId = '7762953796@ybl';

  // Show the popup after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isClosed) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isClosed]);

  // Handle close button click
  const handleClose = () => {
    setIsVisible(false);
    setIsClosed(true);
    
    // Store in localStorage to remember user's preference
    localStorage.setItem('buyMeCoffeeClosed', 'true');
  };

  // Handle copy UPI ID
  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    toast({
      title: "UPI ID Copied!",
      description: "UPI ID has been copied to your clipboard",
      duration: 3000,
    });
  };

  // If user closed it before, don't show
  useEffect(() => {
    const wasClosed = localStorage.getItem('buyMeCoffeeClosed') === 'true';
    if (wasClosed) {
      setIsClosed(true);
    }
  }, []);

  if (isClosed) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform max-w-xs w-full 
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
    >
      <div className="bg-blue-600 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center">
          <Coffee className="h-5 w-5 mr-2" />
          <h3 className="font-medium text-sm">Buy Me a Coffee</h3>
        </div>
        <button
          onClick={handleClose}
          className="text-white hover:bg-blue-700 rounded p-1"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">
          A small token if you like our work!
        </p>
        
        <div className="flex items-center bg-gray-100 rounded p-2 mb-3">
          <span className="text-gray-800 text-sm font-medium mr-2">UPI:</span>
          <code className="text-sm text-gray-700 flex-1">{upiId}</code>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0"
            onClick={handleCopyUPI}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
          onClick={handleCopyUPI}
        >
          <Copy className="h-4 w-4 mr-2" /> Copy UPI
        </Button>
      </div>
    </div>
  );
};

export default BuyMeCoffee;
