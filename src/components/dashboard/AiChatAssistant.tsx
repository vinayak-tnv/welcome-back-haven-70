import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, Sparkles, Calendar, Lightbulb, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hello! I'm your Gemini-powered AI assistant. I can help you with scheduling, planning, and provide suggestions for your day. How can I help you today?",
    sender: 'ai',
    timestamp: new Date(),
  },
];

const suggestedPrompts = [
  "Plan my day efficiently",
  "Suggest best times for deep work",
  "How can I optimize my meetings?",
  "Find gaps in my schedule",
  "Help me prioritize my tasks",
  "Generate a weekly planning template"
];

const AiChatAssistant: React.FC = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('geminiApiKey') || '';
  });
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const savedMessages = localStorage.getItem('aiChatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        const messagesWithDateObjects = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDateObjects);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || messages.length > 15) return;
    
    const suggestionTimer = setTimeout(() => {
      const lastMessageTime = messages[messages.length - 1]?.timestamp || new Date(0);
      const timeElapsed = new Date().getTime() - lastMessageTime.getTime();
      
      if (timeElapsed > 10000 && !showSuggestion) {
        callGeminiForSuggestion();
      }
    }, 15000);
    
    return () => clearTimeout(suggestionTimer);
  }, [isOpen, messages, showSuggestion, apiKey]);

  const callGeminiForSuggestion = async () => {
    if (!apiKey) return;
    
    try {
      const prompt = `
As an AI assistant for a productivity app, generate ONE short productivity tip or insight.
Make it concise (1-2 sentences), actionable, and evidence-based.
Examples of good suggestions:
- "Did you know that scheduling challenging tasks during your peak energy hours can boost productivity by up to 30%?"
- "Consider using the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break can improve concentration."
- "Research shows that short breaks between meetings reduce stress and improve decision-making. Try adding 5-10 minute buffers."
`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Gemini API error:", data);
        return;
      }

      let suggestionText = "";
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        suggestionText = data.candidates[0].content.parts[0].text.trim();
        setCurrentSuggestion(suggestionText);
        setShowSuggestion(true);
      }
    } catch (error) {
      console.error("Error getting Gemini suggestion:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your Gemini API key in settings first.",
        variant: "destructive"
      });
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setShowSuggestion(false);
    setIsWaitingForResponse(true);
    
    try {
      const conversationContext = messages
        .slice(-5)
        .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');
      
      const prompt = `
You are an AI assistant for a productivity app, focused on helping users with time management, scheduling, and planning. 
Respond to the user's latest message below. Be helpful, concise, and provide actionable advice.

Previous conversation for context:
${conversationContext}

User's latest message: ${userMessage.text}

Respond in a friendly, conversational tone. Keep your response under 200 words. If the user asks about scheduling, planning, or productivity concepts, provide evidence-based advice.
`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to get response from Gemini API");
      }

      let responseText = "";
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        responseText = data.candidates[0].content.parts[0].text.trim();
      } else {
        responseText = "Sorry, I couldn't generate a proper response. Please try again later.";
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, there was an error communicating with the Gemini API. Please check your API key and try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Gemini API Error",
        description: error instanceof Error ? error.message : "Failed to communicate with Gemini API",
        variant: "destructive"
      });
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const handleSuggestionResponse = () => {
    if (!currentSuggestion) return;
    
    const suggestionMessage: Message = {
      id: Date.now().toString(),
      text: currentSuggestion,
      sender: 'ai',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, suggestionMessage]);
    setShowSuggestion(false);
    setCurrentSuggestion('');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('geminiApiKey', newApiKey);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved.",
    });
    
    if (!apiKey && newApiKey) {
      const updatedMessages = [...messages];
      if (updatedMessages.length === 1 && updatedMessages[0].id === '1') {
        updatedMessages[0] = {
          ...updatedMessages[0],
          text: "Hello! I'm your Gemini-powered AI assistant. I can help you with scheduling, planning, and provide suggestions for your day. How can I help you today?"
        };
        setMessages(updatedMessages);
      }
    }
  };

  return (
    <>
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 z-50",
          !isOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
        )}
      >
        {!isOpen ? <Sparkles className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </Button>
      
      <div className={cn(
        "fixed bottom-24 right-6 w-80 md:w-96 shadow-lg rounded-lg transition-all duration-300 transform z-50",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Gemini Assistant
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white hover:bg-white/30">
                AI Powered
              </Badge>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gemini API Settings</DialogTitle>
                    <DialogDescription>
                      Enter your Gemini API key to enable AI features. You can get an API key from Google AI Studio.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="chatApiKey">API Key</Label>
                      <Input 
                        id="chatApiKey" 
                        type="password" 
                        placeholder="Enter your Gemini API key" 
                        defaultValue={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Your API key is stored locally in your browser and never sent to our servers.
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button onClick={() => handleApiKeySave(apiKey)}>Save</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={cn(
                      "flex items-start gap-2.5",
                      message.sender === 'user' ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.sender === 'user' ? "bg-blue-100" : "bg-gray-100"
                    )}>
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] p-3 rounded-lg text-sm",
                      message.sender === 'user' 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    )}>
                      {message.text}
                    </div>
                  </div>
                ))}
                
                {isWaitingForResponse && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="max-w-[75%] p-3 rounded-lg text-sm bg-gray-100 text-gray-800 rounded-tl-none flex items-center gap-2">
                      <span>Thinking</span>
                      <span className="flex space-x-1">
                        <span className="animate-bounce delay-0 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                        <span className="animate-bounce delay-150 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                        <span className="animate-bounce delay-300 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                      </span>
                    </div>
                  </div>
                )}
                
                {showSuggestion && currentSuggestion && (
                  <div className="flex items-start gap-2.5 animate-pulse">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                    </div>
                    <div 
                      className="max-w-[75%] p-3 rounded-lg text-sm bg-amber-50 text-amber-800 rounded-tl-none border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={handleSuggestionResponse}
                    >
                      <p className="text-xs text-amber-600 font-medium mb-1">Suggestion:</p>
                      {currentSuggestion}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {messages.length <= 3 && (
              <div className="p-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Try asking me:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-2.5 rounded-full transition-colors"
                      onClick={() => handleSuggestedPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t">
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder={apiKey ? "Ask me anything about scheduling..." : "Set API key first..."}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isWaitingForResponse && handleSendMessage()}
                className="flex-1"
                disabled={isWaitingForResponse || !apiKey}
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isWaitingForResponse || !apiKey}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isWaitingForResponse ? (
                  <span className="animate-spin"><Loader2 className="h-4 w-4" /></span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default AiChatAssistant;
