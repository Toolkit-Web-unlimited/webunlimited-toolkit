/**
 * Safe Zone Konfiguration für verschiedene Plattformen
 * Konservative Margins basierend auf Basisauflösungen
 */

export interface SafeZoneConfig {
  name: string;
  ratio: string;
  width: number;
  height: number;
  safeZone: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  description?: string;
}

export const SAFE_ZONE_CONFIGS: Record<string, SafeZoneConfig> = {
  // Instagram
  'instagram-reel': {
    name: 'Instagram Reel',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: {
      top: 160,
      bottom: 320,
      left: 60,
      right: 120
    },
    description: 'Für vertikale Videos mit UI-Elementen'
  },
  'instagram-story': {
    name: 'Instagram Story',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: {
      top: 250,
      bottom: 250,
      left: 60,
      right: 60
    },
    description: 'Für Stories mit Caption-Bereich'
  },
  'instagram-feed-square': {
    name: 'Instagram Feed (1:1)',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    safeZone: {
      top: 60,
      bottom: 60,
      left: 60,
      right: 60
    },
    description: 'Für quadratische Feed-Posts'
  },
  'instagram-feed-portrait': {
    name: 'Instagram Feed (4:5)',
    ratio: '4:5',
    width: 1080,
    height: 1350,
    safeZone: {
      top: 90,
      bottom: 90,
      left: 60,
      right: 60
    },
    description: 'Für vertikale Feed-Posts'
  },

  // TikTok
  'tiktok-video': {
    name: 'TikTok Video',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: {
      top: 150,
      bottom: 420,
      left: 60,
      right: 120
    },
    description: 'Für TikTok Videos mit UI-Chrome'
  },

  // YouTube
  'youtube-shorts': {
    name: 'YouTube Shorts',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: {
      top: 150,
      bottom: 250,
      left: 60,
      right: 60
    },
    description: 'Für YouTube Shorts'
  },
  'youtube-landscape': {
    name: 'YouTube Landscape',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    safeZone: {
      top: 80,
      bottom: 120,
      left: 60,
      right: 60
    },
    description: 'Für horizontale YouTube Videos'
  },

  // Facebook/LinkedIn
  'facebook-feed-square': {
    name: 'Facebook Feed (1:1)',
    ratio: '1:1',
    width: 1200,
    height: 1200,
    safeZone: {
      top: 60,
      bottom: 60,
      left: 60,
      right: 60
    },
    description: 'Für quadratische Facebook Posts'
  },
  'facebook-feed-portrait': {
    name: 'Facebook Feed (4:5)',
    ratio: '4:5',
    width: 1200,
    height: 1500,
    safeZone: {
      top: 90,
      bottom: 90,
      left: 60,
      right: 60
    },
    description: 'Für vertikale Facebook Posts'
  },
  'linkedin-feed': {
    name: 'LinkedIn Feed',
    ratio: '1:1',
    width: 1200,
    height: 1200,
    safeZone: {
      top: 60,
      bottom: 60,
      left: 60,
      right: 60
    },
    description: 'Für LinkedIn Feed Posts'
  }
};

/**
 * Erkennt das Seitenverhältnis eines Bildes mit Toleranz
 */
export function detectAspectRatio(width: number, height: number): {
  ratio: string;
  isStandard: boolean;
  tolerance: number;
} {
  const actualRatio = width / height;
  
  // Erweiterte Liste mit mehr Standard-Formaten
  const standardRatios = [
    { value: 9/16, name: '9:16', tolerance: 0.02 }, // Vertikal (Story/Reel)
    { value: 16/9, name: '16:9', tolerance: 0.02 }, // Landscape (YouTube)
    { value: 1, name: '1:1', tolerance: 0.02 },     // Quadratisch (Feed)
    { value: 4/5, name: '4:5', tolerance: 0.02 },   // Vertikal (Feed)
    { value: 5/4, name: '5:4', tolerance: 0.02 },   // Horizontal (Feed)
    { value: 3/4, name: '3:4', tolerance: 0.02 },   // Vertikal
    { value: 4/3, name: '4:3', tolerance: 0.02 },   // Horizontal
    { value: 21/9, name: '21:9', tolerance: 0.02 }, // Ultra-Wide
    { value: 2/3, name: '2:3', tolerance: 0.02 },   // Vertikal
    { value: 3/2, name: '3:2', tolerance: 0.02 },   // Horizontal
  ];

  // Prüfe auf Standard-Formate
  for (const standard of standardRatios) {
    const difference = Math.abs(actualRatio - standard.value);
    const maxDifference = standard.value * standard.tolerance;
    
    if (difference <= maxDifference) {
      return {
        ratio: standard.name,
        isStandard: true,
        tolerance: (difference / standard.value) * 100
      };
    }
  }

  // Falls kein Standard-Format gefunden
  return {
    ratio: `${width}:${height}`,
    isStandard: false,
    tolerance: 0
  };
}

/**
 * Findet passende Safe Zone Konfigurationen basierend auf dem Seitenverhältnis
 */
export function getCompatibleConfigs(aspectRatio: string): SafeZoneConfig[] {
  return Object.values(SAFE_ZONE_CONFIGS).filter(config => 
    config.ratio === aspectRatio
  );
}

/**
 * Berechnet Safe Zone Prozentwerte für die Anzeige
 */
export function calculateSafeZonePercentages(
  config: SafeZoneConfig,
  displayWidth: number,
  displayHeight: number
): {
  safeZone: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  riskAreas: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
} {
  const { safeZone } = config;
  
  // Berechne Skalierungsfaktoren
  const scaleX = displayWidth / config.width;
  const scaleY = displayHeight / config.height;
  
  // Konvertiere Pixel zu Prozent
  const safeZonePercentages = {
    top: (safeZone.top * scaleY) / displayHeight * 100,
    bottom: (safeZone.bottom * scaleY) / displayHeight * 100,
    left: (safeZone.left * scaleX) / displayWidth * 100,
    right: (safeZone.right * scaleX) / displayWidth * 100,
  };

  // Berechne Risk Areas (alles außerhalb der Safe Zone)
  const riskAreas = [];
  
  // Top risk area
  if (safeZonePercentages.top > 0) {
    riskAreas.push({
      x: 0,
      y: 0,
      width: 100,
      height: safeZonePercentages.top
    });
  }
  
  // Bottom risk area
  if (safeZonePercentages.bottom > 0) {
    riskAreas.push({
      x: 0,
      y: 100 - safeZonePercentages.bottom,
      width: 100,
      height: safeZonePercentages.bottom
    });
  }
  
  // Left risk area
  if (safeZonePercentages.left > 0) {
    riskAreas.push({
      x: 0,
      y: safeZonePercentages.top,
      width: safeZonePercentages.left,
      height: 100 - safeZonePercentages.top - safeZonePercentages.bottom
    });
  }
  
  // Right risk area
  if (safeZonePercentages.right > 0) {
    riskAreas.push({
      x: 100 - safeZonePercentages.right,
      y: safeZonePercentages.top,
      width: safeZonePercentages.right,
      height: 100 - safeZonePercentages.top - safeZonePercentages.bottom
    });
  }

  return {
    safeZone: safeZonePercentages,
    riskAreas
  };
}



