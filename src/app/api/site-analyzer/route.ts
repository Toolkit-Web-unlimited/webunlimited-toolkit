import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Ensure URL is HTTPS
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    if (!targetUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      );
    }

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'WebUnlimited-Toolkit/1.0 (+https://toolkit.webunlimited.ch)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
          { status: 400 }
        );
      }

      const html = await response.text();
      const analysis = analyzeHTML(html, targetUrl);

      return NextResponse.json(analysis);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - website took too long to respond' },
          { status: 408 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Site analyzer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeHTML(html: string, url: string): AnalysisResult {
  // Parse HTML (simple regex-based parsing for basic elements)
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  const faviconMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*>/i);

  // Extract title
  const title = {
    text: titleMatch ? titleMatch[1].trim() : '',
    length: titleMatch ? titleMatch[1].trim().length : 0,
    optimal: titleMatch ? titleMatch[1].trim().length >= 25 && titleMatch[1].trim().length <= 60 : false
  };

  // Extract description
  const description = {
    text: descriptionMatch ? descriptionMatch[1].trim() : '',
    length: descriptionMatch ? descriptionMatch[1].trim().length : 0,
    optimal: descriptionMatch ? descriptionMatch[1].trim().length >= 70 && descriptionMatch[1].trim().length <= 160 : false
  };

  // Extract H1
  const h1 = {
    text: h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : '',
    present: !!h1Match
  };

  // Check Open Graph tags
  const ogTags = {
    title: !!ogTitleMatch,
    description: !!ogDescriptionMatch,
    image: !!ogImageMatch
  };

  // Analyze assets (CSS and JS)
  const cssMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  const jsMatches = html.match(/<script[^>]*src=["']([^"']*)["'][^>]*>/gi) || [];

  let totalSizeKB = 0;
  let cssCount = cssMatches.length;
  let jsCount = jsMatches.length;

  // Try to get asset sizes for same-origin resources
  const baseUrl = new URL(url);
  const assetUrls = [
    ...cssMatches.map(match => {
      const hrefMatch = match.match(/href=["']([^"']*)["']/i);
      return hrefMatch ? resolveUrl(hrefMatch[1], baseUrl) : null;
    }).filter(Boolean),
    ...jsMatches.map(match => {
      const srcMatch = match.match(/src=["']([^"']*)["']/i);
      return srcMatch ? resolveUrl(srcMatch[1], baseUrl) : null;
    }).filter(Boolean)
  ];

  // Calculate score
  let score = 0;

  // Title (20 points)
  if (title.optimal) score += 20;
  else if (title.length > 0) score += 10;

  // Description (20 points)
  if (description.optimal) score += 20;
  else if (description.length > 0) score += 10;

  // H1 (15 points)
  if (h1.present) score += 15;

  // Favicon (10 points)
  if (faviconMatch) score += 10;

  // Open Graph tags (20 points)
  const ogScore = Object.values(ogTags).filter(Boolean).length * 7;
  score += Math.min(ogScore, 20);

  // Assets (15 points)
  if (totalSizeKB < 500) score += 15;
  else if (totalSizeKB < 1000) score += 10;
  else if (totalSizeKB < 2000) score += 5;

  // Generate issues and suggestions
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!title.text) {
    issues.push('Kein Title-Tag gefunden');
    suggestions.push('Füge einen aussagekräftigen Title-Tag hinzu (25-60 Zeichen)');
  } else if (!title.optimal) {
    issues.push(`Title zu ${title.length < 25 ? 'kurz' : 'lang'} (${title.length} Zeichen)`);
    suggestions.push(`Optimiere die Title-Länge auf 25-60 Zeichen (aktuell: ${title.length})`);
  }

  if (!description.text) {
    issues.push('Keine Meta-Description gefunden');
    suggestions.push('Füge eine aussagekräftige Meta-Description hinzu (70-160 Zeichen)');
  } else if (!description.optimal) {
    issues.push(`Description zu ${description.length < 70 ? 'kurz' : 'lang'} (${description.length} Zeichen)`);
    suggestions.push(`Optimiere die Description-Länge auf 70-160 Zeichen (aktuell: ${description.length})`);
  }

  if (!h1.present) {
    issues.push('Kein H1-Tag gefunden');
    suggestions.push('Füge mindestens einen H1-Tag hinzu für bessere SEO-Struktur');
  }

  if (!faviconMatch) {
    suggestions.push('Füge ein Favicon hinzu für bessere Branding');
  }

  if (!ogTags.title) {
    suggestions.push('Füge Open Graph Title-Tag hinzu für bessere Social Media Darstellung');
  }
  if (!ogTags.description) {
    suggestions.push('Füge Open Graph Description-Tag hinzu für bessere Social Media Darstellung');
  }
  if (!ogTags.image) {
    suggestions.push('Füge Open Graph Image-Tag hinzu für bessere Social Media Darstellung');
  }

  if (totalSizeKB > 1000) {
    issues.push(`Hohe Asset-Größe: ${totalSizeKB}KB`);
    suggestions.push('Optimiere CSS und JavaScript für bessere Ladezeiten');
  }

  return {
    url,
    score: Math.max(0, Math.min(100, score)),
    title,
    description,
    h1,
    assets: {
      totalSizeKB,
      cssCount,
      jsCount
    },
    ogTags,
    issues,
    suggestions
  };
}

function resolveUrl(url: string, baseUrl: URL): string | null {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      return baseUrl.origin + url;
    }
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}






