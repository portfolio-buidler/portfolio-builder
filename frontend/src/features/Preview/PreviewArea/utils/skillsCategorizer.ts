// src/features/Preview/PreviewArea/utils/skillsCategorizer.ts

/**
 * Skills Categorization Utility
 * 
 * Splits a flat array of skills into programming languages and technologies
 * using a heuristic-based approach.
 * 
 * Strategy: Maintain a curated list of ~100+ common programming languages.
 * Everything else goes to technologies (tools, frameworks, platforms).
 */

/**
 * Comprehensive list of programming languages (case-insensitive matching)
 */
const PROGRAMMING_LANGUAGES = new Set([
  // Popular languages
  'javascript',
  'js',
  'typescript',
  'ts',
  'python',
  'java',
  'c',
  'c++',
  'cpp',
  'c#',
  'csharp',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'go',
  'golang',
  'rust',
  'scala',
  'r',
  'matlab',
  'perl',
  'lua',
  'dart',
  'elixir',
  'erlang',
  'haskell',
  'clojure',
  'f#',
  'fsharp',
  
  // Web/Scripting
  'html',
  'html5',
  'css',
  'css3',
  'sass',
  'scss',
  'less',
  'coffeescript',
  
  // Shell/System
  'bash',
  'shell',
  'powershell',
  'batch',
  
  // Database query languages
  'sql',
  'mysql',
  'postgresql',
  'plsql',
  'tsql',
  'nosql',
  
  // Older/Legacy
  'fortran',
  'cobol',
  'pascal',
  'delphi',
  'vb',
  'vba',
  'visual basic',
  'vb.net',
  
  // Mobile
  'objective-c',
  'objective c',
  'objc',
  
  // JVM languages
  'groovy',
  'clojure',
  
  // .NET
  'vb.net',
  
  // Specialized
  'assembly',
  'asm',
  'lisp',
  'scheme',
  'prolog',
  'julia',
  'nim',
  'crystal',
  'ocaml',
  'elm',
  'purescript',
  'reasonml',
  'solidity',
  'vyper',
  'move',
  
  // Query/Data
  'graphql',
  'sparql',
  
  // Markup (sometimes listed as languages)
  'xml',
  'json',
  'yaml',
  'toml',
  'markdown',
  
  // Statistical
  'sas',
  'stata',
  'spss',
  
  // Hardware description
  'vhdl',
  'verilog',
  
  // Esoteric but real
  'apl',
  'j',
  'k',
  'awk',
  'sed',
])

/**
 * Categorizes a flat array of skills into languages and technologies
 * 
 * @param skills - Array of skill strings from backend
 * @returns Object with languages and technologies arrays
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
    
    if (PROGRAMMING_LANGUAGES.has(normalized)) {
      languages.push(trimmed)
    } else {
      technologies.push(trimmed)
    }
  }
  
  return { languages, technologies }
}

/**
 * For testing/debugging: Check if a skill would be categorized as a language
 */
export function isLanguage(skill: string): boolean {
  const normalized = skill.toLowerCase().replace(/[._-]/g, ' ').trim()
  return PROGRAMMING_LANGUAGES.has(normalized)
}