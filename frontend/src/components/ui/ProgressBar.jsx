import React from 'react';
import { motion } from 'framer-motion';

export const ProgressBar = ({ progress = 0, className = '' }) => {
  return (
    <div className={`w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 overflow-hidden ${className}`}>
      <motion.div 
        className="bg-primary-600 h-2.5 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
};
