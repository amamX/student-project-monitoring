import React from 'react';
import { motion } from 'framer-motion';

export const Button = React.forwardRef(({ 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  children, 
  isLoading,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
    outline: 'border border-slate-200 hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-100',
    ghost: 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
});
Button.displayName = 'Button';
