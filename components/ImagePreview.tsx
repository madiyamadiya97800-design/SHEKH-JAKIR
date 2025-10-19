import React, { useState, useRef } from 'react';

interface ImagePreviewProps {
  originalSrc: string | null;
  generatedSrc: string | null;
  originalMimeType: string | null;
}

const ZoomIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ZoomInIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const ZoomOutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const ResetIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
    </svg>
);

const ImageCard: React.FC<{ src: string | null; title: string }> = ({ src, title }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleInteractionEnd = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleAmount = -e.deltaY * 0.005;
        const newScale = Math.min(Math.max(1, scale + scaleAmount), 5);

        const imageX = (mouseX - position.x) / scale;
        const imageY = (mouseY - position.y) / scale;

        const newPositionX = mouseX - imageX * newScale;
        const newPositionY = mouseY - imageY * newScale;

        setScale(newScale);
        setPosition({ x: newPositionX, y: newPositionY });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale <= 1) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };
    
    const resetTransform = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const adjustScale = (factor: number) => {
        if (!containerRef.current) return;
        const newScale = Math.min(Math.max(1, scale * factor), 5);
        if (newScale === scale) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const imageX = (centerX - position.x) / scale;
        const imageY = (centerY - position.y) / scale;

        const newPositionX = centerX - imageX * newScale;
        const newPositionY = centerY - imageY * newScale;

        setScale(newScale);
        setPosition({ x: newPositionX, y: newPositionY });
    };

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-center mb-2 text-gray-600 dark:text-gray-300">{title}</h3>
            <div
                ref={containerRef}
                className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border dark:border-gray-700 relative select-none"
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
            >
                {src ? (
                    <>
                        <img
                            src={src}
                            alt={title}
                            className="w-full h-full object-contain"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                transformOrigin: 'top left',
                            }}
                            onMouseDown={handleMouseDown}
                            draggable="false"
                        />
                        <div className="absolute bottom-2 right-2 flex items-center bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-lg p-1 shadow-md">
                            <button onClick={() => adjustScale(0.8)} title="Zoom Out" className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50" disabled={scale <= 1}><ZoomOutIcon /></button>
                            <button onClick={resetTransform} title="Reset View" className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50" disabled={scale === 1 && position.x === 0 && position.y === 0}><ResetIcon /></button>
                            <button onClick={() => adjustScale(1.25)} title="Zoom In" className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50" disabled={scale >= 5}><ZoomInIcon /></button>
                        </div>
                        {scale === 1 && (
                            <div className="absolute top-2 left-2 flex items-center bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-full py-1 px-2 shadow-md text-gray-600 dark:text-gray-300 text-xs pointer-events-none">
                                <ZoomIcon />
                                <span className="ml-1.5 hidden sm:inline">Use mouse wheel to zoom</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 dark:text-gray-500">Image not available</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({ originalSrc, originalMimeType, generatedSrc }) => {
  if (!originalSrc) return null;

  const fullOriginalSrc = originalSrc ? `data:${originalMimeType || 'image/jpeg'};base64,${originalSrc}` : null;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
       <ImageCard src={fullOriginalSrc} title="Original Photo" />
       {generatedSrc ? (
         <ImageCard src={generatedSrc} title="Shekh Jakir Painter Dwara" />
       ) : (
        <div className="w-full">
             <h3 className="text-lg font-semibold text-center mb-2 text-gray-600 dark:text-gray-300">Shekh Jakir Painter Dwara</h3>
             <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-dashed dark:border-gray-600">
                <span className="text-gray-500 dark:text-gray-400">Natija yahan dikhega</span>
             </div>
        </div>
       )}
    </div>
  );
};