
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, Sparkles, Calendar, Lightbulb, Mic, MicOff, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/context/TaskContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  onend: (event: any) => void;
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hello! I'm your Gemini-powered assistant. I can help you with scheduling, planning, and provide suggestions for your day. How can I help you today?",
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

// Default API key - can be overridden by user
const DEFAULT_API_KEY = "AIzaSyBFT3XFk9GpPGxt70u9emdUbiDarUkL5fc";

const AiChatAssistant: React.FC = () => {
  const { toast } = useToast();
  const { addTask, getProductivityPatterns, getSleepPatterns } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [apiKey, setApiKey] = useState<string>(() => {
    // Try to load from localStorage
    const savedKey = localStorage.getItem('geminiApiKey');
    return savedKey || DEFAULT_API_KEY;
  });
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('aiChatMessages');
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
    
    // Initialize speech recognition
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setIsVoiceSupported(false);
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
      setCurrentMessage(transcriptText);
      processVoiceCommand(transcriptText);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      toast({
        title: "Voice Recognition Error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive"
      });
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const saveApiKey = () => {
    // Validate and save API key
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey);
      localStorage.setItem('geminiApiKey', tempApiKey);
      setIsApiKeyDialogOpen(false);
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved successfully.",
      });
    } else {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key.",
        variant: "destructive"
      });
    }
  };

  const callGeminiApi = async (text: string): Promise<string> => {
    try {
      // Updated to use correct Gemini API endpoint (v1 instead of v1beta)
      const url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
      
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
                text: `You are a helpful AI assistant for a task management app. The user has said: "${text}".
                
                If the user is asking to create a task, respond in this JSON format:
                {"action": "addTask", "title": "Task title", "time": "HH:MM", "priority": "high/medium/low"}
                
                If the user is asking to generate a schedule or plan, provide useful advice formatted as a list.
                
                If the user is asking about sleep analysis:
                {"action": "sleepAnalysis"}
                
                If the user is asking about productivity info:
                {"action": "productivityInfo"}
                
                If it's any other type of request, respond in a helpful, concise way as an AI assistant focused on productivity.
                
                Your response should be direct and informative, focusing on productivity and time management.`
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
      return "Sorry, there was an error communicating with the Gemini API. Please try again or check your API key.";
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setShowSuggestion(false); // Hide any suggestion when user sends a message
    setIsProcessing(true);
    
    try {
      // Call Gemini API
      const geminiResponse = await callGeminiApi(userMessage.text);
      
      try {
        // Try to parse as JSON for task creation
        const parsedResponse = JSON.parse(geminiResponse);
        
        if (parsedResponse.action === "addTask") {
          // Extract task details and add the task
          addTask({
            title: parsedResponse.title,
            time: parsedResponse.time,
            priority: parsedResponse.priority as 'high' | 'medium' | 'low',
            completed: false,
            date: new Date().toISOString().split('T')[0]
          });
          
          // Add AI response message
          const aiMessage: Message = {
            id: Date.now().toString(),
            text: `I've created a task "${parsedResponse.title}" scheduled for ${parsedResponse.time} with ${parsedResponse.priority} priority.`,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
        } 
        else if (parsedResponse.action === "sleepAnalysis") {
          const sleepData = getSleepPatterns();
          const aiMessage: Message = {
            id: Date.now().toString(),
            text: `You sleep an average of ${sleepData.averageSleepHours.toFixed(1)} hours per night. Your usual bedtime is ${sleepData.averageBedtime} and you typically wake up at ${sleepData.averageWakeupTime}. ${sleepData.recommendations[0]}`,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
        else if (parsedResponse.action === "productivityInfo") {
          const productivity = getProductivityPatterns();
          const aiMessage: Message = {
            id: Date.now().toString(),
            text: `You're most productive during the ${productivity.mostProductiveTimeOfDay}, and ${productivity.mostProductiveDay} is your most productive day. Your average focus session lasts ${Math.round(productivity.averageFocusSessionLength)} minutes.`,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
        else {
          // For other types of structured responses
          const aiMessage: Message = {
            id: Date.now().toString(),
            text: parsedResponse.message || geminiResponse,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (e) {
        // If not valid JSON, use the full response
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: geminiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
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

  const toggleListening = () => {
    if (!isVoiceSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    setTranscript("");
    setIsListening(true);
    recognitionRef.current?.start();
    
    toast({
      title: "Listening...",
      description: "Speak now to give a command.",
    });
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const processVoiceCommand = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsProcessing(true);
    
    try {
      // Call Gemini API - reusing same function as text input
      const geminiResponse = await callGeminiApi(text);
      
      try {
        // Try to parse as JSON
        const parsedResponse = JSON.parse(geminiResponse);
        
        if (parsedResponse.action === "addTask") {
          // Extract task details and add the task
          addTask({
            title: parsedResponse.title,
            time: parsedResponse.time,
            priority: parsedResponse.priority as 'high' | 'medium' | 'low',
            completed: false,
            date: new Date().toISOString().split('T')[0]
          });
          
          const responseText = `Added task "${parsedResponse.title}" at ${parsedResponse.time} with ${parsedResponse.priority} priority.`;
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: responseText,
            sender: 'ai',
            timestamp: new Date(),
          }]);
          
          // Text-to-speech response
          if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(responseText);
            speech.lang = 'en-US';
            window.speechSynthesis.speak(speech);
          }
        } 
        else if (parsedResponse.action === "sleepAnalysis") {
          const sleepData = getSleepPatterns();
          const responseText = `You sleep an average of ${sleepData.averageSleepHours.toFixed(1)} hours per night. Your usual bedtime is ${sleepData.averageBedtime} and you typically wake up at ${sleepData.averageWakeupTime}. ${sleepData.recommendations[0]}`;
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: responseText,
            sender: 'ai',
            timestamp: new Date(),
          }]);
          
          // Text-to-speech response
          if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(responseText);
            speech.lang = 'en-US';
            window.speechSynthesis.speak(speech);
          }
        }
        else if (parsedResponse.action === "productivityInfo") {
          const productivity = getProductivityPatterns();
          const responseText = `You're most productive during the ${productivity.mostProductiveTimeOfDay}, and ${productivity.mostProductiveDay} is your most productive day. Your average focus session lasts ${Math.round(productivity.averageFocusSessionLength)} minutes.`;
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: responseText,
            sender: 'ai',
            timestamp: new Date(),
          }]);
          
          // Text-to-speech response
          if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(responseText);
            speech.lang = 'en-US';
            window.speechSynthesis.speak(speech);
          }
        }
        else {
          // For general responses
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: parsedResponse.message || geminiResponse,
            sender: 'ai',
            timestamp: new Date(),
          }]);
          
          // Text-to-speech response
          if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(parsedResponse.message || geminiResponse);
            speech.lang = 'en-US';
            window.speechSynthesis.speak(speech);
          }
        }
      } catch (e) {
        // If it's not valid JSON, just use the full response
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: geminiResponse,
          sender: 'ai',
          timestamp: new Date(),
        }]);
        
        // Text-to-speech response
        if ('speechSynthesis' in window) {
          const speech = new SpeechSynthesisUtterance(geminiResponse);
          speech.lang = 'en-US';
          window.speechSynthesis.speak(speech);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Sorry, I couldn't process that request. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Gemini API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Enter your Gemini API key. You can get one from the Google AI Studio.
              </p>
              <Input
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsApiKeyDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveApiKey} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 z-50",
          !isOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
        )}
      >
        {!isOpen ? <Sparkles className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </Button>

      {/* Voice control button */}
      <Button
        onClick={toggleListening}
        className={cn(
          "fixed bottom-6 right-24 h-12 w-12 rounded-full shadow-lg flex items-center justify-center p-0 z-50",
          isListening ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
        )}
      >
        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
      
      {/* API Settings button */}
      <Button
        onClick={() => setIsApiKeyDialogOpen(true)}
        className="fixed bottom-6 right-40 h-12 w-12 rounded-full shadow-lg flex items-center justify-center p-0 z-50 bg-gray-600 hover:bg-gray-700"
        title="Set API Key"
      >
        <Settings className="h-5 w-5" />
      </Button>
      
      {/* Chat panel */}
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
                Powered by Google
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
                
                {isProcessing && (
                  <div className="flex justify-center">
                    <div className="animate-pulse flex items-center justify-center gap-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full delay-75"></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full delay-150"></div>
                    </div>
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
                placeholder="Ask me anything about scheduling..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
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

export default AiChatAssistant;
