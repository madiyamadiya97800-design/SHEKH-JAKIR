import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ExteriorPart } from '../types';
import { MASK_COLORS } from '../constants/masks';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (maskBase64: string, partsInMask: ExteriorPart[]) => void;
  originalImage: string | null;
  originalMimeType: string | null;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, onSave, originalImage, originalMimeType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePart, setActivePart] = useState<ExteriorPart>(ExteriorPart.WALL);
  const [brushSize, setBrushSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);
  const history = useRef<ImageData[]>([]);
  const historyIndex = useRef(-1);

  const drawImageOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image.src) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const containerRatio = container.clientWidth / container.clientHeight;
    const imageRatio = image.naturalWidth / image.naturalHeight;

    let drawWidth, drawHeight;
    if (containerRatio > imageRatio) {
      drawHeight = container.clientHeight;
      drawWidth = drawHeight * imageRatio;
    } else {
      drawWidth = container.clientWidth;
      drawHeight = drawWidth / imageRatio;
    }
    
    canvas.width = drawWidth;
    canvas.height = drawHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Do not draw the image on the canvas itself, it's a background now
  }, []);

  useEffect(() => {
    if (isOpen && originalImage && originalMimeType) {
      const image = imageRef.current;
      image.onload = () => {
        drawImageOnCanvas();
        // Clear history for new image
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            history.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
            historyIndex.current = 0;
        }
      };
      image.src = `data:${originalMimeType};base64,${originalImage}`;
    }
  }, [isOpen, originalImage, originalMimeType, drawImageOnCanvas]);

  useEffect(() => {
    window.addEventListener('resize', drawImageOnCanvas);
    return () => {
      window.removeEventListener('resize', drawImageOnCanvas);
    };
  }, [drawImageOnCanvas]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // If we've undone, clear the future history
    if (historyIndex.current < history.current.length - 1) {
      history.current.splice(historyIndex.current + 1);
    }
    
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyIndex.current = history.current.length - 1;
  };

  const undo = () => {
    if (historyIndex.current <= 0) return;
    
    historyIndex.current--;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.putImageData(history.current[historyIndex.current], 0, 0);
    }
  };
  
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = `rgba(0,0,0,1)`;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = MASK_COLORS[activePart].color;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  };
  
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const presentMaskColors = new Set<string>();

    for (let i = 0; i < data.length; i += 4) {
      // Check if pixel is not transparent (alpha > 0)
      if (data[i + 3] > 0) {
        const r = data[i].toString(16).padStart(2, '0');
        const g = data[i + 1].toString(16).padStart(2, '0');
        const b = data[i + 2].toString(16).padStart(2, '0');
        presentMaskColors.add(`#${r}${g}${b}`);
      }
    }

    const partsInMask: ExteriorPart[] = [];
    (Object.keys(MASK_COLORS) as ExteriorPart[]).forEach(part => {
      if (presentMaskColors.has(MASK_COLORS[part].color.toLowerCase())) {
        partsInMask.push(part);
      }
    });

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    onSave(base64, partsInMask);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
      {/* Header Controls */}
      <div className="w-full bg-gray-800 p-2 flex flex-wrap items-center justify-center gap-4 text-white shadow-lg z-10">
        <div className="flex items-center gap-2">
          <label htmlFor="part-select">Part:</label>
          <select 
            id="part-select"
            value={activePart} 
            onChange={e => setActivePart(e.target.value as ExteriorPart)}
            className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1"
          >
            {Object.values(ExteriorPart).map(part => (
              <option key={part} value={part}>{MASK_COLORS[part].name}</option>
            ))}
          </select>
          {!isErasing && <div className="w-6 h-6 rounded-full" style={{backgroundColor: MASK_COLORS[activePart].color}}></div>}
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="brush-size">Size:</label>
          <input 
            id="brush-size"
            type="range" 
            min="1" 
            max="100" 
            value={brushSize} 
            onChange={e => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
        </div>
        
        <div className="flex items-center gap-4">
            <button onClick={() => setIsErasing(!isErasing)} className={`p-2 rounded-md ${isErasing ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Eraser</button>
            <button onClick={undo} disabled={historyIndex.current <= 0} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50">Undo</button>
            <button onClick={handleClear} className="p-2 rounded-md bg-red-800 hover:bg-red-700">Clear All</button>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
            <button onClick={handleSave} className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-500">Save & Close</button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow w-full h-full flex items-center justify-center p-4 relative" style={{ touchAction: 'none' }}>
        <img 
            ref={imageRef} 
            alt="House to draw on"
            className="max-w-full max-h-full object-contain absolute"
        />
        <canvas
            ref={canvasRef}
            className="absolute cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
};