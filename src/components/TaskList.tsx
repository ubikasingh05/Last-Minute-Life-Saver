import React, { useState } from 'react';
import { Task } from '../types';
import { AlertTriangle, Clock, CheckCircle, Circle, Edit2, Check, X, ChevronDown, ChevronUp, Trash2, Sparkles, CheckSquare } from 'lucide-react';
import DraftModal from './DraftModal';

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onEditTask: (id: string, updatedFields: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubTask: (taskId: string, subTaskText: string) => void;
}

export default function TaskList({ tasks, onToggleStatus, onEditTask, onDeleteTask, onToggleSubTask }: TaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editUrgency, setEditUrgency] = useState<'high' | 'medium' | 'low'>('medium');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  // Drafting and Modal State
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [draftErrorId, setDraftErrorId] = useState<string | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [selectedDraftTask, setSelectedDraftTask] = useState<Task | null>(null);
  const [draftData, setDraftData] = useState<{ actionType: string; subject: string; body: string; searchUrl?: string }>({
    actionType: '',
    subject: '',
    body: '',
    searchUrl: ''
  });

  const handleGenerateDraft = async (task: Task) => {
    setLoadingTaskId(task.id);
    setDraftErrorId(null);
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
          actionType: task.actionType,
          searchUrl: task.searchUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft.');
      }

      const data = await response.json();
      setDraftData({
        actionType: data.actionType || '',
        subject: data.subject || '',
        body: data.body || '',
        searchUrl: data.searchUrl || '',
      });
      setSelectedDraftTask(task);
      setDraftModalOpen(true);
    } catch (err) {
      console.error(err);
      setDraftErrorId(task.id);
    } finally {
      setLoadingTaskId(null);
    }
  };

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

  const getRemainingTimeText = (deadlineStr: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadlineStr);
    const diffMs = deadlineDate.getTime() - now.getTime();
    if (isNaN(diffMs)) return null;
    if (diffMs < 0) {
      const overdueMs = Math.abs(diffMs);
      const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
      const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
      if (overdueHours > 0) {
        return `${overdueHours}h ${overdueMins}m overdue ⚠️`;
      }
      return `${overdueMins}m overdue ⚠️`;
    }
    const totalMins = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMins / (24 * 60));
    const hours = Math.floor((totalMins % (24 * 60)) / 60);
    const mins = totalMins % 60;
    if (days > 0) {
      return `${days}d ${hours}h left`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m left`;
    }
    return `${mins}m left`;
  };

  const getUrgencyStyles = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return {
          border: 'border-l-4 border-l-rose-500 border-[#f1e4c3] dark:border-zinc-800/80 bg-theme-card',
          badgeBg: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
          iconColor: 'text-rose-500',
        };
      case 'medium':
        return {
          border: 'border-l-4 border-l-amber-500 border-[#f1e4c3] dark:border-zinc-800/80 bg-theme-card',
          badgeBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
          iconColor: 'text-amber-500',
        };
      case 'low':
        default:
        return {
          border: 'border-l-4 border-l-emerald-500 border-[#f1e4c3] dark:border-zinc-800/80 bg-theme-card',
          badgeBg: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
          iconColor: 'text-emerald-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Keyframe style for soft urgent pulsing background */}
      <style>{`
        @keyframes softPulseRed {
          0%, 100% {
            background-color: rgba(239, 68, 68, 0.05);
            border-color: rgba(239, 68, 68, 0.2);
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.1);
          }
          50% {
            background-color: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.4);
            box-shadow: 0 0 10px 2px rgba(239, 68, 68, 0.15);
          }
        }
        .soft-pulse-urgent {
          animation: softPulseRed 2.5s infinite ease-in-out;
        }
      `}</style>

      {/* Pending Tasks list */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-semibold text-theme-main text-sm tracking-wide uppercase flex items-center gap-2">
            <span>Pending Deadlines</span>
            <span className="font-mono text-xs text-theme-muted px-1.5 py-0.5 bg-theme-card border rounded">
              {pendingTasks.length}
            </span>
          </h3>
        </div>

        {sortedPendingTasks.length === 0 ? (
          <div className="bg-theme-card border border-dashed rounded-xl p-8 text-center text-theme-muted text-sm shadow-sm">
            No active tasks. Sleep easy, or add tasks to save your sanity!
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPendingTasks.map((task) => {
              const isEditing = editingId === task.id;
              const styles = getUrgencyStyles(task.urgency);

              // Calculate time remaining in hours
              const now = new Date();
              const deadlineDate = new Date(task.deadline);
              const diffMs = deadlineDate.getTime() - now.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);

              const isUrgentPulsing = !isEditing && diffHours < 3;

              return (
                <div
                  key={task.id}
                  className={`rounded-xl transition-all shadow-md border ${
                    isEditing ? 'ring-1 ring-amber-500/30' : ''
                  } ${
                    isUrgentPulsing
                      ? 'border border-red-500/35 soft-pulse-urgent'
                      : 'bg-theme-card'
                  } ${isUrgentPulsing ? '' : styles.border}`}
                >
                  <div className="p-4 flex items-start gap-3.5">
                    {/* Status checkbox */}
                    <button
                      onClick={() => onToggleStatus(task.id)}
                      className="mt-1 text-theme-muted hover:text-amber-500 transition-colors cursor-pointer shrink-0"
                    >
                      <Circle className="w-5 h-5 animate-pulse" />
                    </button>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-theme-muted font-semibold block mb-1">
                              Task Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-theme-input border focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-1.5 text-theme-main text-sm outline-none transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-theme-muted font-semibold block mb-1">
                                Deadline
                              </label>
                              <input
                                type="datetime-local"
                                value={editDeadline}
                                onChange={(e) => setEditDeadline(e.target.value)}
                                className="w-full bg-theme-input border focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-1.5 text-theme-main text-xs outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-theme-muted font-semibold block mb-1">
                                Urgency
                              </label>
                              <select
                                value={editUrgency}
                                onChange={(e) => setEditUrgency(e.target.value as 'high' | 'medium' | 'low')}
                                className="w-full bg-theme-input border focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-1.5 text-theme-main text-xs outline-none transition-all"
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
                              className="flex items-center gap-1.5 bg-theme-input border hover:opacity-85 text-theme-muted px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
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
                            <h4 className="font-semibold text-theme-main text-sm leading-snug break-words">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                                isUrgentPulsing 
                                  ? 'bg-red-500/25 text-red-300 border border-red-500/30' 
                                  : styles.badgeBg
                              }`}>
                                {task.urgency}
                              </span>
                            </div>
                          </div>

                          {/* Actionable Breakdown Subtasks */}
                          {task.subTasks && task.subTasks.length > 0 && (
                            <div className="mt-2.5 mb-2 pl-3 pr-3 py-2.5 bg-theme-input/40 dark:bg-zinc-900/45 rounded-xl border border-theme-muted/10 space-y-2">
                              <div className="text-[9px] uppercase tracking-wider text-theme-muted font-bold font-mono flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                                <span>Actionable Breakdown</span>
                              </div>
                              <div className="space-y-2 pl-0.5">
                                {task.subTasks.map((subTaskText, idx) => {
                                  const isSubTaskDone = (task.completedSubTasks || []).includes(subTaskText);
                                  return (
                                    <label
                                      key={idx}
                                      className="flex items-start gap-2.5 text-xs text-theme-main hover:text-theme-main/90 cursor-pointer select-none transition-all py-0.5"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSubTaskDone}
                                        onChange={() => onToggleSubTask(task.id, subTaskText)}
                                        className="rounded border-theme-muted/30 text-amber-500 focus:ring-amber-500/50 w-3.5 h-3.5 bg-theme-input mt-0.5 cursor-pointer"
                                      />
                                      <span className={`leading-relaxed break-words ${isSubTaskDone ? 'text-theme-muted line-through font-normal' : 'font-medium'}`}>
                                        {subTaskText}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-theme-muted text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-mono text-theme-main font-medium">
                                {formatDateString(task.deadline)}
                              </span>
                            </div>

                            {/* Remaining dynamic countdown text */}
                            {(() => {
                              const remainingText = getRemainingTimeText(task.deadline);
                              if (!remainingText) return null;
                              const isPast = remainingText.includes('overdue');
                              return (
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
                                  isPast 
                                    ? 'bg-rose-500/15 text-rose-500 border-rose-500/25' 
                                    : diffHours < 3 
                                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse' 
                                      : 'bg-theme-input text-theme-muted border'
                                }`}>
                                  {remainingText}
                                </span>
                              );
                            })()}
                          </div>

                          {task.urgencyReason && (
                            <p className="text-theme-muted text-xs mt-2 italic bg-theme-input p-2 rounded-lg border">
                              🤖 {task.urgencyReason}
                            </p>
                          )}

                          {task.actionable && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleGenerateDraft(task)}
                                disabled={loadingTaskId === task.id}
                                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-semibold text-xs py-2 px-3 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer border-none"
                              >
                                {loadingTaskId === task.id ? (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 animate-spin animate-pulse" />
                                    <span>
                                      {task.actionType === 'research'
                                        ? 'Launching Research...'
                                        : task.actionType === 'outline'
                                        ? 'Drafting Outline...'
                                        : 'Drafting response...'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-zinc-950 animate-pulse" />
                                    <span>
                                      {task.actionType === 'research'
                                        ? 'Launch Research Assistant'
                                        : task.actionType === 'outline'
                                        ? 'Generate Document Outline'
                                        : 'Draft for me'}
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {draftErrorId === task.id && (
                            <div className="mt-2 text-[10px] text-rose-500 font-mono bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-center justify-between">
                              <span>⚠️ Generation failed. Please try again.</span>
                              <button
                                onClick={() => setDraftErrorId(null)}
                                className="text-zinc-500 hover:text-zinc-300 font-mono text-[10px] border-none bg-transparent cursor-pointer"
                              >
                                [Dismiss]
                              </button>
                            </div>
                          )}

                          {/* Quick controls on hover or static on small devices */}
                          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-theme-muted/15 justify-end">
                            <button
                              onClick={() => startEdit(task)}
                              className="flex items-center gap-1 text-theme-muted hover:text-theme-main text-xs transition-colors cursor-pointer"
                              title="Edit task details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="flex items-center gap-1 text-theme-muted hover:text-rose-500 text-xs transition-colors cursor-pointer"
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

      {/* Draft modal for actionable tasks */}
      <DraftModal
        isOpen={draftModalOpen}
        onClose={() => {
          setDraftModalOpen(false);
          setSelectedDraftTask(null);
        }}
        initialSubject={draftData.subject}
        initialBody={draftData.body}
        taskTitle={selectedDraftTask?.title || ''}
        actionType={draftData.actionType || selectedDraftTask?.actionType || 'none'}
        searchUrl={draftData.searchUrl}
      />

      {/* Completed Tasks section */}
      {completedTasks.length > 0 && (
        <div className="border-t border-theme-muted/15 pt-4">
          <button
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            className="flex items-center justify-between w-full text-theme-muted hover:text-theme-main transition-colors py-2 px-1 text-sm font-semibold uppercase tracking-wider cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>Completed Tasks</span>
              <span className="font-mono text-xs text-theme-muted px-1.5 py-0.5 bg-theme-card border rounded">
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
                  className="bg-theme-card border rounded-xl p-3.5 flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className="mt-0.5 text-emerald-500 hover:text-zinc-600 transition-colors cursor-pointer shrink-0"
                  >
                    <CheckCircle className="w-5 h-5 fill-emerald-500/10" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-theme-muted text-sm line-through break-words">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-theme-muted font-mono mt-0.5">
                      Completed: {formatDateString(task.deadline)}
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-theme-muted hover:text-rose-500 transition-colors cursor-pointer"
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
