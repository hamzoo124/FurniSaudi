// src/components/Toast.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Toast as ToastType } from '../lib/toast'

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const getBgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success': return 'text-green-800';
      case 'error': return 'text-red-800';
      case 'warning': return 'text-yellow-800';
      case 'info': return 'text-blue-800';
      default: return 'text-gray-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 min-w-[300px] max-w-md border rounded-lg shadow-lg p-4 ${getBgColor()} transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className={`font-bold ${getTextColor()}`}>
            {getIcon()}
          </span>
          <div>
            <h3 className={`font-medium text-sm ${getTextColor()}`}>
              {toast.title}
            </h3>
            {toast.description && (
              <p className="text-xs text-gray-600 mt-1">
                {toast.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-gray-400 hover:text-gray-600 ml-4"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Toast Container
export const ToastContainer: React.FC<{
  toasts: ToastType[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  if (toasts?.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2">
      {toasts?.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};