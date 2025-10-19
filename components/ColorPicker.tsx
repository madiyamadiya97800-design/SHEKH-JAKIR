import React from 'react';
import { ExteriorPart } from '../types';

interface ColorPickerProps {
  label: string;
  part: ExteriorPart;
  color: string;
  onColorChange: (part: ExteriorPart, color: string) => void;
  onPaletteOpen: () => void;
  isEnabled: boolean;
  onToggle: (part: ExteriorPart, isEnabled: boolean) => void;
  toggleable: boolean;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => {
    return (
        <button
            type="button"
            className={`${
                enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800`}
            role="switch"
            aria-checked={enabled}
            onClick={() => onChange(!enabled)}
        >
            <span
                className={`${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
            />
        </button>
    );
};


export const ColorPicker: React.FC<ColorPickerProps> = ({ label, part, color, onColorChange, onPaletteOpen, isEnabled, onToggle, toggleable }) => {
  return (
    <div className={`transition-opacity ${!isEnabled && toggleable ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={`${part}-color`} className="text-gray-600 dark:text-gray-300 font-medium">
          {label}
        </label>
        <div className="flex items-center space-x-3">
            {toggleable && <ToggleSwitch enabled={isEnabled} onChange={(checked) => onToggle(part, checked)} />}
            <div className="relative">
                <input
                    id={`${part}-color`}
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(part, e.target.value)}
                    className="w-10 h-10 p-0 border-none cursor-pointer appearance-none disabled:cursor-not-allowed"
                    style={{backgroundColor: 'transparent'}}
                    disabled={!isEnabled}
                />
                <div 
                    className="absolute top-0 left-0 w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600 pointer-events-none"
                    style={{ backgroundColor: color }}
                ></div>
            </div>
        </div>
      </div>
       <button 
        onClick={onPaletteOpen}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 w-full text-right disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed"
        disabled={!isEnabled}
      >
        Asian Paints Palette
      </button>
    </div>
  );
};