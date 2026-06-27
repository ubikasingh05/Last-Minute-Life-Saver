import React, { useState } from 'react';
import { Sparkles, Calendar, ArrowRight, Zap } from 'lucide-react';

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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-100">
            Dump Your Deadlines
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
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
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-4 text-zinc-100 placeholder-zinc-500 text-sm outline-none transition-all resize-none disabled:opacity-50"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
              Press submit to parse
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-medium mr-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              Try examples:
            </span>
            {EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUseExample(ex)}
                disabled={isLoading}
                className="text-[11px] bg-zinc-950 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 border border-zinc-800 rounded-md transition-colors text-left max-w-full truncate"
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
