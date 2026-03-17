"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderProjectWorkbenchHtml = renderProjectWorkbenchHtml;
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function renderAction(action) {
    const attrs = action.commandId
        ? `data-command="${escapeHtml(action.commandId)}"`
        : action.href
            ? `data-href="${escapeHtml(action.href)}"`
            : '';
    return `
    <button class="orc-action orc-action-${action.kind}" ${attrs}>
      <span class="orc-action-label">${escapeHtml(action.label)}</span>
      <span class="orc-action-copy">${escapeHtml(action.description)}</span>
    </button>
  `;
}
function renderStageCard(card) {
    return `
    <article class="orc-stage-card">
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.description)}</p>
      ${renderAction(card.action)}
    </article>
  `;
}
function renderProjectWorkbenchHtml(model) {
    const metricHtml = model.metrics
        .map((metric) => `
        <div class="orc-metric">
          <div class="orc-metric-value">${escapeHtml(metric.value)}</div>
          <div class="orc-metric-label">${escapeHtml(metric.label)}</div>
          <div class="orc-metric-helper">${escapeHtml(metric.helper)}</div>
        </div>
      `)
        .join('');
    const stageHtml = model.stages
        .map((stage) => `
        <section class="orc-stage" id="${escapeHtml(stage.id)}">
          <header>
            <p class="orc-kicker">${escapeHtml(stage.title)}</p>
            <h2>${escapeHtml(stage.description)}</h2>
          </header>
          <div class="orc-stage-grid">
            ${stage.cards.map(renderStageCard).join('')}
          </div>
        </section>
      `)
        .join('');
    const projectHtml = model.projects.length
        ? model.projects
            .map((project) => `
            <article class="orc-project-card">
              <div class="orc-project-header">
                <div>
                  <h3>${escapeHtml(project.name)}</h3>
                  <p>${escapeHtml(project.description)}</p>
                </div>
                <span class="orc-project-status">${escapeHtml(project.status)}</span>
              </div>
              <div class="orc-project-meta">
                <span>${escapeHtml(project.domain)}</span>
                <span>${escapeHtml(project.updatedLabel)}</span>
              </div>
              <div class="orc-project-progress">
                <div class="orc-project-progress-bar">
                  <div class="orc-project-progress-fill" style="width:${project.utilizationPercent}%"></div>
                </div>
                <div class="orc-project-meta">
                  <span>${escapeHtml(project.budgetLabel)}</span>
                  <span>${escapeHtml(project.teamLabel)}</span>
                </div>
              </div>
            </article>
          `)
            .join('')
        : `<div class="orc-empty">No projects are available yet. Start from the shared creation lane.</div>`;
    return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(model.title)}</title>
      <style>
        :root {
          color-scheme: dark;
        }
        body {
          margin: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: linear-gradient(180deg, #0e1117 0%, #111827 100%);
          color: #f8fafc;
        }
        .orc-shell {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 24px 48px;
        }
        .orc-hero {
          display: grid;
          gap: 20px;
          margin-bottom: 24px;
        }
        .orc-hero-copy h1 {
          font-size: 32px;
          margin: 0 0 8px;
        }
        .orc-hero-copy p {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.6;
          max-width: 860px;
        }
        .orc-actions {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .orc-action {
          text-align: left;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 16px;
          padding: 14px 16px;
          background: rgba(15, 23, 42, 0.85);
          color: inherit;
          cursor: pointer;
        }
        .orc-action-primary {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(59, 130, 246, 0.22));
          border-color: rgba(56, 189, 248, 0.45);
        }
        .orc-action-label {
          display: block;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .orc-action-copy {
          display: block;
          color: #cbd5e1;
          font-size: 12px;
          line-height: 1.5;
        }
        .orc-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }
        .orc-metric, .orc-stage-card, .orc-project-card, .orc-empty {
          background: rgba(15, 23, 42, 0.84);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          padding: 16px;
        }
        .orc-metric-value {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .orc-metric-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #93c5fd;
          margin-bottom: 4px;
        }
        .orc-metric-helper {
          color: #94a3b8;
          font-size: 12px;
        }
        .orc-stages {
          display: grid;
          gap: 16px;
          margin-bottom: 28px;
        }
        .orc-stage header {
          margin-bottom: 12px;
        }
        .orc-kicker {
          margin: 0 0 6px;
          color: #7dd3fc;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
          font-weight: 700;
        }
        .orc-stage h2 {
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
          color: #e2e8f0;
        }
        .orc-stage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }
        .orc-stage-card h3, .orc-project-card h3 {
          margin: 0 0 8px;
          font-size: 16px;
        }
        .orc-stage-card p, .orc-project-card p {
          margin: 0 0 14px;
          color: #cbd5e1;
          line-height: 1.55;
          font-size: 13px;
        }
        .orc-projects {
          display: grid;
          gap: 12px;
        }
        .orc-project-header, .orc-project-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .orc-project-meta {
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .orc-project-status {
          color: #67e8f9;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
          font-weight: 700;
        }
        .orc-project-progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(51, 65, 85, 0.75);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .orc-project-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0ea5e9, #38bdf8);
        }
      </style>
    </head>
    <body>
      <div class="orc-shell">
        <section class="orc-hero">
          <div class="orc-hero-copy">
            <h1>${escapeHtml(model.title)}</h1>
            <p>${escapeHtml(model.subtitle)}</p>
          </div>
          <div class="orc-actions">${model.heroActions.map(renderAction).join('')}</div>
        </section>
        <section class="orc-metrics">${metricHtml}</section>
        <section class="orc-stages">${stageHtml}</section>
        <section class="orc-projects">${projectHtml}</section>
      </div>
      <script>
        const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
        document.querySelectorAll('[data-command]').forEach((node) => {
          node.addEventListener('click', () => {
            if (vscode) {
              vscode.postMessage({ type: 'command', command: node.getAttribute('data-command') });
            }
          });
        });
        document.querySelectorAll('[data-href]').forEach((node) => {
          node.addEventListener('click', () => {
            const href = node.getAttribute('data-href');
            if (vscode) {
              vscode.postMessage({ type: 'href', href });
            } else if (href) {
              window.location.href = href;
            }
          });
        });
      </script>
    </body>
  </html>`;
}
//# sourceMappingURL=render-html.js.map