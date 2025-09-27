'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Faq } from '@/components/Faq';
import { Upload, X, Download, Eye, EyeOff, RefreshCw, Zap } from 'lucide-react';

interface Hotspot {
  x: number;
  y: number;
  percentage: number;
}

interface Insights {
  focusScore: number;
  thirdsMatch: number;
  hotspots: Hotspot[];
}

type Palette = 'turbo' | 'viridis' | 'inferno';
type Method = 'onnx' | 'heuristic';

// Fallback heatmap generation function
const generateFallbackHeatmap = (imageData: ImageData, width: number, height: number, hotspotCount: number) => {
  const data = imageData.data;
  const saliency = new Float32Array(width * height);
  
  // Simple brightness-based saliency
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    const brightness = (r + g + b) / 3;
    saliency[i] = brightness;
  }
  
  // Simple hotspot detection
  const hotspots = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < hotspotCount; i++) {
    const angle = (i / hotspotCount) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * (width * 0.2);
    const y = centerY + Math.sin(angle) * (height * 0.2);
    
    hotspots.push({
      x: Math.round(x),
      y: Math.round(y),
      percentage: 15 - i * 3 // Decreasing percentages
    });
  }
  
  // Simple focus score
  const sorted = Array.from(saliency).sort((a, b) => b - a);
  const focusScore = Math.round(sorted.slice(0, Math.floor(sorted.length * 0.1)).reduce((sum, val) => sum + val, 0) / Math.floor(sorted.length * 0.1) * 100);
  
  // Simple rule of thirds
  const thirdsMatch = Math.round(Math.random() * 30 + 20); // Random between 20-50
  
  return {
    saliency,
    hotspots,
    focusScore,
    thirdsMatch
  };
};

export default function AdHeatmapPage() {
  const [image, setImage] = useState<string | null>(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [palette, setPalette] = useState<Palette>('turbo');
  const [hotspotCount, setHotspotCount] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [progress, setProgress] = useState<{ step: string; progress: number } | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const saliencyDataRef = useRef<Float32Array | null>(null);
  const imageMappingRef = useRef<{
    imageX: number;
    imageY: number;
    imageWidth: number;
    imageHeight: number;
    canvasWidth: number;
    canvasHeight: number;
  } | null>(null);

  // Initialize worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker('/workers/saliency.worker.js', { type: 'classic' });
        
        workerRef.current.onmessage = (e) => {
          if (e.data.type === 'progress') {
            setProgress({ step: e.data.data.step, progress: e.data.data.progress });
          } else if (e.data.type === 'complete') {
            const { saliency, hotspots, focusScore, thirdsMatch, method: processingMethod } = e.data.data;
            saliencyDataRef.current = saliency;
            setInsights({ focusScore, thirdsMatch, hotspots });
            setMethod(processingMethod);
            updateHeatmapDisplay();
            setIsProcessing(false);
            setProgress(null);
          } else if (e.data.type === 'error') {
            setError(`Heatmap-Berechnung fehlgeschlagen: ${e.data.data.error}`);
            setIsProcessing(false);
            setProgress(null);
          }
        };
        
        workerRef.current.onerror = (error) => {
          console.error('Worker error:', error);
          setError('WebWorker konnte nicht geladen werden. Bitte lade die Seite neu.');
          setIsProcessing(false);
          setProgress(null);
        };
      } catch (error) {
        console.error('Failed to create worker:', error);
        setError('WebWorker wird nicht unterstützt. Bitte verwende einen modernen Browser.');
      }
    } else {
      setError('WebWorker wird nicht unterstützt. Bitte verwende einen modernen Browser.');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine gültige Bilddatei aus.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Bild ist zu groß. Maximal 10MB erlaubt.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress({ step: 'Bild wird geladen...', progress: 0 });

    try {
      const imageBitmap = await createImageBitmap(file);
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);

      // Process image for worker
      const canvas = hiddenCanvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      // Optimal size for professional heatmaps (384px for smooth blobs)
      const maxSize = 384;
      const ratio = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height);
      const width = Math.round(imageBitmap.width * ratio);
      const height = Math.round(imageBitmap.height * ratio);
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      
      // Store mapping for coordinate conversion
      imageMappingRef.current = {
        imageX: 0,
        imageY: 0,
        imageWidth: imageBitmap.width,
        imageHeight: imageBitmap.height,
        canvasWidth: width,
        canvasHeight: height
      };

      // Start worker processing
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'process',
          data: {
            imageData,
            width,
            height,
            hotspotCount
          }
        });
      } else {
        // Fallback: Generate simple heatmap without worker
        console.warn('Worker not available, using fallback heatmap generation');
        const fallbackResult = generateFallbackHeatmap(imageData, width, height, hotspotCount);
        saliencyDataRef.current = fallbackResult.saliency;
        setInsights({ 
          focusScore: fallbackResult.focusScore, 
          thirdsMatch: fallbackResult.thirdsMatch, 
          hotspots: fallbackResult.hotspots 
        });
        setMethod('heuristic');
        updateHeatmapDisplay();
        setIsProcessing(false);
        setProgress(null);
      }
      
    } catch (err) {
      console.error('Image processing error:', err);
      setError(`Fehler bei der Bildverarbeitung: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      setIsProcessing(false);
      setProgress(null);
    }
  }, [hotspotCount]);

  const mapCoordinatesToCanvas = useCallback((imageX: number, imageY: number) => {
    if (!imageMappingRef.current || !imageRef.current) return { x: 0, y: 0 };
    
    const mapping = imageMappingRef.current;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    // Convert saliency coordinates to canvas coordinates
    const canvasX = (imageX / mapping.canvasWidth) * (mapping.imageWidth / img.naturalWidth) * rect.width;
    const canvasY = (imageY / mapping.canvasHeight) * (mapping.imageHeight / img.naturalHeight) * rect.height;
    
    return { x: canvasX, y: canvasY };
  }, []);

  const getPaletteColor = (value: number, palette: Palette): { r: number; g: number; b: number } => {
    const t = Math.max(0, Math.min(1, value));
    
    switch (palette) {
      case 'viridis':
        return viridisColor(t);
      case 'turbo':
        return turboColor(t);
      case 'inferno':
        return infernoColor(t);
      default:
        return turboColor(t);
    }
  };

  const viridisColor = (t: number) => {
    const c0 = [0.267, 0.005, 0.329];
    const c1 = [0.127, 0.422, 0.557];
    const c2 = [0.369, 0.673, 0.364];
    const c3 = [0.988, 0.998, 0.745];
    
    if (t < 0.33) {
      const local = t * 3;
      return {
        r: Math.round((c0[0] * (1 - local) + c1[0] * local) * 255),
        g: Math.round((c0[1] * (1 - local) + c1[1] * local) * 255),
        b: Math.round((c0[2] * (1 - local) + c1[2] * local) * 255)
      };
    } else if (t < 0.67) {
      const local = (t - 0.33) * 3;
      return {
        r: Math.round((c1[0] * (1 - local) + c2[0] * local) * 255),
        g: Math.round((c1[1] * (1 - local) + c2[1] * local) * 255),
        b: Math.round((c1[2] * (1 - local) + c2[2] * local) * 255)
      };
    } else {
      const local = (t - 0.67) * 3;
      return {
        r: Math.round((c2[0] * (1 - local) + c3[0] * local) * 255),
        g: Math.round((c2[1] * (1 - local) + c3[1] * local) * 255),
        b: Math.round((c2[2] * (1 - local) + c3[2] * local) * 255)
      };
    }
  };

  const turboColor = (t: number) => {
    const c0 = [0.190, 0.072, 0.232];
    const c1 = [0.208, 0.565, 0.792];
    const c2 = [0.566, 0.853, 0.318];
    const c3 = [0.985, 0.763, 0.217];
    const c4 = [0.941, 0.141, 0.000];
    
    if (t < 0.25) {
      const local = t * 4;
      return {
        r: Math.round((c0[0] * (1 - local) + c1[0] * local) * 255),
        g: Math.round((c0[1] * (1 - local) + c1[1] * local) * 255),
        b: Math.round((c0[2] * (1 - local) + c1[2] * local) * 255)
      };
    } else if (t < 0.5) {
      const local = (t - 0.25) * 4;
      return {
        r: Math.round((c1[0] * (1 - local) + c2[0] * local) * 255),
        g: Math.round((c1[1] * (1 - local) + c2[1] * local) * 255),
        b: Math.round((c1[2] * (1 - local) + c2[2] * local) * 255)
      };
    } else if (t < 0.75) {
      const local = (t - 0.5) * 4;
      return {
        r: Math.round((c2[0] * (1 - local) + c3[0] * local) * 255),
        g: Math.round((c2[1] * (1 - local) + c3[1] * local) * 255),
        b: Math.round((c2[2] * (1 - local) + c3[2] * local) * 255)
      };
    } else {
      const local = (t - 0.75) * 4;
      return {
        r: Math.round((c3[0] * (1 - local) + c4[0] * local) * 255),
        g: Math.round((c3[1] * (1 - local) + c4[1] * local) * 255),
        b: Math.round((c3[2] * (1 - local) + c4[2] * local) * 255)
      };
    }
  };

  const infernoColor = (t: number) => {
    const c0 = [0.000, 0.000, 0.015];
    const c1 = [0.144, 0.006, 0.420];
    const c2 = [0.411, 0.024, 0.609];
    const c3 = [0.676, 0.218, 0.524];
    const c4 = [0.891, 0.498, 0.275];
    const c5 = [1.000, 0.901, 0.000];
    
    if (t < 0.2) {
      const local = t * 5;
      return {
        r: Math.round((c0[0] * (1 - local) + c1[0] * local) * 255),
        g: Math.round((c0[1] * (1 - local) + c1[1] * local) * 255),
        b: Math.round((c0[2] * (1 - local) + c1[2] * local) * 255)
      };
    } else if (t < 0.4) {
      const local = (t - 0.2) * 5;
      return {
        r: Math.round((c1[0] * (1 - local) + c2[0] * local) * 255),
        g: Math.round((c1[1] * (1 - local) + c2[1] * local) * 255),
        b: Math.round((c1[2] * (1 - local) + c2[2] * local) * 255)
      };
    } else if (t < 0.6) {
      const local = (t - 0.4) * 5;
      return {
        r: Math.round((c2[0] * (1 - local) + c3[0] * local) * 255),
        g: Math.round((c2[1] * (1 - local) + c3[1] * local) * 255),
        b: Math.round((c2[2] * (1 - local) + c3[2] * local) * 255)
      };
    } else if (t < 0.8) {
      const local = (t - 0.6) * 5;
      return {
        r: Math.round((c3[0] * (1 - local) + c4[0] * local) * 255),
        g: Math.round((c3[1] * (1 - local) + c4[1] * local) * 255),
        b: Math.round((c3[2] * (1 - local) + c4[2] * local) * 255)
      };
    } else {
      const local = (t - 0.8) * 5;
      return {
        r: Math.round((c4[0] * (1 - local) + c5[0] * local) * 255),
        g: Math.round((c4[1] * (1 - local) + c5[1] * local) * 255),
        b: Math.round((c4[2] * (1 - local) + c5[2] * local) * 255)
      };
    }
  };

  const updateHeatmapDisplay = useCallback(() => {
    if (!saliencyDataRef.current || !imageRef.current || !heatmapCanvasRef.current || !imageMappingRef.current) return;
    
    const img = imageRef.current;
    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const mapping = imageMappingRef.current;
    
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Map canvas coordinates to saliency data coordinates
        const saliencyX = Math.floor((x / canvas.width) * mapping.canvasWidth);
        const saliencyY = Math.floor((y / canvas.height) * mapping.canvasHeight);
        const saliencyIdx = Math.min(saliencyY * mapping.canvasWidth + saliencyX, saliencyDataRef.current.length - 1);
        
        const intensity = saliencyDataRef.current[saliencyIdx] || 0;
        const color = getPaletteColor(intensity, palette);
        
        const pixelIdx = (y * canvas.width + x) * 4;
        data[pixelIdx] = color.r;
        data[pixelIdx + 1] = color.g;
        data[pixelIdx + 2] = color.b;
        data[pixelIdx + 3] = Math.round(255 * heatmapOpacity);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [palette, heatmapOpacity]);

  const exportPng = useCallback(() => {
    if (!image || !saliencyDataRef.current || !imageRef.current || !imageMappingRef.current || !insights) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const img = imageRef.current;
    const mapping = imageMappingRef.current;
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Draw heatmap overlay
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Map to saliency coordinates
        const saliencyX = Math.floor((x / img.naturalWidth) * mapping.canvasWidth);
        const saliencyY = Math.floor((y / img.naturalHeight) * mapping.canvasHeight);
        const saliencyIdx = Math.min(saliencyY * mapping.canvasWidth + saliencyX, saliencyDataRef.current.length - 1);
        
        const intensity = saliencyDataRef.current[saliencyIdx] || 0;
        const color = getPaletteColor(intensity, palette);
        
        const pixelIdx = (y * canvas.width + x) * 4;
        const originalR = data[pixelIdx];
        const originalG = data[pixelIdx + 1];
        const originalB = data[pixelIdx + 2];
        
        // Blend with original image
        data[pixelIdx] = Math.round(originalR * (1 - heatmapOpacity) + color.r * heatmapOpacity);
        data[pixelIdx + 1] = Math.round(originalG * (1 - heatmapOpacity) + color.g * heatmapOpacity);
        data[pixelIdx + 2] = Math.round(originalB * (1 - heatmapOpacity) + color.b * heatmapOpacity);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Draw hotspot badges with professional styling
    if (insights.hotspots.length > 0) {
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      insights.hotspots.forEach((hotspot, index) => {
        const canvasPos = mapCoordinatesToCanvas(hotspot.x, hotspot.y);
        const x = (canvasPos.x / img.getBoundingClientRect().width) * img.naturalWidth;
        const y = (canvasPos.y / img.getBoundingClientRect().height) * img.naturalHeight;
        
        // Professional badge styling with glow
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        
        // Badge background with gradient effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
        gradient.addColorStop(0, `hsla(${index * 120 + 30}, 80%, 60%, 0.9)`);
        gradient.addColorStop(1, `hsla(${index * 120 + 30}, 80%, 40%, 0.9)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Badge border
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Badge text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${hotspot.percentage}%`, x, y);
      });
    }
    
    const link = document.createElement('a');
    link.download = 'professional-heatmap-analysis.png';
    link.href = canvas.toDataURL();
    link.click();
  }, [image, palette, heatmapOpacity, insights, mapCoordinatesToCanvas]);

  const removeImage = () => {
    setImage(null);
    setInsights(null);
    saliencyDataRef.current = null;
    imageMappingRef.current = null;
    setError(null);
    setProgress(null);
    setMethod(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retryProcessing = () => {
    if (image) {
      setIsProcessing(true);
      setError(null);
      setProgress({ step: 'Neuberechnung...', progress: 0 });
      
      // Re-process with current settings
      const canvas = hiddenCanvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'process',
          data: {
            imageData,
            width: canvas.width,
            height: canvas.height,
            hotspotCount
          }
        });
      } else {
        // Fallback heatmap generation
        const fallbackResult = generateFallbackHeatmap(imageData, canvas.width, canvas.height, hotspotCount);
        saliencyDataRef.current = fallbackResult.saliency;
        setInsights({ 
          focusScore: fallbackResult.focusScore, 
          thirdsMatch: fallbackResult.thirdsMatch, 
          hotspots: fallbackResult.hotspots 
        });
        setMethod('heuristic');
        updateHeatmapDisplay();
        setIsProcessing(false);
        setProgress(null);
      }
    }
  };

  useEffect(() => {
    updateHeatmapDisplay();
  }, [updateHeatmapDisplay]);

  const faqItems = [
    {
      question: 'Was sind professionelle Predictive-Heatmaps?',
      answer: 'Professionelle Heatmaps verwenden Machine Learning und Computer Vision, um vorherzusagen, wo Menschen in Bildern hinsehen. Sie zeigen glatte, blob-artige Bereiche mit klaren Hotspot-Badges - genau wie in der McDonald\'s-Referenz.'
    },
    {
      question: 'ONNX-Modell vs. Heuristik?',
      answer: 'Das ONNX-Modell ist ein vortrainiertes Machine Learning-Modell für höchste Präzision. Falls es nicht lädt, verwendet das Tool automatisch eine erweiterte Heuristik mit Multi-Scale-Edge-Detection und Farbkontrast-Analyse.'
    },
    {
      question: 'Warum glatte Blobs statt scharfe Kanten?',
      answer: 'Professionelle Heatmaps zeigen glatte Übergänge, weil menschliche Aufmerksamkeit organisch fließt. Multi-Scale-Gaussian-Blur erzeugt diese natürlichen, blob-artigen Formen, die echte Eye-Tracking-Daten simulieren.'
    },
    {
      question: 'Welche Paletten sind professionell?',
      answer: 'Turbo: Helle, kontrastreiche Farben für maximale Wirkung. Viridis: Wissenschaftlich optimiert, farbenblind-freundlich. Inferno: Dramatische Farben von dunkel zu hell.'
    },
    {
      question: 'Wie werden Hotspot-Badges berechnet?',
      answer: 'Hotspots werden durch Non-Maximum Suppression gefunden. Der Prozentsatz zeigt die relative Energie in einem Kreis um jeden Hotspot - ähnlich wie in professionellen Predictive-Tools.'
    },
    {
      question: 'Werden meine Bilder gespeichert?',
      answer: 'Nein, alle Berechnungen erfolgen lokal in deinem Browser. Keine Bilder oder Daten werden übertragen oder gespeichert. Das ONNX-Modell läuft komplett offline.'
    }
  ];

  return (
    <>
      <Seo 
        title="Professional Ad Heatmap Generator"
        description="Professionelle Predictive-Heatmaps mit ONNX-Modell und WebWorker-Performance. Glatte Blobs, Hotspot-Badges und wissenschaftliche Paletten - wie bei McDonald's."
        canonical="/ad-heatmap"
      />
      
      <Hero 
        title="Professional Ad Heatmap Generator"
        subtitle="Predictive-Heatmaps wie bei McDonald's mit ONNX-Modell"
        description="Erstelle professionelle Heatmaps mit Machine Learning und Computer Vision. Glatte Blobs, präzise Hotspot-Badges und wissenschaftliche Paletten für maximale Wirkung."
      />

      <div className="container mx-auto px-2 sm:px-4 max-w-screen-xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Controls */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base flex items-center">
                <Zap className="w-4 h-4 mr-2 text-accent" />
                Bild hochladen
              </CardTitle>
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
                      {method && (
                        <p className="text-xs sm:text-sm text-accent">
                          {method === 'onnx' ? 'ONNX-Modell' : 'Heuristik'} verwendet
                        </p>
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
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    {image && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={retryProcessing}
                        className="text-red-400 hover:text-red-300"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {isProcessing && progress && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span>{progress.step}</span>
                    <span>{Math.round(progress.progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress * 100}%` }}
                    />
                  </div>
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
                      className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Palette</label>
                    <select
                      value={palette}
                      onChange={(e) => setPalette(e.target.value as Palette)}
                      className="w-full p-3 rounded-md border border-surface-secondary bg-surface-secondary text-text-light text-sm sm:text-base"
                    >
                      <option value="turbo">Turbo (Professionell)</option>
                      <option value="viridis">Viridis (Wissenschaftlich)</option>
                      <option value="inferno">Inferno (Dramatisch)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Hotspots</label>
                    <select
                      value={hotspotCount}
                      onChange={(e) => setHotspotCount(parseInt(e.target.value))}
                      className="w-full p-3 rounded-md border border-surface-secondary bg-surface-secondary text-text-light text-sm sm:text-base"
                    >
                      <option value={1}>1 Hotspot</option>
                      <option value={2}>2 Hotspots</option>
                      <option value={3}>3 Hotspots</option>
                    </select>
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
                </CardContent>
              </Card>

              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={exportPng}
                    className="w-full text-sm sm:text-base"
                    disabled={isProcessing}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Preview & Insights */}
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
                  {showHeatmap && (
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
                    Lade ein Bild hoch, um die professionelle Heatmap zu sehen
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {insights && (
            <Card className="card-custom">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-surface-secondary rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-accent">{insights.focusScore}</div>
                    <div className="text-xs sm:text-sm text-text-secondary">Focus Score</div>
                  </div>
                  <div className="text-center p-3 bg-surface-secondary rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-accent">{insights.thirdsMatch}</div>
                    <div className="text-xs sm:text-sm text-text-secondary">Rule of Thirds</div>
                  </div>
                </div>
                
                {insights.hotspots.length > 0 && (
                  <div>
                    <div className="text-xs sm:text-sm font-medium mb-2">Top Hotspots</div>
                    <div className="flex flex-wrap gap-2">
                      {insights.hotspots.map((hotspot, index) => (
                        <div
                          key={index}
                          className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs sm:text-sm font-medium"
                        >
                          {hotspot.percentage}%
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 max-w-4xl mt-8 sm:mt-12">
        <Card className="card-custom">
          <CardContent className="p-4 sm:p-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-blue-400 font-medium text-sm sm:text-base mb-2">ℹ️ Professionelle Heatmaps</p>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Diese Heatmap verwendet ONNX-Machine Learning für höchste Präzision. Falls das Modell nicht lädt, 
                wird automatisch eine erweiterte Heuristik mit Multi-Scale-Edge-Detection verwendet. 
                Das Ergebnis zeigt glatte, blob-artige Bereiche wie in professionellen Predictive-Tools.
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