import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Check, CheckCheck, PaperclipIcon, Mic, SmileIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{ 
    text: string; 
    isUser: boolean; 
    isWhatsApp?: boolean; 
    options?: string[];
    timestamp?: Date;
    isRead?: boolean;
  }[]>([
    { 
      text: "Welcome to CTJ Support", 
      isUser: false,
      timestamp: new Date(Date.now() - 2 * 60000), // 2 minutes ago
      isRead: true
    },
    {
      text: "Hi! I'm here to help with your digital journey. How can I assist you today?",
      isUser: false,
      timestamp: new Date(Date.now() - 1 * 60000), // 1 minute ago
      isRead: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showBubbles, setShowBubbles] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [isAgentOnline, setIsAgentOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasUserResponded, setHasUserResponded] = useState(false);
  const [showWhatsAppReminder, setShowWhatsAppReminder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupSoundRef = useRef<HTMLAudioElement>(null);
  const messageSoundRef = useRef<HTMLAudioElement>(null);
  const whatsappReminderTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // For speech recognition 
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
          setNewMessage(transcript);
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

  // Play sound function
  const playSound = (soundRef: React.RefObject<HTMLAudioElement>) => {
    if (soundRef.current) {
      // Reset the audio to start position to ensure it plays every time
      soundRef.current.pause();
      soundRef.current.currentTime = 0;
      
      // Play with user interaction handling
      const playPromise = soundRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio play error:", error);
          // Often autoplay is blocked by browsers, we can handle it here
          if (error.name === "NotAllowedError") {
            console.log("Audio autoplay was prevented by the browser. User interaction is required.");
          }
        });
      }
    }
  };

  // Preload sound files
  useEffect(() => {
    // Function to preload and test audio files
    const preloadAudio = () => {
      // Set volume to 1 (maximum) to ensure sounds are audible
      if (popupSoundRef.current) {
        popupSoundRef.current.volume = 1.0;
        // Load the audio file
        popupSoundRef.current.load();
      }
      
      if (messageSoundRef.current) {
        messageSoundRef.current.volume = 1.0;
        // Load the audio file
        messageSoundRef.current.load();
      }
      
      // Log to confirm sounds are loaded
      console.log('Sound files preloaded');
    };
    
    preloadAudio();
    
    // Add click event listener to document to enable sound on first user interaction
    const enableAudio = () => {
      // Try to play and immediately pause both sounds to enable audio context
      if (popupSoundRef.current) {
        const playPromise = popupSoundRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            popupSoundRef.current!.pause();
            popupSoundRef.current!.currentTime = 0;
          }).catch(e => console.log("Audio enable error:", e));
        }
      }
      
      if (messageSoundRef.current) {
        const playPromise = messageSoundRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            messageSoundRef.current!.pause();
            messageSoundRef.current!.currentTime = 0;
          }).catch(e => console.log("Audio enable error:", e));
        }
      }
      
      // Remove the event listener once sounds are enabled
      document.removeEventListener('click', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
    };
  }, []);

  // Initialize auto-popup
  useEffect(() => {
    // Auto-open chat after 5 seconds
    const timer = setTimeout(() => {
      if (!isOpen) {
        toggleChatbot();
        // Play popup sound
        playSound(popupSoundRef);
        
        // Send greeting message after a short delay
        setTimeout(() => {
          const greetingTime = new Date();
          setIsTyping(true);
          setShowBubbles(true);
          
          setTimeout(() => {
            setIsTyping(false);
            setShowBubbles(false);
            setMessages(prev => [
              ...prev,
              {
                text: "Hello there! 👋 Welcome to CTJ Digital Products. I'm your virtual assistant ready to help you discover our amazing digital products and services!",
                isUser: false,
                timestamp: greetingTime,
                isRead: true
              }
            ]);
            
            // Play message sound
            playSound(messageSoundRef);
            
            // Set a timer to show WhatsApp number if no response in 30 seconds
            whatsappReminderTimerRef.current = setTimeout(() => {
              if (!hasUserResponded) {
                setShowWhatsAppReminder(true);
                const whatsappTime = new Date();
                setIsTyping(true);
                setShowBubbles(true);
                
                setTimeout(() => {
                  setIsTyping(false);
                  setShowBubbles(false);
                  setMessages(prev => [
                    ...prev,
                    {
                      text: "It seems you might need more specific assistance. Feel free to reach out to our product specialist on WhatsApp for personalized help:",
                      isUser: false,
                      timestamp: whatsappTime,
                      isRead: true
                    },
                    {
                      text: "+917903638966",
                      isUser: false,
                      isWhatsApp: true,
                      timestamp: new Date(whatsappTime.getTime() + 500),
                      isRead: true
                    }
                  ]);
                  
                  // Play message sound
                  playSound(messageSoundRef);
                }, 1500);
              }
            }, 30000);
          }, 1500);
        }, 1000);
      }
    }, 5000);
    
    return () => {
      clearTimeout(timer);
      if (whatsappReminderTimerRef.current) {
        clearTimeout(whatsappReminderTimerRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    }
  };

  const toggleChatbot = () => {
    if (!isOpen) {
      // Mark all messages as read when opening chat
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
    setShowPopup(false);
    setShowAttachmentOptions(false);
  };

  useEffect(() => {
    // Auto-scroll to the latest message
    if (isOpen) {
      const messageContainer = document.getElementById('message-container');
      if (messageContainer) {
        setTimeout(() => {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 100);
      }
    } else if (messages.length > 0 && !messages[messages.length - 1].isUser && !messages[messages.length - 1].isRead) {
      // Count unread messages when chat is closed
      const unread = messages.filter(msg => !msg.isUser && !msg.isRead).length;
      setUnreadCount(unread);
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Mark user as responded
    setHasUserResponded(true);
    
    // Clear WhatsApp reminder timer if active
    if (whatsappReminderTimerRef.current) {
      clearTimeout(whatsappReminderTimerRef.current);
    }

    // Add user message
    const now = new Date();
    setMessages([...messages, { 
      text: newMessage, 
      isUser: true,
      timestamp: now,
      isRead: false
    }]);
    setNewMessage('');
    setIsTyping(true);

    // Add typing indicator
    setShowBubbles(true);

    // Add chatbot response after a delay for a more natural feel
    setTimeout(() => {
      setIsTyping(false);
      setShowBubbles(false);
      const responseTime = new Date();
      setMessages((prev) => [
        ...prev,
        {
          text: "Thanks for your message! To provide you with the best assistance for our digital products, please connect with our product specialist on WhatsApp:",
          isUser: false,
          timestamp: responseTime,
          isRead: isOpen // Mark as read only if chat is open
        },
        {
          text: "+917903638966",
          isUser: false,
          isWhatsApp: true,
          timestamp: new Date(responseTime.getTime() + 500),
          isRead: isOpen
        },
      ]);

      // Play message sound
      playSound(messageSoundRef);

      // Update unread count if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 2);
      }
    }, 2000);
  };

  // Handle predefined option clicks
  const handleOptionClick = (option: string) => {
    // Mark user as responded
    setHasUserResponded(true);
    
    // Clear WhatsApp reminder timer if active
    if (whatsappReminderTimerRef.current) {
      clearTimeout(whatsappReminderTimerRef.current);
    }
    
    // Add user selection as a message
    const now = new Date();
    setMessages([...messages, { 
      text: option, 
      isUser: true,
      timestamp: now,
      isRead: false
    }]);
    setIsTyping(true);
    setShowBubbles(true);

    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      setShowBubbles(false);

      // Different responses based on the option selected
      let responses: { 
        text: string; 
        isUser: boolean; 
        isWhatsApp?: boolean;
        timestamp?: Date;
        isRead?: boolean;
      }[] = [];

      const responseTime = new Date();

      switch (option) {
        case "E-Books":
          responses = [
            { 
              text: "We offer a variety of e-books on digital marketing, programming, and business growth. Which topic interests you?", 
              isUser: false,
              timestamp: responseTime,
              isRead: isOpen
            }
          ];
          break;
        case "Templates":
          responses = [
            { 
              text: "Our templates include website designs, social media graphics, and business documents. What are you looking for?", 
              isUser: false,
              timestamp: responseTime,
              isRead: isOpen
            }
          ];
          break;
        case "Courses":
          responses = [
            { 
              text: "We have courses on web development, digital marketing, and more. Which subject would you like to learn?", 
              isUser: false,
              timestamp: responseTime,
              isRead: isOpen
            }
          ];
          break;
        case "Pricing":
          responses = [
            { 
              text: "For pricing information, our specialists are available to give you the best offers:", 
              isUser: false,
              timestamp: responseTime,
              isRead: isOpen
            },
            {
              text: "+917903638966",
              isUser: false,
              isWhatsApp: true,
              timestamp: new Date(responseTime.getTime() + 500),
              isRead: isOpen
            }
          ];
          break;
        default:
          responses = [
            { 
              text: "I'd be happy to help with your inquiry. To provide the best assistance, please connect with our team directly:", 
              isUser: false,
              timestamp: responseTime,
              isRead: isOpen
            },
            {
              text: "+917903638966",
              isUser: false,
              isWhatsApp: true,
              timestamp: new Date(responseTime.getTime() + 500),
              isRead: isOpen
            }
          ];
      }

      setMessages(prev => [...prev, ...responses]);
      
      // Play message sound
      playSound(messageSoundRef);

      // Update unread count if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + responses.length);
      }
    }, 1500);
  };

  const handleAttachmentClick = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mark user as responded
      setHasUserResponded(true);
      
      // Clear WhatsApp reminder timer if active
      if (whatsappReminderTimerRef.current) {
        clearTimeout(whatsappReminderTimerRef.current);
      }
      
      // Handle the file upload
      const file = e.target.files[0];
      const now = new Date();
      
      // Add a message about the file upload
      setMessages([...messages, { 
        text: `Uploaded file: ${file.name}`, 
        isUser: true,
        timestamp: now,
        isRead: false
      }]);
      
      // Close the attachment options panel
      setShowAttachmentOptions(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Add bot response after a short delay
      setIsTyping(true);
      setShowBubbles(true);
      
      setTimeout(() => {
        setIsTyping(false);
        setShowBubbles(false);
        const responseTime = new Date();
        setMessages(prev => [
          ...prev,
          {
            text: "Thanks for sharing this file. Our team will review it and get back to you. For immediate assistance, please reach out via WhatsApp:",
            isUser: false,
            timestamp: responseTime,
            isRead: isOpen
          },
          {
            text: "+917903638966",
            isUser: false,
            isWhatsApp: true,
            timestamp: new Date(responseTime.getTime() + 500),
            isRead: isOpen
          }
        ]);
        
        // Play message sound
        playSound(messageSoundRef);
      }, 1500);
    }
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {/* Audio elements - hidden from view */}
      <audio ref={popupSoundRef} src="/sounds/popup-sound.mp3" preload="auto" />
      <audio ref={messageSoundRef} src="/sounds/message-sound.mp3" preload="auto" />
      
      {/* Hidden button to enable sound on first user interaction */}
      <button 
        className="hidden"
        onClick={() => {
          // This button is never visible but helps with enabling audio
          if (popupSoundRef.current) {
            popupSoundRef.current.play()
              .then(() => popupSoundRef.current!.pause())
              .catch(e => console.log("Audio enable error:", e));
          }
          if (messageSoundRef.current) {
            messageSoundRef.current.play()
              .then(() => messageSoundRef.current!.pause())
              .catch(e => console.log("Audio enable error:", e));
          }
        }}
      />
      
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-xl w-80 md:w-96 animate-scale-in border border-gray-200">
          {/* Chat header */}
          <div className="bg-[#4A90E2] text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative">
                <Avatar className="h-9 w-9 mr-3 bg-white/10 backdrop-blur-lg ring-2 ring-white/20 overflow-hidden">
                  <AvatarImage src="/images/shourav_pic.jpg" alt="CTJ Support" />
                  <AvatarFallback>CTJ</AvatarFallback>
                </Avatar>
                {isAgentOnline && (
                  <span className="absolute bottom-0 right-3 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">CTJ Support</h3>
                <p className="text-xs font-light opacity-90">
                  Online | We reply instantly
                </p>
              </div>
            </div>
            <button 
              onClick={toggleChatbot} 
              className="text-white hover:text-gray-200 bg-white/10 rounded-full p-1.5 transition-all hover:bg-white/20"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Chat messages */}
          <div 
            id="message-container" 
            className="p-4 h-80 overflow-y-auto flex flex-col space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-gray-50"
          >
            <div className="text-center my-2">
              <span className="text-xs bg-gray-200 text-gray-600 py-1 px-3 rounded-full">
                Today
              </span>
            </div>
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {!message.isUser && index === 0 && (
                  <Avatar className="h-6 w-6 mr-2 self-end mb-1 bg-white/10 ring-1 ring-gray-200 overflow-hidden">
                    <AvatarImage src="/images/shourav_pic.jpg" alt="CTJ Support" />
                    <AvatarFallback>CTJ</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-xl shadow-sm 
                    ${
                      message.isUser
                        ? 'bg-[#4A90E2] text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                >
                  {message.isWhatsApp ? (
                    <a 
                      href={`https://wa.me/${message.text.replace(/\+/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-green-500 hover:text-green-600 transition-colors font-medium"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-5 h-5 mr-1"
                      >
                        <path d="M17.4722 14.7392C17.167 14.587 15.7104 13.8666 15.4301 13.7638C15.1499 13.6611 14.9446 13.6097 14.7394 13.9165C14.5341 14.2232 13.9686 14.8922 13.7883 15.0988C13.608 15.3055 13.4277 15.3312 13.1225 15.179C12.8173 15.0269 11.8578 14.7136 10.7175 13.6896C9.83186 12.8913 9.23023 11.9118 9.04995 11.6051C8.86967 11.2984 9.03071 11.1292 9.18457 10.9756C9.32302 10.8378 9.49045 10.619 9.64572 10.4373C9.80098 10.2557 9.85209 10.1273 9.95433 9.92204C10.0566 9.7168 10.0055 9.53516 9.92959 9.38298C9.85372 9.23082 9.25629 7.76344 8.99881 7.1499C8.74984 6.55275 8.49648 6.6306 8.30682 6.6217C8.12653 6.61283 7.92127 6.61104 7.71603 6.61104C7.51078 6.61104 7.17941 6.68749 6.89917 6.99423C6.61893 7.30096 5.85108 8.02136 5.85108 9.48875C5.85108 10.9561 6.92529 12.3742 7.0806 12.5793C7.23587 12.7845 9.2277 15.9295 12.329 17.1998C13.1323 17.5474 13.7593 17.7534 14.2462 17.9096C15.0628 18.164 15.8116 18.1259 16.4039 18.0473C17.0615 17.9597 18.2532 17.326 18.5105 16.6089C18.7679 15.8919 18.7679 15.2784 18.692 15.1499C18.6161 15.0213 18.4109 14.9442 18.1057 14.792C17.8004 14.6398 17.4722 14.7392 17.4722 14.7392ZM12.0451 21.9579H12.0407C10.2647 21.9582 8.52239 21.48 6.99636 20.573L6.62972 20.3567L2.87203 21.376L3.90664 17.7052L3.67066 17.3237C2.68069 15.7387 2.15776 13.9053 2.16012 12.0369C2.16161 6.52103 6.65168 2.04319 12.0495 2.04319C14.6609 2.04319 17.1172 3.05992 18.9521 4.90301C19.8591 5.8083 20.5807 6.8696 21.0798 8.0373C21.5789 9.20499 21.8465 10.457 21.868 11.7245C21.8665 17.2403 17.3763 21.9579 12.0451 21.9579ZM20.5007 3.35872C19.4143 2.26553 18.1202 1.40149 16.6947 0.817423C15.2691 0.233351 13.7413 -0.0605593 12.1991 0.0127809C5.46624 0.0127809 0.0838449 5.38376 0.0824059 12.1044C0.0798055 14.2214 0.60991 16.3005 1.62887 18.1513L0 24L6.02423 22.4171C7.80973 23.3406 9.79644 23.8267 11.815 23.8269H11.8194C18.5522 23.8269 23.9345 18.4558 23.936 11.7351C24.0103 10.1959 23.718 8.67094 23.0957 7.24767C22.4735 5.82439 21.5117 4.5322 20.3003 3.4493L20.5007 3.35872Z" />
                      </svg>
                      {message.text}
                    </a>
                  ) : (
                    message.text
                  )}

                  {/* Quick reply options */}
                  {message.options && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(option)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-1 px-3 rounded-full transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Message timestamp and read status */}
                  <div className={`flex items-center mt-1 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${message.isUser ? 'text-white/70' : 'text-gray-500'}`}>
                      {message.timestamp && formatTime(message.timestamp)}
                    </span>
                    {message.isUser && (
                      <span className="ml-1 text-white/70">
                        {message.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {showBubbles && (
              <div className="flex justify-start animate-fade-in">
                <Avatar className="h-6 w-6 mr-2 self-end mb-1 bg-white/10 ring-1 ring-gray-200 overflow-hidden">
                  <AvatarImage src="/images/shourav_pic.jpg" alt="CTJ Support" />
                  <AvatarFallback>CTJ</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 p-3 rounded-xl rounded-bl-none max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#4A90E2] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[#4A90E2] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[#4A90E2] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick link buttons */}
          <div className="border-t border-gray-200 p-2 grid grid-cols-4 gap-2 bg-gray-50">
            <button onClick={() => handleOptionClick("E-Books")} className="text-xs text-gray-600 hover:text-gray-800 flex items-center flex-col p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="font-semibold">E-Books</span>
              <span className="text-[10px]">→</span>
            </button>
            <button onClick={() => handleOptionClick("Templates")} className="text-xs text-gray-600 hover:text-gray-800 flex items-center flex-col p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="font-semibold">Templates</span>
              <span className="text-[10px]">→</span>
            </button>
            <button onClick={() => handleOptionClick("Courses")} className="text-xs text-gray-600 hover:text-gray-800 flex items-center flex-col p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="font-semibold">Courses</span>
              <span className="text-[10px]">→</span>
            </button>
            <button onClick={() => handleOptionClick("Pricing")} className="text-xs text-gray-600 hover:text-gray-800 flex items-center flex-col p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="font-semibold">Pricing</span>
              <span className="text-[10px]">→</span>
            </button>
          </div>
          
          {/* Input area */}
          <div className="border-t border-gray-200 p-2 px-4 bg-white rounded-b-2xl">
            {showAttachmentOptions && (
              <div className="flex items-center justify-between p-2.5 mb-2.5 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in shadow-sm">
                <button onClick={() => handleFileUpload()} className="flex flex-col items-center justify-center w-1/4">
                  <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4273C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Document</span>
                </button>
                
                <button className="flex flex-col items-center justify-center w-1/4">
                  <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E9564" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Camera</span>
                </button>
                
                <button className="flex flex-col items-center justify-center w-1/4">
                  <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9061F9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Gallery</span>
                </button>
                
                <button onClick={() => handleFileUpload()} className="flex flex-col items-center justify-center w-1/4">
                  <div className="w-10 h-10 bg-orange-100 rounded-md flex items-center justify-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Upload</span>
                </button>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelected}
                />
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-center">
              <div className="flex-shrink-0 mr-2">
                <button 
                  type="button"
                  onClick={handleAttachmentClick}
                  className="text-gray-500 hover:text-[#4A90E2] p-2 rounded-full hover:bg-gray-100"
                >
                  <PaperclipIcon size={20} />
                </button>
              </div>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] placeholder:text-gray-400"
              />
              <div className="flex-shrink-0 ml-2">
                {newMessage.trim() ? (
                  <Button 
                    type="submit" 
                    className="bg-[#4A90E2] hover:bg-[#3A80D2] rounded-full flex items-center justify-center w-10 h-10 p-0"
                  >
                    <Send size={18} />
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4A90E2] hover:bg-[#3A80D2]'} text-white rounded-full flex items-center justify-center w-10 h-10 transition-colors`}
                  >
                    <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          {/* Chat button with icon */}
          <button
            onClick={() => {
              // Enable audio on user interaction
              if (popupSoundRef.current) {
                popupSoundRef.current.play()
                  .then(() => {
                    popupSoundRef.current!.pause();
                    popupSoundRef.current!.currentTime = 0;
                  })
                  .catch(e => console.error("Audio enable error:", e));
              }
              
              // Toggle chatbot after audio is enabled
              toggleChatbot();
            }}
            className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-110 btn-hover relative"
            aria-label="Open chat"
          >
            <MessageCircle size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Pulse animation when WhatsApp reminder is shown to attract attention */}
          {showWhatsAppReminder && !isOpen && (
            <div className="absolute bottom-16 left-0 w-5 h-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A90E2] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-[#4A90E2]"></span>
            </div>
          )}
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

export default Chatbot;
