
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
  const [apiKey, setApiKey] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const { addTask, getProductivityPatterns, getSleepPatterns } = useTasks();

  useEffect(() => {
    // Load API key from localStorage if available
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

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
      if (!apiKey) {
        promptForApiKey();
        return;
      }
      startListening();
    }
  };

  const promptForApiKey = () => {
    const key = prompt("Please enter your Gemini API key to continue:");
    if (key) {
      setApiKey(key);
      localStorage.setItem('geminiApiKey', key);
      startListening();
    } else {
      toast({
        title: "API Key Required",
        description: "A Gemini API key is required to use the voice assistant.",
        variant: "destructive"
      });
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

  const callGeminiApi = async (text: string): Promise<string> => {
    if (!apiKey) {
      return "API key is missing. Please provide a Gemini API key to continue.";
    }

    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
      const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a voice assistant for a productivity and task management app. The user has said: "${text}". 
              If they want to add a task, extract the task title, time (convert to 24h format), and priority (high/medium/low).
              If they want information about their sleep or productivity patterns, provide that analysis.
              If it's another type of request, respond helpfully in a brief and efficient manner.
              
              If this is a task creation request, format your response as JSON like this:
              {"action": "addTask", "title": "Task title", "time": "HH:MM", "priority": "high/medium/low"}
              
              If it's a request for sleep analysis:
              {"action": "sleepAnalysis"}
              
              If it's a request for productivity info:
              {"action": "productivityInfo"}
              
              Otherwise, just respond conversationally:
              {"action": "response", "message": "Your helpful response here"}
              `
            }],
            role: "user"
          }],
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

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    
    try {
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
          
          setResponse(`Added task "${parsedResponse.title}" at ${parsedResponse.time} with ${parsedResponse.priority} priority.`);
        } 
        else if (parsedResponse.action === "sleepAnalysis") {
          const sleepData = getSleepPatterns();
          setResponse(`You sleep an average of ${sleepData.averageSleepHours.toFixed(1)} hours per night. Your usual bedtime is ${sleepData.averageBedtime} and you typically wake up at ${sleepData.averageWakeupTime}. ${sleepData.recommendations[0]}`);
        }
        else if (parsedResponse.action === "productivityInfo") {
          const productivity = getProductivityPatterns();
          setResponse(`You're most productive during the ${productivity.mostProductiveTimeOfDay}, and ${productivity.mostProductiveDay} is your most productive day. Your average focus session lasts ${Math.round(productivity.averageFocusSessionLength)} minutes.`);
        }
        else {
          // For general responses
          setResponse(parsedResponse.message || geminiResponse);
        }
      } catch (e) {
        // If it's not valid JSON, just use the full response
        setResponse(geminiResponse);
      }
    } catch (error) {
      setResponse("Sorry, I couldn't process that request. Please try again.");
    } finally {
      setIsProcessing(false);
      
      // Text-to-speech response
      if ('speechSynthesis' in window && response) {
        const speech = new SpeechSynthesisUtterance(response);
        speech.lang = 'en-US';
        window.speechSynthesis.speak(speech);
      }
    }
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
                <Badge variant="outline" className="bg-indigo-100 text-indigo-700">Gemini:</Badge>
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
