import React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle, X } from "lucide-react";

const Alert = ({ title, children, variant = 'info', onClose, className = "" }) => {
  const variants = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <Info size={20} className="text-blue-500" />
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle2 size={20} className="text-green-500" />
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle size={20} className="text-yellow-500" />
    },
    danger: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <XCircle size={20} className="text-red-500" />
    }
  };

  const v = variants[variant];

  return (
    <div className={`
      relative p-4 rounded-lg border flex items-start gap-4 animate-in fade-in slide-in-from-top-2
      ${v.bg} ${v.text} ${className}
    `}>
      <div className="shrink-0 mt-0.5">{v.icon}</div>
      <div className="grow">
        {title && <h4 className="font-bold text-sm mb-1">{title}</h4>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Alert;
