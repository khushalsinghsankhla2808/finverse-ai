import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import type { Toast as ToastType } from '@/types/ui.types';

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const dismissToast = useUIStore((state) => state.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => {
      dismissToast(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  const typeConfig = {
    success: {
      border: 'border-l-green-positive',
      icon: <CheckCircle2 className="text-green-positive shrink-0" size={18} />,
      progressBg: 'bg-green-positive',
    },
    error: {
      border: 'border-l-red-negative',
      icon: <XCircle className="text-red-negative shrink-0" size={18} />,
      progressBg: 'bg-red-negative',
    },
    warning: {
      border: 'border-l-gold-savings',
      icon: <AlertTriangle className="text-gold-savings shrink-0" size={18} />,
      progressBg: 'bg-gold-savings',
    },
    info: {
      border: 'border-l-blue-primary',
      icon: <Info className="text-blue-primary shrink-0" size={18} />,
      progressBg: 'bg-blue-primary',
    },
  };

  const { border, icon, progressBg } = typeConfig[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className={`glassmorphism bg-bg-surface/75 border border-white/5 border-l-4 ${border} rounded-lg shadow-xl w-80 p-4 relative overflow-hidden flex items-start gap-3`}
    >
      {icon}
      <div className="flex-1 text-xs font-semibold text-white/90 leading-normal pr-4">
        {toast.message}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        className="text-white/30 hover:text-white transition-colors duration-150 shrink-0 cursor-pointer absolute top-3 right-3"
      >
        <X size={14} />
      </button>

      {/* Shrinking progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[3px] ${progressBg}`}
      />
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
