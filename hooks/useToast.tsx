import { createContext, useContext, ReactNode } from 'react';

export type ToastType = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
}

export interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
