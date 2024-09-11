import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transition } from '@headlessui/react';

type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  const contextValue: ToastContextValue = {
    addToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4">
        <Transition
          show={toasts.length > 0}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`p-4 rounded shadow-xl ${toast.type === 'success'
                    ? 'border-l-4 border-green-500'
                    : toast.type === 'error'
                      ? ' border-l-4 border-red-500'
                      : 'border-l-4 border-blue-500'
                  }`}
              >
                {toast.message}
              </div>
            ))}
          </div>
        </Transition>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
