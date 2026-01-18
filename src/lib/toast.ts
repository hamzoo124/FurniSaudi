// src/lib/toast.ts
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({
    title,
    description,
    type = 'info',
    duration = 5000
  }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, title, description, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'success' });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'error' });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'warning' });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    return toast({ title, description, type: 'info' });
  }, [toast]);

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
  };
};