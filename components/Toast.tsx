import { ToastProviderProps, Toast, ToastType, ToastContextValue, ToastContext, ToastItemProps } from "@/hooks/useToast";
import { useState, useCallback, useEffect } from "react";

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const contextValue: ToastContextValue = {
    addToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50 pt-safe">
        <div className="space-y-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const appearTimer = setTimeout(() => {
      setVisible(true);
    }, 100);

    const disappearTimer = setTimeout(() => {
      setVisible(false);
    }, 1700);

    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, 2000);

    return () => {
      clearTimeout(appearTimer);
      clearTimeout(disappearTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onRemove]);

  return (
    <div
      className={`px-4 py-2 bg-background rounded shadow-xl ${toast.type === 'success'
        ? 'border-l-4 border-green-500'
        : toast.type === 'error'
          ? 'border-l-4 border-red-500'
          : 'border-l-4 border-blue-500'
        } transition ease-in-out duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
    >
      {toast.message}
    </div>
  );
};
