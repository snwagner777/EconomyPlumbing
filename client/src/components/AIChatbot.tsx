import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Phone, MessageSquare, Loader2 } from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { apiRequest } from "@/lib/queryClient";

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

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  needsHandoff?: boolean;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const phoneConfig = usePhoneConfig();
  const isMobile = useIsMobile();

  // Guard against missing phoneConfig
  if (!phoneConfig || !phoneConfig.tel || !phoneConfig.display) {
    return null; // Don't render chatbot if phone config isn't loaded
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting when chatbot opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm Economy Plumbing's AI assistant. I can help you with:\n\n• Water heater questions\n• Pricing estimates\n• Scheduling appointments\n• Emergency plumbing info\n• Common plumbing issues\n\nWhat can I help you with today?",
        },
      ]);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Call backend API for chat completion
      const response = await apiRequest("POST", "/api/chatbot", {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });

      const data = await response.json();
      
      // Check if AI determined a handoff is needed
      if (data.needsHandoff) {
        setShowHandoff(true);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
            needsHandoff: true,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
          },
        ]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please text us directly at " + phoneConfig.display + " or call for immediate assistance.",
          needsHandoff: true,
        },
      ]);
      setShowHandoff(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openSMS = () => {
    // Open default SMS app with pre-filled number
    window.location.href = `sms:${phoneConfig.tel}`;
  };

  // Build chatbot UI
  let chatbotUI;
  
  if (!isOpen) {
    chatbotUI = (
      <Button
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
        style={{
          position: 'fixed',
          bottom: isMobile ? '1rem' : '1.5rem',
          right: isMobile ? '1rem' : '1.5rem',
          zIndex: 9999
        }}
        size="icon"
        data-testid="button-open-chatbot"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  } else if (isMobile) {
    chatbotUI = (
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
