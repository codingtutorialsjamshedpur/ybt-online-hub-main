import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  ArrowRight 
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-br from-[#1A3C5E] to-[#0A2042] text-white">
      {/* Wave Separator */}
      <div className="w-full h-12 bg-[#E6F0FA] dark:bg-gray-900">
        <svg viewBox="0 0 1440 100" className="w-full h-12 -mb-1 fill-[#1A3C5E] dark:fill-[#0A2042]">
          <path d="M0,50 C150,120 350,0 500,40 C650,80 700,10 900,70 C1050,120 1200,50 1440,20 L1440,100 L0,100 Z"></path>
        </svg>
      </div>
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About Company */}
          <div>
            <h3 className="text-xl font-semibold mb-4 relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-[#4A90E2] after:-mb-2">About Company</h3>
            <p className="text-gray-300 mb-4">
              CTJ is dedicated to providing high-quality digital content for learning and growth.
            </p>
            <div className="text-gray-300">
              <p className="mb-2">Features:</p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-[#4A90E2] flex items-center justify-center mr-2">
                    <ArrowRight size={12} className="text-white" />
                  </div>
                  Quality Content
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-[#4A90E2] flex items-center justify-center mr-2">
                    <ArrowRight size={12} className="text-white" />
                  </div>
                  Instant Delivery
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-[#4A90E2] flex items-center justify-center mr-2">
                    <ArrowRight size={12} className="text-white" />
                  </div>
                  Secure Shopping
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-[#4A90E2] flex items-center justify-center mr-2">
                    <ArrowRight size={12} className="text-white" />
                  </div>
                  24/7 Support
                </li>
              </ul>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4 relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-[#4A90E2] after:-mb-2">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="bg-[#4A90E2] w-2 h-2 rounded-full mr-3 group-hover:w-3 transition-all duration-200"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="bg-[#4A90E2] w-2 h-2 rounded-full mr-3 group-hover:w-3 transition-all duration-200"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="bg-[#4A90E2] w-2 h-2 rounded-full mr-3 group-hover:w-3 transition-all duration-200"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="bg-[#4A90E2] w-2 h-2 rounded-full mr-3 group-hover:w-3 transition-all duration-200"></span>
                  Refund and Returns Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-semibold mb-4 relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-[#4A90E2] after:-mb-2">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-[#4A90E2] mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300 hover:text-white transition-colors">
                  codingtutorialsjamshedpur@gmail.com
                </span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-[#4A90E2] mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300 hover:text-white transition-colors">
                  +91 7903638966
                </span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-[#4A90E2] mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300 hover:text-white transition-colors">
                  Jamshedpur, Jharkhand, India
                </span>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-[#4A90E2] mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300 hover:text-white transition-colors">
                  Mon - Sat, 10:00 AM - 7:00 PM
                </span>
              </li>
            </ul>
          </div>

          {/* Subscribe */}
          <div>
            <h3 className="text-xl font-semibold mb-4 relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-[#4A90E2] after:-mb-2">Subscribe</h3>
            <p className="text-gray-300 mb-4">
              Join our newsletter to receive updates on new products and special offers.
            </p>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 pr-12 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-[#4A90E2] bg-white/90 backdrop-blur-sm"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#4A90E2] hover:bg-[#3A80D2] text-white p-1.5 rounded-lg transition-colors">
                <Send size={18} />
              </button>
            </div>
            
            {/* Social Links */}
            <div className="mt-6 flex space-x-4">
              <a 
                href="https://facebook.com/codingtutorialsjamshedpur" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transform hover:scale-110 transition-all bg-[#1A3C5E]/50 hover:bg-[#4A90E2]/30 p-2 rounded-full"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com/codingtutorialsjamshedpur" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transform hover:scale-110 transition-all bg-[#1A3C5E]/50 hover:bg-[#4A90E2]/30 p-2 rounded-full"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://youtube.com/@codingtutorialsjamshedpur" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transform hover:scale-110 transition-all bg-[#1A3C5E]/50 hover:bg-[#4A90E2]/30 p-2 rounded-full"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transform hover:scale-110 transition-all bg-[#1A3C5E]/50 hover:bg-[#4A90E2]/30 p-2 rounded-full"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">COPYRIGHT © {currentYear} <span className="text-white font-medium">CTJ</span> - All Rights Reserved</p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link>
            <span className="text-gray-600">|</span>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Use</Link>
            <span className="text-gray-600">|</span>
            <Link to="/sitemap" className="text-gray-400 hover:text-white transition-colors text-sm">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
