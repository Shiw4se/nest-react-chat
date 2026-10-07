import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const ref = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      onClick={onClose}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-5 animate-pop"
      >
        <h3 id="confirm-title" className="text-lg font-bold text-slate-50">
          {title}
        </h3>
        <p id="confirm-desc" className="mt-2 text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} className="min-h-[44px]">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-h-[44px] !bg-red-600 hover:!bg-red-500 !text-white !border-transparent"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
