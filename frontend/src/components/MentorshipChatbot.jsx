import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  MessageSquarePlus, 
  Search,
  X
} from "lucide-react";
import api from "../api/api";

const QUICK_REPLIES = [
  "Career Advice",
  "Internship Search",
  "Skill Development",
  "Resume Tips",
  "Interview Prep",
  "Industry Trends",
];

const FALLBACK_BOT_RESPONSES = [
  "I'm here to help! Could you tell me more about what you're looking for?",
  "That's a great question! Let me think about the best way to help you.",
  "I'd be happy to assist you with that. Can you provide a bit more detail?",
  "Thanks for reaching out! How can I best support your career journey?",
];

export function MentorshipChatbot() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  // Initialize with welcome message on mount (only if no messages exist)
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          sender: "bot",
          text: "👋 Hi! I'm Kazini Mentor AI — your personal career advisor. How can I help you today?",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ✅ Fetch conversation list
  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await api.get("chatbot/history/");
      setConversations(response.data.results || response.data);
    } catch (error) {
      console.error("Error loading conversations", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // ✅ Load messages for selected conversation
  const loadConversationMessages = async (id) => {
    try {
      const response = await api.get(`chatbot/conversations/${id}/messages/`);
      setMessages(
        response.data.map((msg) => ({
          id: msg.id,
          sender: msg.sender === "ai" ? "bot" : msg.sender,
          text: msg.text,
          timestamp: msg.created_at,
        }))
      );
      setActiveConversation(id);
    } catch (error) {
      console.error("Error loading messages", error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // ✅ Send a new message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await api.post("chatbot/", {
        message: text,
        conversation_id: activeConversation || undefined,
      });

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text:
          response.data.reply ||
          FALLBACK_BOT_RESPONSES[
            Math.floor(Math.random() * FALLBACK_BOT_RESPONSES.length)
          ],
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, botMessage]);

      // update conversation if new
      if (!activeConversation && response.data.conversation_id) {
        setActiveConversation(response.data.conversation_id);
        loadConversations();
      }
    } catch (error) {
      console.error("Error:", error);
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "⚠️ Sorry, I couldn't connect to the AI service. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (reply) => handleSendMessage(reply);

  const handleNewChat = () => {
    setMessages([
      {
        id: 1,
        sender: "bot",
        text: "👋 Hi! I'm Kazini Mentor AI — your personal career advisor. How can I help you today?",
        timestamp: new Date().toISOString(),
      },
    ]);
    setActiveConversation(null);
  };

  const filteredConversations = conversations.filter((conv) =>
    (conv.title || "Untitled Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-accent/10 overflow-hidden">
      {/* 🧭 Sidebar */}
      <div className="w-80 border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col shadow-lg">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Conversations
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNewChat}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversationMessages(conv.id)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeConversation === conv.id
                    ? "bg-gradient-to-r from-primary/20 to-chart-2/20 border border-primary/30 shadow-sm"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <p className={`font-semibold text-sm truncate ${
                  activeConversation === conv.id ? "text-primary" : "text-foreground"
                }`}>
                  {conv.title || "Untitled Chat"}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquarePlus className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new chat to begin
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 💬 Chat Window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-3 to-chart-5 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Kazini Mentor AI
              </h1>
              <p className="text-xs text-muted-foreground">Your personal career advisor</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-accent/5">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Kazini Mentor AI</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Ask me anything about your career, internships, skills, or get personalized advice!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_REPLIES.slice(0, 3).map((reply) => (
                    <Badge
                      key={reply}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-4 py-2 text-sm"
                      onClick={() => handleQuickReply(reply)}
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      {reply}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                      msg.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                        msg.sender === "bot"
                          ? "bg-gradient-to-br from-chart-3 to-chart-5"
                          : "bg-gradient-to-br from-primary to-chart-2"
                      }`}
                    >
                      {msg.sender === "bot" ? (
                        <Bot className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender === "bot"
                          ? "bg-card border border-border/50 text-foreground"
                          : "bg-gradient-to-br from-primary to-chart-2 text-primary-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                      <p className={`text-xs mt-2 ${
                        msg.sender === "bot" 
                          ? "text-muted-foreground" 
                          : "text-primary-foreground/70"
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 animate-in fade-in">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-3 to-chart-5 flex items-center justify-center shadow-md">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* ⚡ Quick Replies + Input */}
        <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm space-y-3">
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
              {QUICK_REPLIES.map((reply) => (
                <Badge
                  key={reply}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-3 py-1.5 text-xs font-medium border border-border/50 hover:border-primary/50"
                  onClick={() => handleQuickReply(reply)}
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  {reply}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              className="flex-1 h-11 border-border/50 focus:border-primary transition-colors"
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              size="icon"
              className="shrink-0 h-11 w-11 shadow-md hover:shadow-lg transition-shadow"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
