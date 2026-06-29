import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Mail, ExternalLink, Sparkles } from 'lucide-react';

interface DraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject: string;
  initialBody: string;
  taskTitle: string;
  actionType: string;
}

export default function DraftModal({
  isOpen,
  onClose,
  initialSubject,
  initialBody,
  taskTitle,
  actionType,
}: DraftModalProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [copied, setCopied] = useState(false);

  // Sync state with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject);
      setBody(initialBody);
      setCopied(false);
    }
  }, [isOpen, initialSubject, initialBody]);

  const handleCopy = async () => {
    try {
      const textToCopy = `Subject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const isEmail =
    actionType?.toLowerCase() === 'email' ||
    taskTitle?.toLowerCase().includes('email') ||
    taskTitle?.toLowerCase().includes('mail');

  // URL-encode subject and body for mailto link
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-2xl bg-theme-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-theme-card">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/15 rounded-lg text-amber-500">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-theme-main text-sm sm:text-base">
                    AI Communication Draft
                  </h3>
                  <p className="text-[10px] sm:text-xs text-theme-muted font-mono truncate max-w-[320px] sm:max-w-[420px]">
                    Task: {taskTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-theme-muted hover:text-theme-main transition-colors p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-theme-card">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-theme-muted font-semibold mb-1.5 font-mono">
                  Subject Line / Header
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-theme-input border focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-2 text-theme-main text-sm outline-none transition-all"
                  placeholder="e.g. Request for extension"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-theme-muted font-semibold mb-1.5 font-mono">
                  Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full bg-theme-input border focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-lg px-3 py-2 text-theme-main text-xs sm:text-sm outline-none transition-all resize-y font-sans leading-relaxed"
                  placeholder="Message body..."
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t bg-theme-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {isEmail && (
                  <span className="text-[10px] font-mono text-theme-muted bg-theme-input border px-2 py-1 rounded">
                    📬 Outbound Email Detected
                  </span>
                )}
                {!isEmail && actionType && actionType !== 'none' && (
                  <span className="text-[10px] font-mono text-theme-muted bg-theme-input border px-2 py-1 rounded">
                    💬 {actionType.toUpperCase()} Action Detected
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border outline-none ${
                    copied
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-theme-input hover:opacity-85 text-theme-main border'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Draft</span>
                    </>
                  )}
                </button>

                {/* Mailto Button */}
                {isEmail && (
                  <a
                    href={mailtoUrl}
                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition-all no-underline shadow-lg shadow-amber-500/10"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Open in Email Client</span>
                  </a>
                )}

                {/* Close Button if not email (or general close button for mobile screens) */}
                <button
                  onClick={onClose}
                  className="sm:hidden flex items-center justify-center px-4 py-2 bg-theme-input hover:opacity-85 text-theme-main rounded-xl text-xs font-medium cursor-pointer transition-all border"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
