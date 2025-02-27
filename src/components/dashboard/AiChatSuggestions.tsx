
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hi there! I'm your AI scheduling assistant. How can I help you today?",
    sender: 'ai',
    timestamp: new Date(),
  },
];

const suggestedPrompts = [
  "Plan my schedule for tomorrow",
  "Suggest best time for focused work",
  "How can I optimize my meetings?",
  "Find gaps in my schedule",
];

const AiChatSuggestions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
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
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponses = [
        "Based on your schedule, I recommend allocating time between 9-11 AM for high-priority tasks when your energy is at its peak.",
        "Looking at your calendar, you have a 2-hour gap on Thursday afternoon that would be perfect for your project work.",
        "I noticed you have multiple meetings back-to-back on Wednesday. Consider adding 15-minute breaks between them to avoid fatigue.",
        "Your most productive time appears to be mornings. Would you like me to schedule your most challenging tasks before noon?",
        "I've analyzed your work patterns and noticed you complete tasks more efficiently when they're scheduled earlier in the week.",
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
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
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0",
          !isOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
        )}
      >
        {!isOpen ? <Sparkles className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </Button>
      
      {/* Chat panel */}
      <div className={cn(
        "fixed bottom-24 right-6 w-80 md:w-96 shadow-lg rounded-lg transition-all duration-300 transform",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Schedule Assistant
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Suggested prompts */}
            {messages.length <= 2 && (
              <div className="p-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
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
                placeholder="Ask for scheduling advice..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!currentMessage.trim()}
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

export default AiChatSuggestions;
