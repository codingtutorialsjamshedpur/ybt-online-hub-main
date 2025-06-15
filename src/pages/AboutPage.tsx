import { Card } from '@/components/ui/card';
import { Facebook, Instagram, Youtube, Github, Linkedin, Mail, Phone, MapPin, Calendar, Award, Briefcase, BookOpen, Heart, FileText, Download, X, Eye, RefreshCw, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const AboutPage = () => {
  // Resume modal state
  const [showResume, setShowResume] = useState(false);
  const [downloads, setDownloads] = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  // Detect Safari browser
  useEffect(() => {
    // Safari detection
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

  // Load download count from localStorage
  useEffect(() => {
    const storedDownloads = localStorage.getItem('resumeDownloads');
    if (storedDownloads) {
      setDownloads(parseInt(storedDownloads, 10));
    }
  }, []);

  // Track resume downloads
  const handleDownload = () => {
    try {
      const newCount = downloads + 1;
      setDownloads(newCount);
      localStorage.setItem('resumeDownloads', newCount.toString());
    } catch (error) {
      console.error('Error updating download count:', error);
    }
  };

  // Open in new tab handler
  const openInNewTab = () => {
    window.open('/resume/shourav_resume.pdf', '_blank');
    handleDownload();
  };
  
  // Attempt to load PDF and check if it's accessible
  useEffect(() => {
    if (showResume) {
      setLoadingPdf(true);
      setPdfLoaded(false);
      
      // Check if PDF file exists and is accessible
      fetch('/resume/shourav_resume.pdf', { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            setPdfLoaded(true);
          } else {
            console.error('PDF file not found or accessible');
            setPdfLoaded(false);
          }
        })
        .catch((error) => {
          console.error('Error checking PDF accessibility:', error);
          setPdfLoaded(false);
        })
        .finally(() => {
          setTimeout(() => {
            setLoadingPdf(false);
          }, 1000); // Small delay to ensure UI reflects loading state
        });
    }
  }, [showResume]);

  // Render PDF viewer based on browser capabilities
  const renderPdfViewer = () => {
    if (loadingPdf) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading PDF...</p>
        </div>
      );
    }
    
    if (!pdfLoaded || isSafari) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <FileText size={64} className="text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Unable to display PDF in browser</h3>
          <p className="text-gray-600 mb-8">
            {isSafari 
              ? "Safari has limited PDF viewing capabilities. Please use one of the options below."
              : "Your browser might not support inline PDF viewing or the file might be loading."
            }
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={openInNewTab}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center gap-2"
            >
              <Eye size={18} />
              Open in New Tab
            </button>
            
            <a
              href="/resume/shourav_resume.pdf"
              download="Shourav_Kumar_Resume.pdf"
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center gap-2"
              onClick={handleDownload}
            >
              <Download size={18} />
              Download Resume
            </a>
            
            <button
              onClick={() => {
                setShowResume(false);
                setTimeout(() => setShowResume(true), 100);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Retry
            </button>
          </div>
        </div>
      );
    }
    
    // For supporting as many browsers as possible, we'll offer multiple ways to view the PDF
    const fullPdfUrl = window.location.origin + '/resume/shourav_resume.pdf';
    
    // Use direct object tag which is more compatible
    return (
      <div className="w-full h-full">
        <object
          data={fullPdfUrl}
          type="application/pdf"
          width="100%"
          height="100%"
        >
          <p>Your browser doesn't support PDF viewing. Please download the PDF instead.</p>
        </object>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Author Details */}
        <section className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-6 text-center lg:text-left">About CTJ</h1>
          
          <Card className="p-8 mb-8 overflow-hidden relative bg-gradient-to-r from-[#f0f4f8] to-white dark:from-gray-800 dark:to-gray-900">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#4A90E2]/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#4A90E2]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 relative z-10">
              <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full border-4 border-[#4A90E2] overflow-hidden bg-white flex-shrink-0 shadow-lg transition-transform duration-300 hover:scale-105 relative">
                <img
                  src="/images/shourav_pic.jpg"
                  alt="Shourav Kumar"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    // Fallback if image not found
                    e.currentTarget.src = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&h=200&auto=format&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A3C5E]/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center">
                  <p className="text-white text-sm font-semibold mb-3">Shourav Kumar</p>
                </div>
              </div>
              
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold mb-2 text-[#1A3C5E] dark:text-white">Shourav Kumar</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-700 dark:text-gray-300">
                    <Briefcase size={18} className="text-[#4A90E2]" />
                    <p className="text-lg">Software Engineer, Android App Developer</p>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-700 dark:text-gray-300">
                    <BookOpen size={18} className="text-[#4A90E2]" />
                    <p className="text-lg">Graduated from: Lovely Professional University (Punjab)</p>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-700 dark:text-gray-300">
                    <MapPin size={18} className="text-[#4A90E2]" />
                    <p className="text-lg">BS-3, Kamal Kunj, Sakchi, Jamshedpur-831001, East Singhbhum, Jharkhand</p>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3">
                  <a 
                    href="https://youtube.com/@codingtutorialsjamshedpur" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube size={20} />
                  </a>
                  <a 
                    href="https://facebook.com/codingtutorialsjamshedpur" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                  <a 
                    href="https://instagram.com/codingtutorialsjamshedpur" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                  <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={20} />
                  </a>
                  <a 
                    href="https://github.com/codingtutorialsjamshedpur" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github size={20} />
                  </a>
                </div>
                
                <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-4">
                  <a 
                    href="https://wa.me/917903638966" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-[#4A90E2] hover:bg-[#3A80D2] px-6 py-2 transition-all duration-300 hover:shadow-lg flex items-center gap-2">
                      <Phone size={16} />
                      Contact Me
                    </Button>
                  </a>
                  <Button 
                    onClick={() => setShowResume(true)}
                    className="bg-red-500 hover:bg-red-600 px-6 py-2 transition-all duration-300 hover:shadow-lg flex items-center gap-2"
                  >
                    <FileText size={16} />
                    RESUME
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Professional Summary */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Award className="mr-2 text-[#4A90E2]" size={24} />
              Professional Summary
            </h2>
            <Card className="p-6 bg-gradient-to-r from-white to-[#f8fafc] dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow">
              <p className="text-lg mb-4 leading-relaxed">
                With over 5 years of experience in software development, I specialize in creating robust Android applications and web solutions. My expertise includes Java, Kotlin, React, and modern web technologies.
              </p>
              <p className="text-lg leading-relaxed">
                At CTJ, I'm passionate about creating digital products that help others learn and grow. My goal is to simplify complex technological concepts and make high-quality educational resources accessible to everyone.
              </p>
            </Card>
          </div>
          
          {/* Web Technologies Used */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Code className="mr-2 text-[#4A90E2]" size={24} />
              Web Technologies Used To Build This Website
            </h2>
            <Card className="p-6 bg-gradient-to-r from-white to-[#f8fafc] dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg hover:shadow-md transition-all">
                  <h3 className="text-xl font-semibold mb-2 text-blue-700">Frontend</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>React.js with TypeScript</li>
                    <li>Tailwind CSS for styling</li>
                    <li>React Router for navigation</li>
                    <li>Lucide React for icons</li>
                    <li>React Context API for state management</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg hover:shadow-md transition-all">
                  <h3 className="text-xl font-semibold mb-2 text-green-700">Backend</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Firebase Authentication</li>
                    <li>Firebase Cloud Functions</li>
                    <li>RESTful API architecture</li>
                    <li>Node.js runtime environment</li>
                    <li>Serverless architecture</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg hover:shadow-md transition-all">
                  <h3 className="text-xl font-semibold mb-2 text-yellow-700">Database</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Firebase Firestore (NoSQL)</li>
                    <li>Real-time data synchronization</li>
                    <li>Cloud Storage for media files</li>
                    <li>Indexed data for fast queries</li>
                    <li>Secure data access rules</li>
                  </ul>
                </div>
              </div>
              <p className="text-lg leading-relaxed">
                This modern web application is built using a comprehensive stack of technologies that ensure high performance, scalability, and security. The frontend leverages React with TypeScript for type safety and Tailwind CSS for responsive design. The backend is powered by Firebase's serverless architecture, providing authentication, data storage, and cloud functions. All data is stored in Firestore, a flexible NoSQL database with real-time capabilities, ensuring a seamless user experience across all devices.
              </p>
            </Card>
          </div>
          
          {/* Google Map */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <MapPin className="mr-2 text-[#4A90E2]" size={24} />
              Our Location
            </h2>
            <Card className="p-0 overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-full h-96 bg-gray-200">
              <iframe
                title="CTJ Location"
                src="https://maps.google.com/maps?q=22.798667,86.208111&z=15&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            </Card>
          </div>
          
          {/* Contact Information */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Phone className="mr-2 text-[#4A90E2]" size={24} />
              Contact Information
            </h2>
            <Card className="p-6 bg-gradient-to-r from-white to-[#f8fafc] dark:from-gray-900 dark:to-gray-800 hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center transform hover:translate-y-[-5px] transition-transform">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 shadow-sm">
                    <Mail size={20} className="text-[#4A90E2]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <p className="text-lg">codingtutorialsjamshedpur@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center transform hover:translate-y-[-5px] transition-transform">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4 shadow-sm">
                    <Phone size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">WhatsApp & Mobile</p>
                    <p className="text-lg">+91 7903638966</p>
                  </div>
                </div>
                <div className="flex items-center transform hover:translate-y-[-5px] transition-transform">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4 shadow-sm">
                    <MapPin size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Address</p>
                    <p className="text-lg">Jamshedpur, Jharkhand, India</p>
                  </div>
                </div>
                <div className="flex items-center transform hover:translate-y-[-5px] transition-transform">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 shadow-sm">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Working Hours</p>
                    <p className="text-lg">Mon - Sat, 10:00 AM - 7:00 PM</p>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="mt-8 p-4 bg-[#f8fafc] dark:bg-gray-800 rounded-xl">
                <p className="text-lg font-semibold mb-4 flex items-center">
                  <Heart size={18} className="mr-2 text-red-500" />
                  Connect with us on social media
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://youtube.com/@codingtutorialsjamshedpur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors hover:scale-105 transform shadow-sm"
                  >
                    <Youtube size={20} className="mr-2" />
                    <span>YouTube</span>
                  </a>
                  <a
                    href="https://facebook.com/codingtutorialsjamshedpur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors hover:scale-105 transform shadow-sm"
                  >
                    <Facebook size={20} className="mr-2" />
                    <span>Facebook</span>
                  </a>
                  <a
                    href="https://instagram.com/codingtutorialsjamshedpur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors hover:scale-105 transform shadow-sm"
                  >
                    <Instagram size={20} className="mr-2" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://github.com/codingtutorialsjamshedpur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors hover:scale-105 transform shadow-sm"
                  >
                    <Github size={20} className="mr-2" />
                    <span>GitHub</span>
                  </a>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors hover:scale-105 transform shadow-sm"
                  >
                    <Linkedin size={20} className="mr-2" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* Resume Modal */}
      {showResume && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-md shadow-xl max-w-xl w-full h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="text-[#4A90E2]" size={20} />
                <span className="font-medium text-lg">Shourav Kumar - Resume</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 flex items-center text-sm text-gray-600">
                  <Download size={16} className="mr-1 text-green-500" />
                  <span>{downloads} downloads</span>
                </div>
                <button 
                  onClick={() => setShowResume(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
              {renderPdfViewer()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutPage;
