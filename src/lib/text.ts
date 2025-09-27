/**
 * Text analysis utilities for copywriting and content optimization
 */

export interface TextAnalysis {
  wordCount: number;
  characterCount: number;
  ctaWords: string[];
  numbers: number[];
  hasPassiveVoice: boolean;
  readabilityScore: number;
}

/**
 * Common CTA words in German
 */
const CTA_WORDS = [
  'jetzt', 'sofort', 'heute', 'hier', 'klicken', 'kaufen', 'bestellen',
  'anmelden', 'registrieren', 'download', 'herunterladen', 'erfahren',
  'entdecken', 'probieren', 'testen', 'starten', 'beginnen', 'loslegen',
  'mehr erfahren', 'jetzt kaufen', 'kostenlos', 'gratis', 'ohne risiko',
  'unverbindlich', 'kostenlose', 'kostenloses'
];

/**
 * Passive voice indicators in German
 */
const PASSIVE_INDICATORS = [
  'wird', 'werden', 'wurde', 'wurden', 'worden', 'ist', 'sind', 'war', 'waren',
  'geworden', 'gemacht', 'gegeben', 'gesagt', 'gezeigt', 'erhalten'
];

/**
 * Analyze text content
 */
export function analyzeText(text: string): TextAnalysis {
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const characters = text.replace(/\s/g, '');
  
  // Find CTA words
  const ctaWords = words.filter(word => 
    CTA_WORDS.some(cta => word.includes(cta.toLowerCase()))
  );
  
  // Find numbers
  const numbers = text.match(/\d+/g)?.map(Number) || [];
  
  // Check for passive voice
  const hasPassiveVoice = PASSIVE_INDICATORS.some(indicator => 
    text.toLowerCase().includes(indicator)
  );
  
  // Simple readability score (based on average word length and sentence length)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Simplified Flesch Reading Ease approximation
  const readabilityScore = Math.max(0, Math.min(100, 
    180 - avgWordsPerSentence - (58.5 * avgWordLength)
  ));
  
  return {
    wordCount: words.length,
    characterCount: characters.length,
    ctaWords: [...new Set(ctaWords)],
    numbers,
    hasPassiveVoice,
    readabilityScore: Math.round(readabilityScore)
  };
}

/**
 * Generate headline variations based on rules
 */
export function generateHeadlineVariations(
  original: string, 
  context: string, 
  platform: string
): {
  shorter: string;
  withProof: string;
  emotional: string;
} {
  const analysis = analyzeText(original);
  
  // Shorter version - remove filler words
  const shorter = makeShorter(original);
  
  // Add proof/numbers
  const withProof = addProof(original, analysis);
  
  // Make more emotional
  const emotional = makeEmotional(original, platform);
  
  return { shorter, withProof, emotional };
}

/**
 * Make headline shorter
 */
function makeShorter(text: string): string {
  const fillerWords = ['und', 'oder', 'aber', 'denn', 'sowie', 'sogar', 'auch', 'nur', 'schon', 'erst'];
  const words = text.split(' ');
  
  // Remove filler words, keep first and last words
  const filtered = words.filter((word, index) => 
    index === 0 || 
    index === words.length - 1 || 
    !fillerWords.includes(word.toLowerCase())
  );
  
  return filtered.join(' ');
}

/**
 * Add proof/numbers to headline
 */
function addProof(text: string, analysis: TextAnalysis): string {
  if (analysis.numbers.length > 0) {
    return text; // Already has numbers
  }
  
  // Add common proof numbers based on context
  const proofNumbers = ['3', '5', '10', '24/7', '100%'];
  const randomProof = proofNumbers[Math.floor(Math.random() * proofNumbers.length)];
  
  // Insert at beginning or end
  const insertAtEnd = Math.random() > 0.5;
  
  if (insertAtEnd) {
    return `${text} (${randomProof})`;
  } else {
    return `${randomProof}: ${text}`;
  }
}

/**
 * Make headline more emotional
 */
function makeEmotional(text: string, platform: string): string {
  const emotionalWords = {
    general: ['unglaublich', 'revolutionär', 'genial', 'fantastisch', 'außergewöhnlich'],
    instagram: ['🔥', '✨', '💯', '🚀', '❤️'],
    facebook: ['beeindruckend', 'erstaunlich', 'phänomenal', 'sensationell'],
    linkedin: ['innovativ', 'effizient', 'strategisch', 'erfolgreich'],
    tiktok: ['viral', 'trending', '🔥', '💥', '🚀']
  };
  
  const words = emotionalWords[platform as keyof typeof emotionalWords] || emotionalWords.general;
  const randomWord = words[Math.floor(Math.random() * words.length)];
  
  // Add at beginning or end
  const insertAtEnd = Math.random() > 0.5;
  
  if (insertAtEnd) {
    return `${text} - ${randomWord}!`;
  } else {
    return `${randomWord}: ${text}`;
  }
}

/**
 * Check if text meets platform requirements
 */
export function checkPlatformRequirements(
  text: string, 
  platform: string
): {
  meetsRequirements: boolean;
  issues: string[];
  suggestions: string[];
} {
  const analysis = analyzeText(text);
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  const requirements = {
    instagram: { minWords: 2, maxWords: 10, maxChars: 100 },
    facebook: { minWords: 3, maxWords: 15, maxChars: 150 },
    linkedin: { minWords: 4, maxWords: 20, maxChars: 200 },
    tiktok: { minWords: 2, maxWords: 8, maxChars: 80 }
  };
  
  const req = requirements[platform as keyof typeof requirements];
  if (!req) return { meetsRequirements: true, issues: [], suggestions: [] };
  
  // Check word count
  if (analysis.wordCount < req.minWords) {
    issues.push(`Zu wenige Wörter (${analysis.wordCount}/${req.minWords})`);
    suggestions.push('Füge mehr aussagekräftige Wörter hinzu');
  }
  
  if (analysis.wordCount > req.maxWords) {
    issues.push(`Zu viele Wörter (${analysis.wordCount}/${req.maxWords})`);
    suggestions.push('Kürze den Text und entferne Füllwörter');
  }
  
  // Check character count
  if (analysis.characterCount > req.maxChars) {
    issues.push(`Text zu lang (${analysis.characterCount}/${req.maxChars} Zeichen)`);
    suggestions.push('Verwende kürzere Wörter oder entferne unwichtige Teile');
  }
  
  // Check for CTA
  if (analysis.ctaWords.length === 0) {
    suggestions.push('Füge einen Call-to-Action hinzu (z.B. "jetzt", "hier")');
  }
  
  // Check for numbers/proof
  if (analysis.numbers.length === 0) {
    suggestions.push('Füge Zahlen oder Beweise hinzu für mehr Glaubwürdigkeit');
  }
  
  // Check for passive voice
  if (analysis.hasPassiveVoice) {
    issues.push('Passive Sprache erkannt');
    suggestions.push('Verwende aktive Sprache für mehr Wirkung');
  }
  
  return {
    meetsRequirements: issues.length === 0,
    issues,
    suggestions
  };
}






