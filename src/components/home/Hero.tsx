import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// CountUp animation component
const CountUp = ({ end, duration = 1500 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isVisible) return;
    
    countRef.current = 0;
    const step = Math.ceil(end / (duration / 10));
    
    const interval = setInterval(() => {
      countRef.current += step;
      
      if (countRef.current >= end) {
        countRef.current = end;
        clearInterval(interval);
      }
      
      setCount(countRef.current);
    }, 10);
    
    return () => clearInterval(interval);
  }, [end, duration, isVisible]);

  return <div ref={elementRef}>{count}</div>;
};

const Hero = () => {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center">
          {/* Hero Content */}
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <div className="mb-4 inline-block">
              <div className="bg-blue-100 text-ybtBlue py-2 px-4 rounded-full animate-fade-in">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-ybtBlue rounded-full mr-2"></span>
                  Welcome to CODING TUTORIALS JAMSHEDPUR
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Empowering Your <span className="text-ybtBlue">Digital Journey</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-lg animate-fade-in">
              Join our thriving community of developers, entrepreneurs, and digital creators. Get access to premium resources that accelerate your growth.
            </p>
            
            <div className="flex flex-wrap gap-4 animate-fade-in">
              <Link to="/category/e-book">
                <Button className="bg-ybtBlue hover:bg-blue-700 text-lg px-8 py-6 btn-hover">
                  Explore Products
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="text-lg px-8 py-6 btn-hover">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="lg:w-1/2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm animate-fade-in" style={{animationDelay: "0.1s"}}>
                <h3 className="text-4xl font-bold text-ybtBlue mb-2">
                  <CountUp end={1286} />
                </h3>
                <p className="text-lg text-gray-600">Active Members</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm animate-fade-in" style={{animationDelay: "0.2s"}}>
                <h3 className="text-4xl font-bold text-ybtBlue mb-2">
                  <CountUp end={4} duration={1000} />
                </h3>
                <p className="text-lg text-gray-600">Digital Products</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm animate-fade-in" style={{animationDelay: "0.3s"}}>
                <h3 className="text-4xl font-bold text-ybtBlue mb-2">
                  <CountUp end={98} duration={1200} />
                </h3>
                <p className="text-lg text-gray-600">Success Rate %</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
