import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Smooth scroll to top with animation
  const scrollToTop = () => {
    setIsAnimating(true);
    
    // Create animated scroll effect
    const scrollToTopAnimated = () => {
      const currentPosition = window.scrollY;
      if (currentPosition > 0) {
        // Calculate scroll step - faster at the beginning, slower at the end
        const scrollStep = Math.max(currentPosition / 10, 10);
        window.scrollTo(0, currentPosition - scrollStep);
        window.requestAnimationFrame(scrollToTopAnimated);
      } else {
        setIsAnimating(false);
      }
    };
    
    // Start the animation
    window.requestAnimationFrame(scrollToTopAnimated);
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div 
      className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      <button
        onClick={scrollToTop}
        disabled={isAnimating}
        aria-label="Scroll to top"
        className={`
          relative overflow-hidden
          bg-gradient-to-r from-[#4A90E2] to-[#3A80D2] text-white 
          p-3.5 rounded-full shadow-lg
          transition-all duration-300 transform
          ${isAnimating ? 'animate-bounce-smooth animate-pulse-glow' : 'hover:shadow-[0_0_15px_rgba(74,144,226,0.6)]'}
          group
        `}
      >
        {/* Ripple effect for hover */}
        <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-25 group-hover:animate-wave-circle"></span>
        
        {/* Glowing ripple on activation */}
        {isAnimating && (
          <>
            <span className="absolute inset-0 rounded-full bg-white opacity-25 animate-wave-circle" style={{ animationDelay: '0ms' }}></span>
            <span className="absolute inset-0 rounded-full bg-white opacity-20 animate-wave-circle" style={{ animationDelay: '200ms' }}></span>
            <span className="absolute inset-0 rounded-full bg-white opacity-15 animate-wave-circle" style={{ animationDelay: '400ms' }}></span>
          </>
        )}
        
        {/* Button icon */}
        <ChevronUp 
          size={24} 
          className={`
            relative z-10 transition-transform duration-300
            ${isAnimating ? 'animate-bounce' : 'group-hover:-translate-y-1'}
          `}
        />
      </button>
    </div>
  );
};

export default ScrollToTop;
