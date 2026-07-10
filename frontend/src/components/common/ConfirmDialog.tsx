import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from '../common/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button
        variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
        size="sm"
        loading={isLoading}
        onClick={handleConfirm}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={footer}>
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="w-12 h-12 rounded-full bg-red-negative/10 flex items-center justify-center border border-red-negative/20 text-red-negative shadow-glow-red/5">
          <AlertTriangle size={24} />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-white/70 leading-relaxed px-2">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
