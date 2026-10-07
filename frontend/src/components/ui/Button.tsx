import React, { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'text' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:active:scale-100';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white p-3 shadow-lg shadow-blue-900/30',
    secondary:
      'bg-slate-700/70 hover:bg-slate-600/80 text-slate-100 px-4 py-2 text-sm border border-slate-600/60',
    danger:
      'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2 text-sm border border-red-500/30 rounded-lg',
    text: 'text-blue-400 hover:text-blue-300 font-medium hover:underline p-0 active:scale-100 bg-transparent',
    icon: 'text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-full h-10 w-10 p-0 bg-transparent',
  };

  return (
    <button {...props} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};
