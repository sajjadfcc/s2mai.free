
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  // Define optional size property to handle different button dimensions
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  icon, 
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]',
    secondary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    outline: 'border border-neutral-700 text-white hover:bg-neutral-900',
    ghost: 'text-neutral-400 hover:text-white hover:bg-neutral-900'
  };

  // Mapping for button size classes
  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base'
  };

  return (
    <button 
      className={`
        relative flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
