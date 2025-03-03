
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/context/TaskContext';
import { useToast } from '@/hooks/use-toast';

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

const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const { addTask, getProductivityPatterns, getSleepPatterns } = useTasks();

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setIsSupported(false);
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

  const toggleListening = () => {
    if (!isSupported) {
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
    setResponse("");
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

  const processVoiceCommand = (text: string) => {
    setIsProcessing(true);
    const lowerText = text.toLowerCase();

    // Simple NLP - command detection
    setTimeout(() => {
      let responseText = "";

      // Add task command
      if (lowerText.includes("add task") || lowerText.includes("create task") || lowerText.includes("new task")) {
        const titleMatch = text.match(/(?:add|create|new)\s+task\s+(?:called|named|titled)?\s*["']?([^"']+)["']?/i);
        const title = titleMatch ? titleMatch[1] : "New task";
        
        // Extract time
        const timeMatch = text.match(/at\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i);
        const time = timeMatch ? convertToTime(timeMatch[1]) : "09:00";
        
        // Extract priority
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (lowerText.includes("high priority") || lowerText.includes("important")) priority = 'high';
        if (lowerText.includes("low priority") || lowerText.includes("not important")) priority = 'low';
        
        // Create task
        addTask({
          title,
          time,
          priority,
          completed: false,
          date: new Date().toISOString().split('T')[0]
        });
        
        responseText = `Added task "${title}" at ${time} with ${priority} priority.`;
      }
      // Sleep analysis command
      else if (lowerText.includes("sleep") && (lowerText.includes("analysis") || lowerText.includes("pattern") || lowerText.includes("report"))) {
        const sleepData = getSleepPatterns();
        responseText = `You sleep an average of ${sleepData.averageSleepHours.toFixed(1)} hours per night. Your usual bedtime is ${sleepData.averageBedtime} and you typically wake up at ${sleepData.averageWakeupTime}. ${sleepData.recommendations[0]}`;
      }
      // Productivity command 
      else if (lowerText.includes("productivity") || (lowerText.includes("how") && lowerText.includes("productive"))) {
        const productivity = getProductivityPatterns();
        responseText = `You're most productive during the ${productivity.mostProductiveTimeOfDay}, and ${productivity.mostProductiveDay} is your most productive day. Your average focus session lasts ${Math.round(productivity.averageFocusSessionLength)} minutes.`;
      }
      // Fallback
      else {
        responseText = "I'm sorry, I didn't understand that command. You can ask me to add tasks, analyze sleep patterns, or check productivity.";
      }

      setResponse(responseText);
      setIsProcessing(false);
      
      // Text-to-speech response
      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(responseText);
        speech.lang = 'en-US';
        window.speechSynthesis.speak(speech);
      }
    }, 1000);
  };

  // Convert various time formats to 24h format
  const convertToTime = (timeStr: string): string => {
    // Handle formats like "9am", "9:30 pm", etc.
    const cleanTime = timeStr.toLowerCase().trim();
    let hours = 0;
    let minutes = 0;
    
    if (cleanTime.includes(':')) {
      // Format like "9:30 am"
      const parts = cleanTime.split(':');
      hours = parseInt(parts[0], 10);
      const minutesPart = parts[1].replace(/[^0-9]/g, '');
      minutes = parseInt(minutesPart, 10);
      
      if (cleanTime.includes('pm') && hours < 12) {
        hours += 12;
      }
      if (cleanTime.includes('am') && hours === 12) {
        hours = 0;
      }
    } else {
      // Format like "9am" or "9 am"
      const numericPart = cleanTime.replace(/[^0-9]/g, '');
      hours = parseInt(numericPart, 10);
      
      if (cleanTime.includes('pm') && hours < 12) {
        hours += 12;
      }
      if (cleanTime.includes('am') && hours === 12) {
        hours = 0;
      }
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 left-24 z-50">
      <Button 
        onClick={toggleListening}
        className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 ${
          isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
      
      {(transcript || response) && (
        <Card className="absolute bottom-16 -left-32 w-80 shadow-lg transition-all duration-300 transform">
          <CardContent className="p-3 space-y-3">
            {transcript && (
              <div className="space-y-1">
                <Badge variant="outline" className="bg-gray-100">You said:</Badge>
                <p className="text-sm text-gray-700">{transcript}</p>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            )}
            
            {response && (
              <div className="space-y-1">
                <Badge variant="outline" className="bg-indigo-100 text-indigo-700">Assistant:</Badge>
                <p className="text-sm">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceAssistant;
