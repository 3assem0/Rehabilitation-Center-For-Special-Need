import React from "react";

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  loading = false, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-light shadow-md',
    secondary: 'bg-white text-primary border border-border hover:bg-bg',
    danger: 'bg-danger text-white hover:bg-red-600 shadow-md',
    success: 'bg-success text-white hover:bg-green-600 shadow-md',
    warning: 'bg-warning text-white hover:bg-yellow-600 shadow-md',
    ghost: 'bg-transparent text-text hover:bg-bg border-none'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`
        btn inline-flex items-center justify-center gap-2 font-semibold
        ${variants[variant]}
        ${sizes[size]}
        ${loading ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      )}
      {children}
    </button>
  );
};

export default Button;
