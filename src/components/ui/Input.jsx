import React from "react";

const Input = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold mb-2 text-text">
          {label}
        </label>
      )}
      <input
        className={`input ${error ? 'border-danger focus:ring-danger/20' : 'border-border'}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-danger font-medium animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
