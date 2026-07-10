import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}) => {
  // Prevent scrolling on document body when the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div 
        className="relative z-10 w-full max-w-sm transform overflow-hidden rounded-[16px] bg-white p-6 shadow-xl transition-all duration-300 ease-out border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Accent icon container */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>

          {/* Modal Header */}
          <h3 className="text-lg font-bold text-slate-900 leading-6 mb-2">
            {title}
          </h3>

          {/* Modal Message */}
          <p className="text-sm font-medium text-slate-500 mb-6 leading-[150%] max-w-[280px]">
            {message}
          </p>

          {/* Controls */}
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 inline-flex cursor-pointer items-center justify-center rounded-[8px] bg-[#FF7F7F] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus:outline-none"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
