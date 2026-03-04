import React, { type InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = (props) => {
  return (
    <input
      {...props}
      className={`w-full p-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500 transition-all ${props.className || ''}`}
    />
  );
};