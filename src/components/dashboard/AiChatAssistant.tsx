
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, Sparkles, Calendar, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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
    text: "Hello! I'm your AI assistant. I can help you with scheduling, planning, and provide suggestions for your day. How can I help you today?",
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

// Premade suggestions that the AI will provide periodically
const aiSuggestions = [
  "Did you know that scheduling your most challenging tasks during your peak energy hours can boost productivity by up to 30%?",
  "Consider using the Pomodoro Technique: work for 25 minutes, then take a 5-minute break to maintain focus and energy.",
  "Research shows that short breaks between meetings can reduce stress and improve decision-making. Try adding 5-10 minute buffers.",
  "For better work-life balance, try scheduling personal activities with the same priority as work tasks.",
  "Morning routines have been linked to improved productivity. Consider establishing a consistent start to your day.",
  "Try time-blocking your schedule to reduce context switching, which can waste up to 40% of your productive time.",
  "Scheduling dedicated 'no meeting' days can increase deep work output by allowing for longer periods of uninterrupted focus."
];

const AiChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Effect to show AI suggestions periodically
  useEffect(() => {
    // Only show suggestions if chat is open and not too frequently
    if (!isOpen || messages.length > 15) return;
    
    const suggestionTimer = setTimeout(() => {
      // Only show suggestions if there's a gap in conversation (at least 10 seconds since last message)
      const lastMessageTime = messages[messages.length - 1]?.timestamp || new Date(0);
      const timeElapsed = new Date().getTime() - lastMessageTime.getTime();
      
      if (timeElapsed > 10000 && !showSuggestion) {
        const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
        setCurrentSuggestion(randomSuggestion);
        setShowSuggestion(true);
      }
    }, 15000);
    
    return () => clearTimeout(suggestionTimer);
  }, [isOpen, messages, showSuggestion]);

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
    setShowSuggestion(false); // Hide any suggestion when user sends a message
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      let aiResponse = '';
      
      // Simple keyword matching for more contextual responses
      const userMessageLower = userMessage.text.toLowerCase();
      
      if (userMessageLower.includes('plan') || userMessageLower.includes('schedule')) {
        aiResponse = "Based on your current schedule, I recommend allocating 2-hour blocks for deep work in the morning, followed by meetings in the afternoon. This matches your natural energy patterns.";
      } else if (userMessageLower.includes('meeting') || userMessageLower.includes('meetings')) {
        aiResponse = "I noticed you have several meetings on Wednesday. Consider grouping them together with small breaks in between to preserve your focus time on other days.";
      } else if (userMessageLower.includes('prioritize') || userMessageLower.includes('important')) {
        aiResponse = "To prioritize effectively, I suggest using the Eisenhower Matrix: sort tasks into urgent/important, important/not urgent, urgent/not important, and neither. Focus on the important tasks first, regardless of urgency.";
      } else if (userMessageLower.includes('focus') || userMessageLower.includes('concentrate')) {
        aiResponse = "For better focus, try the 'deep work' approach. Block 90-minute sessions on your calendar, silence notifications, and work on a single task. Your concentration typically peaks around 10-11 AM based on your patterns.";
      } else if (userMessageLower.includes('break') || userMessageLower.includes('rest')) {
        aiResponse = "Strategic breaks improve productivity. I recommend a 5-minute break every 25 minutes, and a longer 30-minute break after 2 hours of work. This aligns with your natural attention cycles.";
      } else if (userMessageLower.includes('template') || userMessageLower.includes('routine')) {
        aiResponse = "Based on your work patterns, an ideal weekly template would have Mondays and Tuesdays for deep work, Wednesdays for meetings, Thursdays for planning and reviews, and Fridays for creative and collaborative work.";
      } else {
        // Default responses if no keywords match
        const aiResponses = [
          "Based on your past productivity patterns, I recommend scheduling your most challenging tasks between 9-11 AM when your focus tends to be strongest.",
          "Looking at your calendar, you have a 2-hour gap on Thursday afternoon that would be perfect for deep work on your priority project.",
          "I've noticed you have multiple back-to-back meetings on Wednesday. Adding 10-minute breaks between them could improve your focus and decision-making quality.",
          "Analyzing your task completion patterns, you finish work most efficiently in the mornings. Consider scheduling important tasks before noon.",
          "Your current schedule shows some potential for time batching. Grouping similar tasks (like emails, calls, and meetings) can reduce context switching and boost productivity.",
        ];
        
        aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1500);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const handleSuggestionResponse = () => {
    if (!currentSuggestion) return;
    
    // Add the AI suggestion as a message
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

  return (
    <>
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
      
      {/* Chat panel */}
      <div className={cn(
        "fixed bottom-24 right-6 w-80 md:w-96 shadow-lg rounded-lg transition-all duration-300 transform z-50",
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Assistant
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white hover:bg-white/30">
                Smart Suggestions
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
                
                {/* Show AI suggestion if available */}
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

export default AiChatAssistant;
