'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Faq } from '@/components/Faq';
import { Upload, X, Grid, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

// Safe Zone Konfigurationen
interface SafeZoneConfig {
  platform: string;
  format: string;
  ratio: string;
  width: number;
  height: number;
  safeZone: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  description: string;
}

const SAFE_ZONE_CONFIGS: Record<string, SafeZoneConfig> = {
  'instagram-story': {
    platform: 'Instagram',
    format: 'Story',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: { top: 250, bottom: 250, left: 60, right: 60 },
    description: 'Instagram Stories mit Safe Zones für UI-Elemente'
  },
  'instagram-reel': {
    platform: 'Instagram',
    format: 'Reel',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: { top: 160, bottom: 320, left: 60, right: 120 },
    description: 'Instagram Reels mit erweiterten Safe Zones'
  },
  'instagram-feed': {
    platform: 'Instagram',
    format: 'Feed',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    safeZone: { top: 60, bottom: 60, left: 60, right: 60 },
    description: 'Instagram Feed Posts quadratisch'
  },
  'instagram-feed-vertical': {
    platform: 'Instagram',
    format: 'Feed Vertical',
    ratio: '4:5',
    width: 1080,
    height: 1350,
    safeZone: { top: 90, bottom: 90, left: 60, right: 60 },
    description: 'Instagram Feed Posts vertikal'
  },
  'tiktok': {
    platform: 'TikTok',
    format: 'Video',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: { top: 150, bottom: 420, left: 60, right: 120 },
    description: 'TikTok Videos mit Safe Zones für UI'
  },
  'youtube-shorts': {
    platform: 'YouTube',
    format: 'Shorts',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    safeZone: { top: 150, bottom: 250, left: 60, right: 60 },
    description: 'YouTube Shorts vertikal'
  },
  'youtube-landscape': {
    platform: 'YouTube',
    format: 'Landscape',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    safeZone: { top: 80, bottom: 120, left: 60, right: 60 },
    description: 'YouTube Videos im Landscape-Format'
  },
  'facebook-feed': {
    platform: 'Facebook',
    format: 'Feed',
    ratio: '1:1',
    width: 1200,
    height: 1200,
    safeZone: { top: 60, bottom: 60, left: 60, right: 60 },
    description: 'Facebook Feed Posts'
  },
  'linkedin-feed': {
    platform: 'LinkedIn',
    format: 'Feed',
    ratio: '1:1',
    width: 1200,
    height: 1200,
    safeZone: { top: 60, bottom: 60, left: 60, right: 60 },
    description: 'LinkedIn Feed Posts'
  }
};

// Standard-Formate für Ratio-Erkennung
const STANDARD_RATIOS = [
  { value: 9/16, name: '9:16', tolerance: 0.01 },
  { value: 16/9, name: '16:9', tolerance: 0.01 },
  { value: 1, name: '1:1', tolerance: 0.01 },
  { value: 4/5, name: '4:5', tolerance: 0.01 },
  { value: 5/4, name: '5:4', tolerance: 0.01 },
  { value: 3/4, name: '3:4', tolerance: 0.01 },
  { value: 4/3, name: '4:3', tolerance: 0.01 },
];

// Ratio-Erkennung
function detectAspectRatio(width: number, height: number): {
  ratio: string;
  isStandard: boolean;
  tolerance: number;
} {
  const actualRatio = width / height;
  
  for (const standard of STANDARD_RATIOS) {
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

  return {
    ratio: `${width}:${height}`,
    isStandard: false,
    tolerance: 0
  };
}

// Kompatible Konfigurationen finden
function getCompatibleConfigs(aspectRatio: string): SafeZoneConfig[] {
  return Object.values(SAFE_ZONE_CONFIGS).filter(config => config.ratio === aspectRatio);
}

interface ImageSpecs {
  width: number;
  height: number;
  ratio: string;
  isStandard: boolean;
  tolerance: number;
  type: string;
  url: string;
}

export default function SafeZonePage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageSpecs, setImageSpecs] = useState<ImageSpecs | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<string>('instagram-story');
  const [showGrid, setShowGrid] = useState(true);
  const [showRiskAreas, setShowRiskAreas] = useState(true);
  const [showSafeOutline, setShowSafeOutline] = useState(true);
  const [compatibleConfigs, setCompatibleConfigs] = useState<SafeZoneConfig[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        
        const ratioDetection = detectAspectRatio(width, height);
        const specs: ImageSpecs = {
          width,
          height,
          ratio: ratioDetection.ratio,
          isStandard: ratioDetection.isStandard,
          tolerance: ratioDetection.tolerance,
          type: file.type,
          url: imageUrl
        };
        
        setImageSpecs(specs);
        setImage(imageUrl);
        
        // Finde kompatible Konfigurationen
        const compatible = getCompatibleConfigs(ratioDetection.ratio);
        setCompatibleConfigs(compatible);
        
        // Auto-select beste passende Konfiguration
        if (compatible.length > 0) {
          const configKey = Object.keys(SAFE_ZONE_CONFIGS).find(
            key => SAFE_ZONE_CONFIGS[key].ratio === ratioDetection.ratio
          );
          if (configKey) {
            setSelectedConfig(configKey);
          }
        }
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImageSpecs(null);
    setCompatibleConfigs([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentConfig = SAFE_ZONE_CONFIGS[selectedConfig];
  const isRatioMismatch = imageSpecs && currentConfig && currentConfig.ratio !== imageSpecs.ratio;

  const faqItems = [
    {
      question: 'Was sind Safe Zones?',
      answer: 'Safe Zones sind Bereiche in deinem Content, die nicht von UI-Elementen wie Buttons, Texten oder anderen Bedienelementen überdeckt werden. Wichtige Inhalte sollten innerhalb dieser Zonen platziert werden.'
    },
    {
      question: 'Warum ist das wichtig für Social Media?',
      answer: 'Verschiedene Plattformen haben unterschiedliche UI-Layouts. Was auf einer Plattform gut aussieht, kann auf einer anderen durch UI-Elemente verdeckt werden. Safe Zone Preview hilft dir, universell funktionierende Inhalte zu erstellen.'
    },
    {
      question: 'Wie funktioniert die automatische Seitenverhältnis-Erkennung?',
      answer: 'Das Tool erkennt automatisch das Seitenverhältnis deines Bildes und vergleicht es mit Standard-Formaten (9:16, 1:1, 4:5, 16:9, etc.). Das Bild wird immer im originalen Seitenverhältnis angezeigt - ohne Verzerrung oder Streckung.'
    },
    {
      question: 'Wie genau sind die Safe Zone Margins?',
      answer: 'Die Margins basieren auf den aktuellen UI-Designs der jeweiligen Plattformen und sind bewusst konservativ gewählt. Sie werden pixelgenau proportional zum hochgeladenen Bild skaliert.'
    },
    {
      question: 'Was bedeuten die roten Risk Areas?',
      answer: 'Risk Areas zeigen Bereiche an, wo dein Content möglicherweise nicht optimal dargestellt wird - zum Beispiel bei falschen Seitenverhältnissen oder wenn wichtige Inhalte in UI-Bereichen liegen.'
    },
    {
      question: 'Was passiert bei nicht unterstützten Formaten?',
      answer: 'Auch ungewöhnliche Seitenverhältnisse werden korrekt angezeigt. Eine rote Warnung "Nicht unterstütztes Format" erscheint, aber das Bild wird trotzdem im originalen Seitenverhältnis dargestellt. Safe Zone Overlays werden proportional angepasst.'
    }
  ];

  return (
    <>
      <Seo 
        title="Safe Zone Preview"
        description="Visualisiere Safe Zones für verschiedene Social Media Plattformen. Perfekt für Story- und Reel-Creatives."
        canonical="/safe-zone"
      />
      
      <Hero 
        title="Safe Zone Preview"
        subtitle="Sicherstellen, dass deine Creatives auf jeder Plattform perfekt aussehen"
        description="Lade dein Bild oder Video hoch und sieh sofort, welche Bereiche auf verschiedenen Social Media Plattformen von UI-Elementen verdeckt werden könnten. Optimiere deine Inhalte für maximale Sichtbarkeit."
      />

      <div className="container mx-auto px-2 sm:px-4 max-w-screen-xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Steuerung */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle>Bild/Video hochladen</CardTitle>
            </CardHeader>
            <CardContent>
              {!image ? (
                <div 
                  className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-surface-secondary rounded-lg cursor-pointer hover:border-accent transition-colors min-h-[120px] sm:min-h-[140px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-text-secondary mb-2 sm:mb-3" />
                  <p className="text-text-light font-medium mb-1 text-sm sm:text-base">Klicke oder ziehe dein Bild/Video hierher</p>
                  <p className="text-xs sm:text-sm text-text-secondary">Unterstützt: JPG, PNG, GIF, MP4, WebM</p>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
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
                      <p className="text-text-light font-medium text-sm sm:text-base truncate">Datei hochgeladen</p>
                      {imageSpecs && (
                        <p className="text-xs sm:text-sm text-text-secondary">{imageSpecs.width}x{imageSpecs.height}px, {imageSpecs.ratio}</p>
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
            </CardContent>
          </Card>

          <Card className="card-custom">
            <CardHeader>
              <CardTitle>Plattform & Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRatioMismatch && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-400">
                        Format-Mismatch erkannt
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Bild: {imageSpecs?.ratio} | Gewählt: {currentConfig?.ratio}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isRatioMismatch && imageSpecs && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-400">
                        Format perfekt abgestimmt
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Bild und gewählte Plattform haben das gleiche Seitenverhältnis ({imageSpecs.ratio}).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Plattform wählen</label>
                <select
                  value={selectedConfig}
                  onChange={(e) => setSelectedConfig(e.target.value)}
                  disabled={!image}
                  className={`w-full p-3 rounded-md border transition-all duration-300 text-sm sm:text-base ${
                    image 
                      ? 'bg-surface-secondary border-surface-secondary text-text-light focus:ring-accent focus:border-accent' 
                      : 'bg-surface-secondary/50 border-surface-secondary/50 text-text-muted cursor-not-allowed'
                  }`}
                >
                  {Object.entries(SAFE_ZONE_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.platform} - {config.format} ({config.ratio})
                    </option>
                  ))}
                </select>
                {!image ? (
                  <p className="text-xs text-text-muted mt-2 italic">
                    Bitte zuerst ein Bild/Video hochladen
                  </p>
                ) : currentConfig ? (
                  <p className="text-xs text-text-secondary mt-2">
                    {currentConfig.description}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">Overlay Optionen</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="showSafeOutline" 
                    checked={showSafeOutline} 
                    onChange={() => setShowSafeOutline(!showSafeOutline)} 
                    disabled={!image}
                    className={`form-checkbox h-4 w-4 rounded border-gray-300 transition-all duration-300 ${
                      image 
                        ? 'text-accent focus:ring-accent' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  />
                  <label 
                    htmlFor="showSafeOutline" 
                    className={`text-xs sm:text-sm transition-colors duration-300 ${
                      image ? 'text-text-secondary' : 'text-text-muted cursor-not-allowed'
                    }`}
                  >
                    Safe Zone Outline anzeigen
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="showRiskAreas" 
                    checked={showRiskAreas} 
                    onChange={() => setShowRiskAreas(!showRiskAreas)} 
                    disabled={!image}
                    className={`form-checkbox h-4 w-4 rounded border-gray-300 transition-all duration-300 ${
                      image 
                        ? 'text-accent focus:ring-accent' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  />
                  <label 
                    htmlFor="showRiskAreas" 
                    className={`text-sm transition-colors duration-300 ${
                      image ? 'text-text-secondary' : 'text-text-muted cursor-not-allowed'
                    }`}
                  >
                    Risk Areas anzeigen
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="showGrid" 
                    checked={showGrid} 
                    onChange={() => setShowGrid(!showGrid)} 
                    disabled={!image}
                    className={`form-checkbox h-4 w-4 rounded border-gray-300 transition-all duration-300 ${
                      image 
                        ? 'text-accent focus:ring-accent' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  />
                  <label 
                    htmlFor="showGrid" 
                    className={`text-sm transition-colors duration-300 ${
                      image ? 'text-text-secondary' : 'text-text-muted cursor-not-allowed'
                    }`}
                  >
                    Grid anzeigen (Drittel-Regel)
                  </label>
                </div>
              </div>

              <PrivacyNote type="client" />
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {image && imageSpecs ? (
              <div className="space-y-4">
                <div className="flex justify-center px-2 sm:px-0">
                  <FrameContainer 
                    config={currentConfig}
                    image={image}
                    imageSpecs={imageSpecs}
                    showSafeOutline={showSafeOutline}
                    showRiskAreas={showRiskAreas}
                    showGrid={showGrid}
                    isRatioMismatch={isRatioMismatch || false}
                  />
                </div>
                
                <div className="text-center text-sm text-text-secondary">
                  <p>
                    <span className="text-accent">Blau</span>: Safe Zone | 
                    <span className="text-red-400"> Rot</span>: Risk Areas | 
                    <span className="text-white"> Weiß</span>: Grid
                  </p>
                </div>

                {/* Live-Infos */}
                <div className="bg-surface-secondary p-4 rounded-lg text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-text-secondary">Erkanntes Ratio:</span>
                      <p className="font-medium">{imageSpecs.ratio}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Bildmaße:</span>
                      <p className="font-medium">{imageSpecs.width} × {imageSpecs.height}px</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Frame-Format:</span>
                      <p className="font-medium">{currentConfig.width} × {currentConfig.height}px ({currentConfig.ratio})</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Plattform:</span>
                      <p className="font-medium">{currentConfig.platform} {currentConfig.format}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-surface-secondary">
                    <span className="text-text-secondary">Safe Zone Margins:</span>
                    <p className="font-medium text-xs">
                      Top: {currentConfig.safeZone.top}px | 
                      Bottom: {currentConfig.safeZone.bottom}px | 
                      Left: {currentConfig.safeZone.left}px | 
                      Right: {currentConfig.safeZone.right}px
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-surface-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Grid className="w-8 h-8 text-text-muted" />
                </div>
                <p className="text-text-secondary">Lade ein Bild oder Video hoch, um die Safe Zones zu sehen.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Faq items={faqItems} />
    </>
  );
}

// Frame Container Komponente
interface FrameContainerProps {
  config: SafeZoneConfig;
  image: string;
  imageSpecs: ImageSpecs;
  showSafeOutline: boolean;
  showRiskAreas: boolean;
  showGrid: boolean;
  isRatioMismatch: boolean;
}

function FrameContainer({ 
  config, 
  image, 
  imageSpecs, 
  showSafeOutline, 
  showRiskAreas, 
  showGrid, 
  isRatioMismatch 
}: FrameContainerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameDimensions, setFrameDimensions] = useState({ width: 320, height: 568 });
  
  // Berechne Frame-Größe basierend auf verfügbarem Platz - größer auf Mobile
  const calculateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return { width: 320, height: 568 };
    
    const isMobile = window.innerWidth < 768;
    const frameWidth = isMobile 
      ? Math.min(320, window.innerWidth * 0.85) // 85% auf Mobile
      : Math.min(400, window.innerWidth * 0.4); // 40% auf Desktop für bessere Sichtbarkeit
    const frameHeight = (frameWidth * config.height) / config.width;
    
    return { width: frameWidth, height: frameHeight };
  }, [config.height, config.width]);
  
  useEffect(() => {
    const updateDimensions = () => {
      setFrameDimensions(calculateDimensions());
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [calculateDimensions]);
  
  return (
    <div className="relative">
      {/* Frame Container - Fester Container mit exaktem Seitenverhältnis */}
      <div 
        ref={frameRef}
        className="relative bg-black rounded-lg overflow-hidden mx-auto"
        style={{ 
          width: `${frameDimensions.width}px`,
          height: `${frameDimensions.height}px`,
          border: '2px solid #3bd0ff',
          boxShadow: '0 4px 20px rgba(59, 208, 255, 0.2)',
          maxWidth: '100%' // Ensure it doesn't overflow on very small screens
        }}
      >
        {/* Bild/Video - IMMER in Frame geladen */}
        <img
          src={image}
          alt="Preview"
          className="w-full h-full"
          style={{
            objectFit: 'contain'
          }}
        />
        
        {/* Safe Zone Overlay - Exakt an Frame-Innenfläche ausgerichtet */}
        <SafeZoneOverlay 
          config={config}
          frameRef={frameRef}
          showSafeOutline={showSafeOutline}
          showRiskAreas={showRiskAreas}
          showGrid={showGrid}
          isRatioMismatch={isRatioMismatch}
        />
        
        {/* Format Warning */}
        {!imageSpecs.isStandard && (
          <div 
            className="absolute bg-red-500/90 text-white text-xs p-2 rounded font-medium text-center backdrop-blur-sm"
            style={{
              top: '8px',
              left: '8px',
              right: '8px',
              fontSize: '10px'
            }}
          >
            ⚠️ Unbekanntes Format ({imageSpecs.ratio})
          </div>
        )}
        
        {/* Ratio Mismatch Warning */}
        {isRatioMismatch && (
          <div 
            className="absolute bg-yellow-500/90 text-black text-xs p-2 rounded font-medium text-center backdrop-blur-sm"
            style={{
              bottom: '8px',
              left: '8px',
              right: '8px',
              fontSize: '10px'
            }}
          >
            ⚠️ Format-Mismatch: Bild {imageSpecs.ratio} vs Frame {config.ratio}
          </div>
        )}
      </div>
    </div>
  );
}

// Safe Zone Overlay Komponente
interface SafeZoneOverlayProps {
  config: SafeZoneConfig;
  frameRef: React.RefObject<HTMLDivElement>;
  showSafeOutline: boolean;
  showRiskAreas: boolean;
  showGrid: boolean;
  isRatioMismatch: boolean;
}

function SafeZoneOverlay({ 
  config, 
  frameRef, 
  showSafeOutline, 
  showRiskAreas, 
  showGrid, 
  isRatioMismatch 
}: SafeZoneOverlayProps) {
  const [frameDimensions, setFrameDimensions] = useState({ 
    width: 0, 
    height: 0,
    imageWidth: 0,
    imageHeight: 0,
    imageOffsetX: 0,
    imageOffsetY: 0
  });

  // Berechne Frame-Dimensionen und tatsächliche Bildfläche (object-fit: contain)
  useEffect(() => {
    const updateDimensions = () => {
      if (frameRef.current) {
        // Warte kurz, damit das Layout vollständig gerendert ist
        requestAnimationFrame(() => {
          if (frameRef.current) {
            const rect = frameRef.current.getBoundingClientRect();
            const frameWidth = rect.width;
            const frameHeight = rect.height;
            
            // Berechne tatsächliche Bildfläche mit object-fit: contain
            const frameAspect = frameWidth / frameHeight;
            const configAspect = config.width / config.height;
            
            let imageWidth, imageHeight, imageOffsetX, imageOffsetY;
            
            if (frameAspect > configAspect) {
              // Frame ist breiter - Bild wird an Höhe angepasst
              imageHeight = frameHeight;
              imageWidth = frameHeight * configAspect;
              imageOffsetX = (frameWidth - imageWidth) / 2;
              imageOffsetY = 0;
            } else {
              // Frame ist höher - Bild wird an Breite angepasst
              imageWidth = frameWidth;
              imageHeight = frameWidth / configAspect;
              imageOffsetX = 0;
              imageOffsetY = (frameHeight - imageHeight) / 2;
            }
            
            setFrameDimensions({
              width: frameWidth,
              height: frameHeight,
              imageWidth,
              imageHeight,
              imageOffsetX,
              imageOffsetY
            });
            
            // Debug-Logging für Desktop-Troubleshooting
            if (window.innerWidth >= 768) {
              console.log('[SafeZone] Desktop dimensions:', {
                frameWidth,
                frameHeight,
                imageWidth,
                imageHeight,
                imageOffsetX,
                imageOffsetY,
                frameAspect: frameWidth / frameHeight,
                configAspect: config.width / config.height
              });
            }
          }
        });
      }
    };

    // Initiale Berechnung mit Delay für Desktop
    const timeoutId = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [frameRef, config.width, config.height]);

  // Skalierungsfaktoren basierend auf tatsächlicher Bildfläche
  const scaleX = frameDimensions.imageWidth > 0 ? frameDimensions.imageWidth / config.width : 1;
  const scaleY = frameDimensions.imageHeight > 0 ? frameDimensions.imageHeight / config.height : 1;

  // Safe Zone Margins skalieren mit Halb-Pixel-Offsets für knackscharfe Linien
  // Fallback auf Frame-Dimensionen wenn Bild-Dimensionen nicht verfügbar
  const effectiveImageWidth = frameDimensions.imageWidth > 0 ? frameDimensions.imageWidth : frameDimensions.width;
  const effectiveImageHeight = frameDimensions.imageHeight > 0 ? frameDimensions.imageHeight : frameDimensions.height;
  const effectiveOffsetX = frameDimensions.imageWidth > 0 ? frameDimensions.imageOffsetX : 0;
  const effectiveOffsetY = frameDimensions.imageHeight > 0 ? frameDimensions.imageOffsetY : 0;
  
  const scaledMargins = {
    top: Math.round(config.safeZone.top * scaleY) + 0.5,
    bottom: Math.round(config.safeZone.bottom * scaleY) + 0.5,
    left: Math.round(config.safeZone.left * scaleX) + 0.5,
    right: Math.round(config.safeZone.right * scaleX) + 0.5
  };

  // Safe Zone Rectangle - relativ zur tatsächlichen Bildfläche mit Fallback
  const safeRect = {
    x: effectiveOffsetX + scaledMargins.left,
    y: effectiveOffsetY + scaledMargins.top,
    width: effectiveImageWidth - scaledMargins.left - scaledMargins.right,
    height: effectiveImageHeight - scaledMargins.top - scaledMargins.bottom
  };

  // Risk Areas berechnen - relativ zur tatsächlichen Bildfläche
  const riskAreas = [];
  
  // Top risk area
  if (scaledMargins.top > 0) {
    riskAreas.push({
      x: effectiveOffsetX,
      y: effectiveOffsetY,
      width: effectiveImageWidth,
      height: scaledMargins.top
    });
  }
  
  // Bottom risk area
  if (scaledMargins.bottom > 0) {
    riskAreas.push({
      x: effectiveOffsetX,
      y: effectiveOffsetY + effectiveImageHeight - scaledMargins.bottom,
      width: effectiveImageWidth,
      height: scaledMargins.bottom
    });
  }
  
  // Left risk area
  if (scaledMargins.left > 0) {
    riskAreas.push({
      x: effectiveOffsetX,
      y: effectiveOffsetY + scaledMargins.top,
      width: scaledMargins.left,
      height: effectiveImageHeight - scaledMargins.top - scaledMargins.bottom
    });
  }
  
  // Right risk area
  if (scaledMargins.right > 0) {
    riskAreas.push({
      x: effectiveOffsetX + effectiveImageWidth - scaledMargins.right,
      y: effectiveOffsetY + scaledMargins.top,
      width: scaledMargins.right,
      height: effectiveImageHeight - scaledMargins.top - scaledMargins.bottom
    });
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Risk Areas */}
      {showRiskAreas && riskAreas.map((area, index) => (
        <div
          key={index}
          className="absolute bg-red-500/20 border border-red-500/40"
          style={{
            left: `${area.x}px`,
            top: `${area.y}px`,
            width: `${area.width}px`,
            height: `${area.height}px`,
          }}
        />
      ))}
      
      {/* Safe Zone Outline */}
      {showSafeOutline && (
        <div
          className={`absolute border-2 shadow-lg ${
            isRatioMismatch ? 'border-yellow-400 opacity-75' : 'border-accent'
          }`}
          style={{
            left: `${safeRect.x}px`,
            top: `${safeRect.y}px`,
            width: `${safeRect.width}px`,
            height: `${safeRect.height}px`,
          }}
        />
      )}
      
      {/* Grid (Rule of Thirds) - relativ zur tatsächlichen Bildfläche */}
      {showGrid && (
        <div className="absolute inset-0 opacity-30">
          {/* Vertical lines */}
          <div 
            className="absolute w-px bg-white/50"
            style={{
              left: `${effectiveOffsetX + (effectiveImageWidth / 3) + 0.5}px`,
              top: `${effectiveOffsetY}px`,
              height: `${effectiveImageHeight}px`
            }}
          />
          <div 
            className="absolute w-px bg-white/50"
            style={{
              left: `${effectiveOffsetX + ((effectiveImageWidth * 2) / 3) + 0.5}px`,
              top: `${effectiveOffsetY}px`,
              height: `${effectiveImageHeight}px`
            }}
          />
          {/* Horizontal lines */}
          <div 
            className="absolute h-px bg-white/50"
            style={{
              left: `${effectiveOffsetX}px`,
              top: `${effectiveOffsetY + (effectiveImageHeight / 3) + 0.5}px`,
              width: `${effectiveImageWidth}px`
            }}
          />
          <div 
            className="absolute h-px bg-white/50"
            style={{
              left: `${effectiveOffsetX}px`,
              top: `${effectiveOffsetY + ((effectiveImageHeight * 2) / 3) + 0.5}px`,
              width: `${effectiveImageWidth}px`
            }}
          />
        </div>
      )}
    </div>
  );
}