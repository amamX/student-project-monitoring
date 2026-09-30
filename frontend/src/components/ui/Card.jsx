import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ className = '', children, ...props }) => {
  return (
    <motion.div 
      className={`rounded-xl border border-slate-200 bg-surface shadow-sm dark:border-slate-800 transition-colors backdrop-blur-md ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ className = '', children }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ className = '', children }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);
