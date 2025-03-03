
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Bot, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hello! I'm your voice assistant powered by Gemini. Speak to me by clicking the microphone button.",
    sender: 'ai',
    timestamp: new Date(),
  },
];

// Default API key
const DEFAULT_API_KEY = "AIzaSyBFT3XFk9GpPGxt70u9emdUbiDarUkL5fc";

const VoiceAssistant: React.FC = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    // Try to load from localStorage
    const savedKey = localStorage.getItem('geminiApiKey');
    return savedKey || DEFAULT_API_KEY;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize speech recognition on component mount
  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      toast({
        title: "Voice Assistant Unavailable",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
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

  const callGeminiApi = async (text: string): Promise<string> => {
    try {
      // FIXED: Using the correct Gemini API endpoint with the proper model name
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
      
      const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{
                text: `You are a helpful voice assistant. Please respond to the following query in a concise way: "${text}"`
              }],
              role: "user"
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
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

  const toggleListening = () => {
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
    setIsProcessing(true);
    
    try {
      // Call Gemini API
      const geminiResponse = await callGeminiApi(text);
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: geminiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Text-to-speech response
      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(geminiResponse);
        speech.lang = 'en-US';
        window.speechSynthesis.speak(speech);
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 z-40",
          !isOpen ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 hover:bg-gray-700"
        )}
      >
        {!isOpen ? <Mic className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </Button>
      
      {/* Chat panel */}
      <div className={cn(
        "fixed bottom-24 left-6 w-80 shadow-lg rounded-lg transition-all duration-300 transform z-40",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Assistant
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white hover:bg-white/30">
                Powered by Gemini
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80 p-4">
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
                      message.sender === 'user' ? "bg-purple-100" : "bg-gray-100"
                    )}>
                      {message.sender === 'user' ? (
                        <Mic className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] p-3 rounded-lg text-sm",
                      message.sender === 'user' 
                        ? "bg-purple-600 text-white rounded-tr-none" 
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    )}>
                      {message.text}
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-center">
                    <div className="animate-pulse flex items-center justify-center gap-1">
                      <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-purple-600 rounded-full delay-75"></div>
                      <div className="h-2 w-2 bg-purple-600 rounded-full delay-150"></div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t">
            <Button 
              onClick={toggleListening}
              className={cn(
                "w-full justify-center",
                isListening ? "bg-red-500 hover:bg-red-600" : "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" /> Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" /> {transcript ? "Speak Again" : "Speak Now"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default VoiceAssistant;
