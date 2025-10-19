import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ColorPicker } from './components/ColorPicker';
import { Button } from './components/Button';
import { ImagePreview } from './components/ImagePreview';
import { Spinner } from './components/Spinner';
import { DownloadButton } from './components/DownloadButton';
import { ExteriorPart, ColorSelection } from './types';
import { applyColorsToHouse } from './services/geminiService';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ file: File; base64: string } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorSelection>({
    [ExteriorPart.WALL]: '#f3f4f6',
    [ExteriorPart.DOOR]: '#374151',
    [ExteriorPart.WINDOW]: '#ffffff',
    [ExteriorPart.ROOF]: '#6b7280',
  });
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleImageUpload = (file: File, base64: string) => {
    setOriginalImage({ file, base64 });
    setGeneratedImage(null);
    setError(null);
  };

  const handleColorChange = (part: ExteriorPart, color: string) => {
    setColors(prevColors => ({ ...prevColors, [part]: color }));
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImage) {
      setError('Pahale ghar ki photo upload karein.');
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const result = await applyColorsToHouse(originalImage.base64, originalImage.file.type, colors);
      if (result) {
        setGeneratedImage(`data:image/png;base64,${result}`);
      } else {
        throw new Error('Shekh Jakir Painter se image generate nahi ho payi. Dobara koshish karein.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, colors]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="p-4 md:p-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">1. Photo Upload Karein</h2>
            <FileUpload onImageUpload={handleImageUpload} />

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">2. Rang Chunein</h2>
              <div className="space-y-4">
                <ColorPicker
                  label="Deewar (Wall)"
                  part={ExteriorPart.WALL}
                  color={colors[ExteriorPart.WALL]}
                  onColorChange={handleColorChange}
                />
                <ColorPicker
                  label="Darwaza (Door)"
                  part={ExteriorPart.DOOR}
                  color={colors[ExteriorPart.DOOR]}
                  onColorChange={handleColorChange}
                />
                <ColorPicker
                  label="Khidki (Window)"
                  part={ExteriorPart.WINDOW}
                  color={colors[ExteriorPart.WINDOW]}
                  onColorChange={handleColorChange}
                />
                <ColorPicker
                  label="Chhat (Roof)"
                  part={ExteriorPart.ROOF}
                  color={colors[ExteriorPart.ROOF]}
                  onColorChange={handleColorChange}
                />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">3. Image Banayein</h2>
              <Button onClick={handleGenerate} disabled={isLoading || !originalImage}>
                {isLoading ? 'Painting Ho Rahi Hai...' : 'Shekh Jakir Se Color Karein'}
              </Button>
              {error && <p className="text-red-500 dark:text-red-400 mt-4">{error}</p>}
            </div>
          </div>

          {/* Image Display */}
          <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[60vh]">
            {isLoading && <Spinner />}
            {!isLoading && !originalImage && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-4 text-lg">Apne ghar ki photo upload karke shuru karein.</p>
                <p>Nayi image yahan dikhegi.</p>
              </div>
            )}
            {!isLoading && originalImage && (
              <div className="w-full">
                <ImagePreview
                  originalSrc={originalImage.base64}
                  generatedSrc={generatedImage}
                />
                {generatedImage && (
                   <div className="mt-6 flex justify-center">
                    <DownloadButton imageUrl={generatedImage} fileName="shekh_jakir_painter_result.png" />
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;