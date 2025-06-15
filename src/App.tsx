import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AdminPage from "./pages/AdminPage";
import WeatherPage from "./pages/WeatherPage";
import NotFound from "./pages/NotFound";
import TestPage from "./pages/TestPage";
import UserDashboard from "@/components/user/UserDashboard";
import UserTickets from "@/components/user/UserTickets";
import TicketCreate from "@/components/user/TicketCreate";
import TicketDetails from "@/components/user/TicketDetails";
import UserProfile from "@/components/user/UserProfile";
import ProtectedRoute from "@/components/user/ProtectedRoute";
import UserOrders from "@/components/user/UserOrders";
import UserWishlist from "@/components/user/UserWishlist";
import UserAddresses from "@/components/user/UserAddresses";
import PaymentMethods from "@/components/user/PaymentMethods";
import UserNotifications from "@/components/user/UserNotifications";
import AccountAddressPage from "@/pages/AccountAddressPage";
// Using aliased imports to avoid TypeScript module resolution issues
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import ProductsPage from "@/pages/ProductsPage";
import EBooksPage from "@/pages/EBooksPage";
import PacksPage from "@/pages/PacksPage";
import TemplatesPage from "@/pages/TemplatesPage";
import ToolsScriptsPage from "@/pages/ToolsScriptsPage";
import VideoCoursesPage from "@/pages/VideoCoursesPage";
import CartPage from "@/pages/CartPage";
import PaymentCallbackPage from "@/pages/PaymentCallbackPage";
import PhonePeTestPage from "@/pages/PhonePeTestPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/CookieConsent";
import FloatingCartButton from "./components/cart/FloatingCartButton";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "./components/cart/CartContext";

// Import Firebase configuration from the centralized config file
import "./firebase/config";

const queryClient = new QueryClient();

// Error fallback component
type ErrorFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
    <pre className="bg-gray-100 p-4 rounded-md max-w-2xl overflow-auto text-left mb-4">
      {error.message}
    </pre>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Try again
    </button>
  </div>
);

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <Router>
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/category/e-books" element={<EBooksPage />} />
              <Route path="/category/e-books" element={<EBooksPage />} />
              <Route path="/category/e-book" element={<EBooksPage />} />
              <Route path="/products/category/packs" element={<PacksPage />} />
              <Route path="/category/packs" element={<PacksPage />} />
              <Route path="/category/pack" element={<PacksPage />} />
              <Route path="/products/category/templates" element={<TemplatesPage />} />
              <Route path="/category/templates" element={<TemplatesPage />} />
              <Route path="/products/category/tools-scripts" element={<ToolsScriptsPage />} />
              <Route path="/category/tools-scripts" element={<ToolsScriptsPage />} />
              <Route path="/products/category/video-courses" element={<VideoCoursesPage />} />
              <Route path="/category/video-courses" element={<VideoCoursesPage />} />
              <Route path="/category/video-course" element={<VideoCoursesPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/payment-callback" element={<ProtectedRoute><PaymentCallbackPage /></ProtectedRoute>} />
              <Route path="/phonepe-test" element={<PhonePeTestPage />} />
              {/* User Panel Routes - Protected with Authentication */}
              <Route path="/user" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              {/* Redirect from old dashboard URL to new one */}
              <Route path="/user/dashboard" element={<ProtectedRoute><Navigate to="/user" replace /></ProtectedRoute>} />
              <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/user/tickets" element={<ProtectedRoute><UserTickets /></ProtectedRoute>} />
              <Route path="/user/tickets/create" element={<ProtectedRoute><TicketCreate /></ProtectedRoute>} />
              <Route path="/user/tickets/:ticketId" element={<ProtectedRoute><TicketDetails /></ProtectedRoute>} />
              <Route path="/user/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
              <Route path="/user/orders/:orderId" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
              <Route path="/user/wishlist" element={<ProtectedRoute><UserWishlist /></ProtectedRoute>} />
              <Route path="/user/addresses" element={<ProtectedRoute><UserAddresses /></ProtectedRoute>} />
              <Route path="/user/address" element={<ProtectedRoute><AccountAddressPage /></ProtectedRoute>} />
              <Route path="/user/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
              <Route path="/user/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Chatbot />
            <ScrollToTop />
            <FloatingCartButton />
            <Footer />
            <CookieConsent />
          </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
