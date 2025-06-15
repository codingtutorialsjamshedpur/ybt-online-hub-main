import { useState, useEffect, useRef } from 'react';
import { Users, Activity, ChevronUp, ChevronDown, X, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserStats {
  current: number;
  peak: number;
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

const OnlineUsersWidget = () => {
  const [userStats, setUserStats] = useState<UserStats>({
    current: 1286,
    peak: 1500,
    trend: 'up',
    history: [1250, 1265, 1280, 1286]
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Close details popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update user count randomly every 3-7 seconds
  useEffect(() => {
    const getRandomInterval = () => Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000;
    
    const updateUserCount = () => {
      setUserStats(prev => {
        // Random change between -10 and +15
        const change = Math.floor(Math.random() * 26) - 10;
        
        // Ensure count stays reasonable
        const newCount = Math.max(1000, Math.min(2000, prev.current + change));
        
        // Determine trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (change > 0) trend = 'up';
        else if (change < 0) trend = 'down';
        
        // Update history (keep last 10 entries)
        const history = [...prev.history, newCount].slice(-10);
        
        // Update peak if needed
        const peak = Math.max(prev.peak, newCount);
        
        return { current: newCount, peak, trend, history };
      });
      
      // Schedule next update with random interval
      setTimeout(updateUserCount, getRandomInterval());
    };
    
    // Start the update cycle
    const timeoutId = setTimeout(updateUserCount, getRandomInterval());
    
    return () => clearTimeout(timeoutId);
  }, []);

  const refreshStats = () => {
    setIsRefreshing(true);
    
    // Simulate API call with a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Get trend icon and color
  const getTrendIcon = () => {
    if (userStats.trend === 'up') {
      return <ChevronUp size={14} className="text-green-500" />;
    } else if (userStats.trend === 'down') {
      return <ChevronDown size={14} className="text-red-500" />;
    }
    return null;
  };

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex items-center text-[#1A3C5E] dark:text-gray-100 whitespace-nowrap cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Users size={16} className="mr-1.5" />
              <span className="text-sm font-medium">Online Users: </span>
              <div className="bg-blue-600 text-white text-xs py-0.5 px-2 rounded-full inline-flex items-center font-medium">
                <Users size={12} className="mr-1" />
                <span>{userStats.current}</span>
              </div>  
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                {getTrendIcon()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Click for more details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Details Popup */}
      {showDetails && (
        <div 
          ref={detailsRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 w-64 overflow-hidden animate-fade-in"
        >
          <div className="p-3 relative">
            <button 
              onClick={() => setShowDetails(false)}
              className="absolute right-2 top-2 text-[#5A7D9E] hover:text-[#1A3C5E] dark:text-gray-400 dark:hover:text-white"
            >
              <X size={16} />
            </button>
            
            <div className="flex justify-between items-start mb-4 mt-1">
              <h3 className="font-bold text-lg flex items-center">
                <Users size={16} className="mr-1 text-[#4A90E2]" />
                Online Users
              </h3>
              <button 
                className={`text-[#4A90E2] hover:text-[#3A80D2] transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  refreshStats();
                }}
                disabled={isRefreshing}
                title="Refresh stats"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-[#4A90E2]">
                  {userStats.current.toLocaleString()}
                </span>
                <span className="ml-2">{getTrendIcon()}</span>
              </div>
              <div className="text-sm text-[#5A7D9E] dark:text-gray-400 flex items-center">
                <Activity size={14} className="mr-1" />
                Live
              </div>
            </div>
            
            {/* Visual representation of user count trends */}
            <div className="h-12 mb-4 bg-gray-50 dark:bg-gray-700 rounded overflow-hidden flex items-end">
              {userStats.history.map((count, index) => {
                // Calculate relative height based on min/max in history
                const min = Math.min(...userStats.history);
                const max = Math.max(...userStats.history);
                const range = max - min;
                const height = range > 0 
                  ? Math.max(20, Math.round(((count - min) / range) * 100)) 
                  : 50;
                
                return (
                  <div 
                    key={index} 
                    className="flex-1 mx-0.5 bg-[#4A90E2] rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${count} users`}
                  ></div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-[#5A7D9E] dark:text-gray-400 text-xs">Peak Today</div>
                <div className="font-medium">{userStats.peak.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-[#5A7D9E] dark:text-gray-400 text-xs">Trend</div>
                <div className="font-medium flex items-center">
                  {userStats.trend === 'up' ? (
                    <>Rising <ChevronUp size={14} className="ml-1 text-green-500" /></>
                  ) : userStats.trend === 'down' ? (
                    <>Declining <ChevronDown size={14} className="ml-1 text-red-500" /></>
                  ) : (
                    'Stable'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersWidget; 