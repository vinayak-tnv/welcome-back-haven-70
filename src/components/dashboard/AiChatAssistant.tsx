import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Sparkles, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import AiChatSuggestions from './AiChatSuggestions';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/context/TaskContext';
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
import { sendPromptToGemini, validateApiKey, getStoredApiKey, storeApiKey } from '@/utils/geminiApi';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hi there! I'm your Gemini-powered productivity assistant. I can help you manage your tasks, schedule, and provide productivity tips. How can I assist you today?",
    sender: 'ai',
    timestamp: new Date(),
  },
];

const AiChatAssistant: React.FC = () => {
  const { toast } = useToast();
  const { tasks, addTask } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [apiKey, setApiKey] = useState(getStoredApiKey);
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

  const clearChat = () => {
    setMessages(initialMessages);
    localStorage.removeItem('aiChatMessages');
  };
  
  const handleSelectedPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
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
    setIsWaitingForResponse(true);
    
    try {
      const pendingTasks = tasks.filter(t => !t.completed).length;
      const completedTasks = tasks.filter(t => t.completed).length;
      
      const conversationContext = messages
        .slice(-5)
        .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');
      
      const prompt = `
You are an AI assistant for a productivity app, focused on helping users with time management, scheduling, and planning. 
Respond to the user's latest message below. Be helpful, concise, and provide actionable advice.

Current user context:
- Pending tasks: ${pendingTasks}
- Completed tasks: ${completedTasks}

Previous conversation for context:
${conversationContext}

User's latest message: ${userMessage.text}

Respond in a friendly, conversational tone. Keep your response under 200 words. If the user asks about scheduling, planning, or productivity concepts, provide evidence-based advice.
`;

      const responseText = await sendPromptToGemini(prompt, apiKey, {
        temperature: 0.4,
        maxOutputTokens: 500
      });
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if the message appears to be about creating a task
      const taskCreationMatch = userMessage.text.toLowerCase().match(/create|add|schedule|remind|new task|to[\s-]do/g);
      if (taskCreationMatch) {
        const taskMatch = responseText.match(/task[:\s]+["']?([^"']+)["']?/i);
        if (taskMatch) {
          const title = taskMatch[1].trim();
          
          // Detect priority
          let priority: 'high' | 'medium' | 'low' = 'medium';
          if (userMessage.text.toLowerCase().includes("important") || 
              userMessage.text.toLowerCase().includes("critical") ||
              userMessage.text.toLowerCase().includes("urgent")) {
            priority = 'high';
          } else if (userMessage.text.toLowerCase().includes("low priority") ||
                    userMessage.text.toLowerCase().includes("not important")) {
            priority = 'low';
          }
          
          // Ask user if they want to add this task
          toast({
            title: "Task Suggestion",
            description: (
              <div className="space-y-2">
                <p>Would you like to add this task?</p>
                <p className="font-medium">{title}</p>
                <div className="flex gap-2 mt-1">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => {
                      addTask({
                        title,
                        priority,
                        completed: false,
                        date: new Date().toISOString().split('T')[0]
                      });
                      toast({
                        title: "Task Added",
                        description: `"${title}" has been added to your tasks.`,
                      });
                    }}
                  >
                    Add Task
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      toast({
                        title: "Cancelled",
                        description: "No task was added.",
                      });
                    }}
                  >
                    Ignore
                  </Button>
                </div>
              </div>
            ),
            duration: 10000,
          });
        }
      }
      
    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: error instanceof Error 
          ? `Sorry, there was an error: ${error.message}`
          : "Sorry, there was an error communicating with the Gemini API. Please check your API key and try again.",
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
    storeApiKey(newApiKey);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved.",
    });
    
    if (!apiKey && newApiKey) {
      const updatedMessages = [...messages];
      if (updatedMessages.length === 1 && updatedMessages[0].id === '1') {
        updatedMessages[0] = {
          ...updatedMessages[0],
          text: "Hi there! I'm your Gemini-powered productivity assistant. I can help you manage your tasks, schedule, and provide productivity tips. How can I assist you today?"
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
        {!isOpen ? <MessageSquare className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </Button>
      
      <div className={cn(
        "fixed bottom-24 right-6 w-80 md:w-96 shadow-lg rounded-lg transition-all duration-300 transform z-50",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg py-3">
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
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input 
                        id="apiKey" 
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
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <AiChatSuggestions onSelectPrompt={handleSelectedPrompt} />
          </CardContent>
          <CardFooter className="p-3 border-t">
            <div className="flex w-full items-center gap-2">
              <Input
                placeholder={apiKey ? "Ask me anything..." : "Set API key first..."}
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
