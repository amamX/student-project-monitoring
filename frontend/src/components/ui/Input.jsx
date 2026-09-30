import React from 'react';

export const Input = React.forwardRef(({ className = '', label, error, ...props }, ref) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-primary-600 transition-colors ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';
