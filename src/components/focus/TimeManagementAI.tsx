
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
  Zap
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
    text: "I'm your Time Management Assistant. I analyze your work patterns and can recommend optimal schedules. What would you like to know about your productivity?",
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
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load messages from localStorage on component mount
  useEffect(() => {
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

  // Send periodic productivity insights if we have data
  useEffect(() => {
    if (!isOpen || timeEntries.length === 0) return;
    
    const suggestionTimer = setTimeout(() => {
      // Only show suggestions if there's a gap in conversation (at least 10 seconds since last message)
      const lastMessageTime = messages[messages.length - 1]?.timestamp || new Date(0);
      const timeElapsed = new Date().getTime() - lastMessageTime.getTime();
      
      if (timeElapsed > 15000 && !showSuggestion) {
        const patterns = getProductivityPatterns();
        const suggestions = [
          `I've noticed you're most productive during the ${patterns.mostProductiveTimeOfDay}. Consider scheduling your most important tasks during this time.`,
          `Your average focus session is ${Math.round(patterns.averageFocusSessionLength)} minutes. Research suggests taking a 5-minute break after every 25 minutes of focused work.`,
          `You complete about ${Math.round(patterns.completionRate)}% of your scheduled tasks. Setting more realistic time estimates could help improve this rate.`,
          `${patterns.mostProductiveDay} appears to be your most productive day. Consider scheduling important tasks for this day of the week.`,
          `You've spent a total of ${Math.round(patterns.totalTimeSpent)} minutes on tracked activities. Regular tracking helps identify where your time is going.`
        ];
        
        // Only show if we have meaningful data
        if (patterns.totalTimeSpent > 0) {
          const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
          setCurrentSuggestion(randomSuggestion);
          setShowSuggestion(true);
        }
      }
    }, 15000);
    
    return () => clearTimeout(suggestionTimer);
  }, [isOpen, messages, showSuggestion, getProductivityPatterns, timeEntries.length]);

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
    
    // Get productivity patterns
    const patterns = getProductivityPatterns();
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      let aiResponse = '';
      const userMessageLower = userMessage.text.toLowerCase();
      
      // Check for common queries
      if (userMessageLower.includes('productive') || userMessageLower.includes('productivity')) {
        aiResponse = `Based on your data, you're most productive during the ${patterns.mostProductiveTimeOfDay}, and ${patterns.mostProductiveDay} is your most productive day of the week. I recommend scheduling challenging tasks during these times.`;
      } 
      else if (userMessageLower.includes('focus') || userMessageLower.includes('concentrate')) {
        aiResponse = `Your optimal focus session appears to be around ${Math.round(patterns.averageFocusSessionLength)} minutes. I recommend using the Pomodoro technique with 25-minute focus sessions and 5-minute breaks, gradually building up to longer sessions if needed.`;
      }
      else if (userMessageLower.includes('schedule') || userMessageLower.includes('plan')) {
        aiResponse = `Based on your patterns, here's an optimal daily schedule:\n\n• Morning (8-10 AM): Deep work on challenging tasks\n• Late morning (10-12 PM): Meetings and collaborative work\n• Afternoon (2-4 PM): Administrative tasks and follow-ups\n• Late afternoon (4-6 PM): Learning and creative work\n\nAdjust according to your energy levels throughout the day.`;
      }
      else if (userMessageLower.includes('analysis') || userMessageLower.includes('analyze')) {
        if (patterns.totalTimeSpent === 0) {
          aiResponse = "I don't have enough data yet to provide a detailed analysis. Try using the timer and task tracking features more, and I'll be able to give you better insights soon.";
        } else {
          aiResponse = `Productivity Analysis:\n\n• Total tracked time: ${Math.round(patterns.totalTimeSpent)} minutes\n• Completion rate: ${Math.round(patterns.completionRate)}%\n• Most productive time: ${patterns.mostProductiveTimeOfDay}\n• Most productive day: ${patterns.mostProductiveDay}\n• Top categories: ${patterns.commonCategories.map(c => c.category).join(', ') || 'No categories yet'}\n\nRecommendation: Focus on increasing your task completion rate and tracking more of your activities.`;
        }
      }
      else if (userMessageLower.includes('break') || userMessageLower.includes('rest')) {
        aiResponse = `Based on your average focus session of ${Math.round(patterns.averageFocusSessionLength)} minutes, I recommend:\n\n• Short breaks: 5 minutes after 25-30 minutes of focus\n• Medium breaks: 15 minutes after 60 minutes of focus\n• Long breaks: 30 minutes after 2-3 hours of sustained work\n\nUse breaks for physical movement, hydration, and looking at something 20 feet away to rest your eyes.`;
      }
      else {
        // Generic response using pattern data
        const responses = [
          `Based on your data, you tend to be most productive during ${patterns.mostProductiveTimeOfDay}. Try to schedule your most challenging tasks during this period.`,
          `I notice you've been working on tasks related to ${patterns.commonCategories[0]?.category || 'various categories'}. Are you looking for ways to optimize your time spent on these activities?`,
          `Your data shows that ${patterns.mostProductiveDay} is typically your most productive day. Would you like suggestions for how to structure this day for maximum efficiency?`,
          `Looking at your patterns, you could benefit from ${patterns.averageFocusSessionLength < 30 ? 'gradually increasing' : 'maintaining'} your focus sessions to around 25-45 minutes, followed by short breaks.`,
          `Your task completion rate is ${Math.round(patterns.completionRate)}%. I can help you improve this with better time blocking and estimation techniques.`
        ];
        
        if (patterns.totalTimeSpent === 0) {
          aiResponse = "I don't have enough data yet to provide personalized recommendations. Try using the timer and task tracking features more, and I'll be able to give you better insights soon.";
        } else {
          aiResponse = responses[Math.floor(Math.random() * responses.length)];
        }
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
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
                Pattern Analysis
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
                
                {/* Show AI suggestion if available */}
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
                disabled={!currentMessage.trim()}
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
