import React from "react";

const Badge = ({ children, variant = 'gray', className = "" }) => {
  const variants = {
    green: 'bg-success/10 text-success border-success/20',
    red: 'bg-danger/10 text-danger border-danger/20',
    yellow: 'bg-warning/10 text-warning border-warning/20',
    blue: 'bg-primary-light/10 text-primary-light border-primary-light/20',
    gray: 'bg-bg text-text-muted border-border',
  };

  return (
    <span className={`
      px-2.5 py-0.5 rounded-full text-xs font-bold border
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
};

export default Badge;
