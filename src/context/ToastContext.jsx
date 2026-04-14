import React, { createContext, useContext, useState, useCallback } from "react";
import { FiCheck, FiX, FiInfo } from "react-icons/fi";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        <style>{`
          @keyframes slideUpToast { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-5 py-3 rounded-full text-sm font-medium shadow-2xl flex items-center gap-2.5 pointer-events-auto text-white ${toast.type === "error" ? "bg-red-600" : toast.type === "info" ? "bg-stone-800" : "bg-blue-600"}`}
            style={{ animation: "slideUpToast .3s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === "error" ? "bg-white/20 text-white" : toast.type === "info" ? "bg-white/20 text-white" : "bg-emerald-500 text-white"}`}>
              {toast.type === 'error' ? <FiX size={11} strokeWidth={3} /> : toast.type === 'info' ? <FiInfo size={11} strokeWidth={3} /> : <FiCheck size={11} strokeWidth={3} />}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
