import React from 'react';

interface ImagePreviewProps {
  originalSrc: string | null;
  generatedSrc: string | null;
  originalMimeType: string | null;
}

const ImageCard: React.FC<{ src: string | null; title: string }> = ({ src, title }) => {
    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-center mb-2 text-gray-600 dark:text-gray-300">{title}</h3>
            <div
                className="aspect-w-16 aspect-h-9 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg overflow-hidden border dark:border-gray-700/50 relative"
            >
                {src ? (
                    <img
                        src={src}
                        alt={title}
                        className="w-full h-full object-contain"
                    />
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
             <div className="aspect-w-16 aspect-h-9 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center border border-dashed dark:border-gray-600/50">
                <span className="text-gray-500 dark:text-gray-400">Natija yahan dikhega</span>
             </div>
        </div>
       )}
    </div>
  );
};
