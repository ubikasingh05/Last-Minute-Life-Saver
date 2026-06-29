import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Calendar, ArrowRight, Zap, Mic } from 'lucide-react';

interface TaskInputProps {
  onParseTasks: (text: string) => Promise<void>;
  isLoading: boolean;
}

const EXAMPLES = [
  "submit economics report Friday midnight, call client tomorrow 3pm, buy groceries today",
  "project kickoff monday 10am, prepare slides sunday evening, email boss in 2 hours",
  "dentist appointment tomorrow 10:30, car service wednesday afternoon, gym today at 6pm"
];

export default function TaskInput({ onParseTasks, isLoading }: TaskInputProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Safely grab browser speech recognition constructors
  const SpeechRecognition = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;
  const isSpeechSupported = !!SpeechRecognition;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          console.log('Speech recognition stopped/aborted on unmount');
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const startSpeech = () => {
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported in this browser environment');
      return;
    }

    // Cancel any existing instance before initiating a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.lang = 'en-US';

    rec.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setSpeechError(null);
    };

    rec.onend = () => {
      console.log('Speech recognition stopped');
      setIsListening(false);
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error event:', event);
      console.log('Speech recognition error: ' + (event.error || 'unknown'));
      setIsListening(false);
      
      let errMsg = event.error || 'unknown_error';
      if (event.error === 'not-allowed') {
        errMsg = 'Microphone access denied. This is common inside frame previews. Please ensure microphone permissions are allowed in your browser address bar, or try opening this app in a new tab using the "Open in new tab" icon at the top right.';
      } else if (event.error === 'service-not-allowed') {
        errMsg = 'Speech input is restricted by your browser or device policies.';
      } else if (event.error === 'no-speech') {
        errMsg = 'No speech was detected. Please make sure your mic is working and try again.';
      } else if (event.error === 'audio-capture') {
        errMsg = 'Could not capture audio. Verify your microphone is plugged in and not in use.';
      }
      setSpeechError(errMsg);
    };

    rec.onresult = (event: any) => {
      console.log('Speech recognition result received');
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        console.log('Transcript text:', transcript);
        setInputText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      }
    };

    recognitionRef.current = rec;

    try {
      console.log('Triggering speech recognition start from user interaction event handler');
      rec.start();
    } catch (error: any) {
      console.error('Failed to start speech recognition manually:', error);
      console.log('Speech recognition error: failed to trigger start');
      setSpeechError(error?.message || 'Failed to initialize speech recognition.');
    }
  };

  const toggleListening = () => {
    if (!isSpeechSupported) return;

    if (isListening) {
      console.log('User toggled speech recognition OFF');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error during manual stop:', e);
        }
      }
      setIsListening(false);
    } else {
      console.log('User toggled speech recognition ON');
      startSpeech();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onParseTasks(inputText);
    setInputText('');
  };

  const handleUseExample = (example: string) => {
    setInputText(example);
  };

  return (
    <div className="bg-theme-card border rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-theme-main">
            Dump Your Deadlines
          </h2>
          <p className="text-theme-muted text-xs mt-0.5">
            Type tasks and deadlines in plain language — our AI handles the rest.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g., submit draft by tomorrow 5pm, call doctor wednesday 10am, gym today at 8pm..."
            rows={3}
            disabled={isLoading}
            className={`w-full bg-theme-input border focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-4 ${
              isSpeechSupported ? 'pr-12' : 'pr-4'
            } placeholder-zinc-400 dark:placeholder-zinc-500 text-sm outline-none transition-all resize-none disabled:opacity-50`}
          />

          {isSpeechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute top-3 right-3 p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center ${
                isListening
                  ? 'bg-rose-500/15 border-rose-500/35 text-rose-500 animate-pulse'
                  : 'bg-theme-card hover:bg-stone-100 dark:hover:bg-zinc-850 border-theme-muted/15 text-theme-muted'
              }`}
              title={isListening ? 'Listening... Click to stop' : 'Input via voice (Web Speech API)'}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'scale-110' : ''}`} />
            </button>
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {isListening ? (
              <span className="text-[10px] text-rose-500 font-semibold animate-pulse flex items-center gap-1.5 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Listening...
              </span>
            ) : (
              <span className="text-[10px] text-theme-muted font-mono hidden sm:inline">
                Press submit to parse
              </span>
            )}
          </div>
        </div>

        {speechError && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-500 dark:text-rose-400 flex items-start justify-between gap-3 animate-pulse">
            <span className="font-medium leading-relaxed">
              ⚠️ Voice Input Alert: {speechError}
            </span>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-theme-muted hover:text-theme-main border-none bg-transparent cursor-pointer font-bold shrink-0 text-base leading-none"
              title="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-theme-muted font-medium mr-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Try examples:
            </span>
            {EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUseExample(ex)}
                disabled={isLoading}
                className="text-[11px] bg-theme-input hover:opacity-80 text-theme-main px-2.5 py-1 border rounded-md transition-colors text-left max-w-full truncate cursor-pointer"
                title={ex}
              >
                ex. {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-md hover:shadow-amber-500/10 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Parsing deadlocks...</span>
              </>
            ) : (
              <>
                <span>Save My Life</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
