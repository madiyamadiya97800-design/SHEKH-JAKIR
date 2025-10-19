import React from 'react';
import { asianPaintsColors } from '../data/asianPaintsColors';

interface ColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
}

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({ isOpen, onClose, onSelectColor }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Asian Paints Palette</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {asianPaintsColors.map((color) => (
            <div key={color.name} className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm hover:scale-110 hover:border-blue-500 dark:hover:border-blue-400 transition-transform"
                style={{ backgroundColor: color.hex }}
                onClick={() => onSelectColor(color.hex)}
                title={color.name}
              />
              <p className="text-xs text-center mt-2 text-gray-600 dark:text-gray-300">{color.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
