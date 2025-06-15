import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (consent === null) {
      // Slight delay before showing for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-white/90 backdrop-blur-sm m-4 rounded-xl shadow-lg border border-[#4A90E2]/10 p-4 md:max-w-3xl md:mx-auto">
        <div className="flex items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-[#1A3C5E] font-semibold text-lg mb-2">Cookie Consent</h3>
            <p className="text-[#5A7D9E] text-sm md:text-base">
              We use cookies to enhance your experience. Accept or decline to continue.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDecline}
              className="text-[#5A7D9E] border border-[#4A90E2] bg-transparent hover:bg-[#E6F0FA] py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200"
            >
              Decline
            </button>
            <button 
              onClick={handleAccept}
              className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200"
            >
              Accept
            </button>
          </div>
          <button 
            onClick={handleDecline} 
            className="text-[#5A7D9E] hover:text-[#1A3C5E] p-1 rounded-lg"
            aria-label="Close cookie consent"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent; 