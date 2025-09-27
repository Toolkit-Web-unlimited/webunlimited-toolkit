'use client';

import { useState, useRef } from 'react';
import { Metadata } from 'next';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Faq } from '@/components/Faq';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { analyzeText, checkPlatformRequirements } from '@/lib/text';
import { generateAdEstimatorReport, copyToClipboard } from '@/lib/report';

interface ImageSpecs {
  width: number;
  height: number;
  ratio: string;
  sizeKB: number;
  type: string;
}

interface PlatformSpecs {
  name: string;
  ratio: string;
  minWidth: number;
  minHeight: number;
  recommendedWidth: number;
  recommendedHeight: number;
}

const PLATFORM_SPECS: Record<string, PlatformSpecs> = {
  'instagram-feed': {
    name: 'Instagram Feed',
    ratio: '1:1',
    minWidth: 320,
    minHeight: 320,
    recommendedWidth: 1080,
    recommendedHeight: 1080
  },
  'instagram-story': {
    name: 'Instagram Story',
    ratio: '9:16',
    minWidth: 720,
    minHeight: 1280,
    recommendedWidth: 1080,
    recommendedHeight: 1920
  },
  'instagram-reel': {
    name: 'Instagram Reel',
    ratio: '9:16',
    minWidth: 720,
    minHeight: 1280,
    recommendedWidth: 1080,
    recommendedHeight: 1920
  },
  'facebook-feed': {
    name: 'Facebook Feed',
    ratio: '1:1',
    minWidth: 600,
    minHeight: 600,
    recommendedWidth: 1200,
    recommendedHeight: 1200
  },
  'tiktok': {
    name: 'TikTok',
    ratio: '9:16',
    minWidth: 720,
    minHeight: 1280,
    recommendedWidth: 1080,
    recommendedHeight: 1920
  },
  'linkedin': {
    name: 'LinkedIn',
    ratio: '1.91:1',
    minWidth: 552,
    minHeight: 289,
    recommendedWidth: 1200,
    recommendedHeight: 627
  }
};

export default function AdEstimatorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageSpecs, setImageSpecs] = useState<ImageSpecs | null>(null);
  const [platform, setPlatform] = useState<string>('instagram-feed');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [cta, setCta] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImage(imageUrl);

      // Create image element to get dimensions
      const img = new Image();
      img.onload = () => {
        const specs: ImageSpecs = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          ratio: `${img.naturalWidth}:${img.naturalHeight}`,
          sizeKB: Math.round(file.size / 1024),
          type: file.type
        };
        setImageSpecs(specs);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImageSpecs(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeAd = () => {
    if (!imageSpecs || !headline.trim() || !body.trim() || !cta.trim()) {
      return;
    }

    const textAnalysis = analyzeText(`${headline} ${body} ${cta}`);
    const platformReq = checkPlatformRequirements(headline, platform);
    const platformSpecs = PLATFORM_SPECS[platform];

    // Calculate score based on multiple factors
    let calculatedScore = 0;

    // Image specs (30 points)
    const aspectRatio = imageSpecs.width / imageSpecs.height;
    const targetRatio = platformSpecs.ratio === '1:1' ? 1 : 
                      platformSpecs.ratio === '9:16' ? 9/16 : 
                      platformSpecs.ratio === '1.91:1' ? 1.91 : 1;
    
    const ratioDiff = Math.abs(aspectRatio - targetRatio);
    if (ratioDiff < 0.1) calculatedScore += 15;
    else if (ratioDiff < 0.2) calculatedScore += 10;
    else calculatedScore += 5;

    if (imageSpecs.width >= platformSpecs.minWidth && imageSpecs.height >= platformSpecs.minHeight) {
      calculatedScore += 15;
    } else {
      calculatedScore += 5;
    }

    // Text analysis (40 points)
    if (textAnalysis.ctaWords.length > 0) calculatedScore += 10;
    if (textAnalysis.numbers.length > 0) calculatedScore += 10;
    if (!textAnalysis.hasPassiveVoice) calculatedScore += 10;
    if (textAnalysis.readabilityScore > 60) calculatedScore += 10;

    // Platform requirements (30 points)
    if (platformReq.meetsRequirements) calculatedScore += 30;
    else calculatedScore += 20 - platformReq.issues.length * 5;

    setScore(Math.max(0, Math.min(100, calculatedScore)));

    // Generate pros and cons
    const pros: string[] = [];
    const cons: string[] = [];
    const suggestions: string[] = [];

    if (ratioDiff < 0.1) pros.push('Perfektes Seitenverhältnis für die gewählte Plattform');
    else cons.push(`Seitenverhältnis nicht optimal (${imageSpecs.ratio} vs. ${platformSpecs.ratio})`);

    if (imageSpecs.width >= platformSpecs.recommendedWidth) pros.push('Hohe Bildauflösung für beste Qualität');
    else suggestions.push('Verwende eine höhere Auflösung für bessere Qualität');

    if (textAnalysis.ctaWords.length > 0) pros.push('Call-to-Action vorhanden');
    else suggestions.push('Füge einen Call-to-Action hinzu (z.B. "Jetzt", "Hier")');

    if (textAnalysis.numbers.length > 0) pros.push('Zahlen/Beweise erhöhen Glaubwürdigkeit');
    else suggestions.push('Füge Zahlen oder konkrete Beweise hinzu');

    if (!textAnalysis.hasPassiveVoice) pros.push('Aktive Sprache verwendet');
    else suggestions.push('Verwende aktive statt passive Sprache');

    if (platformReq.issues.length === 0) pros.push('Erfüllt alle Plattform-Anforderungen');
    else {
      platformReq.issues.forEach(issue => cons.push(issue));
      platformReq.suggestions.forEach(suggestion => suggestions.push(suggestion));
    }

    setAnalysis({
      textAnalysis,
      platformReq,
      pros,
      cons,
      suggestions
    });
  };

  const copyReport = async () => {
    if (!analysis || score === null || !imageSpecs) return;

    const report = generateAdEstimatorReport({
      score,
      platform: PLATFORM_SPECS[platform].name,
      imageSpecs,
      textAnalysis: {
        headline,
        body,
        cta
      },
      pros: analysis.pros,
      cons: analysis.cons,
      suggestions: analysis.suggestions
    });

    const success = await copyToClipboard(report);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const faqItems = [
    {
      question: 'Wie wird der Score berechnet?',
      answer: 'Der Score (0-100) basiert auf Bild-Spezifikationen (30%), Text-Analyse (40%) und Plattform-Anforderungen (30%). Perfekte Übereinstimmung mit allen Kriterien ergibt 100 Punkte.'
    },
    {
      question: 'Welche Bildformate werden unterstützt?',
      answer: 'Alle gängigen Bildformate (JPG, PNG, GIF, WebP) werden unterstützt. Die Dateigröße sollte unter 5MB liegen für optimale Performance.'
    },
    {
      question: 'Wie genau sind die Plattform-Spezifikationen?',
      answer: 'Die Spezifikationen basieren auf den aktuellen offiziellen Richtlinien der jeweiligen Plattformen. Sie werden regelmäßig aktualisiert.'
    },
    {
      question: 'Was ist der Unterschied zwischen Min- und Recommended-Auflösung?',
      answer: 'Die Mindestauflösung ist die technische Untergrenze. Die empfohlene Auflösung sorgt für optimale Qualität auf allen Geräten und Bildschirmgrößen.'
    }
  ];

  return (
    <>
      <Seo 
        title="Ad Creative Estimator"
        description="Bewerte deine Ad Creatives mit heuristischen Regeln. Upload ein Bild und erhalte sofort eine Bewertung von 0-100 mit detaillierten Verbesserungsvorschlägen."
        canonical="/ad-estimator"
      />
      
      <Hero 
        title="Ad Creative Estimator"
        subtitle="Heuristische Bewertung deiner Ad Creatives"
        description="Upload ein Bild, fülle die Textelemente aus und erhalte eine sofortige Bewertung mit detaillierten Verbesserungsvorschlägen. Optimiert für alle gängigen Social Media Plattformen."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Bild Upload</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!image ? (
                <div className="border-2 border-dashed border-surface-secondary rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">
                    Ziehe ein Bild hierher oder klicke zum Auswählen
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Bild auswählen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={image}
                      alt="Uploaded creative"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {imageSpecs && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Abmessungen:</span>
                        <p className="font-medium">{imageSpecs.width} × {imageSpecs.height}px</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Verhältnis:</span>
                        <p className="font-medium">{imageSpecs.ratio}</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Größe:</span>
                        <p className="font-medium">{imageSpecs.sizeKB}KB</p>
                      </div>
                      <div>
                        <span className="text-text-secondary">Format:</span>
                        <p className="font-medium">{imageSpecs.type}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-custom">
            <CardHeader>
              <CardTitle>Plattform & Texte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Plattform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {Object.entries(PLATFORM_SPECS).map(([key, spec]) => (
                    <option key={key} value={key}>
                      {spec.name} ({spec.ratio})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Headline</label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Deine Headline..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Body Text</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Beschreibung deines Angebots..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Call-to-Action</label>
                <Input
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="z.B. 'Jetzt kaufen', 'Mehr erfahren'..."
                />
              </div>

              <Button 
                onClick={analyzeAd}
                className="w-full"
                disabled={!imageSpecs || !headline.trim() || !body.trim() || !cta.trim()}
              >
                Ad Creative bewerten
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {score !== null && analysis && (
            <>
              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Bewertung</span>
                    <span className="text-2xl font-bold gradient-text">{score}/100</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-surface-secondary rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-accent to-blue-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {score >= 80 ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : score >= 60 ? (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-sm">
                      {score >= 80 ? 'Sehr gut' : score >= 60 ? 'Gut' : 'Verbesserungswürdig'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="pros" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pros">Stärken</TabsTrigger>
                  <TabsTrigger value="cons">Schwächen</TabsTrigger>
                  <TabsTrigger value="suggestions">Tipps</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pros" className="space-y-2">
                  {analysis.pros.length > 0 ? (
                    analysis.pros.map((pro, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{pro}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p>Keine Stärken identifiziert</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="cons" className="space-y-2">
                  {analysis.cons.length > 0 ? (
                    analysis.cons.map((con, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{con}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p>Keine Schwächen gefunden!</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="suggestions" className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <Button 
                onClick={copyReport}
                className="w-full"
                variant="outline"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Ergebnis kopieren
                  </>
                )}
              </Button>
            </>
          )}

          {score === null && (
            <Card className="card-custom">
              <CardContent className="text-center py-12">
                <Info className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">
                  Lade ein Bild hoch und fülle alle Felder aus, um eine Bewertung zu erhalten.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PrivacyNote type="client" />

      <Faq items={faqItems} />
    </>
  );
}






