import React, { useState, useEffect } from 'react';
import { Task, TimelineItem, ParseTasksResponse, PlanDayResponse } from './types';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import ScheduleTimeline from './components/ScheduleTimeline';
import { Zap, HelpCircle, Flame, Calendar, Trash2, ListChecks, CheckSquare, Plus, RefreshCw } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('life_saver_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [schedule, setSchedule] = useState<TimelineItem[]>(() => {
    const saved = localStorage.getItem('life_saver_schedule');
    return saved ? JSON.parse(saved) : [];
  });

  const [coachingMessage, setCoachingMessage] = useState<string>(() => {
    return localStorage.getItem('life_saver_coaching') || '';
  });

  const [isParsing, setIsParsing] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('life_saver_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('life_saver_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('life_saver_coaching', coachingMessage);
  }, [coachingMessage]);

  const handleParseTasks = async (inputText: string) => {
    setIsParsing(true);
    setError(null);
    try {
      const referenceTime = new Date().toISOString();
      const response = await fetch('/api/tasks/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText, referenceTime }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse text into structured tasks. Please check server logs.');
      }

      const data: ParseTasksResponse = await response.json();
      if (data && data.tasks) {
        const newTasks: Task[] = data.tasks.map((parsedTask) => ({
          ...parsedTask,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending',
        }));
        setTasks((prev) => [...prev, ...newTasks]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while contacting Gemini.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePlanDay = async () => {
    const pending = tasks.filter((t) => t.status === 'pending');
    if (pending.length === 0) return;

    setIsPlanning(true);
    setError(null);
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      });

      const response = await fetch('/api/tasks/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: pending, currentTime }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate daily plan. Please check server logs.');
      }

      const data: PlanDayResponse = await response.json();
      if (data) {
        setSchedule(data.schedule || []);
        setCoachingMessage(data.coachingMessage || '');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while creating daily plan.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleToggleStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'pending' ? 'done' : 'pending' } : t))
    );
  };

  const handleEditTask = (id: string, updatedFields: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    // Clean up schedule items targeting this task if needed
    setSchedule((prev) => prev.filter((item) => item.associatedTaskId !== id));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all tasks and timeline?')) {
      setTasks([]);
      setSchedule([]);
      setCoachingMessage('');
    }
  };

  // Stats calculation
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const highUrgencyCount = tasks.filter((t) => t.status === 'pending' && t.urgency === 'high').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-amber-500 selection:text-zinc-950 pb-20">
      {/* Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg tracking-tight text-zinc-50 flex items-center gap-2">
                Last-Minute Life Saver
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-medium">
                  AI Companion
                </span>
              </h1>
              <p className="text-[10px] text-zinc-500 sm:text-xs">Beat procrastination & beat deadlines</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {tasks.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-lg px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Session</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Banner Alert or Coaching status */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-xs text-rose-400 flex items-center justify-between">
            <span className="font-mono">⚠️ Error: {error}</span>
            <button onClick={() => setError(null)} className="text-zinc-500 hover:text-zinc-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Stats Panel */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Pending Tasks</span>
                <span className="text-xl font-bold font-mono text-zinc-200">{pendingCount}</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Completed Tasks</span>
                <span className="text-xl font-bold font-mono text-zinc-200">{completedCount}</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Critical (High Urgency)</span>
                <span className="text-xl font-bold font-mono text-rose-400">{highUrgencyCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* First section: Input block */}
        <TaskInput onParseTasks={handleParseTasks} isLoading={isParsing} />

        {tasks.length === 0 ? (
          /* Empty state */
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-md">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-zinc-100 text-lg">No deadlocks on your radar yet</h3>
              <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                Procrastinating is sweet until the deadline bites. Type your deadlines above in plain text (e.g. "submit presentation Friday 4pm, prepare report tonight") to organize your brain.
              </p>
            </div>
          </div>
        ) : (
          /* Interactive columns */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left side: Task manager lists */}
            <div className="space-y-6">
              <TaskList
                tasks={tasks}
                onToggleStatus={handleToggleStatus}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>

            {/* Right side: AI generated schedule/timeline planner */}
            <div>
              <ScheduleTimeline
                schedule={schedule}
                coachingMessage={coachingMessage}
                tasks={tasks}
                onPlanDay={handlePlanDay}
                isLoading={isPlanning}
                onToggleStatus={handleToggleStatus}
              />
            </div>
          </div>
        )}
      </main>

      {/* Humble craft signature banner */}
      <footer className="mt-20 border-t border-zinc-900 py-8 text-center text-zinc-600 text-xs font-mono">
        <p>Last-Minute Life Saver • Your Dynamic AI Companion</p>
      </footer>
    </div>
  );
}
