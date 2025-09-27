'use client';

import { useState, useRef, useCallback } from 'react';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Faq } from '@/components/Faq';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Eye, Palette, CheckCircle, AlertCircle, Info, Copy } from 'lucide-react';
import { checkWCAG, generateContrastColors } from '@/lib/wcag';
import { generateContrastReport, copyToClipboard } from '@/lib/report';

interface ContrastResult {
  normal: ReturnType<typeof checkWCAG>;
  large: ReturnType<typeof checkWCAG>;
}

export default function ContrastCheckerPage() {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [image, setImage] = useState<string | null>(null);
  const [sampledColors, setSampledColors] = useState<Array<{ color: string; x: number; y: number }>>([]);
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateContrast = useCallback(() => {
    const result: ContrastResult = {
      normal: checkWCAG(foreground, background, 'normal'),
      large: checkWCAG(foreground, background, 'large')
    };
    setContrastResult(result);
  }, [foreground, background]);

  const handleColorChange = (type: 'foreground' | 'background', color: string) => {
    if (type === 'foreground') {
      setForeground(color);
    } else {
      setBackground(color);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImage(imageUrl);
      setSampledColors([]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setSampledColors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sampleColorFromImage = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    setSampledColors(prev => [...prev, { color, x, y }]);
  };

  const useSampledColor = (color: string) => {
    setBackground(color);
    calculateContrast();
  };

  const copyReport = async () => {
    if (!contrastResult) return;

    const report = generateContrastReport(foreground, background, {
      normal: {
        ratio: contrastResult.normal.ratio,
        level: contrastResult.normal.level,
        passed: contrastResult.normal.passed
      },
      large: {
        ratio: contrastResult.large.ratio,
        level: contrastResult.large.level,
        passed: contrastResult.large.passed
      }
    });

    const success = await copyToClipboard(report);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const faqItems = [
    {
      question: 'Was sind WCAG-Standards?',
      answer: 'WCAG (Web Content Accessibility Guidelines) sind internationale Standards für barrierefreie Webinhalte. Sie definieren Mindestkontrastverhältnisse für Text auf Hintergründen, um Lesbarkeit für alle Nutzer zu gewährleisten.'
    },
    {
      question: 'Was bedeuten AA und AAA?',
      answer: 'AA ist das Mindestniveau für Barrierefreiheit (4.5:1 für normalen Text, 3:1 für großen Text). AAA ist das höchste Niveau (7:1 für normalen Text, 4.5:1 für großen Text) und bietet optimale Lesbarkeit.'
    },
    {
      question: 'Wie funktioniert der Bild-Sampler?',
      answer: 'Der Bild-Sampler ermöglicht es dir, Farben direkt aus einem Bild zu entnehmen. Klicke auf beliebige Stellen im Bild, um die Hintergrundfarbe zu sammeln und den Kontrast zu testen.'
    },
    {
      question: 'Was ist großer Text?',
      answer: 'Großer Text ist definiert als mindestens 18pt (24px) oder 14pt (18.67px) fett. Für solchen Text gelten niedrigere Kontrastanforderungen, da er leichter lesbar ist.'
    }
  ];

  return (
    <>
      <Seo 
        title="Contrast & Accessibility Checker"
        description="Prüfe WCAG-Konformität deiner Farben. Mit Bild-Sampler für realistische Kontrastprüfungen. Teste Farbpaare auf Barrierefreiheit und erhalte Verbesserungsvorschläge."
        canonical="/contrast-checker"
      />
      
      <Hero 
        title="Contrast & Accessibility Checker"
        subtitle="WCAG-konforme Farbkontraste prüfen"
        description="Teste Farbpaare auf Barrierefreiheit nach WCAG 2.1 Standards. Mit Bild-Sampler für realistische Kontrastprüfungen und automatischen Verbesserungsvorschlägen."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Farben eingeben</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Textfarbe</label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value={foreground}
                      onChange={(e) => handleColorChange('foreground', e.target.value)}
                      className="w-12 h-10 p-1 border border-input rounded"
                    />
                    <Input
                      value={foreground}
                      onChange={(e) => handleColorChange('foreground', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Hintergrundfarbe</label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value={background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-12 h-10 p-1 border border-input rounded"
                    />
                    <Input
                      value={background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={calculateContrast} className="w-full">
                Kontrast prüfen
              </Button>

              {/* Color Preview */}
              <div 
                className="h-20 rounded-lg border flex items-center justify-center text-lg font-semibold"
                style={{ 
                  backgroundColor: background, 
                  color: foreground 
                }}
              >
                Beispieltext
              </div>
            </CardContent>
          </Card>

          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Bild-Sampler (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!image ? (
                <div className="border-2 border-dashed border-surface-secondary rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">
                    Lade ein Bild hoch, um Farben zu sammeln
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
                    <canvas
                      ref={canvasRef}
                      className="w-full h-48 object-cover rounded-lg cursor-crosshair border"
                      onMouseDown={sampleColorFromImage}
                      style={{ backgroundImage: `url(${image})`, backgroundSize: 'cover' }}
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
                  
                  {sampledColors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Gesammelte Farben:</h4>
                      <div className="flex flex-wrap gap-2">
                        {sampledColors.map((sample, index) => (
                          <button
                            key={index}
                            onClick={() => setBackgroundColor(sample.color)}
                            className="w-8 h-8 rounded border-2 border-white shadow-lg hover:scale-110 transition-transform"
                            style={{ backgroundColor: sample.color }}
                            title={`Verwende ${sample.color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-text-muted">
                    Klicke auf das Bild, um Farben zu sammeln
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {contrastResult ? (
            <>
              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Kontrast-Ergebnisse</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-surface-secondary rounded-lg">
                      <h4 className="font-medium mb-2">Normaler Text</h4>
                      <div className="text-2xl font-bold mb-1">{contrastResult.normal.ratio}:1</div>
                      <div className={`text-sm ${contrastResult.normal.passed ? 'text-green-400' : 'text-red-400'}`}>
                        {contrastResult.normal.level}
                      </div>
                      {contrastResult.normal.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mt-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mt-2" />
                      )}
                    </div>
                    
                    <div className="text-center p-4 bg-surface-secondary rounded-lg">
                      <h4 className="font-medium mb-2">Großer Text</h4>
                      <div className="text-2xl font-bold mb-1">{contrastResult.large.ratio}:1</div>
                      <div className={`text-sm ${contrastResult.large.passed ? 'text-green-400' : 'text-red-400'}`}>
                        {contrastResult.large.level}
                      </div>
                      {contrastResult.large.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mt-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mt-2" />
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    {contrastResult.normal.passed && contrastResult.large.passed ? (
                      <div className="flex items-center justify-center space-x-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Alle Tests bestanden!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Kontrast zu niedrig</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {(!contrastResult.normal.passed || !contrastResult.large.passed) && (
                <Card className="card-custom">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="w-5 h-5" />
                      <span>Verbesserungsvorschläge</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Hellerer Hintergrund:</h4>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: generateContrastColors(background).lighter }}
                          />
                          <span className="text-sm font-mono">
                            {generateContrastColors(background).lighter}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBackground(generateContrastColors(background).lighter)}
                          >
                            Verwenden
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Dunklerer Hintergrund:</h4>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: generateContrastColors(background).darker }}
                          />
                          <span className="text-sm font-mono">
                            {generateContrastColors(background).darker}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBackground(generateContrastColors(background).darker)}
                          >
                            Verwenden
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    Bericht kopieren
                  </>
                )}
              </Button>
            </>
          ) : (
            <Card className="card-custom">
              <CardContent className="text-center py-12">
                <Eye className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">
                  Wähle Farben aus und klicke "Kontrast prüfen" für eine Analyse.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="card-custom">
            <CardHeader>
              <CardTitle>WCAG-Standards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>AA (Normal):</span>
                <span className="font-mono">≥ 4.5:1</span>
              </div>
              <div className="flex justify-between items-center">
                <span>AA (Groß):</span>
                <span className="font-mono">≥ 3:1</span>
              </div>
              <div className="flex justify-between items-center">
                <span>AAA (Normal):</span>
                <span className="font-mono">≥ 7:1</span>
              </div>
              <div className="flex justify-between items-center">
                <span>AAA (Groß):</span>
                <span className="font-mono">≥ 4.5:1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PrivacyNote type="client" />

      <Faq items={faqItems} />
    </>
  );
}






