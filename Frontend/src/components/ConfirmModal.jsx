import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

export default function ConfirmModal({ 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel", 
  onConfirm, 
  onClose,
  type = "danger", // "danger" (red), "primary" (indigo)
  icon: Icon = LogOut
}) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-slate-100/50 flex flex-col items-center text-center space-y-4 animate-modal-enter z-10">
        
        {/* Close Button top-right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Icon Header */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
          type === "danger" 
            ? "bg-rose-50 text-rose-600" 
            : "bg-indigo-50 text-indigo-600"
        }`}>
          <Icon size={22} className={type === "danger" ? "text-rose-600" : "text-indigo-600"} />
        </div>

        {/* Text Details */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons Action Row */}
        <div className="w-full flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-850 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer ${
              type === "danger"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
