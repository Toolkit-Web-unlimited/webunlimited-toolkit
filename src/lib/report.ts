/**
 * Report generation utilities for copying results to clipboard
 */

export interface AdEstimatorReport {
  score: number;
  platform: string;
  imageSpecs: {
    width: number;
    height: number;
    ratio: string;
    sizeKB: number;
    type: string;
  };
  textAnalysis: {
    headline: string;
    body: string;
    cta: string;
  };
  pros: string[];
  cons: string[];
  suggestions: string[];
}

export interface SiteAnalyzerReport {
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

/**
 * Generate Ad Estimator report text
 */
export function generateAdEstimatorReport(report: AdEstimatorReport): string {
  const { score, platform, imageSpecs, textAnalysis, pros, cons, suggestions } = report;
  
  return `
🎯 AD CREATIVE ESTIMATOR - ERGEBNISBERICHT

📊 BEWERTUNG: ${score}/100 Punkte
📱 PLATTFORM: ${platform}

🖼️ BILD-SPEZIFIKATIONEN:
• Abmessungen: ${imageSpecs.width} × ${imageSpecs.height}px
• Seitenverhältnis: ${imageSpecs.ratio}
• Dateigröße: ${imageSpecs.sizeKB}KB
• Format: ${imageSpecs.type}

📝 TEXT-ANALYSE:
• Headline: "${textAnalysis.headline}"
• Body: "${textAnalysis.body}"
• CTA: "${textAnalysis.cta}"

✅ STÄRKEN:
${pros.map(pro => `• ${pro}`).join('\n')}

❌ SCHWÄCHEN:
${cons.map(con => `• ${con}`).join('\n')}

💡 VERBESSERUNGSVORSCHLÄGE:
${suggestions.map(suggestion => `• ${suggestion}`).join('\n')}

---
Generiert mit Web Unlimited Toolkit
https://toolkit.webunlimited.ch
  `.trim();
}

/**
 * Generate Site Analyzer report text
 */
export function generateSiteAnalyzerReport(report: SiteAnalyzerReport): string {
  const { url, score, title, description, h1, assets, ogTags, issues, suggestions } = report;
  
  return `
🔍 WEBSITE ANALYZER - ERGEBNISBERICHT

🌐 URL: ${url}
📊 SEO-SCORE: ${score}/100 Punkte

📝 META-DATEN:
• Title: "${title.text}" (${title.length} Zeichen) ${title.optimal ? '✅' : '❌'}
• Description: "${description.text}" (${description.length} Zeichen) ${description.optimal ? '✅' : '❌'}
• H1: ${h1.present ? `"${h1.text}" ✅` : 'Nicht gefunden ❌'}

🎨 OG-TAGS:
• Title: ${ogTags.title ? '✅' : '❌'}
• Description: ${ogTags.description ? '✅' : '❌'}
• Image: ${ogTags.image ? '✅' : '❌'}

📦 ASSETS:
• Gesamtgröße: ${assets.totalSizeKB}KB
• CSS-Dateien: ${assets.cssCount}
• JS-Dateien: ${assets.jsCount}

❌ IDENTIFIZIERTE PROBLEME:
${issues.map(issue => `• ${issue}`).join('\n')}

💡 OPTIMIERUNGSVORSCHLÄGE:
${suggestions.map(suggestion => `• ${suggestion}`).join('\n')}

---
Generiert mit Web Unlimited Toolkit
https://toolkit.webunlimited.ch
  `.trim();
}

/**
 * Generate Copy Booster report text
 */
export function generateCopyBoosterReport(
  original: string,
  variations: {
    shorter: string;
    withProof: string;
    emotional: string;
  },
  context: string,
  platform: string
): string {
  return `
✨ COPY BOOSTER - ERGEBNISBERICHT

📝 ORIGINAL:
"${original}"

🎯 VARIANTEN:

1️⃣ KÜRZER & KLAR:
"${variations.shorter}"

2️⃣ MIT PROOF/NUMBERS:
"${variations.withProof}"

3️⃣ EMOTIONAL/HOOK:
"${variations.emotional}"

📊 KONTEXT:
• Zielgruppe: ${context}
• Plattform: ${platform}

💡 TIPPS:
• Teste alle Varianten in A/B-Tests
• Verwende die emotionale Version für Social Media
• Die Proof-Version eignet sich für Landing Pages
• Kürzere Versionen funktionieren gut in Anzeigen

---
Generiert mit Web Unlimited Toolkit
https://toolkit.webunlimited.ch
  `.trim();
}

/**
 * Generate Contrast Checker report text
 */
export function generateContrastReport(
  foreground: string,
  background: string,
  results: {
    normal: { ratio: number; level: string; passed: boolean };
    large: { ratio: number; level: string; passed: boolean };
  }
): string {
  return `
🎨 CONTRAST CHECKER - ERGEBNISBERICHT

🎨 FARBEN:
• Vordergrund: ${foreground}
• Hintergrund: ${background}

📊 KONTRAST-VERHÄLTNISSE:
• Normaler Text: ${results.normal.ratio}:1 (${results.normal.level}) ${results.normal.passed ? '✅' : '❌'}
• Großer Text: ${results.large.ratio}:1 (${results.large.level}) ${results.large.passed ? '✅' : '❌'}

📋 WCAG-STANDARDS:
• AA (Normal): Mindestens 4.5:1
• AA (Groß): Mindestens 3:1
• AAA (Normal): Mindestens 7:1
• AAA (Groß): Mindestens 4.5:1

${results.normal.passed && results.large.passed 
  ? '✅ Alle Tests bestanden! Deine Farben sind barrierefrei.'
  : '❌ Kontrast zu niedrig. Verwende dunklere oder hellere Farben.'
}

---
Generiert mit Web Unlimited Toolkit
https://toolkit.webunlimited.ch
  `.trim();
}

/**
 * Copy text to clipboard (browser API)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}






