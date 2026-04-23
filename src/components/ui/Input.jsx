import React from "react";

const Input = ({ label, error, className = "", ...props }) => {
  return (
    <div style={{ width: "100%" }} className={className}>
      {label && (
        <label style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 500,
          color: "#9090A8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "6px",
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: "100%",
          padding: "9px 14px",
          background: "#F0F0F6",
          border: error ? "0.5px solid #DC2626" : "none",
          borderRadius: "10px",
          fontSize: "13px",
          color: "#1a1a2e",
          outline: "none",
          fontFamily: "inherit",
        }}
        onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(37,99,235,0.15)"}
        onBlur={e => e.target.style.boxShadow = "none"}
        {...props}
      />
      {error && (
        <p style={{ marginTop: "4px", fontSize: "11px", color: "#DC2626" }}>{error}</p>
      )}
    </div>
  );
};

export default Input;
