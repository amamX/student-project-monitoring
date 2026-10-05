import React from 'react';
import { motion } from 'framer-motion';

export const ProgressBar = ({ progress = 0, className = '', variant = 'primary' }) => {
  const variantClasses = {
    primary: 'bg-primary-600',
    success: 'bg-emerald-500',
    warning: 'bg-orange-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={`w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 overflow-hidden flex ${className}`}>
      <motion.div 
        className={`${variantClasses[variant] || variantClasses.primary} h-full rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
};
