import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

const LiveUsers = () => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    // Initial random count between 50 and 200
    const initialCount = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
    setUserCount(initialCount);

    // Update count every 10 seconds with slight variations
    const interval = setInterval(() => {
      setUserCount(prevCount => {
        // Random change between -5 and +10
        const change = Math.floor(Math.random() * 16) - 5;
        
        // Ensure count stays between 50 and 200
        const newCount = Math.max(50, Math.min(200, prevCount + change));
        return newCount;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center text-[#4A90E2] animate-pulse-slow">
      <Users size={18} className="mr-2" />
      <div className="flex items-baseline">
        <span className="font-semibold">{userCount}</span>
        <span className="text-xs ml-1">online now</span>
      </div>
    </div>
  );
};

export default LiveUsers; 