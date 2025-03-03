
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Send, 
  X, 
  BrainCircuit, 
  Clock, 
  BarChart3, 
  Zap,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/context/TaskContext';

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

const TimeManagementAI: React.FC = () => {
  const { getProductivityPatterns, timeEntries } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [apiKey, setApiKey] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load API key and messages from localStorage on component mount
  useEffect(() => {
    // Load API key from localStorage if available
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    const savedMessages = localStorage.getItem('timeAIMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
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

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('timeAIMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const callGeminiApi = async (text: string): Promise<string> => {
    if (!apiKey) {
      return "API key is missing. Please provide a Gemini API key to continue.";
    }

    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
      
      // Get productivity patterns to provide context
      const patterns = getProductivityPatterns();
      
      // Get the last 5 messages to provide context (excluding the current message)
      const recentMessages = messages.slice(-5).map(msg => ({
        parts: [{ text: msg.text }],
        role: msg.sender === 'user' ? 'user' : 'model'
      }));
      
      const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            ...recentMessages,
            {
              parts: [{
                text: `You are a productivity and time management AI assistant. The user has said: "${text}".
                
                Here is data about the user's productivity patterns:
                - Most productive time of day: ${patterns.mostProductiveTimeOfDay}
                - Most productive day: ${patterns.mostProductiveDay}
                - Average focus session length: ${Math.round(patterns.averageFocusSessionLength)} minutes
                - Task completion rate: ${Math.round(patterns.completionRate)}%
                
                Use this information to provide personalized advice about time management, productivity, focus, and work schedules.
                Your response should be direct and informative, with specific actionable advice based on their productivity patterns.`
              }],
              role: "user"
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "Sorry, there was an error communicating with the Gemini API. Please try again.";
    }
  };

  const promptForApiKey = () => {
    const key = prompt("Please enter your Gemini API key to continue:");
    if (key) {
      setApiKey(key);
      localStorage.setItem('geminiApiKey', key);
      return true;
    } else {
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    if (!apiKey) {
      const keyProvided = promptForApiKey();
      if (!keyProvided) return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsProcessing(true);
    
    try {
      // Call Gemini API
      const geminiResponse = await callGeminiApi(userMessage.text);
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: geminiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Handle error
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    if (isOpen && !apiKey) {
      promptForApiKey();
    }
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 z-50",
          !isOpen ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
        )}
      >
        {!isOpen ? <BrainCircuit className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </Button>
      
      {/* Chat panel */}
      <div className={cn(
        "fixed bottom-24 left-6 w-80 md:w-96 shadow-lg rounded-lg transition-all duration-300 transform z-50",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Management AI
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white hover:bg-white/30">
                Powered by Gemini
              </Badge>
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
                
                {isProcessing && (
                  <div className="flex justify-center">
                    <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Suggested prompts */}
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
                placeholder="Ask about your productivity patterns..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default TimeManagementAI;
