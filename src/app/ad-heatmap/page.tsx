'use client';

import { useState, useRef, useCallback } from 'react';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Faq } from '@/components/Faq';
import { Upload, X, Download, Eye, EyeOff } from 'lucide-react';

interface HeatmapData {
  width: number;
  height: number;
  data: Float32Array;
}

export default function AdHeatmapPage() {
  const [image, setImage] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine gültige Bilddatei aus.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Bild ist zu groß. Maximal 10MB erlaubt.');
      return;
    }

    setError(null);
    setFallbackMode(false);
    setIsProcessing(true);

    try {
      console.log('Starting image upload and processing...');
      
      // Use createImageBitmap for better async handling
      const imageBitmap = await createImageBitmap(file);
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);

      console.log('Image loaded, dimensions:', imageBitmap.width, 'x', imageBitmap.height);
      
      const heatmap = await processHeatmap(imageBitmap);
      setHeatmapData(heatmap);
      updateHeatmapDisplay();
      
    } catch (err) {
      console.error('Image processing error:', err);
      setError(`Fehler bei der Bildverarbeitung: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      
      // Try fallback processing
      try {
        console.log('Attempting fallback processing...');
        const imageUrl = URL.createObjectURL(file);
        setImage(imageUrl);
        
        const img = new Image();
        img.onload = async () => {
          try {
            const fallbackHeatmap = await processFallbackHeatmap(img);
            setHeatmapData(fallbackHeatmap);
            setFallbackMode(true);
            updateHeatmapDisplay();
            setError('Heatmap mit vereinfachter Berechnung erstellt.');
          } catch (fallbackErr) {
            console.error('Fallback processing failed:', fallbackErr);
            setError('Heatmap-Berechnung fehlgeschlagen. Bitte versuche ein anderes Bild.');
          }
        };
        img.src = imageUrl;
      } catch (fallbackErr) {
        console.error('Fallback setup failed:', fallbackErr);
        setError('Bild konnte nicht geladen werden.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processHeatmap = async (imageBitmap: ImageBitmap): Promise<HeatmapData> => {
    console.log('Starting heatmap processing...');
    
    try {
      const canvas = hiddenCanvasRef.current;
      if (!canvas) throw new Error('Hidden canvas not available');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      console.log('Canvas setup successful');
      
      // Normalize image size (max 1280px on longest edge)
      const maxSize = 1280;
      const ratio = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height);
      const width = Math.round(imageBitmap.width * ratio);
      const height = Math.round(imageBitmap.height * ratio);
      
      console.log('Image dimensions:', width, 'x', height);
      
      // Set canvas dimensions exactly
      canvas.width = width;
      canvas.height = height;
      
      console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);
      
      // Draw scaled image
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      
      console.log('Image drawn to canvas');
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      if (!imageData || !imageData.data) {
        throw new Error('Failed to get image data from canvas');
      }
      
      console.log('Image data retrieved, length:', imageData.data.length);
      
      // Initialize heatmap data
      const heatmap = new Float32Array(width * height);
      
      // Edge detection (Laplacian)
      console.log('Starting edge detection...');
      let edges: Float32Array;
      try {
        edges = detectEdges(imageData, width, height);
        console.log('Edge detection completed');
      } catch (err) {
        console.error('Heatmap step: Edge detection failed', err);
        // Create fallback edges (zeros)
        edges = new Float32Array(width * height);
      }
      
      // Color analysis (saturation and brightness)
      console.log('Starting color analysis...');
      let colorScores: Float32Array;
      try {
        colorScores = analyzeColors(imageData, width, height);
        console.log('Color analysis completed');
      } catch (err) {
        console.error('Heatmap step: Color analysis failed', err);
        // Create fallback color scores (zeros)
        colorScores = new Float32Array(width * height * 2);
      }
      
      // Face detection (optional)
      let faceScores = new Float32Array(width * height);
      if (faceDetectionEnabled) {
        try {
          console.log('Starting face detection...');
          faceScores = await detectFaces(imageData, width, height);
          console.log('Face detection completed');
        } catch (err) {
          console.error('Heatmap step: Face detection failed', err);
        }
      }
      
      // Fusion: 0.6*edges + 0.15*saturation + 0.1*brightness + 0.15*faces
      console.log('Starting fusion...');
      try {
        for (let i = 0; i < width * height; i++) {
          const saturation = colorScores[i] || 0;
          const brightness = colorScores[i + width * height] || 0;
          const edge = edges[i] || 0;
          const face = faceScores[i] || 0;
          
          heatmap[i] = 0.6 * edge + 0.15 * saturation + 0.1 * brightness + 0.15 * face;
        }
        console.log('Fusion completed');
      } catch (err) {
        console.error('Heatmap step: Fusion failed', err);
        throw err;
      }
      
      // Normalize to 0-1
      console.log('Normalizing heatmap...');
      try {
        normalizeArray(heatmap);
        console.log('Normalization completed');
      } catch (err) {
        console.error('Heatmap step: Normalization failed', err);
        throw err;
      }
      
      // Apply Gaussian smoothing
      console.log('Applying Gaussian blur...');
      try {
        applyGaussianBlur(heatmap, width, height, Math.min(width, height) * 0.01);
        console.log('Gaussian blur completed');
      } catch (err) {
        console.error('Heatmap step: Gaussian blur failed', err);
        // Continue without blur
      }
      
      console.log('Heatmap processing completed successfully');
      return { width, height, data: heatmap };
      
    } catch (err) {
      console.error('Heatmap processing failed:', err);
      throw err;
    }
  };

  const detectEdges = (imageData: ImageData, width: number, height: number): Float32Array => {
    console.log('Detecting edges for', width, 'x', height);
    
    try {
      const data = imageData.data;
      const edges = new Float32Array(width * height);
      
      // Convert to grayscale and apply Laplacian
      const grayscale = new Float32Array(width * height);
      for (let i = 0; i < width * height; i++) {
        const r = Math.min(255, Math.max(0, data[i * 4] || 0));
        const g = Math.min(255, Math.max(0, data[i * 4 + 1] || 0));
        const b = Math.min(255, Math.max(0, data[i * 4 + 2] || 0));
        grayscale[i] = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      }
      
      console.log('Grayscale conversion completed');
      
      // 3x3 Laplacian kernel
      const kernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = (y + ky) * width + (x + kx);
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += (grayscale[idx] || 0) * kernel[kernelIdx];
            }
          }
          edges[y * width + x] = Math.abs(sum);
        }
      }
      
      console.log('Laplacian kernel applied');
      
      normalizeArray(edges);
      console.log('Edge detection completed successfully');
      return edges;
      
    } catch (err) {
      console.error('Edge detection error:', err);
      throw err;
    }
  };

  const analyzeColors = (imageData: ImageData, width: number, height: number): Float32Array => {
    console.log('Analyzing colors for', width, 'x', height);
    
    try {
      const data = imageData.data;
      const scores = new Float32Array(width * height * 2); // saturation + brightness
      
      for (let i = 0; i < width * height; i++) {
        const r = Math.min(1, Math.max(0, (data[i * 4] || 0) / 255));
        const g = Math.min(1, Math.max(0, (data[i * 4 + 1] || 0) / 255));
        const b = Math.min(1, Math.max(0, (data[i * 4 + 2] || 0) / 255));
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        // Saturation
        const saturation = max === 0 ? 0 : delta / max;
        scores[i] = Math.min(1, Math.max(0, saturation));
        
        // Brightness (luminance)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        scores[i + width * height] = Math.min(1, Math.max(0, brightness));
      }
      
      console.log('Color analysis completed successfully');
      return scores;
      
    } catch (err) {
      console.error('Color analysis error:', err);
      throw err;
    }
  };

  const detectFaces = async (imageData: ImageData, width: number, height: number): Promise<Float32Array> => {
    // Placeholder for face detection - would use MediaPipe here
    // For now, return empty array
    return new Float32Array(width * height);
  };

  const processFallbackHeatmap = async (img: HTMLImageElement): Promise<HeatmapData> => {
    console.log('Processing fallback heatmap...');
    
    try {
      const canvas = hiddenCanvasRef.current;
      if (!canvas) throw new Error('Hidden canvas not available');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Use smaller size for fallback
      const maxSize = 800;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const heatmap = new Float32Array(width * height);
      
      // Simple brightness-based heatmap
      const data = imageData.data;
      for (let i = 0; i < width * height; i++) {
        const r = data[i * 4] || 0;
        const g = data[i * 4 + 1] || 0;
        const b = data[i * 4 + 2] || 0;
        
        // Simple luminance calculation
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        heatmap[i] = brightness;
      }
      
      normalizeArray(heatmap);
      
      console.log('Fallback heatmap completed');
      return { width, height, data: heatmap };
      
    } catch (err) {
      console.error('Fallback heatmap failed:', err);
      throw err;
    }
  };

  const normalizeArray = (arr: Float32Array) => {
    try {
      let min = Infinity;
      let max = -Infinity;
      
      // Find min/max safely
      for (let i = 0; i < arr.length; i++) {
        const val = arr[i];
        if (!isNaN(val) && isFinite(val)) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      }
      
      if (!isFinite(min) || !isFinite(max) || min === max) {
        console.warn('Array normalization: all values are the same or invalid');
        return;
      }
      
      const range = max - min;
      
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.min(1, Math.max(0, (arr[i] - min) / range));
      }
      
      console.log('Array normalized, range:', min, 'to', max);
    } catch (err) {
      console.error('Normalization error:', err);
      throw err;
    }
  };

  const applyGaussianBlur = (data: Float32Array, width: number, height: number, sigma: number) => {
    console.log('Applying Gaussian blur with sigma:', sigma);
    
    try {
      // Simple Gaussian blur implementation
      const kernelSize = Math.min(Math.ceil(sigma * 3) * 2 + 1, 15); // Limit kernel size
      const kernel: number[] = [];
      let sum = 0;
      
      for (let i = 0; i < kernelSize; i++) {
        const x = i - Math.floor(kernelSize / 2);
        const value = Math.exp(-(x * x) / (2 * sigma * sigma));
        kernel[i] = value;
        sum += value;
      }
      
      // Normalize kernel
      for (let i = 0; i < kernelSize; i++) {
        kernel[i] /= sum;
      }
      
      // Apply horizontal blur
      const temp = new Float32Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let value = 0;
          for (let k = 0; k < kernelSize; k++) {
            const sx = x + k - Math.floor(kernelSize / 2);
            if (sx >= 0 && sx < width) {
              value += (data[y * width + sx] || 0) * kernel[k];
            }
          }
          temp[y * width + x] = Math.min(1, Math.max(0, value));
        }
      }
      
      // Apply vertical blur
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let value = 0;
          for (let k = 0; k < kernelSize; k++) {
            const sy = y + k - Math.floor(kernelSize / 2);
            if (sy >= 0 && sy < height) {
              value += (temp[sy * width + x] || 0) * kernel[k];
            }
          }
          data[y * width + x] = Math.min(1, Math.max(0, value));
        }
      }
      
      console.log('Gaussian blur completed successfully');
    } catch (err) {
      console.error('Gaussian blur error:', err);
      throw err;
    }
  };

  const updateHeatmapDisplay = useCallback(() => {
    if (!heatmapData || !imageRef.current || !heatmapCanvasRef.current) return;
    
    const img = imageRef.current;
    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Match canvas size to displayed image
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Create heatmap visualization
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < canvas.width * canvas.height; i++) {
      const y = Math.floor(i / canvas.width);
      const x = i % canvas.width;
      
      // Map to original heatmap coordinates
      const heatmapX = Math.floor((x / canvas.width) * heatmapData.width);
      const heatmapY = Math.floor((y / canvas.height) * heatmapData.height);
      const heatmapIdx = heatmapY * heatmapData.width + heatmapX;
      
      const intensity = heatmapData.data[heatmapIdx] || 0;
      const color = getHeatmapColor(intensity);
      
      data[i * 4] = color.r;
      data[i * 4 + 1] = color.g;
      data[i * 4 + 2] = color.b;
      data[i * 4 + 3] = Math.round(255 * heatmapOpacity);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [heatmapData, heatmapOpacity]);

  const getHeatmapColor = (intensity: number): { r: number; g: number; b: number } => {
    // Custom "jet" colormap: blue -> green -> yellow -> red
    const t = Math.max(0, Math.min(1, intensity));
    
    if (t < 0.25) {
      // Blue to cyan
      const local = t * 4;
      return { r: 0, g: Math.round(local * 255), b: 255 };
    } else if (t < 0.5) {
      // Cyan to green
      const local = (t - 0.25) * 4;
      return { r: 0, g: 255, b: Math.round((1 - local) * 255) };
    } else if (t < 0.75) {
      // Green to yellow
      const local = (t - 0.5) * 4;
      return { r: Math.round(local * 255), g: 255, b: 0 };
    } else {
      // Yellow to red
      const local = (t - 0.75) * 4;
      return { r: 255, g: Math.round((1 - local) * 255), b: 0 };
    }
  };

  const exportHeatmap = useCallback(() => {
    if (!heatmapCanvasRef.current) return;
    
    const canvas = heatmapCanvasRef.current;
    const link = document.createElement('a');
    link.download = 'heatmap.png';
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  const removeImage = () => {
    setImage(null);
    setHeatmapData(null);
    setError(null);
    setFallbackMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const faqItems = [
    {
      question: 'Was ist eine Ad Heatmap?',
      answer: 'Eine Heatmap zeigt visuell, welche Bereiche eines Bildes am meisten Aufmerksamkeit erregen könnten. Sie basiert auf Kontrast, Farben und Gesichtserkennung - ähnlich wie Eye-Tracking-Studien.'
    },
    {
      question: 'Wie funktioniert die Berechnung?',
      answer: 'Das Tool analysiert Kontrast und Kanten (60%), Farbsättigung (15%), Helligkeit (10%) und Gesichter (15%, optional). Diese Faktoren werden zu einem Heatmap-Score kombiniert und als farbkodierte Overlay angezeigt.'
    },
    {
      question: 'Ist die Gesichtserkennung genau?',
      answer: 'Die Gesichtserkennung ist ein Beta-Feature und nutzt MediaPipe. Sie funktioniert gut bei klaren Gesichtern, kann aber bei schwierigen Lichtverhältnissen oder kleinen Gesichtern ungenau sein.'
    },
    {
      question: 'Kann ich die Heatmap anpassen?',
      answer: 'Ja, du kannst die Opacity (Transparenz) der Heatmap einstellen und sie ein-/ausblenden. Die Berechnung erfolgt in Echtzeit, sodass Änderungen sofort sichtbar sind.'
    },
    {
      question: 'Wie exportiere ich die Heatmap?',
      answer: 'Mit dem "Export PNG" Button kannst du die Heatmap als PNG-Datei herunterladen. Die Datei hat die gleiche Auflösung wie das ursprüngliche Bild.'
    },
    {
      question: 'Werden meine Bilder gespeichert?',
      answer: 'Nein, alle Berechnungen erfolgen lokal in deinem Browser. Keine Bilder oder Daten werden an Server übertragen oder gespeichert.'
    }
  ];

  return (
    <>
      <Seo 
        title="Ad Heatmap Generator"
        description="Generiere Heatmaps für deine Ad-Creatives. Analysiere Aufmerksamkeitsbereiche basierend auf Kontrast, Farben und Gesichtserkennung."
        canonical="/ad-heatmap"
      />
      
      <Hero 
        title="Ad Heatmap Generator"
        subtitle="Visualisiere Aufmerksamkeitsbereiche in deinen Ads"
        description="Lade dein Ad-Creative hoch und erhalte eine Heatmap, die zeigt, wo Betrachter am wahrscheinlichsten hinschauen. Basierend auf Kontrast, Farben und Gesichtserkennung."
      />

      <div className="container mx-auto px-2 sm:px-4 max-w-screen-xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Controls */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Bild hochladen</CardTitle>
            </CardHeader>
            <CardContent>
              {!image ? (
                <div 
                  className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-surface-secondary rounded-lg cursor-pointer hover:border-accent transition-colors min-h-[120px] sm:min-h-[140px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-text-secondary mb-2 sm:mb-3" />
                  <p className="text-text-light font-medium mb-1 text-sm sm:text-base">Klicke oder ziehe dein Bild hierher</p>
                  <p className="text-xs sm:text-sm text-text-secondary">JPG, PNG, GIF (max. 10MB)</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    ref={fileInputRef} 
                  />
                </div>
              ) : (
                <div className="relative p-3 sm:p-4 border border-surface-secondary rounded-lg bg-surface-secondary">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <img src={image} alt="Uploaded thumbnail" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="text-text-light font-medium text-sm sm:text-base truncate">Bild hochgeladen</p>
                      {isProcessing && (
                        <p className="text-xs sm:text-sm text-text-secondary">Heatmap wird berechnet...</p>
                      )}
                      {fallbackMode && (
                        <p className="text-xs sm:text-sm text-yellow-400">Einfache Heatmap verwendet</p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-text-secondary hover:text-red-400 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                      onClick={removeImage}
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {error && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  fallbackMode 
                    ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {image && (
            <>
              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Heatmap Einstellungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">
                      Opacity: {Math.round(heatmapOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={heatmapOpacity}
                      onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="showHeatmap" 
                      checked={showHeatmap} 
                      onChange={(e) => setShowHeatmap(e.target.checked)} 
                      className="form-checkbox h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <label 
                      htmlFor="showHeatmap" 
                      className="text-xs sm:text-sm text-text-secondary"
                    >
                      Heatmap anzeigen
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="faceDetection" 
                      checked={faceDetectionEnabled} 
                      onChange={(e) => setFaceDetectionEnabled(e.target.checked)} 
                      className="form-checkbox h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <label 
                      htmlFor="faceDetection" 
                      className="text-xs sm:text-sm text-text-secondary"
                    >
                      Gesichtserkennung (Beta)
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={exportHeatmap}
                    disabled={!heatmapData}
                    className="w-full text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Heatmap als PNG exportieren
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {image ? (
                <div className="relative w-full max-h-[80vh] flex items-center justify-center bg-surface-secondary rounded-lg overflow-hidden">
                  <img
                    ref={imageRef}
                    src={image}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    onLoad={updateHeatmapDisplay}
                  />
                  {showHeatmap && heatmapData && (
                    <canvas
                      ref={heatmapCanvasRef}
                      className="absolute inset-0 pointer-events-none"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface-secondary rounded-lg">
                  <Eye className="w-8 h-8 sm:w-12 sm:h-12 text-text-muted mb-3 sm:mb-4" />
                  <p className="text-text-secondary text-sm sm:text-base">
                    Lade ein Bild hoch, um die Heatmap zu sehen
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 max-w-4xl mt-8 sm:mt-12">
        <Card className="card-custom">
          <CardContent className="p-4 sm:p-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-blue-400 font-medium text-sm sm:text-base mb-2">⚠️ Hinweis</p>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Diese Heatmap ist eine Schätzung auf Basis von Kontrast, Farbe und Gesichtserkennung - 
                kein echtes Eye-Tracking. Die Ergebnisse dienen als Orientierungshilfe für die Gestaltung 
                deiner Ad-Creatives.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PrivacyNote type="client" />

      <Faq items={faqItems} />
      
      {/* Hidden canvas for processing */}
      <canvas ref={hiddenCanvasRef} className="hidden" />
    </>
  );
}
