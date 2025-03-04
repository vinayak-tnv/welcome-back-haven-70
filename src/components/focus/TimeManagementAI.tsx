import React, { useState, useRef, useEffect } from 'react';
import { 
  ClipboardList, 
  User, 
  Send, 
  X, 
  BrainCircuit, 
  Clock, 
  BarChart3, 
  Calendar, 
  Zap,
  Loader2,
  Settings 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/context/TaskContext';
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
    text: "I'm your Gemini-powered Time Management Assistant. I analyze your work patterns and can recommend optimal schedules. What would you like to know about your productivity?",
    sender: 'ai',
    timestamp: new Date(),
  },
];

const suggestedPrompts = [
  "When am I most productive?",
  "How can I improve my focus?",
  "What's my optimal work schedule?",
  "Analyze my recent productivity",
  "Create a personalized work plan",
  "How long should my breaks be?"
];

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

const TimeManagementAI: React.FC = () => {
  const { toast } = useToast();
  const { getProductivityPatterns, timeEntries } = useTasks();
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
    const savedMessages = localStorage.getItem('timeAIMessages');
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
      localStorage.setItem('timeAIMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || timeEntries.length === 0 || !apiKey) return;
    
    const suggestionTimer = setTimeout(() => {
      const lastMessageTime = messages[messages.length - 1]?.timestamp || new Date(0);
      const timeElapsed = new Date().getTime() - lastMessageTime.getTime();
      
      if (timeElapsed > 15000 && !showSuggestion) {
        generateProductivityInsight();
      }
    }, 15000);
    
    return () => clearTimeout(suggestionTimer);
  }, [isOpen, messages, showSuggestion, timeEntries.length, apiKey]);

  const validateApiKey = (key: string): boolean => {
    return key.length >= 30;
  };

  const generateProductivityInsight = async () => {
    if (timeEntries.length === 0 || !apiKey || !validateApiKey(apiKey)) return;
    
    try {
      const patterns = getProductivityPatterns();
      
      const prompt = `
As an AI assistant for a productivity app, generate ONE short, personalized insight based on the following user data:

- Most productive time of day: ${patterns.mostProductiveTimeOfDay}
- Most productive day of the week: ${patterns.mostProductiveDay}
- Average focus session length: ${Math.round(patterns.averageFocusSessionLength)} minutes
- Task completion rate: ${Math.round(patterns.completionRate)}%
- Total tracked time: ${Math.round(patterns.totalTimeSpent)} minutes

Provide a single, specific insight or actionable tip (1-2 sentences) based on ONE of these data points.
Make it personalized, evidence-based, and directly connected to the data provided.
`;

      const response = await fetch(GEMINI_API_ENDPOINT, {
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
        
        if (patterns.totalTimeSpent > 0) {
          setCurrentSuggestion(suggestionText);
          setShowSuggestion(true);
        }
      }
    } catch (error) {
      console.error("Error generating productivity insight:", error);
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
    
    if (!validateApiKey(apiKey)) {
      toast({
        title: "Invalid API Key",
        description: "Your Gemini API key appears to be invalid. Please check it and try again.",
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
      const patterns = getProductivityPatterns();
      
      const conversationContext = messages
        .slice(-5)
        .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');
      
      const prompt = `
You are an AI assistant for a productivity app, specialized in time management and work pattern analysis.
Respond to the user's latest message about productivity and time management.

Here is data about the user's productivity patterns:
- Most productive time of day: ${patterns.mostProductiveTimeOfDay}
- Most productive day of the week: ${patterns.mostProductiveDay}
- Average focus session length: ${Math.round(patterns.averageFocusSessionLength)} minutes
- Task completion rate: ${Math.round(patterns.completionRate)}%
- Total tracked time: ${Math.round(patterns.totalTimeSpent)} minutes
- Common categories: ${patterns.commonCategories.map(c => c.category).join(', ') || 'No categories yet'}

Previous conversation for context:
${conversationContext}

User's latest message: ${userMessage.text}

Respond in a helpful, data-driven way. Provide specific, actionable advice based on their productivity patterns.
If you don't have enough data (e.g., if total tracked time is 0), let the user know you need more tracking data to provide personalized insights.
Keep your response under 200 words.
`;

      const response = await fetch(GEMINI_API_ENDPOINT, {
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
    if (!validateApiKey(newApiKey)) {
      toast({
        title: "Invalid API Key",
        description: "The API key appears to be invalid. Please provide a valid Gemini API key.",
        variant: "destructive"
      });
      return;
    }
    
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
          text: "I'm your Gemini-powered Time Management Assistant. I analyze your work patterns and can recommend optimal schedules. What would you like to know about your productivity?"
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
          "fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 z-50",
          !isOpen ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
        )}
      >
        {!isOpen ? <BrainCircuit className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </Button>
      
      <div className={cn(
        "fixed bottom-24 left-6 w-80 md:w-96 shadow-lg rounded-lg transition-all duration-300 transform z-50",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Gemini Time Assistant
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white hover:bg-white/30">
                Pattern Analysis
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
                      <Label htmlFor="timeApiKey">API Key</Label>
                      <Input 
                        id="timeApiKey" 
                        type="password" 
                        placeholder="Enter your Gemini API key" 
                        defaultValue={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Your API key is stored locally in your browser and never sent to our servers.
                    </div>
                    <div className="text-xs font-medium text-amber-600">
                      Note: Make sure to use a valid API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
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
                      message.sender === 'user' ? "bg-green-100" : "bg-gray-100"
                    )}>
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-green-600" />
                      ) : (
                        <BrainCircuit className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] p-3 rounded-lg text-sm",
                      message.sender === 'user' 
                        ? "bg-green-600 text-white rounded-tr-none" 
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    )}>
                      {message.text}
                    </div>
                  </div>
                ))}
                
                {isWaitingForResponse && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                      <BrainCircuit className="h-4 w-4 text-gray-600" />
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
                      <Zap className="h-4 w-4 text-amber-600" />
                    </div>
                    <div 
                      className="max-w-[75%] p-3 rounded-lg text-sm bg-amber-50 text-amber-800 rounded-tl-none border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={handleSuggestionResponse}
                    >
                      <p className="text-xs text-amber-600 font-medium mb-1">Insight:</p>
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
                placeholder={apiKey ? "Ask about your productivity patterns..." : "Set API key first..."}
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
                className="bg-green-600 hover:bg-green-700"
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

export default TimeManagementAI;
