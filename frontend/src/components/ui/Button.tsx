import React, { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'text';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyles = 'font-bold rounded-xl transition-all active:scale-95 disabled:bg-slate-700 disabled:text-slate-500';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white p-3',
    danger: 'bg-slate-700 hover:bg-red-500/80 text-white px-4 py-2 text-sm font-medium rounded-lg',
    text: 'text-blue-400 hover:text-blue-300 font-medium hover:underline p-0 active:scale-100 bg-transparent',
  };

  return (
    <button {...props} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};