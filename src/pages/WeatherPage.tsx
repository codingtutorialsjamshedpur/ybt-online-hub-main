import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Thermometer, Droplets, Wind, Compass, Cloud, Sun, Umbrella, Clock } from 'lucide-react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  clouds: number;
  visibility: number;
  sunrise: Date;
  sunset: Date;
  description: string;
  icon: string;
  location: string;
}

const WeatherPage = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Jamshedpur coordinates
        const lat = 22.798667;
        const lon = 86.208111;
        
        // Using OpenWeatherMap API
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=YOUR_API_KEY`
        );
        
        if (!response.ok) {
          throw new Error('Weather data fetch failed');
        }
        
        const data = await response.json();
        
        setWeatherData({
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg,
          clouds: data.clouds.all,
          visibility: data.visibility / 1000, // Convert to km
          sunrise: new Date(data.sys.sunrise * 1000),
          sunset: new Date(data.sys.sunset * 1000),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          location: data.name
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        // Fallback data for demo
        setWeatherData({
          temperature: 36,
          feelsLike: 38,
          humidity: 37,
          pressure: 1010,
          windSpeed: 3.5,
          windDirection: 120,
          clouds: 20,
          visibility: 10,
          sunrise: new Date(dateTime.setHours(6, 0, 0, 0)),
          sunset: new Date(dateTime.setHours(18, 30, 0, 0)),
          description: 'Mist',
          icon: '50d',
          location: 'Jamshedpur'
        });
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const formattedDate = dateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E6F0FA] py-12 px-4">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-white/60 rounded-full w-1/3 mb-8"></div>
          <div className="bg-white/90 rounded-xl p-8 shadow-lg">
            <div className="h-20 bg-gray-200 rounded-xl mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6F0FA] py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1A3C5E] mb-8">Weather in Jamshedpur</h1>
        
        <Card className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border-none mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="text-[#5A7D9E] text-lg">{formattedDate}</div>
              <div className="text-[#1A3C5E] text-3xl font-bold mt-1">{weatherData?.location || 'Jamshedpur'}, Sakchi</div>
              <div className="text-[#5A7D9E] capitalize">{weatherData?.description || 'Mist'}</div>
            </div>
            <div className="flex items-center">
              <img 
                src={`https://openweathermap.org/img/wn/${weatherData?.icon || '50d'}@2x.png`}
                alt="Weather icon"
                className="w-20 h-20"
              />
              <div className="text-6xl font-bold text-[#1A3C5E]">{weatherData?.temperature || 36}°C</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#E6F0FA] p-4 rounded-xl">
              <div className="flex items-center text-[#4A90E2] mb-2">
                <Thermometer size={18} className="mr-2" />
                <span className="text-sm font-medium">Feels Like</span>
              </div>
              <div className="text-xl font-semibold text-[#1A3C5E]">{weatherData?.feelsLike || 38}°C</div>
            </div>
            
            <div className="bg-[#E6F0FA] p-4 rounded-xl">
              <div className="flex items-center text-[#4A90E2] mb-2">
                <Droplets size={18} className="mr-2" />
                <span className="text-sm font-medium">Humidity</span>
              </div>
              <div className="text-xl font-semibold text-[#1A3C5E]">{weatherData?.humidity || 37}%</div>
            </div>
            
            <div className="bg-[#E6F0FA] p-4 rounded-xl">
              <div className="flex items-center text-[#4A90E2] mb-2">
                <Wind size={18} className="mr-2" />
                <span className="text-sm font-medium">Wind</span>
              </div>
              <div className="text-xl font-semibold text-[#1A3C5E]">{weatherData?.windSpeed || 3.5} m/s</div>
            </div>
            
            <div className="bg-[#E6F0FA] p-4 rounded-xl">
              <div className="flex items-center text-[#4A90E2] mb-2">
                <Compass size={18} className="mr-2" />
                <span className="text-sm font-medium">Direction</span>
              </div>
              <div className="text-xl font-semibold text-[#1A3C5E]">{weatherData?.windDirection || 120}°</div>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border-none">
            <h3 className="text-xl font-semibold text-[#1A3C5E] mb-4">Additional Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6F0FA] pb-2">
                <div className="flex items-center text-[#5A7D9E]">
                  <Cloud size={18} className="mr-2" />
                  <span>Cloud Cover</span>
                </div>
                <div className="font-medium text-[#1A3C5E]">{weatherData?.clouds || 20}%</div>
              </div>
              
              <div className="flex items-center justify-between border-b border-[#E6F0FA] pb-2">
                <div className="flex items-center text-[#5A7D9E]">
                  <Umbrella size={18} className="mr-2" />
                  <span>Pressure</span>
                </div>
                <div className="font-medium text-[#1A3C5E]">{weatherData?.pressure || 1010} hPa</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-[#5A7D9E]">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-2"
                  >
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="M19 5l1.5 1.5"></path>
                    <path d="M3.5 18.5 5 20"></path>
                    <path d="M19 19l1.5-1.5"></path>
                    <path d="M3.5 5.5 5 4"></path>
                    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                  </svg>
                  <span>Visibility</span>
                </div>
                <div className="font-medium text-[#1A3C5E]">{weatherData?.visibility || 10} km</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border-none">
            <h3 className="text-xl font-semibold text-[#1A3C5E] mb-4">Sun Schedule</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-[#5A7D9E]">
                  <Sun size={18} className="mr-2" />
                  <span>Sunrise</span>
                </div>
                <div className="font-medium text-[#1A3C5E]">
                  {weatherData?.sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || '6:00 AM'}
                </div>
              </div>
              
              <div className="relative h-2 bg-[#E6F0FA] rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: '50%' }}></div>
                <div className="absolute top-0 left-0 h-4 w-4 bg-yellow-400 rounded-full -mt-1 ml-1"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-[#5A7D9E]">
                  <Clock size={18} className="mr-2" />
                  <span>Sunset</span>
                </div>
                <div className="font-medium text-[#1A3C5E]">
                  {weatherData?.sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || '6:30 PM'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WeatherPage; 