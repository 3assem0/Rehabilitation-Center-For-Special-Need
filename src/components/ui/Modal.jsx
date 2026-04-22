import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "../../context/AppContext";

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  const { language } = useTranslation();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-sidebar/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-bg/50">
          <h3 className="text-xl font-bold text-primary">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-border rounded-full transition-colors text-text-muted hover:text-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-4 p-6 border-t border-border bg-bg/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
