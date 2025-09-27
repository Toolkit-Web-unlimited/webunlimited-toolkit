// WebWorker für Itti-Koch-Niebur Saliency-Berechnung

interface WorkerMessage {
  type: 'process' | 'progress';
  data: any;
}

interface ProcessMessage {
  imageData: ImageData;
  width: number;
  height: number;
  mode: 'scientific' | 'marketing';
  hotspotCount: number;
}

interface ProgressMessage {
  step: string;
  progress: number;
}

interface Hotspot {
  x: number;
  y: number;
  percentage: number;
}

interface ProcessResult {
  saliency: Float32Array;
  hotspots: Hotspot[];
  focusScore: number;
  width: number;
  height: number;
}

class IttiKochNieburSaliency {
  private width: number;
  private height: number;
  private mode: 'scientific' | 'marketing';

  constructor(width: number, height: number, mode: 'scientific' | 'marketing') {
    this.width = width;
    this.height = height;
    this.mode = mode;
  }

  public compute(imageData: ImageData, progressCallback: (step: string, progress: number) => void): ProcessResult {
    progressCallback('Normalizing image', 0.1);
    
    // Convert to normalized float arrays
    const { r, g, b } = this.normalizeImage(imageData);
    
    progressCallback('Computing intensity and color opponency', 0.2);
    
    // Intensity and color opponency
    const intensity = this.computeIntensity(r, g, b);
    const { rg, by } = this.computeColorOpponency(r, g, b);
    
    progressCallback('Building Gaussian pyramids', 0.3);
    
    // Gaussian pyramids
    const intensityPyramid = this.buildGaussianPyramid(intensity);
    const rgPyramid = this.buildGaussianPyramid(rg);
    const byPyramid = this.buildGaussianPyramid(by);
    
    progressCallback('Computing center-surround differences', 0.4);
    
    // Center-surround differences
    const intensityMaps = this.computeCenterSurround(intensityPyramid);
    const colorMaps = this.computeCenterSurround(rgPyramid).concat(
      this.computeCenterSurround(byPyramid)
    );
    
    progressCallback('Computing orientation maps', 0.5);
    
    // Orientation maps
    const orientationMaps = this.computeOrientationMaps(intensity);
    
    progressCallback('Creating conspicuity maps', 0.6);
    
    // Conspicuity maps
    const conspicuityIntensity = this.createConspicuityMap(intensityMaps);
    const conspicuityColor = this.createConspicuityMap(colorMaps);
    const conspicuityOrientation = this.createConspicuityMap(orientationMaps);
    
    progressCallback('Fusing saliency map', 0.7);
    
    // Final saliency map
    const saliency = this.fuseSaliencyMaps(
      conspicuityIntensity,
      conspicuityColor,
      conspicuityOrientation
    );
    
    progressCallback('Normalizing and smoothing', 0.8);
    
    // Final processing
    this.normalizeRobust(saliency);
    this.applyGaussianBlur(saliency, Math.max(this.width, this.height) * 0.02);
    
    progressCallback('Finding hotspots', 0.9);
    
    // Find hotspots
    const hotspots = this.findHotspots(saliency, 3);
    const focusScore = this.computeFocusScore(saliency);
    
    progressCallback('Complete', 1.0);
    
    return {
      saliency,
      hotspots,
      focusScore,
      width: this.width,
      height: this.height
    };
  }

  private normalizeImage(imageData: ImageData): { r: Float32Array; g: Float32Array; b: Float32Array } {
    const data = imageData.data;
    const r = new Float32Array(this.width * this.height);
    const g = new Float32Array(this.width * this.height);
    const b = new Float32Array(this.width * this.height);
    
    for (let i = 0; i < this.width * this.height; i++) {
      r[i] = data[i * 4] / 255;
      g[i] = data[i * 4 + 1] / 255;
      b[i] = data[i * 4 + 2] / 255;
    }
    
    return { r, g, b };
  }

  private computeIntensity(r: Float32Array, g: Float32Array, b: Float32Array): Float32Array {
    const intensity = new Float32Array(this.width * this.height);
    for (let i = 0; i < this.width * this.height; i++) {
      intensity[i] = (r[i] + g[i] + b[i]) / 3;
    }
    return intensity;
  }

  private computeColorOpponency(r: Float32Array, g: Float32Array, b: Float32Array): { rg: Float32Array; by: Float32Array } {
    const rg = new Float32Array(this.width * this.height);
    const by = new Float32Array(this.width * this.height);
    
    for (let i = 0; i < this.width * this.height; i++) {
      rg[i] = Math.max(0, r[i] - g[i]);
      by[i] = Math.max(0, (r[i] + g[i]) / 2 - b[i]);
    }
    
    return { rg, by };
  }

  private buildGaussianPyramid(image: Float32Array): Float32Array[] {
    const pyramid: Float32Array[] = [image];
    const sigmas = [1, 2, 4, 8, 16];
    
    for (const sigma of sigmas) {
      const blurred = this.applyGaussianBlur(image, sigma);
      pyramid.push(blurred);
    }
    
    return pyramid;
  }

  private applyGaussianBlur(image: Float32Array, sigma: number): Float32Array {
    const kernelSize = Math.min(Math.ceil(sigma * 3) * 2 + 1, 31);
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
    
    // Apply horizontal blur
    const temp = new Float32Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const sx = x + k - Math.floor(kernelSize / 2);
          if (sx >= 0 && sx < this.width) {
            value += image[y * this.width + sx] * kernel[k];
          }
        }
        temp[y * this.width + x] = value;
      }
    }
    
    // Apply vertical blur
    const result = new Float32Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const sy = y + k - Math.floor(kernelSize / 2);
          if (sy >= 0 && sy < this.height) {
            value += temp[sy * this.width + x] * kernel[k];
          }
        }
        result[y * this.width + x] = value;
      }
    }
    
    return result;
  }

  private computeCenterSurround(pyramid: Float32Array[]): Float32Array[] {
    const maps: Float32Array[] = [];
    
    for (let c = 0; c < 4; c++) {
      for (let s = c + 3; s < 6; s++) {
        const center = pyramid[c];
        const surround = this.resizeToMatch(center, pyramid[s]);
        
        const difference = new Float32Array(this.width * this.height);
        for (let i = 0; i < this.width * this.height; i++) {
          difference[i] = Math.abs(center[i] - surround[i]);
        }
        
        maps.push(difference);
      }
    }
    
    return maps;
  }

  private resizeToMatch(target: Float32Array, source: Float32Array): Float32Array {
    // Simple nearest neighbor resize (assuming source is smaller)
    const scale = Math.sqrt(source.length / target.length);
    const result = new Float32Array(this.width * this.height);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const sx = Math.min(Math.floor(x * scale), Math.floor(Math.sqrt(source.length)) - 1);
        const sy = Math.min(Math.floor(y * scale), Math.floor(Math.sqrt(source.length)) - 1);
        const sIdx = sy * Math.floor(Math.sqrt(source.length)) + sx;
        result[y * this.width + x] = source[sIdx] || 0;
      }
    }
    
    return result;
  }

  private computeOrientationMaps(intensity: Float32Array): Float32Array[] {
    // Sobel gradients
    const { gx, gy } = this.computeSobelGradients(intensity);
    
    const orientations = [0, 45, 90, 135]; // degrees
    const maps: Float32Array[] = [];
    
    for (const angle of orientations) {
      const map = new Float32Array(this.width * this.height);
      const cos = Math.cos(angle * Math.PI / 180);
      const sin = Math.sin(angle * Math.PI / 180);
      
      for (let i = 0; i < this.width * this.height; i++) {
        const projection = gx[i] * cos + gy[i] * sin;
        map[i] = Math.abs(projection);
      }
      
      // Apply small Gaussian blur
      const blurred = this.applyGaussianBlur(map, 1);
      maps.push(blurred);
    }
    
    return maps;
  }

  private computeSobelGradients(image: Float32Array): { gx: Float32Array; gy: Float32Array } {
    const gx = new Float32Array(this.width * this.height);
    const gy = new Float32Array(this.width * this.height);
    
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        let gxSum = 0, gySum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * this.width + (x + kx);
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gxSum += image[idx] * sobelX[kernelIdx];
            gySum += image[idx] * sobelY[kernelIdx];
          }
        }
        
        gx[y * this.width + x] = gxSum;
        gy[y * this.width + x] = gySum;
      }
    }
    
    return { gx, gy };
  }

  private createConspicuityMap(maps: Float32Array[]): Float32Array {
    const conspicuity = new Float32Array(this.width * this.height);
    
    for (const map of maps) {
      // Local contrast normalization
      const normalized = this.localContrastNormalization(map);
      
      for (let i = 0; i < this.width * this.height; i++) {
        conspicuity[i] += normalized[i];
      }
    }
    
    // Normalize by number of maps
    const mapCount = maps.length;
    for (let i = 0; i < this.width * this.height; i++) {
      conspicuity[i] /= mapCount;
    }
    
    return conspicuity;
  }

  private localContrastNormalization(map: Float32Array): Float32Array {
    // Compute local mean and std in 7x7 window
    const normalized = new Float32Array(this.width * this.height);
    const windowSize = 7;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let y = halfWindow; y < this.height - halfWindow; y++) {
      for (let x = halfWindow; x < this.width - halfWindow; x++) {
        let sum = 0, sumSq = 0;
        let count = 0;
        
        for (let wy = -halfWindow; wy <= halfWindow; wy++) {
          for (let wx = -halfWindow; wx <= halfWindow; wx++) {
            const idx = (y + wy) * this.width + (x + wx);
            const value = map[idx];
            sum += value;
            sumSq += value * value;
            count++;
          }
        }
        
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        const std = Math.sqrt(Math.max(variance, 0.001)); // Avoid division by zero
        
        const centerIdx = y * this.width + x;
        normalized[centerIdx] = (map[centerIdx] - mean) / std;
      }
    }
    
    // Min-max normalization to [0, 1]
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < this.width * this.height; i++) {
      min = Math.min(min, normalized[i]);
      max = Math.max(max, normalized[i]);
    }
    
    const range = max - min;
    if (range > 0) {
      for (let i = 0; i < this.width * this.height; i++) {
        normalized[i] = Math.max(0, Math.min(1, (normalized[i] - min) / range));
      }
    }
    
    return normalized;
  }

  private fuseSaliencyMaps(
    conspicuityIntensity: Float32Array,
    conspicuityColor: Float32Array,
    conspicuityOrientation: Float32Array
  ): Float32Array {
    const saliency = new Float32Array(this.width * this.height);
    
    // Mode-dependent weights
    const weights = this.mode === 'scientific' 
      ? { intensity: 0.45, color: 0.25, orientation: 0.30 }
      : { intensity: 0.35, color: 0.20, orientation: 0.45 };
    
    for (let i = 0; i < this.width * this.height; i++) {
      saliency[i] = 
        weights.intensity * conspicuityIntensity[i] +
        weights.color * conspicuityColor[i] +
        weights.orientation * conspicuityOrientation[i];
    }
    
    return saliency;
  }

  private normalizeRobust(data: Float32Array) {
    const sorted = Array.from(data).sort((a, b) => a - b);
    const p1 = sorted[Math.floor(sorted.length * 0.01)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const range = p99 - p1;
    
    if (range === 0) return;
    
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.min(1, Math.max(0, (data[i] - p1) / range));
    }
  }

  private findHotspots(data: Float32Array, k: number): Hotspot[] {
    const candidates: { x: number; y: number; value: number }[] = [];
    const minDistance = Math.max(this.width, this.height) * 0.05;
    
    // Find local maxima
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const idx = y * this.width + x;
        const value = data[idx];
        
        if (value > 0.1) { // Threshold
          let isMax = true;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const neighborIdx = (y + dy) * this.width + (x + dx);
              if (data[neighborIdx] >= value) {
                isMax = false;
                break;
              }
            }
            if (!isMax) break;
          }
          
          if (isMax) {
            candidates.push({ x, y, value });
          }
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
        const radius = Math.min(this.width, this.height) * 0.07;
        let energy = 0;
        let totalEnergy = 0;
        
        for (let py = 0; py < this.height; py++) {
          for (let px = 0; px < this.width; px++) {
            const distance = Math.sqrt(Math.pow(px - candidate.x, 2) + Math.pow(py - candidate.y, 2));
            const value = data[py * this.width + px] || 0;
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
  }

  private computeFocusScore(data: Float32Array): number {
    const sorted = Array.from(data).sort((a, b) => b - a);
    const top15Count = Math.floor(sorted.length * 0.15);
    const focusScore = Math.round(
      sorted.slice(0, top15Count).reduce((sum, val) => sum + val, 0) / top15Count * 100
    );
    return focusScore;
  }
}

// Worker message handling
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type === 'process') {
    const { imageData, width, height, mode, hotspotCount }: ProcessMessage = e.data.data;
    
    try {
      const processor = new IttiKochNieburSaliency(width, height, mode);
      const result = processor.compute(imageData, (step: string, progress: number) => {
        self.postMessage({
          type: 'progress',
          data: { step, progress }
        });
      });
      
      self.postMessage({
        type: 'complete',
        data: result
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }
};
