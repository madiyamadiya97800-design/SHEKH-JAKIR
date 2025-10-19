
import React from 'react';
import { ExteriorPart } from '../types';

interface ColorPickerProps {
  label: string;
  part: ExteriorPart;
  color: string;
  onColorChange: (part: ExteriorPart, color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, part, color, onColorChange }) => {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={`${part}-color`} className="text-gray-600 dark:text-gray-300 font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={`${part}-color`}
          type="color"
          value={color}
          onChange={(e) => onColorChange(part, e.target.value)}
          className="w-10 h-10 p-0 border-none cursor-pointer appearance-none"
          style={{backgroundColor: 'transparent'}}
        />
        <div 
          className="absolute top-0 left-0 w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600 pointer-events-none"
          style={{ backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
};