import { useState, useEffect, useRef } from 'react';

const stats = [
  {
    platform: "YouTube",
    count: 35000,
    label: "YouTube Subscribers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
    ),
  },
  {
    platform: "Instagram",
    count: 22000,
    label: "Instagram Followers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    platform: "Telegram",
    count: 7700,
    label: "Telegram Members",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.372-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm-1.218 19.073l-.001.002-.002-.001.003-.001zm-.707-.219l-4.375-3.958c-.339-.338-.565-.852-.575-1.448-.129-2.182-.822-9.487-.812-9.487.002-.026.257-.332.331-.381.242-.19.549-.232.826-.118.152.062 7.018 4.765 7.018 4.765.705.481.94.703 1.156 1.609.085.357.183.758.258 1.024l1.092 3.94c.084.333-.021.452-.239.492-.121.026-.746-.16-1.18-.373-2.009-.981-2.618-1.31-2.618-1.31-.245-.11-.403-.162-.758-.03-.174.069-1.053.52-1.246.621l-1.706.847.881.331.653.249.644.243c.12.057.29.11.335.147.14.119.132.265-.02.335zm2.275-4.092l-.97-3.308c-.218-.744-.373-.994-.802-1.266-.137-.087-2.59-1.738-3.812-2.554l5.505 6.118-.001.002.08 1.008zm3.519-6.542c-.14.068-2.961 1.992-3.278 2.206-.318.214-.311.417-.091.526.221.109 3.076 1.792 3.293 1.92.217.128.413.34.534.029s.653-1.889.771-2.217c.064-.178.094-.345-.188-.422-.283-.077-.8-.21-1.041-.272-.242-.061-.242.068 0-.301.242-.369.622-.97.757-1.197.135-.226-.098-.341-.229-.275z" />
      </svg>
    ),
  },
  {
    platform: "GitHub",
    count: 80,
    label: "GitHub Followers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
];

// CountUp component for animating numbers
const CountUp = ({ end, duration = 2000, formatter = (value: number) => value.toLocaleString() }: { 
  end: number, 
  duration?: number,
  formatter?: (value: number) => string
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Detect when element is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  // Setup scroll event listener to trigger animation
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible && !shouldAnimate) {
        setShouldAnimate(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check if element is already visible
    if (isVisible && !shouldAnimate) {
      setShouldAnimate(true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible, shouldAnimate]);

  // Perform the count-up animation
  useEffect(() => {
    if (!shouldAnimate) return;
    
    countRef.current = 0;
    const step = Math.ceil(end / (duration / 16));
    
    const interval = setInterval(() => {
      countRef.current += step;
      
      if (countRef.current >= end) {
        countRef.current = end;
        clearInterval(interval);
      }
      
      setCount(countRef.current);
    }, 16);
    
    return () => clearInterval(interval);
  }, [end, duration, shouldAnimate]);

  return <div ref={elementRef}>{formatter(count)}</div>;
};

const Community = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">
            Join Our <span className="text-ybtBlue">Community</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center animate-scale-in card-hover"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="mb-4">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold mb-2">
                <CountUp 
                  end={stat.count} 
                  duration={2000 + index * 200} 
                  formatter={(value) => {
                    return stat.count >= 1000 
                      ? value.toLocaleString() 
                      : value.toString();
                  }}
                />
              </h3>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Community;
