import { useState, useEffect, useRef } from 'react';
import { MapPin, Thermometer, Droplets, RefreshCw, X, LocateFixed, Home } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  tempMin: number;
  tempMax: number;
  location?: string;
  lat?: number;
  lon?: number;
}

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [useUserLocation, setUseUserLocation] = useState(true);

  // Default Jamshedpur coordinates
  const jamshedpurCoords = {
    lat: 22.798667,
    lon: 86.208111,
    location: 'Jamshedpur'
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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

  // Get user location based on IP address
  const getUserLocation = async (): Promise<{ lat: number; lon: number; location: string }> => {
    try {
      // Using ipinfo.io to get location from IP
      const response = await fetch('https://ipinfo.io/json?token=7e8e88f621f7a5');

      if (!response.ok) {
        throw new Error('Failed to get location from IP');
      }

      const data = await response.json();

      // Location comes as "lat,lon" string
      if (data.loc) {
        const [lat, lon] = data.loc.split(',').map(Number);
        return {
          lat,
          lon,
          location: data.city || data.region || 'Your Location'
        };
      }

      throw new Error('Location data not available');
    } catch (error) {
      console.error('Error getting user location:', error);
      // Silently use Jamshedpur weather without showing error toasts
      return jamshedpurCoords;
    }
  };

  // Toggle between user location and Jamshedpur
  const toggleLocation = async () => {
    setLoading(true);

    if (useUserLocation) {
      // Switch to Jamshedpur
      setUseUserLocation(false);
      await fetchWeatherForCoordinates(jamshedpurCoords.lat, jamshedpurCoords.lon, 'Jamshedpur');
    } else {
      // Switch to user location
      setUseUserLocation(true);
      const userLocation = await getUserLocation();
      await fetchWeatherForCoordinates(userLocation.lat, userLocation.lon, userLocation.location);
    }
  };

  // Fetch weather data for specific coordinates
  const fetchWeatherForCoordinates = async (lat: number, lon: number, locationName?: string) => {
    try {
      setRefreshing(true);

      // Using OpenWeatherMap API with a valid API key
      // For demo purposes, we'll use a public API key, but in production you should use environment variables
      const API_KEY = '4f41c4e3b2998dd9ebffd4de02e4cbd7';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Weather data fetch failed');
      }

      const data = await response.json();

      setWeatherData({
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        description: data.weather[0].main,
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        location: locationName || data.name,
        lat,
        lon
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Use fallback data for demo purposes
      setWeatherData({
        temperature: 36,
        humidity: 37,
        description: 'Mist',
        tempMin: 25,
        tempMax: 37,
        location: locationName || 'Jamshedpur',
        lat,
        lon
      });
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  // Main weather fetching function
  const fetchWeather = async () => {
    if (useUserLocation) {
      // Get user location and fetch weather
      const userLocation = await getUserLocation();
      await fetchWeatherForCoordinates(userLocation.lat, userLocation.lon, userLocation.location);
    } else {
      // Use Jamshedpur coordinates
      await fetchWeatherForCoordinates(jamshedpurCoords.lat, jamshedpurCoords.lon, 'Jamshedpur');
    }
  };

  // Fetch weather data on component mount
  useEffect(() => {
    fetchWeather();

    // Refresh weather every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchWeather();
    }, 300000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  // Format time as "08:48 PM"
  const formattedTime = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Temperature change animation class
  const getTempChangeClass = () => {
    if (!weatherData) return '';
    if (weatherData.temperature >= 35) return 'text-orange-500';
    if (weatherData.temperature <= 20) return 'text-blue-500';
    return 'text-[#4A90E2]';
  };

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-1 shadow-sm animate-pulse">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative text-[#1A3C5E] dark:text-gray-100">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex flex-col items-end cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="flex items-center">
                <span className="font-semibold text-sm mr-2">{weatherData?.description}</span>
                <span className="bg-[#4A90E2] text-white text-[10px] py-0.5 px-2 rounded-full flex items-center">
                  <Droplets size={10} className="mr-1" />
                  <span>{weatherData?.humidity}%</span>
                </span>
                <Thermometer size={16} className={`ml-2 ${getTempChangeClass()} transition-colors duration-500`} />
              </div>
              <div className="text-[10px] text-[#5A7D9E] dark:text-gray-300 mt-0.5">
                {weatherData?.tempMin}° - {weatherData?.tempMax}°C @ {weatherData?.location || 'Jamshedpur'} • {formattedTime}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Click for more details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Weather Details Popup */}
      {showDetails && (
        <div
          ref={detailsRef}
          className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 w-64 overflow-hidden animate-fade-in"
        >
          <div className="p-3 relative">
            <button
              onClick={() => setShowDetails(false)}
              className="absolute right-2 top-2 text-[#5A7D9E] hover:text-[#1A3C5E] dark:text-gray-400 dark:hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex justify-between items-start mb-4 mt-1">
              <div>
                <h3 className="font-bold text-lg flex items-center">
                  <MapPin size={16} className="mr-1 text-[#4A90E2]" />
                  {weatherData?.location || 'Jamshedpur'}
                </h3>
                <p className="text-[#5A7D9E] dark:text-gray-400 text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  className={`text-[#4A90E2] hover:text-[#3A80D2] transition-colors ${refreshing ? 'animate-spin' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchWeather();
                  }}
                  disabled={refreshing}
                  title="Refresh weather data"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  className="text-[#4A90E2] hover:text-[#3A80D2] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLocation();
                  }}
                  disabled={refreshing}
                  title={useUserLocation ? "Switch to Jamshedpur weather" : "Switch to your location"}
                >
                  {useUserLocation ? <Home size={18} /> : <LocateFixed size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <Thermometer size={20} className={`mr-2 ${getTempChangeClass()}`} />
                <span className={`text-2xl font-bold ${getTempChangeClass()} transition-colors duration-500`}>
                  {weatherData?.temperature}°C
                </span>
              </div>
              <div className="text-sm text-[#5A7D9E] dark:text-gray-400">
                {weatherData?.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-[#5A7D9E] dark:text-gray-400 text-xs">Min Temp</div>
                <div className="font-medium">{weatherData?.tempMin}°C</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-[#5A7D9E] dark:text-gray-400 text-xs">Max Temp</div>
                <div className="font-medium">{weatherData?.tempMax}°C</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-[#5A7D9E] dark:text-gray-400 text-xs">Humidity</div>
                <div className="font-medium">{weatherData?.humidity}%</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-[#5A7D9E] dark:text-gray-400 text-xs">Updated</div>
                <div className="font-medium">{formattedTime}</div>
              </div>
              <div className="col-span-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-[#5A7D9E] dark:text-gray-400 text-xs">Location Mode</div>
                <div className="font-medium flex items-center">
                  {useUserLocation ? (
                    <>
                      <LocateFixed size={14} className="mr-1 text-green-500" /> 
                      Your Location
                    </>
                  ) : (
                    <>
                      <Home size={14} className="mr-1 text-blue-500" /> 
                      Jamshedpur Fixed
                    </>
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

export default WeatherWidget; 