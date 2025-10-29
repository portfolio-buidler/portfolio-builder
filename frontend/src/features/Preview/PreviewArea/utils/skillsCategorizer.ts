// src/features/Preview/PreviewArea/utils/skillsCategorizer.ts

/**
 * Skills Categorization Utility
 * 
 * Splits a flat array of skills into spoken languages and technologies
 * using a heuristic-based approach.
 * 
 * Strategy: Maintain a curated list of common spoken languages (Hebrew, English, etc.).
 * Everything else goes to technologies (tools, frameworks, platforms, programming languages).
 */

/**
 * Comprehensive list of spoken languages (case-insensitive matching)
 * These are human languages, not programming languages
 */
const SPOKEN_LANGUAGES = new Set([
  // Major world languages
  'english',
  'spanish',
  'mandarin',
  'chinese',
  'hindi',
  'arabic',
  'bengali',
  'portuguese',
  'russian',
  'japanese',
  'german',
  'french',
  'italian',
  'korean',
  'vietnamese',
  'turkish',
  'polish',
  'ukrainian',
  'dutch',
  'greek',
  'czech',
  'swedish',
  'hungarian',
  'romanian',
  'thai',
  'danish',
  'finnish',
  'norwegian',
  'slovak',
  'croatian',
  'hebrew',
  'bulgarian',
  'serbian',
  'lithuanian',
  'slovenian',
  'latvian',
  'estonian',
  
  // Additional European languages
  'catalan',
  'basque',
  'galician',
  'irish',
  'welsh',
  'scots',
  'icelandic',
  'maltese',
  'albanian',
  'macedonian',
  'bosnian',
  'montenegrin',
  
  // Middle Eastern languages
  'persian',
  'farsi',
  'kurdish',
  'armenian',
  'georgian',
  'azerbaijani',
  'pashto',
  'urdu',
  
  // African languages
  'swahili',
  'amharic',
  'yoruba',
  'igbo',
  'zulu',
  'xhosa',
  'afrikaans',
  'somali',
  'hausa',
  
  // Asian languages
  'indonesian',
  'malay',
  'tagalog',
  'filipino',
  'burmese',
  'khmer',
  'lao',
  'mongolian',
  'nepali',
  'sinhala',
  'tamil',
  'telugu',
  'malayalam',
  'kannada',
  'gujarati',
  'marathi',
  'punjabi',
  
  // Other languages
  'latin',
  'esperanto',
  'yiddish',
  
  // Common variations
  'mandarin chinese',
  'cantonese',
  'taiwanese',
  'british english',
  'american english',
  'brazilian portuguese',
  'european portuguese',
  'castilian spanish',
  'mexican spanish',
  'modern hebrew',
  'classical hebrew',
])

/**
 * Categorizes a flat array of skills into languages and technologies
 * 
 * @param skills - Array of skill strings from backend
 * @returns Object with languages (spoken) and technologies arrays
 */
export function categorizeSkills(skills: string[]): {
  languages: string[]
  technologies: string[]
} {
  const languages: string[] = []
  const technologies: string[] = []
  
  if (!skills || !Array.isArray(skills)) {
    return { languages, technologies }
  }
  
  for (const skill of skills) {
    const trimmed = skill.trim()
    if (!trimmed) continue
    
    // Normalize for comparison (lowercase, remove special chars)
    const normalized = trimmed.toLowerCase().replace(/[._-]/g, ' ').trim()
    
    if (SPOKEN_LANGUAGES.has(normalized)) {
      languages.push(trimmed)
    } else {
      technologies.push(trimmed)
    }
  }
  
  return { languages, technologies }
}

/**
 * For testing/debugging: Check if a skill would be categorized as a spoken language
 */
export function isLanguage(skill: string): boolean {
  const normalized = skill.toLowerCase().replace(/[._-]/g, ' ').trim()
  return SPOKEN_LANGUAGES.has(normalized)
}