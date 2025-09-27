'use client';

import { useState } from 'react';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Faq } from '@/components/Faq';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, CheckCircle, AlertCircle, Info, Copy, Globe, FileText, Image, Code } from 'lucide-react';
import { generateSiteAnalyzerReport, copyToClipboard } from '@/lib/report';

interface AnalysisResult {
  url: string;
  score: number;
  title: {
    text: string;
    length: number;
    optimal: boolean;
  };
  description: {
    text: string;
    length: number;
    optimal: boolean;
  };
  h1: {
    text: string;
    present: boolean;
  };
  assets: {
    totalSizeKB: number;
    cssCount: number;
    jsCount: number;
  };
  ogTags: {
    title: boolean;
    description: boolean;
    image: boolean;
  };
  issues: string[];
  suggestions: string[];
}

export default function SiteAnalyzerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeSite = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/site-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analyse fehlgeschlagen');
      }

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    if (!analysis) return;

    const report = generateSiteAnalyzerReport(analysis);
    const success = await copyToClipboard(report);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const faqItems = [
    {
      question: 'Was wird bei der Website-Analyse geprüft?',
      answer: 'Wir analysieren grundlegende SEO-Elemente wie Title-Tags, Meta-Descriptions, H1-Tags, Open Graph Tags, Favicon und Asset-Größen. Die Analyse erfolgt auf der HTML-Ebene ohne JavaScript-Ausführung.'
    },
    {
      question: 'Wie wird der SEO-Score berechnet?',
      answer: 'Der Score (0-100) basiert auf verschiedenen Faktoren: Title-Tag (20%), Meta-Description (20%), H1-Tag (15%), Open Graph Tags (20%), Favicon (10%) und Asset-Optimierung (15%).'
    },
    {
      question: 'Werden meine Daten gespeichert?',
      answer: 'Nein, alle Analysen werden in Echtzeit durchgeführt und keine Daten werden dauerhaft gespeichert. Die Website wird nur zur Analyse abgerufen und dann verworfen.'
    },
    {
      question: 'Welche Websites können analysiert werden?',
      answer: 'Alle öffentlich zugänglichen HTTPS-Websites können analysiert werden. Die Analyse funktioniert am besten mit statischen HTML-Inhalten und berücksichtigt keine JavaScript-generierten Inhalte.'
    },
    {
      question: 'Warum dauert die Analyse manchmal länger?',
      answer: 'Die Analyse kann bis zu 10 Sekunden dauern, je nach Ladezeit der Website. Langsame oder nicht erreichbare Websites werden nach dem Timeout abgebrochen.'
    }
  ];

  return (
    <>
      <Seo 
        title="Website Analyzer"
        description="Analysiere Websites auf SEO-Grundlagen. Titel, Description, H1, OG-Tags und Asset-Größen. Erhalte einen SEO-Score und detaillierte Verbesserungsvorschläge für deine Website."
        canonical="/site-analyzer"
      />
      
      <Hero 
        title="Website Analyzer"
        subtitle="SEO-Grundlagen analysieren"
        description="Gib eine URL ein und erhalte eine sofortige Analyse der wichtigsten SEO-Elemente. Prüfe Title-Tags, Meta-Descriptions, H1-Tags, Open Graph Tags und mehr."
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Input Section */}
        <Card className="card-custom">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Website analysieren</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && analyzeSite()}
              />
              <Button 
                onClick={analyzeSite}
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analysieren
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {analysis && (
          <div className="space-y-6">
            {/* Score Overview */}
            <Card className="card-custom">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>SEO-Score</span>
                  </span>
                  <span className="text-3xl font-bold gradient-text">{analysis.score}/100</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-surface-secondary rounded-full h-4 mb-4">
                  <div 
                    className="bg-gradient-to-r from-accent to-blue-400 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.score}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {analysis.score >= 80 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : analysis.score >= 60 ? (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-sm">
                    {analysis.score >= 80 ? 'Sehr gut optimiert' : 
                     analysis.score >= 60 ? 'Gut optimiert' : 
                     'Verbesserungswürdig'}
                  </span>
                </div>
                
                <div className="mt-4 text-sm text-text-secondary">
                  <p><strong>Analysierte URL:</strong> {analysis.url}</p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis */}
            <Tabs defaultValue="meta" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="meta">Meta-Daten</TabsTrigger>
                <TabsTrigger value="structure">Struktur</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="meta" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="card-custom">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <FileText className="w-5 h-5" />
                        <span>Title-Tag</span>
                        {analysis.title.optimal ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Text:</p>
                        <p className="text-sm text-text-secondary bg-surface-secondary p-2 rounded">
                          {analysis.title.text || 'Nicht gefunden'}
                        </p>
                        <p className="text-xs text-text-muted">
                          Länge: {analysis.title.length} Zeichen 
                          {analysis.title.optimal ? ' ✅' : ' ❌'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-custom">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <FileText className="w-5 h-5" />
                        <span>Meta-Description</span>
                        {analysis.description.optimal ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Text:</p>
                        <p className="text-sm text-text-secondary bg-surface-secondary p-2 rounded">
                          {analysis.description.text || 'Nicht gefunden'}
                        </p>
                        <p className="text-xs text-text-muted">
                          Länge: {analysis.description.length} Zeichen 
                          {analysis.description.optimal ? ' ✅' : ' ❌'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="structure" className="space-y-4">
                <Card className="card-custom">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>H1-Tag</span>
                      {analysis.h1.present ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Text:</p>
                      <p className="text-sm text-text-secondary bg-surface-secondary p-2 rounded">
                        {analysis.h1.text || 'Nicht gefunden'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <Card className="card-custom">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Image className="w-5 h-5" />
                      <span>Open Graph Tags</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">og:title</span>
                        {analysis.ogTags.title ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">og:description</span>
                        {analysis.ogTags.description ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">og:image</span>
                        {analysis.ogTags.image ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card className="card-custom">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="w-5 h-5" />
                      <span>Assets</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-accent">{analysis.assets.totalSizeKB}KB</p>
                        <p className="text-xs text-text-muted">Gesamtgröße</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-accent">{analysis.assets.cssCount}</p>
                        <p className="text-xs text-text-muted">CSS-Dateien</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-accent">{analysis.assets.jsCount}</p>
                        <p className="text-xs text-text-muted">JS-Dateien</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Issues and Suggestions */}
            {(analysis.issues.length > 0 || analysis.suggestions.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.issues.length > 0 && (
                  <Card className="card-custom border-red-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>Identifizierte Probleme</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.issues.map((issue, index) => (
                          <li key={index} className="text-sm flex items-start space-x-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.suggestions.length > 0 && (
                  <Card className="card-custom border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-blue-400">
                        <Info className="w-5 h-5" />
                        <span>Optimierungsvorschläge</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm flex items-start space-x-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Copy Report Button */}
            <Button 
              onClick={copyReport}
              className="w-full"
              variant="outline"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bericht kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Bericht kopieren
                </>
              )}
            </Button>
          </div>
        )}

        {!analysis && !loading && (
          <Card className="card-custom">
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">
                Gib eine URL ein und klicke "Analysieren", um eine SEO-Analyse zu starten.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <PrivacyNote type="api" />

      <Faq items={faqItems} />
    </>
  );
}






