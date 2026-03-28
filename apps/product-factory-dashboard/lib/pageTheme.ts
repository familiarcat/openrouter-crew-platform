/**
 * Universal Page Theme System
 * Senior Staff Color Theory Implementation
 * Contributors: Riker, Troi, Data, O'Brien
 */

export interface PageTheme {
  accent: string;
  glow: string;
  name: string;
  category: 'core' | 'docs' | 'operations' | 'creative' | 'crew';
}

// Color definitions per Data's systematic analysis
const themeColors = {
  purple: { accent: '#7c5cff', glow: 'rgba(124,92,255,.55)' },
  blue: { accent: '#0077b6', glow: 'rgba(0,119,182,.50)' },
  gold: { accent: '#c9a227', glow: 'rgba(201,162,39,.50)' },
  cyan: { accent: '#00c2ff', glow: 'rgba(0,194,255,.50)' },
  magenta: { accent: '#ff5c93', glow: 'rgba(255,92,147,.50)' },
  // Division colors for crew
  red: { accent: '#c41e3a', glow: 'rgba(196,30,58,.50)' },
  brown: { accent: '#8b7355', glow: 'rgba(139,115,85,.50)' },
};

// Page theme mappings per O'Brien's implementation strategy
const pageThemes: Record<string, PageTheme> = {
  // Core pages (purple)
  home: { ...themeColors.purple, name: 'Home', category: 'core' },
  categories: { ...themeColors.purple, name: 'Categories', category: 'core' },
  portfolio: { ...themeColors.purple, name: 'Portfolio', category: 'core' },
  'observation-lounge': { ...themeColors.purple, name: 'Observation Lounge', category: 'core' },
  
  // Documentation pages (blue)
  docs: { ...themeColors.blue, name: 'Documentation', category: 'docs' },
  overview: { ...themeColors.blue, name: 'Overview', category: 'docs' },
  timeline: { ...themeColors.blue, name: 'Timeline', category: 'docs' },
  roadmap: { ...themeColors.blue, name: 'Roadmap', category: 'docs' },
  assumptions: { ...themeColors.blue, name: 'Assumptions', category: 'docs' },
  
  // Operations pages (gold)
  diagnostics: { ...themeColors.gold, name: 'Diagnostics', category: 'operations' },
  environment: { ...themeColors.gold, name: 'Environment', category: 'operations' },
  env: { ...themeColors.gold, name: 'Environment', category: 'operations' },
  
  // Creative pages (cyan)
  create: { ...themeColors.cyan, name: 'Create', category: 'creative' },
  'projects-new': { ...themeColors.cyan, name: 'New Project', category: 'creative' },
  new: { ...themeColors.cyan, name: 'New', category: 'creative' },
  
  // Conversation pages (magenta)
  ask: { ...themeColors.magenta, name: 'Ask', category: 'creative' },
  
  // Crew pages use division colors (handled separately)
  crew: { ...themeColors.gold, name: 'Crew', category: 'crew' },
};

/**
 * Get theme for a specific page
 * @param pageSlug - The page identifier (e.g., 'home', 'diagnostics', 'docs')
 */
export function getPageTheme(pageSlug: string): PageTheme {
  const normalizedSlug = pageSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return pageThemes[normalizedSlug] || pageThemes.home;
}

/**
 * Generate CSS styles for page theming
 * @param theme - The page theme object
 * @param size - Ellipse size ('large' | 'medium' | 'small')
 */
export function getPageGradientStyle(
  theme: PageTheme,
  size: 'large' | 'medium' | 'small' = 'large'
): React.CSSProperties {
  const ellipseSizes = {
    large: '900px 450px',
    medium: '600px 350px',
    small: '400px 300px',
  };
  
  return {
    background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse ${ellipseSizes[size]} at 0% 0%, ${theme.glow} 0%, transparent 60%)`,
    borderColor: `${theme.accent}50`,
  };
}

/**
 * Generate card styles with page theme
 */
export function getThemedCardStyle(
  theme: PageTheme,
  size: 'large' | 'medium' | 'small' = 'medium'
): React.CSSProperties {
  return {
    ...getPageGradientStyle(theme, size),
  };
}

/**
 * Get accent color for inner elements
 */
export function getAccentColor(theme: PageTheme): string {
  return theme.accent;
}

// Export theme colors for direct access
export { themeColors };

// Default export for convenience
export default {
  getPageTheme,
  getPageGradientStyle,
  getThemedCardStyle,
  getAccentColor,
  themeColors,
};
