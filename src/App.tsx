import React, { useState, useEffect } from 'react';
import { Task, TimelineItem, ParseTasksResponse, PlanDayResponse } from './types';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import ScheduleTimeline from './components/ScheduleTimeline';
import DraftModal from './components/DraftModal';
import { Zap, HelpCircle, Flame, Calendar, Trash2, ListChecks, CheckSquare, Plus, RefreshCw, Sparkles, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('panicmate_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('panicmate_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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

  const [lastParseFallback, setLastParseFallback] = useState(false);
  const [lastPlanFallback, setLastPlanFallback] = useState(false);

  const [isParsing, setIsParsing] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nudge Toast and auto-drafting states
  const [nudgeToast, setNudgeToast] = useState<{
    task: Task;
    hoursLeft: string;
  } | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);
  const [isDraftingFromToast, setIsDraftingFromToast] = useState(false);
  const [toastDraftOpen, setToastDraftOpen] = useState(false);
  const [toastDraftData, setToastDraftData] = useState({ subject: '', body: '' });
  const [toastDraftError, setToastDraftError] = useState<string | null>(null);
  const [lastDraftedTask, setLastDraftedTask] = useState<Task | null>(null);

  // Trigger nudge on load if task is due within 2 hours
  useEffect(() => {
    if (tasks.length === 0 || toastDismissed || nudgeToast) return;

    const pending = tasks.filter((t) => t.status === 'pending');
    const now = new Date();
    const urgentTask = pending.find((t) => {
      const deadlineDate = new Date(t.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 2;
    });

    if (urgentTask) {
      const deadlineDate = new Date(urgentTask.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      setNudgeToast({
        task: urgentTask,
        hoursLeft: diffHours.toFixed(1),
      });
    }
  }, [tasks, toastDismissed, nudgeToast]);

  const handleAutoDraftFromToast = async () => {
    if (!nudgeToast) return;
    setIsDraftingFromToast(true);
    setToastDraftError(null);
    const task = nudgeToast.task;
    setLastDraftedTask(task);
    try {
      const response = await fetch(`/api/tasks/${task.id}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.title,
          urgencyReason: task.urgencyReason,
          deadline: task.deadline,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft.');
      }

      const data = await response.json();
      setToastDraftData({
        subject: data.subject || '',
        body: data.body || '',
      });
      setToastDraftOpen(true);
      setToastDismissed(true);
      setNudgeToast(null);
    } catch (err: any) {
      console.error(err);
      setToastDraftError('Failed to generate draft. Please try again.');
    } finally {
      setIsDraftingFromToast(false);
    }
  };

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
    setLastParseFallback(false);
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
        if (data.isFallback) {
          setLastParseFallback(true);
        }
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
    setLastPlanFallback(false);
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
        if (data.isFallback) {
          setLastPlanFallback(true);
        }
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

  const handleToggleSubTask = (taskId: string, subTaskText: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const completed = t.completedSubTasks || [];
          const isCompleted = completed.includes(subTaskText);
          const newCompleted = isCompleted
            ? completed.filter((st) => st !== subTaskText)
            : [...completed, subTaskText];
          return { ...t, completedSubTasks: newCompleted };
        }
        return t;
      })
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
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-zinc-950' : 'bg-theme-main'} text-theme-main font-sans antialiased selection:bg-amber-500 selection:text-zinc-950 pb-20 transition-colors duration-250`}>
      {/* Toast Notification Container */}
      <AnimatePresence>
        {nudgeToast && !toastDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl"
          >
            <div className={`backdrop-blur-md border border-amber-500/35 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden ${
              isDarkMode ? 'bg-zinc-900/95 text-zinc-100' : 'bg-white/95 text-zinc-900 border-[#EADFCA]'
            }`}>
              {/* Soft glowing indicator line at the top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />
              
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 shrink-0 animate-pulse">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-theme-main leading-snug">
                    🚨 AI Nudge: You only have <span className="text-amber-400 font-bold font-mono">{nudgeToast.hoursLeft}</span> hours left for <span className="text-theme-main underline decoration-amber-500/50 underline-offset-2 font-semibold">{nudgeToast.task.title}</span>.
                  </p>
                  <p className="text-[11px] text-theme-muted mt-0.5">
                    Click Auto-Draft to get started instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setToastDismissed(true);
                    setNudgeToast(null);
                  }}
                  className="text-theme-muted hover:text-theme-main text-xs font-semibold px-2.5 py-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors"
                >
                  Ignore
                </button>
                <button
                  onClick={handleAutoDraftFromToast}
                  disabled={isDraftingFromToast}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5 cursor-pointer border-none disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
                >
                  {isDraftingFromToast ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Drafting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-zinc-950 animate-pulse" />
                      <span>Auto-Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {toastDraftError && (
              <div className="mt-1.5 mx-auto max-w-sm bg-rose-500/15 border border-rose-500/20 text-rose-400 text-[10px] font-mono p-2 rounded-lg text-center shadow">
                {toastDraftError}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Draft Modal for Toast Nudge */}
      <DraftModal
        isOpen={toastDraftOpen}
        onClose={() => {
          setToastDraftOpen(false);
          setLastDraftedTask(null);
        }}
        initialSubject={toastDraftData.subject}
        initialBody={toastDraftData.body}
        taskTitle={lastDraftedTask?.title || ''}
        actionType={lastDraftedTask?.actionType || 'none'}
      />

      {/* Navigation Header */}
      <header className={`border-b ${isDarkMode ? 'border-zinc-900/80 bg-zinc-950/80' : 'border-[#e6dfce] bg-[#FFF9E6]/90'} backdrop-blur sticky top-0 z-50 transition-colors duration-250`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg tracking-tight text-theme-main flex items-center gap-2">
                PanicMate
                <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-medium">
                  AI Companion
                </span>
              </h1>
              <p className="text-[10px] text-theme-muted sm:text-xs font-medium">
                Not just passive reminders. AI that takes the first step for you.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme switcher */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300' 
                  : 'bg-white hover:bg-stone-100 border-[#EADFCA] text-zinc-700'
              }`}
              title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {tasks.length > 0 && (
              <button
                onClick={handleClearAll}
                className={`text-xs border rounded-xl px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 border-zinc-800'
                    : 'bg-white hover:bg-stone-100 text-zinc-600 border-[#EADFCA]'
                }`}
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
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-xs text-rose-400 flex items-center justify-between animate-shake">
            <span className="font-mono">⚠️ Error: {error}</span>
            <button onClick={() => setError(null)} className="text-zinc-500 hover:text-zinc-300 border-none bg-transparent cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {(lastParseFallback || lastPlanFallback) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>
                <strong>Local Recovery Engine active:</strong> Gemini free-tier quota was exceeded or experienced temporary spikes. The app successfully transitioned to offline scheduling heuristics so your workflow remains completely uninterrupted!
              </span>
            </div>
            <button 
              onClick={() => {
                setLastParseFallback(false);
                setLastPlanFallback(false);
              }} 
              className="text-zinc-400 hover:text-zinc-200 text-xs font-mono border-none bg-transparent cursor-pointer self-end sm:self-auto shrink-0"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Dashboard Stats Panel */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-theme-card border p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-theme-muted font-mono block uppercase">Pending Tasks</span>
                <span className="text-xl font-bold font-mono text-theme-main">{pendingCount}</span>
              </div>
            </div>

            <div className="bg-theme-card border p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-theme-muted font-mono block uppercase">Completed Tasks</span>
                <span className="text-xl font-bold font-mono text-theme-main">{completedCount}</span>
              </div>
            </div>

            <div className="bg-theme-card border p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-theme-muted font-mono block uppercase">Critical (High Urgency)</span>
                <span className="text-xl font-bold font-mono text-rose-500 dark:text-rose-400">{highUrgencyCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* First section: Input block */}
        <TaskInput onParseTasks={handleParseTasks} isLoading={isParsing} />

        {tasks.length === 0 ? (
          /* Empty state */
          <div className="bg-theme-card border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-5 shadow-sm">
            <div className="w-16 h-16 bg-theme-main border rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-md">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-theme-main text-lg">No deadlocks on your radar yet</h3>
              <p className="text-theme-muted text-sm max-w-sm mx-auto leading-relaxed">
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
                onToggleSubTask={handleToggleSubTask}
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
      <footer className={`mt-20 border-t ${isDarkMode ? 'border-zinc-900' : 'border-[#e6dfce]'} py-8 text-center text-theme-muted text-xs font-mono transition-colors duration-250`}>
        <p>PanicMate • Your Dynamic AI Companion</p>
      </footer>
    </div>
  );
}
