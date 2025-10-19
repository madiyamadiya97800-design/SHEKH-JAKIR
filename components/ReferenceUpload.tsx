import React, { useRef } from 'react';

interface ReferenceUploadProps {
  referenceImage: { file: File; base64: string } | null;
  onImageUpload: (file: File, base64: string) => void;
  onImageRemove: () => void;
  disabled: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
};

export const ReferenceUpload: React.FC<ReferenceUploadProps> = ({ referenceImage, onImageUpload, onImageRemove, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                const base64 = await fileToBase64(file);
                onImageUpload(file, base64);
            } catch (error) {
                console.error("Error converting file to base64:", error);
            }
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    if (referenceImage) {
        return (
            <div className="relative group">
                <div className="w-full h-48 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <img
                        src={`data:${referenceImage.file.type};base64,${referenceImage.base64}`}
                        alt="Reference style"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
                <button
                    onClick={onImageRemove}
                    className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove reference image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div>
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                disabled={disabled}
            />
            <button
                onClick={handleClick}
                disabled={disabled}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>Add Style Reference</span>
            </button>
        </div>
    );
};