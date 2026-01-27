"use client";

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white border border-[#EAEAEA] px-4 py-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center gap-3 min-w-[300px] max-w-[400px] animate-slide-in pointer-events-auto"
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {toast.type === 'error' ? (
                <div className="w-8 h-8 rounded-full bg-[#FF5E5E] flex items-center justify-center">
                  <svg width="4" height="14" viewBox="0 0 4 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="4" height="9" rx="2" fill="white"/>
                    <rect y="11" width="4" height="3" rx="1.5" fill="white"/>
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center">
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.6666 1.5L4.24992 7.91667L1.33325 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Message */}
            <span className="flex-1 text-[15px] font-normal text-[#666666] leading-normal">{toast.message}</span>
            
            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#999999] hover:text-[#666666] transition-colors p-1"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 1L1 9M1 1L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
