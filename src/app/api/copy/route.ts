import { NextRequest, NextResponse } from 'next/server';

interface CopyRequest {
  headline: string;
  context: string;
  platform: string;
}

interface CopyResponse {
  variations: {
    shorter: string;
    withProof: string;
    emotional: string;
  };
  method: 'heuristic' | 'openai';
}

// Simple rate limiting (in-memory for MVP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

function generateHeuristicVariations(headline: string, context: string, platform: string) {
  const words = headline.split(' ');
  
  // Shorter version - remove filler words
  const fillerWords = ['und', 'oder', 'aber', 'denn', 'sowie', 'sogar', 'auch', 'nur', 'schon', 'erst'];
  const shorter = words.filter((word, index) => 
    index === 0 || 
    index === words.length - 1 || 
    !fillerWords.includes(word.toLowerCase())
  ).join(' ');

  // Add proof/numbers
  const proofNumbers = ['3', '5', '10', '24/7', '100%', '50%', '2x', '3x'];
  const randomProof = proofNumbers[Math.floor(Math.random() * proofNumbers.length)];
  const withProof = `${randomProof}: ${headline}`;

  // Make more emotional based on platform
  const emotionalWords = {
    instagram: ['🔥', '✨', '💯', '🚀', '❤️', 'unglaublich', 'fantastisch'],
    facebook: ['beeindruckend', 'erstaunlich', 'phänomenal', 'sensationell'],
    linkedin: ['innovativ', 'effizient', 'strategisch', 'erfolgreich'],
    tiktok: ['viral', 'trending', '🔥', '💥', '🚀'],
    general: ['unglaublich', 'revolutionär', 'genial', 'fantastisch', 'außergewöhnlich']
  };
  
  const wordsForPlatform = emotionalWords[platform as keyof typeof emotionalWords] || emotionalWords.general;
  const randomWord = wordsForPlatform[Math.floor(Math.random() * wordsForPlatform.length)];
  const emotional = `${randomWord}: ${headline}`;

  return {
    shorter,
    withProof,
    emotional
  };
}

async function generateOpenAIVariations(headline: string, context: string, platform: string) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Du bist ein erfahrener Copywriter. Erstelle 3 Varianten der folgenden Headline für ${platform}:

Original: "${headline}"
Kontext: ${context}
Plattform: ${platform}

Erstelle genau 3 Varianten:
1. KÜRZER: Eine prägnante, kürzere Version
2. PROOF: Mit Zahlen, Beweisen oder Fakten
3. EMOTIONAL: Mit emotionalen Wörtern und Hooks

Antworte nur mit den 3 Varianten, jeweils mit dem Präfix:
KÜRZER: 
PROOF: 
EMOTIONAL: `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse the response
    const lines = content.split('\n').filter(line => line.trim());
    const variations = {
      shorter: '',
      withProof: '',
      emotional: ''
    };

    lines.forEach(line => {
      if (line.startsWith('KÜRZER:')) {
        variations.shorter = line.replace('KÜRZER:', '').trim();
      } else if (line.startsWith('PROOF:')) {
        variations.withProof = line.replace('PROOF:', '').trim();
      } else if (line.startsWith('EMOTIONAL:')) {
        variations.emotional = line.replace('EMOTIONAL:', '').trim();
      }
    });

    // Fallback to heuristic if parsing failed
    if (!variations.shorter || !variations.withProof || !variations.emotional) {
      throw new Error('Failed to parse OpenAI response');
    }

    return variations;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { headline, context, platform }: CopyRequest = await request.json();

    // Validate input
    if (!headline || typeof headline !== 'string' || headline.trim().length === 0) {
      return NextResponse.json(
        { error: 'Headline is required' },
        { status: 400 }
      );
    }

    if (!context || typeof context !== 'string' || context.trim().length === 0) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    let variations;
    let method: 'heuristic' | 'openai';

    try {
      if (openaiApiKey) {
        variations = await generateOpenAIVariations(headline.trim(), context.trim(), platform.trim());
        method = 'openai';
      } else {
        throw new Error('OpenAI not configured');
      }
    } catch (error) {
      // Fallback to heuristic method
      console.log('Falling back to heuristic method:', error);
      variations = generateHeuristicVariations(headline.trim(), context.trim(), platform.trim());
      method = 'heuristic';
    }

    const response: CopyResponse = {
      variations,
      method
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Copy booster error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






