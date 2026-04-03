export {
  tokens,
  colors,
  spacing,
  radii,
  typography,
  shadows,
  transitions,
  zIndex,
} from './tokens'

export type { ColorToken, SpacingToken, RadiusToken } from './tokens'

/**
 * CSS file paths for consumers that need to reference them programmatically.
 * Import the CSS files directly via the package.json exports map:
 *   import '@openrouter-crew/design-tokens/css'
 *   import '@openrouter-crew/design-tokens/css/themes/vscode'
 *   import '@openrouter-crew/design-tokens/css/themes/light'
 */
export const CSS_PATHS = {
  variables: '@openrouter-crew/design-tokens/css',
  vscodetheme: '@openrouter-crew/design-tokens/css/themes/vscode',
  lightTheme: '@openrouter-crew/design-tokens/css/themes/light',
} as const

/**
 * Inline CSS string for VSCode webview panels that cannot import CSS files.
 * Usage: inject into the <style> tag of your webview's HTML string.
 */
export function getWebviewStyles(): string {
  return `
    :root {
      --cr-bg:                       var(--vscode-editor-background, #0D1117);
      --cr-bg-secondary:             var(--vscode-sideBar-background, #161B22);
      --cr-bg-tertiary:              var(--vscode-panel-background, #1C2128);
      --cr-surface:                  var(--vscode-editorWidget-background, #161B22);
      --cr-surface-hover:            var(--vscode-list-hoverBackground, #1C2128);
      --cr-surface-active:           var(--vscode-list-activeSelectionBackground, #21262D);
      --cr-text:                     var(--vscode-editor-foreground, #E6EDF3);
      --cr-text-secondary:           var(--vscode-descriptionForeground, #8B949E);
      --cr-text-muted:               var(--vscode-disabledForeground, #6E7681);
      --cr-text-disabled:            var(--vscode-disabledForeground, #484F58);
      --cr-text-inverse:             #0D1117;
      --cr-border:                   var(--vscode-panel-border, rgba(48, 54, 61, 1));
      --cr-border-muted:             var(--vscode-widget-border, rgba(48, 54, 61, 0.6));
      --cr-border-focus:             var(--vscode-focusBorder, #4A9EFF);
      --cr-color-primary:            var(--vscode-button-background, #4A9EFF);
      --cr-color-primary-hover:      var(--vscode-button-hoverBackground, #3B8FEF);
      --cr-color-primary-foreground: var(--vscode-button-foreground, #000000);
      --cr-color-accent:             #7C3AED;
      --cr-color-success:            var(--vscode-testing-iconPassed, #10B981);
      --cr-color-warning:            var(--vscode-editorWarning-foreground, #F59E0B);
      --cr-color-error:              var(--vscode-errorForeground, #EF4444);
      --cr-color-info:               var(--vscode-editorInfo-foreground, #3B82F6);
      --cr-font-sans:                var(--vscode-font-family, "Inter", -apple-system, sans-serif);
      --cr-font-mono:                var(--vscode-editor-font-family, "JetBrains Mono", Consolas, monospace);
      --cr-text-xs:   11px;
      --cr-text-sm:   12px;
      --cr-text-base: var(--vscode-font-size, 14px);
      --cr-text-lg:   16px;
      --cr-text-xl:   18px;
      --cr-text-2xl:  20px;
      --cr-text-3xl:  24px;
      --cr-radius-none: 0;
      --cr-radius-sm:   4px;
      --cr-radius-md:   6px;
      --cr-radius-lg:   8px;
      --cr-radius-xl:   12px;
      --cr-radius-2xl:  16px;
      --cr-radius-full: 9999px;
      --cr-space-1:  4px;
      --cr-space-2:  8px;
      --cr-space-3:  12px;
      --cr-space-4:  16px;
      --cr-space-5:  20px;
      --cr-space-6:  24px;
      --cr-space-8:  32px;
      --cr-space-10: 40px;
      --cr-space-12: 48px;
      --cr-shadow-sm:   0 1px 2px 0 rgba(0,0,0,0.4);
      --cr-shadow-md:   0 4px 6px -1px rgba(0,0,0,0.5);
      --cr-shadow-glow: 0 0 20px rgba(74,158,255,0.3);
      --cr-transition-fast:   all 100ms ease;
      --cr-transition-base:   all 150ms ease;
      --cr-transition-slow:   all 300ms ease;
    }
  `
}
