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
    }, 2000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001] flex flex-col gap-3">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <div
              key={toast.id}
              className={
                isSuccess
                  ? "bg-[#ECF0FE] rounded-[8px] px-6 h-[50px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center gap-2.5 w-fit animate-slide-in pointer-events-auto"
                  : "bg-white border border-[#EAEAEA] px-4 py-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center gap-3 min-w-[300px] max-w-[400px] animate-slide-in pointer-events-auto"
              }
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {isError ? (
                  <div className="w-8 h-8 rounded-full bg-[#FF5E5E] flex items-center justify-center">
                    <svg width="4" height="14" viewBox="0 0 4 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="4" height="9" rx="2" fill="white"/>
                      <rect y="11" width="4" height="3" rx="1.5" fill="white"/>
                    </svg>
                  </div>
                ) : isSuccess ? (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.97437 0C3.58846 0 0 3.58846 0 7.97437C0 12.3603 3.58846 15.9487 7.97437 15.9487C12.3603 15.9487 15.9487 12.3603 15.9487 7.97437C15.9487 3.58846 12.3603 0 7.97437 0ZM7.97437 14.3539C4.45767 14.3539 1.59487 11.4911 1.59487 7.97437C1.59487 4.45767 4.45767 1.59487 7.97437 1.59487C11.4911 1.59487 14.3539 4.45767 14.3539 7.97437C14.3539 11.4911 11.4911 14.3539 7.97437 14.3539ZM11.6346 4.4497L6.37949 9.7048L4.31413 7.64742L3.18975 8.7718L6.37949 11.9615L12.759 5.58206L11.6346 4.4497Z" fill="#0048B5"/>
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
              <span
                className={
                  isSuccess
                    ? "text-[14px] font-medium text-[#0048B5] leading-none"
                    : "flex-1 text-[15px] font-normal text-[#666666] leading-normal"
                }
              >
                {toast.message}
              </span>

              {/* Close Button */}
              {!isSuccess && (
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-[#999999] hover:text-[#666666] transition-colors p-1"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 1L1 9M1 1L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
