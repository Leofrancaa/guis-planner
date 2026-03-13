'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, Toast, ToastType } from '@/store/toastStore';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const gradients: Record<ToastType, string> = {
  success: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  error: 'from-red-500/10 to-red-500/5 border-red-500/20',
  warning: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
  info: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      className={`flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border min-w-[300px] max-w-[400px] ${gradients[toast.type]}`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-semibold text-foreground/90 leading-tight pr-2 pt-0.5">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-muted-foreground/50 hover:text-foreground transition-all hover:bg-muted p-1 rounded-lg -mr-1 -mt-1"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
