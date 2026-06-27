import React, { useState } from 'react';
import { Task } from '../types';
import { AlertTriangle, Clock, CheckCircle, Circle, Edit2, Check, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onEditTask: (id: string, updatedFields: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskList({ tasks, onToggleStatus, onEditTask, onDeleteTask }: TaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editUrgency, setEditUrgency] = useState<'high' | 'medium' | 'low'>('medium');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  // Sort pending tasks by urgency: high first, then medium, then low
  const urgencyWeight = { high: 3, medium: 2, low: 1 };
  const sortedPendingTasks = [...pendingTasks].sort((a, b) => {
    const diff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (diff !== 0) return diff;
    // Secondary sort: earliest deadline first
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    // Convert YYYY-MM-DD HH:mm to YYYY-MM-DDTHH:mm for local datetime input compatibility
    const formattedDeadline = task.deadline.replace(' ', 'T');
    setEditDeadline(formattedDeadline);
    setEditUrgency(task.urgency);
  };

  const handleSave = (id: string) => {
    // Convert back from T format to YYYY-MM-DD HH:mm
    const cleanedDeadline = editDeadline.replace('T', ' ');
    onEditTask(id, {
      title: editTitle,
      deadline: cleanedDeadline,
      urgency: editUrgency,
    });
    setEditingId(null);
  };

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getUrgencyStyles = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return {
          border: 'border-l-4 border-l-rose-500 border-zinc-800',
          badgeBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          iconColor: 'text-rose-500',
        };
      case 'medium':
        return {
          border: 'border-l-4 border-l-amber-500 border-zinc-800',
          badgeBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          iconColor: 'text-amber-500',
        };
      case 'low':
        default:
        return {
          border: 'border-l-4 border-l-emerald-500 border-zinc-800',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          iconColor: 'text-emerald-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Tasks list */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-semibold text-zinc-300 text-sm tracking-wide uppercase flex items-center gap-2">
            <span>Pending Deadlines</span>
            <span className="font-mono text-xs text-zinc-500 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
              {pendingTasks.length}
            </span>
          </h3>
        </div>

        {sortedPendingTasks.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-8 text-center text-zinc-500 text-sm">
            No active tasks. Sleep easy, or add tasks to save your sanity!
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPendingTasks.map((task) => {
              const isEditing = editingId === task.id;
              const styles = getUrgencyStyles(task.urgency);

              return (
                <div
                  key={task.id}
                  className={`bg-zinc-900 rounded-xl transition-all shadow-md ${
                    isEditing ? 'ring-1 ring-amber-500/30' : ''
                  } ${styles.border}`}
                >
                  <div className="p-4 flex items-start gap-3.5">
                    {/* Status checkbox */}
                    <button
                      onClick={() => onToggleStatus(task.id)}
                      className="mt-1 text-zinc-600 hover:text-amber-500 transition-colors cursor-pointer shrink-0"
                    >
                      <Circle className="w-5 h-5" />
                    </button>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1">
                              Task Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-1.5 text-zinc-100 text-sm outline-none transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1">
                                Deadline
                              </label>
                              <input
                                type="datetime-local"
                                value={editDeadline}
                                onChange={(e) => setEditDeadline(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-1.5 text-zinc-100 text-xs outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1">
                                Urgency
                              </label>
                              <select
                                value={editUrgency}
                                onChange={(e) => setEditUrgency(e.target.value as 'high' | 'medium' | 'low')}
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-1.5 text-zinc-100 text-xs outline-none transition-all"
                              >
                                <option value="high">High Urgency</option>
                                <option value="medium">Medium Urgency</option>
                                <option value="low">Low Urgency</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSave(task.id)}
                              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-zinc-100 text-sm leading-snug break-words">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${styles.badgeBg}`}>
                                {task.urgency}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-zinc-400 text-xs">
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="font-mono text-zinc-300 font-medium">
                                {formatDateString(task.deadline)}
                              </span>
                            </div>
                          </div>

                          {task.urgencyReason && (
                            <p className="text-zinc-500 text-xs mt-2 italic bg-zinc-950/45 p-2 rounded-lg border border-zinc-800/40">
                              🤖 {task.urgencyReason}
                            </p>
                          )}

                          {/* Quick controls on hover or static on small devices */}
                          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-zinc-800/40 justify-end">
                            <button
                              onClick={() => startEdit(task)}
                              className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors cursor-pointer"
                              title="Edit task details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="flex items-center gap-1 text-zinc-600 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Tasks section */}
      {completedTasks.length > 0 && (
        <div className="border-t border-zinc-800/60 pt-4">
          <button
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            className="flex items-center justify-between w-full text-zinc-400 hover:text-zinc-200 transition-colors py-2 px-1 text-sm font-semibold uppercase tracking-wider cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>Completed Tasks</span>
              <span className="font-mono text-xs text-zinc-500 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                {completedTasks.length}
              </span>
            </div>
            {isCompletedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isCompletedExpanded && (
            <div className="space-y-2 mt-2 transition-all">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3.5 flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className="mt-0.5 text-emerald-500 hover:text-zinc-600 transition-colors cursor-pointer shrink-0"
                  >
                    <CheckCircle className="w-5 h-5 fill-emerald-500/10" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-zinc-400 text-sm line-through break-words">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Completed: {formatDateString(task.deadline)}
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete completed task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
