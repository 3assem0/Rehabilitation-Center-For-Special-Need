import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(26,26,46,0.45)",
        }}
      />

      {/* Modal panel */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "600px",
        background: "#ffffff",
        borderRadius: "16px",
        border: "0.5px solid #E8E8EC",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 32px)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "0.5px solid #E8E8EC",
          background: "#FAFAFA",
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#1a1a2e" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "#F0F0F6", border: "none", borderRadius: "50%",
              width: "30px", height: "30px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#6B6B80",
            }}
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px",
            padding: "16px 24px",
            borderTop: "0.5px solid #E8E8EC",
            background: "#FAFAFA",
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
