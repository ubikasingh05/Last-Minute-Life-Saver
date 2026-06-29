import React, { useState, useEffect } from 'react';
import { TimelineItem, Task } from '../types';
import { Calendar, Clock, Smile, Sparkles, RefreshCw, CheckCircle, Activity, Award } from 'lucide-react';

interface ScheduleTimelineProps {
  schedule: TimelineItem[];
  coachingMessage: string;
  tasks: Task[];
  onPlanDay: () => void;
  isLoading: boolean;
  onToggleStatus: (id: string) => void;
}

export default function ScheduleTimeline({
  schedule,
  coachingMessage,
  tasks,
  onPlanDay,
  isLoading,
  onToggleStatus,
}: ScheduleTimelineProps) {
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);

  // Reset local schedule completions when a new schedule is generated or changed
  useEffect(() => {
    setCompletedIndices([]);
  }, [schedule]);

  // Map task status to schedule item
  const getTaskStatus = (taskId: string | null) => {
    if (!taskId) return null;
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.status : null;
  };

  // Toggle completion of a timeline block
  const handleToggleBlock = (index: number, associatedTaskId: string | null) => {
    const taskStatus = getTaskStatus(associatedTaskId);
    const isTaskDone = taskStatus === 'done';
    const isCurrentlyDone = (associatedTaskId ? isTaskDone : false) || completedIndices.includes(index);

    if (associatedTaskId) {
      // Toggle actual task status in parent state
      onToggleStatus(associatedTaskId);
    }

    if (isCurrentlyDone) {
      setCompletedIndices((prev) => prev.filter((i) => i !== index));
    } else {
      setCompletedIndices((prev) => [...prev, index]);
    }
  };

  return (
    <div className="bg-theme-card border rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-theme-main flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
            <span>Time-Blocked Schedule</span>
          </h2>
          <p className="text-theme-muted text-xs mt-0.5">
            Step-by-step action plan to beat your deadlines today.
          </p>
        </div>

        <button
          onClick={onPlanDay}
          disabled={isLoading || tasks.filter(t => t.status === 'pending').length === 0}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-850 disabled:text-zinc-500 text-zinc-950 font-semibold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{schedule.length > 0 ? 'Regenerate Plan' : 'Plan My Day'}</span>
        </button>
      </div>

      {/* AI Coaching quote bubble */}
      {coachingMessage && !isLoading && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3">
          <Smile className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
              AI Coach Prescription
            </span>
            <p className="text-theme-muted text-xs italic leading-relaxed">
              "{coachingMessage}"
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 py-2">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-3/4"></div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-4 items-start">
              <div className="w-16 h-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse shrink-0"></div>
              <div className="w-1 h-12 bg-zinc-200 dark:bg-zinc-850 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-2/3"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule timeline representation */}
      {!isLoading && schedule.length === 0 && (
        <div className="bg-theme-input border border-dashed rounded-xl p-8 text-center text-theme-muted text-xs">
          <p className="mb-3 font-semibold text-theme-main">No schedule generated yet.</p>
          <p className="text-[11px] leading-relaxed max-w-sm mx-auto">
            Click 'Plan My Day' to automatically organize all your pending tasks into a hyper-realistic, action-focused schedule starting right now.
          </p>
        </div>
      )}

      {!isLoading && schedule.length > 0 && (
        <div className="relative pl-1">
          {/* Vertical axis line */}
          <div className="absolute left-[54px] top-4 bottom-4 w-[2px] bg-theme-muted/15"></div>

          <div className="space-y-6">
            {schedule.map((item, index) => {
              const taskStatus = getTaskStatus(item.associatedTaskId);
              const isTaskDone = taskStatus === 'done';
              const isBreak = !item.associatedTaskId;
              const isCompleted = isTaskDone || completedIndices.includes(index);

              return (
                <div key={index} className="flex gap-4 items-start relative group">
                  {/* Time block */}
                  <div className="w-14 text-right shrink-0">
                    <span className="font-mono text-xs font-semibold text-theme-main block">
                      {item.startTime}
                    </span>
                    <span className="font-mono text-[10px] text-theme-muted block">
                      {item.endTime}
                    </span>
                  </div>

                  {/* Node icon indicator */}
                  <div className="relative z-10 flex items-center justify-center">
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center mt-1 transition-all duration-300">
                        <CheckCircle className="w-2.5 h-2.5 text-zinc-950 fill-current" />
                      </div>
                    ) : isBreak ? (
                      <div className="w-4 h-4 rounded-full bg-theme-input border-2 border-theme-muted/30 mt-1 transition-all duration-305" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-950 mt-1 transition-all duration-300" />
                    )}
                  </div>

                  {/* Task item card description */}
                  <div className={`flex-1 p-3.5 border rounded-xl transition-all duration-300 ${
                    isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/5 opacity-55 scale-[0.99]'
                      : isBreak
                      ? 'border-theme-muted/10 bg-theme-input/40'
                      : 'bg-theme-input border-theme-muted/15 hover:border-amber-500/20'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className={`text-xs font-semibold transition-all duration-300 ${
                          isCompleted ? 'text-theme-muted line-through font-normal' : 'text-theme-main'
                        }`}>
                          {item.title}
                        </h4>
                        <p className={`text-[11px] leading-relaxed transition-all duration-300 ${
                          isCompleted ? 'text-theme-muted/70 line-through' : 'text-theme-muted'
                        }`}>
                          {item.description}
                        </p>
                      </div>

                      {/* Fully interactive Done toggle button */}
                      <button
                        onClick={() => handleToggleBlock(index, item.associatedTaskId)}
                        className={`text-[10px] flex items-center gap-1 bg-theme-card border rounded-md px-2 py-0.5 transition-all duration-200 cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                            : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-theme-muted hover:text-emerald-500 border-theme-muted/20 hover:border-emerald-500/30'
                        }`}
                        title={isCompleted ? "Mark as active" : "Mark completed"}
                      >
                        <CheckCircle className={`w-3 h-3 transition-transform duration-200 ${isCompleted ? 'text-emerald-500 scale-110' : ''}`} />
                        <span>{isCompleted ? 'Completed' : 'Done'}</span>
                      </button>
                    </div>

                    {!isBreak && !isCompleted && (
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                          Deadline Task
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-theme-input border rounded-xl text-center shadow-inner">
            <span className="inline-flex items-center gap-1.5 text-xs text-theme-muted font-medium">
              <Award className="w-4 h-4 text-amber-500 animate-bounce" />
              Focus tip: Finish tasks one-by-one to gain incredible momentum!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
