import React from 'react';
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
  // Map task status to schedule item
  const getTaskStatus = (taskId: string | null) => {
    if (!taskId) return null;
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.status : null;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <span>Time-Blocked Schedule</span>
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Step-by-step action plan to beat your deadlines today.
          </p>
        </div>

        <button
          onClick={onPlanDay}
          disabled={isLoading || tasks.filter(t => t.status === 'pending').length === 0}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{schedule.length > 0 ? 'Regenerate Plan' : 'Plan My Day'}</span>
        </button>
      </div>

      {/* AI Coaching quote bubble */}
      {coachingMessage && !isLoading && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3">
          <Smile className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              AI Coach Prescription
            </span>
            <p className="text-zinc-300 text-xs italic leading-relaxed">
              "{coachingMessage}"
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 py-2">
          <div className="h-6 bg-zinc-800 rounded animate-pulse w-3/4"></div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-4 items-start">
              <div className="w-16 h-8 bg-zinc-800 rounded animate-pulse shrink-0"></div>
              <div className="w-1 h-12 bg-zinc-800 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded animate-pulse w-2/3"></div>
                <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule timeline representation */}
      {!isLoading && schedule.length === 0 && (
        <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-8 text-center text-zinc-500 text-xs">
          <p className="mb-3">No schedule generated yet.</p>
          <p className="text-[11px] text-zinc-600 max-w-sm mx-auto">
            Click 'Plan My Day' to automatically organize all your pending tasks into a hyper-realistic, action-focused schedule starting right now.
          </p>
        </div>
      )}

      {!isLoading && schedule.length > 0 && (
        <div className="relative pl-1">
          {/* Vertical axis line */}
          <div className="absolute left-[54px] top-4 bottom-4 w-[2px] bg-zinc-800"></div>

          <div className="space-y-6">
            {schedule.map((item, index) => {
              const taskStatus = getTaskStatus(item.associatedTaskId);
              const isTaskDone = taskStatus === 'done';
              const isBreak = !item.associatedTaskId;

              return (
                <div key={index} className="flex gap-4 items-start relative group">
                  {/* Time block */}
                  <div className="w-14 text-right shrink-0">
                    <span className="font-mono text-xs font-semibold text-zinc-300 block">
                      {item.startTime}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500 block">
                      {item.endTime}
                    </span>
                  </div>

                  {/* Node icon indicator */}
                  <div className="relative z-10 flex items-center justify-center">
                    {isBreak ? (
                      <div className="w-4 h-4 rounded-full bg-zinc-800 border-2 border-zinc-700 mt-1" />
                    ) : isTaskDone ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-950 flex items-center justify-center mt-1">
                        <CheckCircle className="w-2.5 h-2.5 text-zinc-950 fill-current" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-950 mt-1" />
                    )}
                  </div>

                  {/* Task item card description */}
                  <div className={`flex-1 bg-zinc-950 p-3.5 border rounded-xl transition-all ${
                    isTaskDone
                      ? 'border-emerald-500/20 bg-emerald-950/5 opacity-60'
                      : isBreak
                      ? 'border-zinc-800/40 bg-zinc-900/10'
                      : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`text-xs font-semibold ${
                          isTaskDone ? 'text-zinc-500 line-through' : 'text-zinc-200'
                        }`}>
                          {item.title}
                        </h4>
                        <p className={`text-[11px] mt-1 ${
                          isTaskDone ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>
                          {item.description}
                        </p>
                      </div>

                      {/* Complete status shortcut button if associated with task */}
                      {item.associatedTaskId && !isTaskDone && (
                        <button
                          onClick={() => onToggleStatus(item.associatedTaskId!)}
                          className="text-[10px] flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-emerald-400 rounded-md px-1.5 py-0.5 transition-colors cursor-pointer shrink-0"
                          title="Mark task done"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Done</span>
                        </button>
                      )}
                    </div>

                    {!isBreak && !isTaskDone && (
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                          Deadline Task
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <Award className="w-4 h-4 text-amber-500" />
              Focus tip: Finish tasks one-by-one to gain incredible momentum!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
