/**
 * WCAG 2.1 Contrast Ratio Utilities
 */

export interface ContrastResult {
  ratio: number;
  level: 'AA' | 'AAA' | 'FAIL';
  size: 'normal' | 'large';
  passed: boolean;
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check WCAG compliance
 */
export function checkWCAG(
  foreground: string, 
  background: string, 
  fontSize: 'normal' | 'large' = 'normal'
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  
  // WCAG thresholds
  const thresholds = {
    normal: { AA: 4.5, AAA: 7 },
    large: { AA: 3, AAA: 4.5 }
  };
  
  const threshold = thresholds[fontSize];
  
  let level: 'AA' | 'AAA' | 'FAIL';
  if (ratio >= threshold.AAA) {
    level = 'AAA';
  } else if (ratio >= threshold.AA) {
    level = 'AA';
  } else {
    level = 'FAIL';
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    level,
    size: fontSize,
    passed: level !== 'FAIL'
  };
}

/**
 * Generate color variations for better contrast
 */
export function generateContrastColors(hex: string, targetRatio: number = 4.5): {
  lighter: string;
  darker: string;
} {
  const rgb = hexToRgb(hex);
  if (!rgb) return { lighter: hex, darker: hex };
  
  // Simple HSL adjustment
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const lighter = hslToHex(hsl.h, Math.max(0, hsl.s - 0.2), Math.min(100, hsl.l + 20));
  const darker = hslToHex(hsl.h, Math.min(100, hsl.s + 0.2), Math.max(0, hsl.l - 20));
  
  return { lighter, darker };
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to Hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}






