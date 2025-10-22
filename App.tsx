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
import { ColorPaletteModal } from './components/ColorPaletteModal';
import { DrawingModal } from './components/DrawingModal';
import { ReferenceUpload } from './components/ReferenceUpload';

type Theme = 'light' | 'dark';

const BrushIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ file: File; base64: string } | null>(null);
  const [referenceImage, setReferenceImage] = useState<{ file: File; base64: string } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorSelection>({
    [ExteriorPart.WALL]: '#f3f4f6',
    [ExteriorPart.FEATURE_WALL_1]: '#d1d5db',
    [ExteriorPart.FEATURE_WALL_2]: '#9ca3af',
    [ExteriorPart.DOOR]: '#374151',
    [ExteriorPart.WINDOW]: '#ffffff',
    [ExteriorPart.ROOF]: '#6b7280',
    [ExteriorPart.RAILING]: '#4b5563',
    [ExteriorPart.LEAVES]: '#22c55e',
  });
  const defaultEnabledParts = {
    [ExteriorPart.WALL]: true,
    [ExteriorPart.FEATURE_WALL_1]: true,
    [ExteriorPart.FEATURE_WALL_2]: true,
    [ExteriorPart.DOOR]: true,
    [ExteriorPart.WINDOW]: true,
    [ExteriorPart.ROOF]: true,
    [ExteriorPart.RAILING]: true,
    [ExteriorPart.LEAVES]: true,
  };
  const [enabledParts, setEnabledParts] = useState<Record<ExteriorPart, boolean>>(defaultEnabledParts);
  const [prompt, setPrompt] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('light');
  const [paletteOpenFor, setPaletteOpenFor] = useState<ExteriorPart | null>(null);
  const [addLogo, setAddLogo] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [maskData, setMaskData] = useState<string | null>(null);


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
    setReferenceImage(null);
    setMaskData(null);
    setError(null);
  };

  const handleReferenceImageUpload = (file: File, base64: string) => {
    setReferenceImage({ file, base64 });
  };

  const handleRemoveReferenceImage = () => {
    setReferenceImage(null);
  };

  const handleColorChange = (part: ExteriorPart, color: string) => {
    setColors(prevColors => ({ ...prevColors, [part]: color }));
  };

  const handleTogglePart = (part: ExteriorPart, isEnabled: boolean) => {
    setEnabledParts(prev => ({ ...prev, [part]: isEnabled }));
  };
  
  const handlePaletteSelect = (color: string) => {
    if (paletteOpenFor) {
      handleColorChange(paletteOpenFor, color);
    }
    setPaletteOpenFor(null);
  };

  const handleClearMask = () => {
    setMaskData(null);
    setEnabledParts(defaultEnabledParts);
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
      const activeColors: Partial<ColorSelection> = {};
      (Object.keys(colors) as ExteriorPart[]).forEach(part => {
        if (enabledParts[part]) {
          activeColors[part] = colors[part];
        }
      });
      
      const result = await applyColorsToHouse(
          originalImage.base64, 
          originalImage.file.type, 
          activeColors, 
          prompt, 
          addLogo, 
          maskData,
          referenceImage ? { base64: referenceImage.base64, mimeType: referenceImage.file.type } : null
      );
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
  }, [originalImage, colors, prompt, enabledParts, addLogo, maskData, referenceImage]);
  
  const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-50 bg-clip-text text-transparent">
        {children}
      </h2>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-purple-100 dark:from-gray-900 dark:to-indigo-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="p-4 md:p-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 rounded-2xl shadow-lg h-fit border border-gray-200/50 dark:border-gray-700/50">
            <Title>1. Photo Upload Karein</Title>
            <FileUpload onImageUpload={handleImageUpload} />

            <div className="mt-4">
              <button
                onClick={() => setIsDrawing(true)}
                disabled={!originalImage}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <BrushIcon />
                  Manual Selection (Draw Mask)
              </button>
              {maskData && (
                  <div className="mt-2 text-center text-sm text-green-600 dark:text-green-400">
                      <p>Manual mask applied. <button onClick={handleClearMask} className="underline font-semibold">Clear</button></p>
                  </div>
              )}
            </div>

            <div className="mt-8">
              <Title>2. Rang Chunein</Title>
              <div className="space-y-6">
                <ColorPicker
                  label="Deewar (Wall)"
                  part={ExteriorPart.WALL}
                  color={colors[ExteriorPart.WALL]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.WALL)}
                  isEnabled={enabledParts[ExteriorPart.WALL]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
                 <ColorPicker
                  label="Feature Wall 1"
                  part={ExteriorPart.FEATURE_WALL_1}
                  color={colors[ExteriorPart.FEATURE_WALL_1]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.FEATURE_WALL_1)}
                  isEnabled={enabledParts[ExteriorPart.FEATURE_WALL_1]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
                 <ColorPicker
                  label="Feature Wall 2"
                  part={ExteriorPart.FEATURE_WALL_2}
                  color={colors[ExteriorPart.FEATURE_WALL_2]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.FEATURE_WALL_2)}
                  isEnabled={enabledParts[ExteriorPart.FEATURE_WALL_2]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
                <ColorPicker
                  label="Darwaza (Door)"
                  part={ExteriorPart.DOOR}
                  color={colors[ExteriorPart.DOOR]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.DOOR)}
                  isEnabled={enabledParts[ExteriorPart.DOOR]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
                <ColorPicker
                  label="Khidki (Window)"
                  part={ExteriorPart.WINDOW}
                  color={colors[ExteriorPart.WINDOW]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.WINDOW)}
                  isEnabled={enabledParts[ExteriorPart.WINDOW]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
                <ColorPicker
                  label="Chhat (Roof)"
                  part={ExteriorPart.ROOF}
                  color={colors[ExteriorPart.ROOF]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.ROOF)}
                  isEnabled={enabledParts[ExteriorPart.ROOF]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
                <ColorPicker
                  label="Railing"
                  part={ExteriorPart.RAILING}
                  color={colors[ExteriorPart.RAILING]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.RAILING)}
                  isEnabled={enabledParts[ExteriorPart.RAILING]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
                <ColorPicker
                  label="Patte (Leaves)"
                  part={ExteriorPart.LEAVES}
                  color={colors[ExteriorPart.LEAVES]}
                  onColorChange={handleColorChange}
                  onPaletteOpen={() => setPaletteOpenFor(ExteriorPart.LEAVES)}
                  isEnabled={enabledParts[ExteriorPart.LEAVES]}
                  onToggle={handleTogglePart}
                  toggleable={true}
                />
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700/50 pt-6">
                <Title>Style Reference (Optional)</Title>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Doosre ghar ki photo upload karke style copy karein.
                </p>
                <ReferenceUpload
                    referenceImage={referenceImage}
                    onImageUpload={handleReferenceImageUpload}
                    onImageRemove={handleRemoveReferenceImage}
                    disabled={!originalImage}
                />
            </div>
            
            <div className="mt-8">
              <Title>Extra Jankari (Optional)</Title>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                rows={3}
                placeholder="Jaise: 'Deewar par texture add karein' ya 'Darwaze ko glossy finish dein'."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="mt-8">
              <Title>3. Image Banayein</Title>
               <div className="flex items-center justify-between bg-white/50 dark:bg-gray-700/50 p-3 rounded-lg mb-4">
                    <label htmlFor="add-logo-toggle" className="text-gray-600 dark:text-gray-300 font-medium">
                        JAKIR Logo Jodein
                    </label>
                    <button
                        type="button"
                        className={`${
                            addLogo ? 'bg-gradient-to-r from-teal-400 to-cyan-500' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-gray-800`}
                        role="switch"
                        aria-checked={addLogo}
                        onClick={() => setAddLogo(!addLogo)}
                    >
                        <span
                            className={`${
                                addLogo ? 'translate-x-6' : 'translate-x-1'
                            } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                        />
                    </button>
                </div>
              <Button onClick={handleGenerate} disabled={isLoading || !originalImage}>
                {isLoading ? 'Painting Ho Rahi Hai...' : 'Shekh Jakir Se Color Karein'}
              </Button>
              {error && <p className="text-red-500 dark:text-red-400 mt-4">{error}</p>}
            </div>
          </div>

          {/* Image Display */}
          <div className="lg:col-span-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[60vh] border border-gray-200/50 dark:border-gray-700/50">
            {isLoading && <Spinner />}
            {!isLoading && !originalImage && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-4 text-lg">Apne ghar ki photo yahan upload karein.</p>
                <p className="text-sm">Shekh Jakir Painter aapke ghar ko naya rang denge.</p>
              </div>
            )}
            {!isLoading && originalImage && (
              <ImagePreview
                originalSrc={originalImage.base64}
                originalMimeType={originalImage.file.type}
                generatedSrc={generatedImage}
              />
            )}
            {!isLoading && generatedImage && (
                <div className="mt-6">
                    <DownloadButton imageUrl={generatedImage} fileName="painted-house-shekh-jakir.png" />
                </div>
            )}
          </div>
        </div>
      </main>
      <ColorPaletteModal 
        isOpen={paletteOpenFor !== null}
        onClose={() => setPaletteOpenFor(null)}
        onSelectColor={handlePaletteSelect}
      />
      {originalImage && (
        <DrawingModal 
          isOpen={isDrawing}
          onClose={() => setIsDrawing(false)}
          onSave={(data, partsInMask) => {
              setMaskData(data);
              setIsDrawing(false);
              const allParts = Object.values(ExteriorPart);
              const newEnabledState = Object.fromEntries(
                  allParts.map(part => [part, partsInMask.includes(part)])
              ) as Record<ExteriorPart, boolean>;
              setEnabledParts(newEnabledState);
          }}
          originalImage={originalImage.base64}
          originalMimeType={originalImage.file.type}
        />
      )}
    </div>
  );
};

export default App;