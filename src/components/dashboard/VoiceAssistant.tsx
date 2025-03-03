import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('geminiApiKey') || '';
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const { addTask, getProductivityPatterns, getSleepPatterns } = useTasks();

  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

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

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your Gemini API key in settings first.",
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

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    
    try {
      const sleepData = getSleepPatterns();
      const productivityData = getProductivityPatterns();
      
      const prompt = `
As an AI assistant for a productivity app, respond to this user command: "${text}"

Here is some context about the user:
- Sleep data: Average sleep is ${sleepData.averageSleepHours.toFixed(1)} hours, bedtime ${sleepData.averageBedtime}, wakeup ${sleepData.averageWakeupTime}
- Productivity: Most productive during ${productivityData.mostProductiveTimeOfDay}, best day is ${productivityData.mostProductiveDay}
- Focus sessions average ${Math.round(productivityData.averageFocusSessionLength)} minutes

Task-related commands format: If the user is asking to add/create a task, extract:
1. Task title (what the task is)
2. Time (if mentioned, default to "09:00")
3. Priority (if mentioned, default to "medium")

For commands about sleep or productivity, provide a brief data-based insight.
Keep responses concise and actionable.
`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
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
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to get response from Gemini API");
      }

      let responseText = "";
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        responseText = data.candidates[0].content.parts[0].text;
      } else {
        responseText = "Sorry, I couldn't generate a proper response.";
      }
      
      setResponse(responseText);
      
      const taskMatch = responseText.match(/add(?:ed|ing)?\s+task\s+["']?([^"']+)["']?/i);
      if (taskMatch) {
        const title = taskMatch[1].trim();
        
        const timeMatch = responseText.match(/at\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i);
        const time = timeMatch ? convertToTime(timeMatch[1]) : "09:00";
        
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (responseText.toLowerCase().includes("high priority")) priority = 'high';
        if (responseText.toLowerCase().includes("low priority")) priority = 'low';
        
        addTask({
          title,
          time,
          priority,
          completed: false,
          date: new Date().toISOString().split('T')[0]
        });
      }
      
      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(responseText);
        speech.lang = 'en-US';
        window.speechSynthesis.speak(speech);
      }
      
    } catch (error) {
      console.error("Error processing with Gemini:", error);
      setResponse("Sorry, there was an error processing your request with Gemini. Please check your API key and try again.");
      
      toast({
        title: "Gemini API Error",
        description: error instanceof Error ? error.message : "Failed to communicate with Gemini API",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToTime = (timeStr: string): string => {
    const cleanTime = timeStr.toLowerCase().trim();
    let hours = 0;
    let minutes = 0;
    
    if (cleanTime.includes(':')) {
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

  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('geminiApiKey', newApiKey);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved.",
    });
  };

  return (
    <div className="fixed bottom-6 left-24 z-50">
      <div className="flex flex-col items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gemini API Settings</DialogTitle>
              <DialogDescription>
                Enter your Gemini API key to enable AI voice assistant. You can get an API key from Google AI Studio.
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
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={() => handleApiKeySave(apiKey)}>Save</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button 
          onClick={toggleListening}
          className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 ${
            isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
      </div>
      
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
