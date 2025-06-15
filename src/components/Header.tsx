import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Heart, Home, Info, Menu, MessageSquare, User, Users, BookOpen, ShoppingBag, ShoppingCart } from 'lucide-react';
import CartIcon from './cart/CartIcon';
import WeatherWidget from './WeatherWidget';
import SearchBox from './SearchBox';
import OnlineUsersWidget from './OnlineUsersWidget';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#E6F0FA] dark:bg-gray-900 shadow-sm sticky top-0 z-50 py-2">
      <div className="container mx-auto px-4">
        {/* Top navigation bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left section: Empty space */}
          <div className="w-4"></div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 transition-all hover:shadow-md">
              <div className="flex items-center text-[#1A3C5E] dark:text-gray-100">
                <Home size={16} className="mr-2" />
                <span className="text-base font-medium">Home</span>
              </div>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 transition-all hover:shadow-md">
                  <div className="flex items-center text-[#1A3C5E] dark:text-gray-100">
                    <ShoppingBag size={16} className="mr-2" />
                    <span className="text-base font-medium">Products</span>
                    <ChevronDown size={16} className="ml-2" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl">
                <DropdownMenuItem asChild>
                  <Link to="/products" className="w-full cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100 font-medium">All Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/category/e-book" className="w-full cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">E-Book</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/category/pack" className="w-full cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Pack</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/category/templates" className="w-full cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Templates</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/category/tools-scripts" className="w-full cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Tools/Scripts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/category/video-course" className="w-full cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Video Course</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link to="/blog" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 transition-all hover:shadow-md">
              <div className="flex items-center text-[#1A3C5E] dark:text-gray-100">
                <BookOpen size={16} className="mr-2" />
                <span className="text-base font-medium">Blog</span>
              </div>
            </Link>
            
            <Link to="/cart" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 transition-all hover:shadow-md">
              <div className="flex items-center text-[#1A3C5E] dark:text-gray-100">
                <CartIcon className="mr-2 flex-shrink-0" />
                <span className="text-base font-medium">Cart</span>
              </div>
            </Link>
            
            <Link to="/about" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 transition-all hover:shadow-md">
              <div className="flex items-center text-[#1A3C5E] dark:text-gray-100">
                <Info size={16} className="mr-2" />
                <span className="text-base font-medium">About Us</span>
              </div>
            </Link>
            
            <Link to="/contact" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 transition-all hover:shadow-md">
              <div className="flex items-center text-[#1A3C5E] dark:text-gray-100">
                <MessageSquare size={16} className="mr-2" />
                <span className="text-base font-medium">Contact Us</span>
              </div>
            </Link>
          </nav>

          {/* Right section: Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-[#1A3C5E] dark:text-gray-100 hover:text-[#4A90E2]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Title section */}
        <div className="text-center mt-4">
          <h2 className="text-lg font-bold text-[#1A3C5E] dark:text-white">CTJ <span className="font-normal text-[#5A7D9E] dark:text-gray-300">- Digital Products</span></h2>
        </div>

        {/* Widgets row - Search, Online Users, Weather, Heart, Cart and Login in one line */}
        <div className="mt-4">
          <div className="hidden md:flex items-center justify-between gap-4 max-w-[1200px] mx-auto px-4">
            {/* Left slot - Search Box */}
            <div className="flex-shrink-0">
              <SearchBox />
            </div>
            
            {/* Middle slot - Online Users */}
            <div className="flex-shrink-0">
              <OnlineUsersWidget />
            </div>
            
            {/* Weather Widget */}
            <div className="flex-shrink-0">
              <WeatherWidget />
            </div>

            {/* Login Button */}
            <div className="flex-shrink-0">
              {currentUser || userData ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full bg-white dark:bg-gray-800 border-[#4A90E2]/30 h-8 w-8 p-0">
                      <User size={18} className="text-[#0A2042]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl">
                    <DropdownMenuItem className="font-medium text-[#1A3C5E] dark:text-gray-100">
                      {userData?.username || currentUser?.email}
                    </DropdownMenuItem>
                    {userData?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer w-full hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/user/profile" className="cursor-pointer w-full hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/user" className="cursor-pointer w-full hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button className="bg-[#4A90E2] text-white rounded-md px-5 py-1 text-sm">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile layout */}
          <div className="md:hidden flex flex-col px-4 py-2 gap-3 items-center">
            <div className="w-full max-w-[300px]">
              <SearchBox />
            </div>
            
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="flex-shrink-0">
                <OnlineUsersWidget />
              </div>
              
              <WeatherWidget />
            </div>

            <div className="flex items-center justify-center gap-6 w-full mt-2">
              <Link to="/wishlist" className="relative text-[#0A2042] dark:text-gray-100">
                <Heart size={20} className="text-[#0A2042]" />
                <span className="absolute -top-1.5 right-0 bg-[#4A90E2] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  0
                </span>
              </Link>
              
              <Link to="/cart" className="relative text-[#0A2042] dark:text-gray-100">
                <CartIcon className="text-[#0A2042]" />
              </Link>
              
              {currentUser || userData ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full bg-white dark:bg-gray-800 border-[#4A90E2]/30 h-7 w-7 p-0">
                      <User size={16} className="text-[#0A2042]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl">
                    <DropdownMenuItem className="font-medium text-[#1A3C5E] dark:text-gray-100">
                      {userData?.username || currentUser?.email}
                    </DropdownMenuItem>
                    {userData?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer w-full hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/user/profile" className="cursor-pointer w-full hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/user" className="cursor-pointer w-full hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-[#E6F0FA] dark:hover:bg-gray-700 text-[#1A3C5E] dark:text-gray-100">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button className="bg-[#4A90E2] text-white rounded-md px-3 py-1 text-xs">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-3 px-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-[#4A90E2]/10 dark:border-gray-700 animate-fade-in">
          <nav className="flex flex-col space-y-2">
            <Link
              to="/"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-1.5 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home size={16} className="mr-2 text-[#1A3C5E] dark:text-gray-100" />
              <span className="text-base font-medium text-[#1A3C5E] dark:text-gray-100">Home</span>
            </Link>
            
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm p-3">
              <div className="flex items-center mb-2">
                <ShoppingCart size={16} className="mr-2 text-[#1A3C5E] dark:text-gray-100" />
                <h3 className="font-medium text-base text-[#1A3C5E] dark:text-gray-100">Products</h3>
              </div>
              <div className="space-y-1 pl-3 border-l-2 border-[#E6F0FA] dark:border-gray-700">
                <Link
                  to="/products"
                  className="block text-sm font-medium text-[#5A7D9E] dark:text-gray-300 hover:text-[#4A90E2] transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  All Products
                </Link>
                <Link
                  to="/category/e-book"
                  className="block text-sm text-[#5A7D9E] dark:text-gray-300 hover:text-[#4A90E2] transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  E-Book
                </Link>
                <Link
                  to="/category/pack"
                  className="block text-sm text-[#5A7D9E] dark:text-gray-300 hover:text-[#4A90E2] transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pack
                </Link>
                <Link
                  to="/category/templates"
                  className="block text-sm text-[#5A7D9E] dark:text-gray-300 hover:text-[#4A90E2] transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Templates
                </Link>
                <Link
                  to="/category/tools-scripts"
                  className="block text-sm text-[#5A7D9E] dark:text-gray-300 hover:text-[#4A90E2] transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tools/Scripts
                </Link>
                <Link
                  to="/category/video-course"
                  className="block text-sm text-[#5A7D9E] dark:text-gray-300 hover:text-[#4A90E2] transition-colors py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Video Course
                </Link>
              </div>
            </div>
            
            <Link
              to="/blog"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-1.5 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <BookOpen size={16} className="mr-2 text-[#1A3C5E] dark:text-gray-100" />
              <span className="text-base font-medium text-[#1A3C5E] dark:text-gray-100">Blog</span>
            </Link>
            
            <Link
              to="/cart"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-1.5 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <CartIcon className="mr-2 text-[#1A3C5E] dark:text-gray-100" />
              <span className="text-base font-medium text-[#1A3C5E] dark:text-gray-100">Cart</span>
            </Link>
            
            <Link
              to="/about"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-1.5 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Info size={16} className="mr-2 text-[#1A3C5E] dark:text-gray-100" />
              <span className="text-base font-medium text-[#1A3C5E] dark:text-gray-100">About Us</span>
            </Link>
            
            <Link
              to="/contact"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-1.5 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <MessageSquare size={16} className="mr-2 text-[#1A3C5E] dark:text-gray-100" />
              <span className="text-base font-medium text-[#1A3C5E] dark:text-gray-100">Contact Us</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
