import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Painting ho rahi hai...</p>
        <p className="text-gray-500 dark:text-gray-400">Isme thoda samay lag sakta hai.</p>
    </div>
  );
};