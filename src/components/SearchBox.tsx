import { useState, useEffect, useRef } from 'react';
import { Search, Mic, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      if (recognitionRef.current) {
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Make sure search is expanded before activating voice input
      if (!isExpanded) {
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    }
  };

  // Sample search results - in a real app, this would be dynamic
  const sampleResults = [
    { title: 'React JS Complete Course', path: '/product/react-course' },
    { title: 'Web Development eBook', path: '/product/web-dev-ebook' },
    { title: 'About Us', path: '/about' },
    { title: 'Contact Page', path: '/contact' }
  ];

  useEffect(() => {
    // Simple search - in real app would be more sophisticated
    if (query.trim().length > 2) {
      const filtered = sampleResults
        .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
        .map(item => item.title);
      setResults(filtered);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsExpanded(false);
        setIsListening(false);
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // In a real app, you'd navigate to search results page
      console.log(`Searching for: ${query}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (result: string) => {
    const selectedResult = sampleResults.find(item => item.title === result);
    if (selectedResult) {
      navigate(selectedResult.path);
      setShowResults(false);
      setIsExpanded(false);
      setQuery('');
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    if (query.trim().length > 2) {
      setShowResults(true);
    }
  };

  const closeExpanded = () => {
    setIsExpanded(false);
    setShowResults(false);
    inputRef.current?.blur();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${isExpanded ? 'z-50' : ''}`}>
      {!isExpanded ? (
        // Collapsed search box
        <div 
          className="relative w-full max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-md cursor-text"
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
        >
          <div className="relative py-1.5 pl-8 pr-8">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search size={18} className="text-[#4A90E2]" />
            </div>
            <div className="text-[#5A7D9E]/60 dark:text-gray-400 text-sm truncate">
              {query || "Type here..."}
            </div>
            <div 
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#4A90E2] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleVoiceInput();
              }}
            >
              <Mic size={18} className={isListening ? 'text-red-500 animate-pulse' : 'text-[#4A90E2]'} />
            </div>
          </div>
        </div>
      ) : (
        // Expanded search popup
        <div className="fixed inset-0 flex items-start justify-center pt-[100px] bg-transparent">
          <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-200 animate-fade-in-down">
            <div className="relative p-4">
              <button 
                onClick={closeExpanded}
                className="absolute right-4 top-4 text-[#5A7D9E] hover:text-[#1A3C5E] dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg font-medium text-[#1A3C5E] dark:text-white mb-3">Search</h3>
              
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type here..."
                    className="w-full py-3 pl-10 pr-10 bg-[#F5F9FD] dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-[#1A3C5E] dark:text-white placeholder-[#5A7D9E]/60 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={20} className="text-[#4A90E2]" />
                  </div>
                  <button 
                    type="button"
                    onClick={toggleVoiceInput}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <Mic 
                      size={20} 
                      className={`${
                        isListening 
                          ? 'text-red-500 animate-pulse' 
                          : 'text-[#4A90E2] hover:text-[#3A80D2]'
                      } transition-colors`} 
                    />
                  </button>
                </div>
              </form>

              {isListening && (
                <div className="mt-4 text-center py-3 bg-red-50 rounded-md text-red-500 animate-pulse">
                  Listening... Speak now
                </div>
              )}

              {/* Search results in expanded view */}
              {results.length > 0 ? (
                <div className="mt-4 max-h-[300px] overflow-y-auto">
                  <h4 className="text-sm font-medium text-[#5A7D9E] dark:text-gray-400 mb-2 px-2">Results</h4>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="px-4 py-2.5 hover:bg-[#E6F0FA] dark:hover:bg-gray-700 cursor-pointer text-[#1A3C5E] dark:text-gray-200 rounded-md transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-center">
                        <Search size={16} className="text-[#4A90E2] mr-2 flex-shrink-0" />
                        <span>{result}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query.trim().length > 0 && !isListening ? (
                <div className="mt-4 text-center py-6 text-[#5A7D9E] dark:text-gray-400">
                  No results found for "{query}"
                </div>
              ) : null}

              {query.trim().length === 0 && !isListening && (
                <div className="mt-4 text-center py-4 text-[#5A7D9E] dark:text-gray-400 text-sm">
                  Type to search for products, pages, and more...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add TypeScript interfaces for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default SearchBox; 