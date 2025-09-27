'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Faq } from '@/components/Faq';
import { Upload, X, Download, Eye, EyeOff } from 'lucide-react';

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

type Palette = 'viridis' | 'turbo' | 'classic';

export default function AdHeatmapPage() {
  const [image, setImage] = useState<string | null>(null);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [palette, setPalette] = useState<Palette>('viridis');
  const [hotspotCount, setHotspotCount] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const saliencyDataRef = useRef<Float32Array | null>(null);

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

    try {
      const imageBitmap = await createImageBitmap(file);
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);

      const saliency = await computeSaliency(imageBitmap);
      saliencyDataRef.current = saliency;
      
      const computedInsights = computeInsights(saliency, imageBitmap.width, imageBitmap.height, hotspotCount);
      setInsights(computedInsights);
      
      updateHeatmapDisplay();
      
    } catch (err) {
      console.error('Image processing error:', err);
      setError(`Fehler bei der Bildverarbeitung: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [hotspotCount]);

  const computeSaliency = async (imageBitmap: ImageBitmap): Promise<Float32Array> => {
    const canvas = hiddenCanvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    // Downscale to 256px on longest edge
    const maxSize = 256;
    const ratio = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height);
    const width = Math.round(imageBitmap.width * ratio);
    const height = Math.round(imageBitmap.height * ratio);
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Sobel edge detection
    const edges = computeSobelEdges(data, width, height);
    
    // Saturation analysis
    const saturation = computeSaturation(data, width, height);
    
    // Fusion: 0.7*edges + 0.3*saturation
    const saliency = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      saliency[i] = 0.7 * edges[i] + 0.3 * saturation[i];
    }
    
    // Gaussian blur
    applyGaussianBlur(saliency, width, height, Math.min(width, height) * 0.01);
    
    // Robust normalization (percentiles 1-99)
    normalizePercentiles(saliency);
    
    return saliency;
  };

  const computeSobelEdges = (data: Uint8ClampedArray, width: number, height: number): Float32Array => {
    const edges = new Float32Array(width * height);
    
    // Sobel kernels
    const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gxSum = 0, gySum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gxSum += gray * gx[kernelIdx];
            gySum += gray * gy[kernelIdx];
          }
        }
        
        edges[y * width + x] = Math.sqrt(gxSum * gxSum + gySum * gySum);
      }
    }
    
    return edges;
  };

  const computeSaturation = (data: Uint8ClampedArray, width: number, height: number): Float32Array => {
    const saturation = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4] / 255;
      const g = data[i * 4 + 1] / 255;
      const b = data[i * 4 + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      saturation[i] = max === 0 ? 0 : delta / max;
    }
    
    return saturation;
  };

  const applyGaussianBlur = (data: Float32Array, width: number, height: number, sigma: number) => {
    const kernelSize = Math.min(Math.ceil(sigma * 3) * 2 + 1, 15);
    const kernel: number[] = [];
    let sum = 0;
    
    for (let i = 0; i < kernelSize; i++) {
      const x = i - Math.floor(kernelSize / 2);
      const value = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[i] = value;
      sum += value;
    }
    
    for (let i = 0; i < kernelSize; i++) {
      kernel[i] /= sum;
    }
    
    // Horizontal blur
    const temp = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const sx = x + k - Math.floor(kernelSize / 2);
          if (sx >= 0 && sx < width) {
            value += data[y * width + sx] * kernel[k];
          }
        }
        temp[y * width + x] = value;
      }
    }
    
    // Vertical blur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const sy = y + k - Math.floor(kernelSize / 2);
          if (sy >= 0 && sy < height) {
            value += temp[sy * width + x] * kernel[k];
          }
        }
        data[y * width + x] = value;
      }
    }
  };

  const normalizePercentiles = (data: Float32Array) => {
    const sorted = Array.from(data).sort((a, b) => a - b);
    const p1 = sorted[Math.floor(sorted.length * 0.01)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const range = p99 - p1;
    
    if (range === 0) return;
    
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.min(1, Math.max(0, (data[i] - p1) / range));
    }
  };

  const findHotspots = (data: Float32Array, width: number, height: number, k: number): Hotspot[] => {
    // Downscale for hotspot detection
    const scale = 128 / Math.max(width, height);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    
    const downscaled = new Float32Array(newWidth * newHeight);
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const origX = Math.round(x / scale);
        const origY = Math.round(y / scale);
        const idx = Math.min(origY * width + origX, data.length - 1);
        downscaled[y * newWidth + x] = data[idx];
      }
    }
    
    // Find local maxima
    const candidates: { x: number; y: number; value: number }[] = [];
    const minDistance = Math.max(width, height) * 0.05;
    
    for (let y = 1; y < newHeight - 1; y++) {
      for (let x = 1; x < newWidth - 1; x++) {
        const idx = y * newWidth + x;
        const value = downscaled[idx];
        
        // Check if it's a local maximum
        let isMax = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighborIdx = (y + dy) * newWidth + (x + dx);
            if (downscaled[neighborIdx] >= value) {
              isMax = false;
              break;
            }
          }
          if (!isMax) break;
        }
        
        if (isMax && value > 0.1) {
          candidates.push({
            x: Math.round(x / scale),
            y: Math.round(y / scale),
            value
          });
        }
      }
    }
    
    // Sort by value and apply non-maximum suppression
    candidates.sort((a, b) => b.value - a.value);
    const hotspots: Hotspot[] = [];
    
    for (const candidate of candidates) {
      let tooClose = false;
      for (const hotspot of hotspots) {
        const distance = Math.sqrt(
          Math.pow(candidate.x - hotspot.x, 2) + Math.pow(candidate.y - hotspot.y, 2)
        );
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        // Calculate percentage
        const radius = Math.min(width, height) * 0.07;
        let energy = 0;
        let totalEnergy = 0;
        
        for (let py = 0; py < height; py++) {
          for (let px = 0; px < width; px++) {
            const distance = Math.sqrt(Math.pow(px - candidate.x, 2) + Math.pow(py - candidate.y, 2));
            const value = data[py * width + px] || 0;
            totalEnergy += value;
            
            if (distance <= radius) {
              energy += value;
            }
          }
        }
        
        const percentage = Math.round((energy / totalEnergy) * 100);
        
        hotspots.push({
          x: candidate.x,
          y: candidate.y,
          percentage
        });
        
        if (hotspots.length >= k) break;
      }
    }
    
    return hotspots;
  };

  const computeInsights = (data: Float32Array, width: number, height: number, k: number): Insights => {
    // Focus Score: mean of top 15%
    const sorted = Array.from(data).sort((a, b) => b - a);
    const top15Count = Math.floor(sorted.length * 0.15);
    const focusScore = Math.round(
      sorted.slice(0, top15Count).reduce((sum, val) => sum + val, 0) / top15Count * 100
    );
    
    // Rule of Thirds
    const thirdW = width / 3;
    const thirdH = height / 3;
    const circleRadius = Math.min(width, height) * 0.03;
    
    const thirdsPoints = [
      { x: thirdW, y: thirdH },
      { x: thirdW * 2, y: thirdH },
      { x: thirdW, y: thirdH * 2 },
      { x: thirdW * 2, y: thirdH * 2 }
    ];
    
    let thirdsEnergy = 0;
    let totalEnergy = data.reduce((sum, val) => sum + val, 0);
    
    for (const point of thirdsPoints) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
          if (distance <= circleRadius) {
            thirdsEnergy += data[y * width + x] || 0;
          }
        }
      }
    }
    
    const thirdsMatch = Math.round((thirdsEnergy / totalEnergy) * 100);
    
    // Hotspots
    const hotspots = findHotspots(data, width, height, k);
    
    return { focusScore, thirdsMatch, hotspots };
  };

  const getPaletteColor = (value: number, palette: Palette): { r: number; g: number; b: number } => {
    const t = Math.max(0, Math.min(1, value));
    
    switch (palette) {
      case 'viridis':
        return viridisColor(t);
      case 'turbo':
        return turboColor(t);
      case 'classic':
        return classicColor(t);
      default:
        return viridisColor(t);
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

  const classicColor = (t: number) => {
    if (t < 0.25) {
      const local = t * 4;
      return { r: 0, g: Math.round(local * 255), b: 255 };
    } else if (t < 0.5) {
      const local = (t - 0.25) * 4;
      return { r: 0, g: 255, b: Math.round((1 - local) * 255) };
    } else if (t < 0.75) {
      const local = (t - 0.5) * 4;
      return { r: Math.round(local * 255), g: 255, b: 0 };
    } else {
      const local = (t - 0.75) * 4;
      return { r: 255, g: Math.round((1 - local) * 255), b: 0 };
    }
  };

  const updateHeatmapDisplay = useCallback(() => {
    if (!saliencyDataRef.current || !imageRef.current || !heatmapCanvasRef.current) return;
    
    const img = imageRef.current;
    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    // Assume saliency data is 256x256 (we'll scale it)
    const saliencyWidth = 256;
    const saliencyHeight = 256;
    
    for (let i = 0; i < canvas.width * canvas.height; i++) {
      const y = Math.floor(i / canvas.width);
      const x = i % canvas.width;
      
      const saliencyX = Math.floor((x / canvas.width) * saliencyWidth);
      const saliencyY = Math.floor((y / canvas.height) * saliencyHeight);
      const saliencyIdx = Math.min(saliencyY * saliencyWidth + saliencyX, saliencyDataRef.current.length - 1);
      
      const intensity = saliencyDataRef.current[saliencyIdx] || 0;
      const color = getPaletteColor(intensity, palette);
      
      data[i * 4] = color.r;
      data[i * 4 + 1] = color.g;
      data[i * 4 + 2] = color.b;
      data[i * 4 + 3] = Math.round(255 * heatmapOpacity);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [palette, heatmapOpacity]);

  const exportPng = useCallback(() => {
    if (!image || !saliencyDataRef.current || !imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Draw heatmap
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    const saliencyWidth = 256;
    const saliencyHeight = 256;
    
    for (let i = 0; i < canvas.width * canvas.height; i++) {
      const y = Math.floor(i / canvas.width);
      const x = i % canvas.width;
      
      const saliencyX = Math.floor((x / canvas.width) * saliencyWidth);
      const saliencyY = Math.floor((y / canvas.height) * saliencyHeight);
      const saliencyIdx = Math.min(saliencyY * saliencyWidth + saliencyX, saliencyDataRef.current.length - 1);
      
      const intensity = saliencyDataRef.current[saliencyIdx] || 0;
      const color = getPaletteColor(intensity, palette);
      
      const originalR = data[i * 4];
      const originalG = data[i * 4 + 1];
      const originalB = data[i * 4 + 2];
      
      // Blend with original image
      data[i * 4] = Math.round(originalR * (1 - heatmapOpacity) + color.r * heatmapOpacity);
      data[i * 4 + 1] = Math.round(originalG * (1 - heatmapOpacity) + color.g * heatmapOpacity);
      data[i * 4 + 2] = Math.round(originalB * (1 - heatmapOpacity) + color.b * heatmapOpacity);
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Draw hotspot badges
    if (insights?.hotspots) {
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      insights.hotspots.forEach((hotspot, index) => {
        const x = (hotspot.x / saliencyWidth) * canvas.width;
        const y = (hotspot.y / saliencyHeight) * canvas.height;
        
        // Draw glow
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        
        // Draw badge
        ctx.fillStyle = `hsl(${index * 120}, 70%, 50%)`;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${hotspot.percentage}%`, x, y);
      });
    }
    
    const link = document.createElement('a');
    link.download = 'heatmap-analysis.png';
    link.href = canvas.toDataURL();
    link.click();
  }, [image, palette, heatmapOpacity, insights]);

  const removeImage = () => {
    setImage(null);
    setInsights(null);
    saliencyDataRef.current = null;
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    updateHeatmapDisplay();
  }, [updateHeatmapDisplay]);

  const faqItems = [
    {
      question: 'Was ist eine Ad Heatmap?',
      answer: 'Eine Heatmap zeigt visuell, welche Bereiche eines Bildes am meisten Aufmerksamkeit erregen könnten. Sie basiert auf Kontrast, Farben und Gesichtserkennung - ähnlich wie Eye-Tracking-Studien.'
    },
    {
      question: 'Wie funktioniert die Saliency-Analyse?',
      answer: 'Das Tool verwendet eine robuste Pipeline: Sobel-Kantenerkennung (70%) kombiniert mit Farbsättigung (30%), gefolgt von Gaussian Blur und robustem Normalisieren. Dies simuliert menschliche Aufmerksamkeitsmuster.'
    },
    {
      question: 'Was bedeuten die Insights?',
      answer: 'Focus Score: Durchschnittswert der 15% intensivsten Bereiche (0-100). Rule-of-Thirds: Anteil der Aufmerksamkeit in den 4 Kreuzungspunkten. Hotspots: Lokale Maxima mit Energie-Prozent.'
    },
    {
      question: 'Welche Paletten stehen zur Verfügung?',
      answer: 'Viridis: Wissenschaftlich optimiert, farbenblind-freundlich. Turbo: Helle, kontrastreiche Farben. Classic: Traditionelle Blau-Grün-Gelb-Rot Heatmap.'
    },
    {
      question: 'Wie werden Hotspots berechnet?',
      answer: 'Hotspots werden durch lokale Maxima in der Heatmap identifiziert, mit Mindestabstand zwischen ihnen. Der Prozentsatz zeigt die relative Energie in einem Kreis um jeden Hotspot.'
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
        description="Professioneller Ad Heatmap Generator mit Saliency-Analyse, Hotspot-Erkennung und Insights. Visualisiere Aufmerksamkeitsbereiche in deinen Ad-Creatives."
        canonical="/ad-heatmap"
      />
      
      <Hero 
        title="Ad Heatmap Generator"
        subtitle="Professionelle Saliency-Analyse für Ad-Creatives"
        description="Analysiere die Aufmerksamkeitsbereiche deiner Ads mit robuster Computer-Vision. Erhalte Insights zu Focus Score, Rule-of-Thirds und Hotspots."
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
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Palette</label>
                    <select
                      value={palette}
                      onChange={(e) => setPalette(e.target.value as Palette)}
                      className="w-full p-3 rounded-md border border-surface-secondary bg-surface-secondary text-text-light text-sm sm:text-base"
                    >
                      <option value="viridis">Viridis (Wissenschaftlich)</option>
                      <option value="turbo">Turbo (Kontrastreich)</option>
                      <option value="classic">Classic (Traditionell)</option>
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
                    Lade ein Bild hoch, um die Heatmap zu sehen
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
              <p className="text-blue-400 font-medium text-sm sm:text-base mb-2">ℹ️ Hinweis</p>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Diese Heatmap basiert auf Saliency-Analyse (Kanten + Farbsättigung) und simuliert menschliche 
                Aufmerksamkeitsmuster. Die Ergebnisse dienen als Orientierungshilfe für die Gestaltung deiner Ad-Creatives.
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