import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', fullWidth = false, className = '', ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-[18px] px-6 py-3 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-[14px]";
  const variants = {
    primary: "bg-pine text-white shadow-soft hover:bg-pine-deep",
    secondary: "bg-surface text-ink border border-tile hover:bg-canvas",
    ghost: "text-pine hover:bg-tint"
  };
  return (
    <button className={`${base} active:scale-[0.98] transition-all duration-200 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
};