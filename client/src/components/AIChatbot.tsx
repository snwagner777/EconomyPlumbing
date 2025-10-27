'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "@/lib/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  MessageSquare, 
  Loader2, 
  Minimize2, 
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  ImageIcon,
  Star,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  DollarSign,
  Calendar,
  Wrench,
  Bell
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { openScheduler } from "@/lib/scheduler";

// Hook to detect mobile screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Generate unique IDs
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Web Audio API sound notification
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (err) {
    console.log("Could not play notification sound:", err);
  }
}

interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  feedback?: "positive" | "negative" | null;
  imageUrl?: string;
  needsHandoff?: boolean;
}

interface QuickResponse {
  label: string;
  message: string;
  icon?: string;
}

interface ConversationData {
  sessionId: string;
  conversationId: string;
  messages: Message[];
  lastActivity: number;
  pageContext?: string;
  rating?: number;
}

const STORAGE_KEY = "chatbot_conversations";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Default quick responses
const DEFAULT_QUICK_RESPONSES: QuickResponse[] = [
  { label: "Emergency Service", message: "I need emergency plumbing service", icon: "AlertCircle" },
  { label: "Get Quote", message: "I'd like to get a quote for plumbing services", icon: "DollarSign" },
  { label: "Schedule Service", message: "I want to schedule a service appointment", icon: "Calendar" },
  { label: "Water Heater Issue", message: "I'm having issues with my water heater", icon: "Wrench" },
  { label: "Business Hours", message: "What are your business hours?", icon: "Clock" },
  { label: "Service Areas", message: "What areas do you service?", icon: "HelpCircle" },
];

const ICON_MAP: { [key: string]: any } = {
  AlertCircle,
  DollarSign,
  Calendar,
  Wrench,
  Clock,
  HelpCircle,
  CheckCircle
};

export default function AIChatbot() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string>("");
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>(DEFAULT_QUICK_RESPONSES);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const phoneConfig = usePhoneConfig();
  const isMobile = useIsMobile();

  // Don't render chatbot on admin pages
  if (location.startsWith('/admin')) {
    return null;
  }

  // Guard against missing phoneConfig
  if (!phoneConfig || !phoneConfig.tel || !phoneConfig.display) {
    return null;
  }

  // Load conversation from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: ConversationData = JSON.parse(stored);
        
        // Check if session is still valid (not expired)
        const now = Date.now();
        if (now - data.lastActivity < SESSION_TIMEOUT) {
          setSessionId(data.sessionId);
          setConversationId(data.conversationId);
          setMessages(data.messages || []);
        } else {
          // Session expired, start fresh
          initializeNewSession();
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
        initializeNewSession();
      }
    } else {
      initializeNewSession();
    }
  }, []);

  // Initialize new session
  const initializeNewSession = () => {
    const newSessionId = generateSessionId();
    const newConversationId = generateConversationId();
    setSessionId(newSessionId);
    setConversationId(newConversationId);
    setMessages([]);
    saveToLocalStorage(newSessionId, newConversationId, []);
  };

  // Save conversation to localStorage
  const saveToLocalStorage = (sid: string, cid: string, msgs: Message[]) => {
    const data: ConversationData = {
      sessionId: sid,
      conversationId: cid,
      messages: msgs,
      lastActivity: Date.now(),
      pageContext: location,
      rating: rating || undefined
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Update localStorage whenever messages change
  useEffect(() => {
    if (sessionId && conversationId) {
      saveToLocalStorage(sessionId, conversationId, messages);
    }
  }, [messages, sessionId, conversationId, rating]);

  // Track unread messages
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setUnreadCount(prev => prev + 1);
        playNotificationSound(); // Play sound for new message
      }
    }
  }, [messages, isOpen]);

  // Reset unread count when chatbot opens
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Initial greeting when chatbot opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: "Hi! I'm Economy Plumbing's AI assistant. I can help you with:\n\n• Water heater questions\n• Pricing estimates\n• Scheduling appointments\n• Emergency plumbing info\n• Common plumbing issues\n\nWhat can I help you with today?",
        timestamp: Date.now()
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

  // Handle sending messages
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend && !uploadedImage || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: textToSend || "I've uploaded an image of my plumbing issue",
      timestamp: Date.now()
    };

    // Clear input
    setInput("");
    
    // Add user message to chat
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Upload image first if there is one
      let imageUrl: string | undefined;
      if (uploadedImage) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', uploadedImage);
        formData.append('sessionId', sessionId);
        formData.append('conversationId', conversationId);

        const uploadResponse = await apiRequest("POST", "/api/chatbot/upload-image", formData);
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
        
        // Add image to user message
        userMessage.imageUrl = imageUrl;
        setUploadedImage(null);
        setIsUploading(false);
      }

      // Call backend API for chat completion
      const response = await apiRequest("POST", "/api/chatbot", {
        messages: newMessages.map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })),
        sessionId,
        conversationId,
        pageContext: location
      });

      const data = await response.json();
      
      // Update quick responses if provided
      if (data.quickResponses && data.quickResponses.length > 0) {
        setQuickResponses(data.quickResponses);
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        needsHandoff: data.needsHandoff
      };

      // Check if AI determined a handoff is needed
      if (data.needsHandoff) {
        setShowHandoff(true);
      }

      // Check if AI wants to open ServiceTitan scheduler
      if (data.openScheduler) {
        // Open the ServiceTitan scheduler
        const schedulerOpened = await openScheduler();
        
        if (!schedulerOpened) {
          // If scheduler didn't open, add a fallback message
          const fallbackMessage: Message = {
            id: `msg_${Date.now() + 1}`,
            role: "assistant",
            content: "I'm having trouble opening the scheduler right now. Please call us at " + phoneConfig.display + " to book your appointment, or you can try refreshing the page and clicking the 'Schedule Service' button.",
            timestamp: Date.now()
          };
          setMessages([...newMessages, assistantMessage, fallbackMessage]);
          return;
        }
      }

      setMessages([...newMessages, assistantMessage]);
      
      // Play notification sound
      if (!isOpen || isMinimized) {
        playNotificationSound();
      }

    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: `I'm having trouble connecting right now. Please text us directly at ${phoneConfig.display} or call for immediate assistance.`,
        timestamp: Date.now(),
        needsHandoff: true
      };
      setMessages([...newMessages, errorMessage]);
      setShowHandoff(true);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Handle feedback
  const handleFeedback = async (messageId: string | undefined, feedbackType: "positive" | "negative") => {
    if (!messageId) return;
    
    // Update local state
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: feedbackType } : msg
    ));

    // Send feedback to backend
    try {
      await apiRequest("POST", "/api/chatbot/feedback", {
        messageId,
        conversationId,
        feedback: feedbackType
      });
    } catch (err) {
      console.error("Failed to send feedback:", err);
    }
  };

  // Handle image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
    }
  };

  // Clear conversation
  const handleClearChat = () => {
    setMessages([]);
    setShowHandoff(false);
    initializeNewSession();
    localStorage.removeItem(STORAGE_KEY);
    
    // Add initial greeting
    const greeting: Message = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: "Hi! I've cleared our previous conversation. How can I help you today?",
      timestamp: Date.now()
    };
    setMessages([greeting]);
  };

  // End conversation and show rating
  const handleEndConversation = () => {
    setShowRatingDialog(true);
  };

  // Submit rating
  const handleSubmitRating = async (stars: number) => {
    setRating(stars);
    setShowRatingDialog(false);

    try {
      await apiRequest("POST", "/api/chatbot/end-conversation", {
        conversationId,
        rating: stars
      });
    } catch (err) {
      console.error("Failed to submit rating:", err);
    }

    // Thank user
    const thankYouMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: "Thank you for your feedback! Is there anything else I can help you with?",
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, thankYouMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openSMS = () => {
    window.location.href = `sms:${phoneConfig.tel}`;
  };

  // Rating Dialog
  const ratingDialog = showRatingDialog && (
    <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How was your experience?</DialogTitle>
          <DialogDescription>
            Please rate your conversation to help us improve our service
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleSubmitRating(star)}
              className="hover:scale-110 transition-transform"
              data-testid={`button-rating-${star}`}
            >
              <Star
                className={cn(
                  "w-8 h-8",
                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Build chatbot UI
  let chatbotUI;
  
  if (!isOpen) {
    chatbotUI = (
      <div
        className="relative"
        style={{
          position: 'fixed',
          bottom: isMobile ? '1rem' : '1.5rem',
          right: isMobile ? '1rem' : '1.5rem',
          zIndex: 9999
        }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
          size="icon"
          data-testid="button-open-chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center animate-pulse">
            {unreadCount}
          </Badge>
        )}
      </div>
    );
  } else if (isMinimized) {
    // Minimized state
    chatbotUI = (
      <div
        className={cn(
          "fixed bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow",
          isMobile ? "bottom-4 left-4 right-4" : "bottom-6 right-6"
        )}
        style={{ zIndex: 9999 }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Economy Plumbing AI</p>
          <p className="text-xs text-muted-foreground">Click to expand</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="animate-pulse">
            {unreadCount} new
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            setIsMinimized(false);
          }}
          data-testid="button-close-minimized"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  } else if (isMobile && !isMinimized) {
    chatbotUI = (
      <>
        <Card 
          className="shadow-2xl flex flex-col"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: 'calc(100vh - 80px)',
            borderTopLeftRadius: '0.5rem',
            borderTopRightRadius: '0.5rem',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            zIndex: 9999
          }}
        >
          {/* Header */}
          <CardHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Economy Plumbing AI</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online {location && `• ${location.substring(1) || 'home'}`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearChat}
                  className="h-8 w-8"
                  data-testid="button-clear-chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="h-8 w-8"
                  data-testid="button-minimize-chatbot"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                  data-testid="button-close-chatbot"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={message.id || index}>
                <div
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded plumbing issue"
                        className="mt-2 rounded-md max-w-full h-auto"
                      />
                    )}
                  </div>
                </div>
                
                {/* Feedback buttons for assistant messages */}
                {message.role === "assistant" && (
                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mt-2 gap-2 ml-2`}>
                    <Button
                      variant={message.feedback === "positive" ? "default" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleFeedback(message.id, "positive")}
                      data-testid={`button-feedback-positive-${index}`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={message.feedback === "negative" ? "default" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleFeedback(message.id, "negative")}
                      data-testid={`button-feedback-negative-${index}`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <p className="text-sm text-muted-foreground">Typing...</p>
                </div>
              </div>
            )}

          {/* Handoff Section */}
          {showHandoff && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold">Ready to Connect?</p>
                  <p className="text-xs text-muted-foreground">
                    Text us for personalized help from our team. We respond within minutes!
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={openSMS}
                      className="w-full"
                      data-testid="button-text-us"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Text Us: {phoneConfig.display}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      data-testid="button-call-us"
                    >
                      <a href={`tel:${phoneConfig.tel}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Or Call: {phoneConfig.display}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Responses */}
          {quickResponses.length > 0 && !isLoading && (
            <div className="border-t px-3 py-2 flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickResponses.slice(0, 3).map((qr, index) => {
                  const Icon = ICON_MAP[qr.icon || "HelpCircle"];
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 text-xs"
                      onClick={() => handleSendMessage(qr.message)}
                      data-testid={`button-quick-response-${index}`}
                    >
                      {Icon && <Icon className="w-3 h-3 mr-1" />}
                      {qr.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-3 flex-shrink-0">
            {uploadedImage && (
              <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between">
                <span className="text-xs truncate">{uploadedImage.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setUploadedImage(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                size="icon"
                variant="outline"
                data-testid="button-upload-image"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && !uploadedImage) || isLoading}
                size="icon"
                data-testid="button-send-message"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                AI responses may vary. For urgent issues, call us.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={handleEndConversation}
                className="text-xs h-auto p-0"
                data-testid="button-end-conversation"
              >
                End Chat
              </Button>
            </div>
          </div>
        </Card>
        {ratingDialog}
      </>
    );
  } else {
    // Desktop layout
    chatbotUI = (
      <Card 
        className="shadow-2xl flex flex-col rounded-lg"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '24rem',
          height: '600px',
          zIndex: 9999
        }}
      >
      {/* Header */}
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Economy Plumbing AI</CardTitle>
              <CardDescription className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-chatbot"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
              data-testid={`message-${message.role}-${index}`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </div>
          </div>
        )}

        {/* Handoff Section */}
        {showHandoff && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold">Ready to Connect?</p>
                <p className="text-xs text-muted-foreground">
                  Text us for personalized help from our team. We respond within minutes!
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={openSMS}
                    className="w-full"
                    data-testid="button-text-us"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Text Us: {phoneConfig.display}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    data-testid="button-call-us"
                  >
                    <a href={`tel:${phoneConfig.tel}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Or Call: {phoneConfig.display}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="border-t p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI responses may be inaccurate. For urgent issues, text or call us directly.
        </p>
      </div>
    </Card>
    );
  }

  // Render using portal to avoid SidebarProvider transform issues
  return createPortal(chatbotUI, document.body);
}
