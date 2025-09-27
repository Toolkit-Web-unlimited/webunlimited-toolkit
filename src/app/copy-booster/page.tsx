'use client';

import { useState } from 'react';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Faq } from '@/components/Faq';
import { PrivacyNote } from '@/components/PrivacyNote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Loader2, Copy, CheckCircle, AlertCircle, Info, Sparkles, Target, TrendingUp } from 'lucide-react';
import { generateCopyBoosterReport, copyToClipboard } from '@/lib/report';

interface CopyVariations {
  shorter: string;
  withProof: string;
  emotional: string;
}

interface CopyResponse {
  variations: CopyVariations;
  method: 'heuristic' | 'openai';
}

export default function CopyBoosterPage() {
  const [headline, setHeadline] = useState('');
  const [context, setContext] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedVariations, setCopiedVariations] = useState<Set<string>>(new Set());
  const [copiedReport, setCopiedReport] = useState(false);

  const platforms = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'general', label: 'Allgemein' }
  ];

  const boostCopy = async () => {
    if (!headline.trim() || !context.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headline: headline.trim(),
          context: context.trim(),
          platform: platform
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Copy-Boost fehlgeschlagen');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const copyVariation = async (variation: string, type: string) => {
    const success = await copyToClipboard(variation);
    if (success) {
      setCopiedVariations(prev => new Set(prev).add(type));
      setTimeout(() => {
        setCopiedVariations(prev => {
          const newSet = new Set(prev);
          newSet.delete(type);
          return newSet;
        });
      }, 2000);
    }
  };

  const copyFullReport = async () => {
    if (!result) return;

    const report = generateCopyBoosterReport(
      headline,
      result.variations,
      context,
      platforms.find(p => p.value === platform)?.label || platform
    );

    const success = await copyToClipboard(report);
    if (success) {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const faqItems = [
    {
      question: 'Wie funktioniert der Copy Booster?',
      answer: 'Der Copy Booster verwendet entweder OpenAI GPT-3.5-turbo (wenn API-Key verfügbar) oder regelbasierte Heuristiken, um deine Headlines in 3 optimierte Varianten zu verwandeln: kürzer, mit Proof und emotional.'
    },
    {
      question: 'Welche Methoden werden verwendet?',
      answer: 'Bei verfügbarem OpenAI API-Key wird GPT-3.5-turbo für intelligente Varianten verwendet. Als Fallback nutzen wir regelbasierte Heuristiken mit plattformspezifischen Optimierungen.'
    },
    {
      question: 'Sind die Varianten plattformspezifisch?',
      answer: 'Ja, jede Plattform hat ihre eigenen Besonderheiten. Instagram nutzt Emojis und kurze Texte, LinkedIn fokussiert auf professionelle Sprache, TikTok auf virale Elemente.'
    },
    {
      question: 'Werden meine Daten gespeichert?',
      answer: 'Nein, alle Texte werden nur zur Generierung der Varianten verarbeitet und nicht dauerhaft gespeichert. Bei OpenAI-Nutzung gelten deren Datenschutzrichtlinien.'
    },
    {
      question: 'Warum gibt es manchmal ähnliche Varianten?',
      answer: 'Das kann passieren, wenn die ursprüngliche Headline bereits sehr optimiert ist oder bei der heuristischen Methode. Die AI-Methode generiert meist vielfältigere Varianten.'
    }
  ];

  return (
    <>
      <Seo 
        title="AI Copy Booster"
        description="Verbessere deine Headlines mit AI. Erhalte 3 Varianten: Kürzer & klar, mit Proof/Numbers oder emotional/Hook. Optimiert für verschiedene Plattformen mit regelbasierter Heuristik oder OpenAI Integration."
        canonical="/copy-booster"
      />
      
      <Hero 
        title="AI Copy Booster"
        subtitle="Headlines mit KI optimieren"
        description="Gib eine Headline und Kontext ein, erhalte 3 optimierte Varianten für verschiedene Plattformen. Nutze regelbasierte Heuristiken oder OpenAI für intelligente Verbesserungen."
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Input</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Headline</label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Deine aktuelle Headline..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kontext</label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Produkt, Zielgruppe, Kampagne..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Plattform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button 
                onClick={boostCopy}
                disabled={loading || !headline.trim() || !context.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booste...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Headline boosten
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Original Preview */}
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Original</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {headline ? (
                <div className="space-y-4">
                  <div className="p-4 bg-surface-secondary rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{headline}</h3>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p><strong>Kontext:</strong> {context}</p>
                      <p><strong>Plattform:</strong> {platforms.find(p => p.value === platform)?.label}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-text-muted">
                    <p><strong>Zeichen:</strong> {headline.length}</p>
                    <p><strong>Wörter:</strong> {headline.split(' ').length}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Target className="w-12 h-12 mx-auto mb-4" />
                  <p>Gib eine Headline ein, um eine Vorschau zu sehen.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Optimierte Varianten</h2>
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                {result.method === 'openai' ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Powered by OpenAI</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>Heuristische Optimierung</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Shorter Variant */}
              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <span>1️⃣</span>
                    <span>Kürzer & Klar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-surface-secondary rounded-lg">
                    <p className="font-medium">{result.variations.shorter}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{result.variations.shorter.length} Zeichen</span>
                    <span>{result.variations.shorter.split(' ').length} Wörter</span>
                  </div>
                  
                  <Button
                    onClick={() => copyVariation(result.variations.shorter, 'shorter')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    {copiedVariations.has('shorter') ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Proof Variant */}
              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <span>2️⃣</span>
                    <span>Mit Proof</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-surface-secondary rounded-lg">
                    <p className="font-medium">{result.variations.withProof}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{result.variations.withProof.length} Zeichen</span>
                    <span>{result.variations.withProof.split(' ').length} Wörter</span>
                  </div>
                  
                  <Button
                    onClick={() => copyVariation(result.variations.withProof, 'proof')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    {copiedVariations.has('proof') ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Emotional Variant */}
              <Card className="card-custom">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <span>3️⃣</span>
                    <span>Emotional/Hook</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-surface-secondary rounded-lg">
                    <p className="font-medium">{result.variations.emotional}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{result.variations.emotional.length} Zeichen</span>
                    <span>{result.variations.emotional.split(' ').length} Wörter</span>
                  </div>
                  
                  <Button
                    onClick={() => copyVariation(result.variations.emotional, 'emotional')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    {copiedVariations.has('emotional') ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Tips and Full Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-custom border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-400">
                    <Info className="w-5 h-5" />
                    <span>Verwendungstipps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Kürzer:</strong> Ideal für Anzeigen und Social Media Posts</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Mit Proof:</strong> Perfekt für Landing Pages und Verkaufsseiten</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong>Emotional:</strong> Gut für virale Inhalte und Engagement</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Teste alle Varianten in A/B-Tests für beste Ergebnisse</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-custom">
                <CardHeader>
                  <CardTitle>Vollständiger Bericht</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    Kopiere einen vollständigen Bericht mit allen Varianten und Kontext für deine Dokumentation.
                  </p>
                  <Button 
                    onClick={copyFullReport}
                    variant="outline"
                    className="w-full"
                  >
                    {copiedReport ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Bericht kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Vollständigen Bericht kopieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!result && !loading && (
          <Card className="card-custom">
            <CardContent className="text-center py-12">
              <Zap className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">
                Gib eine Headline und Kontext ein, um optimierte Varianten zu erhalten.
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






