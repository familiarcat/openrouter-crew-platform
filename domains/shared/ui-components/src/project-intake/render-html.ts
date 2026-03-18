import { ProjectIntakeModel, ProjectIntakeValues } from './types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderOption(value: string, label: string, selected: boolean): string {
  return `<option value="${escapeHtml(value)}"${selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

export function renderProjectIntakeHtml(
  model: ProjectIntakeModel,
  values: ProjectIntakeValues,
): string {
  const domainCopy =
    model.domainOptions.find((option) => option.id === values.domainId)?.description || '';
  const templateCopy =
    model.templateOptions.find((option) => option.id === values.template)?.description || '';

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(model.title)}</title>
      <style>
        :root { color-scheme: dark; }
        body {
          margin: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: linear-gradient(180deg, #0e1117 0%, #111827 100%);
          color: #f8fafc;
        }
        .orc-shell {
          max-width: 960px;
          margin: 0 auto;
          padding: 28px 22px 40px;
          display: grid;
          gap: 18px;
        }
        .orc-card {
          background: rgba(15, 23, 42, 0.84);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 24px;
          padding: 24px;
        }
        .orc-kicker {
          margin: 0 0 8px;
          color: #7dd3fc;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 11px;
          font-weight: 700;
        }
        h1 {
          margin: 0 0 10px;
          font-size: 30px;
        }
        .orc-copy, .orc-helper, .orc-context {
          color: #cbd5e1;
          line-height: 1.6;
          font-size: 13px;
        }
        form {
          display: grid;
          gap: 18px;
        }
        .orc-field {
          display: grid;
          gap: 8px;
        }
        .orc-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }
        label {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        input, textarea, select {
          width: 100%;
          box-sizing: border-box;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(2, 6, 23, 0.55);
          color: #f8fafc;
          padding: 12px 14px;
          font: inherit;
        }
        textarea {
          resize: vertical;
          min-height: 110px;
        }
        .orc-context {
          border-radius: 16px;
          border: 1px solid rgba(103, 232, 249, 0.18);
          background: rgba(34, 211, 238, 0.08);
          padding: 12px 14px;
        }
        .orc-error {
          display: none;
          border-radius: 16px;
          border: 1px solid rgba(251, 113, 133, 0.3);
          background: rgba(244, 63, 94, 0.12);
          color: #fecdd3;
          padding: 12px 14px;
          font-size: 13px;
        }
        .orc-error[data-visible="true"] {
          display: block;
        }
        .orc-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .orc-button {
          border-radius: 16px;
          border: 1px solid rgba(56, 189, 248, 0.45);
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(59, 130, 246, 0.22));
          color: #fff;
          font-weight: 700;
          padding: 12px 16px;
          cursor: pointer;
        }
        .orc-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }
      </style>
    </head>
    <body>
      <div class="orc-shell">
        <section class="orc-card">
          <p class="orc-kicker">Shared Creation Lane</p>
          <h1>${escapeHtml(model.title)}</h1>
          <p class="orc-copy">${escapeHtml(model.subtitle)}</p>
        </section>

        <section class="orc-card">
          <form id="project-intake-form">
            <div class="orc-field">
              <label for="project-name">Project Name</label>
              <input id="project-name" name="name" value="${escapeHtml(values.name)}" placeholder="e.g., Unified Project Ops" />
            </div>

            <div class="orc-field">
              <label for="project-description">Description</label>
              <textarea id="project-description" name="description" placeholder="Describe the goal, scope, and operating context for the project.">${escapeHtml(values.description)}</textarea>
            </div>

            <div class="orc-grid">
              <div class="orc-field">
                <label for="project-domain">Domain</label>
                <select id="project-domain" name="domainId">
                  ${model.domainOptions.map((option) => renderOption(option.id, option.label, option.id === values.domainId)).join('')}
                </select>
                <div id="project-domain-copy" class="orc-helper">${escapeHtml(domainCopy)}</div>
              </div>

              <div class="orc-field">
                <label for="project-template">Template</label>
                <select id="project-template" name="template">
                  ${model.templateOptions.map((option) => renderOption(option.id, option.label, option.id === values.template)).join('')}
                </select>
                <div id="project-template-copy" class="orc-helper">${escapeHtml(templateCopy)}</div>
              </div>
            </div>

            <div class="orc-field">
              <label for="project-budget">Budget (USD)</label>
              <input id="project-budget" name="budgetUsd" type="number" min="0" step="0.01" value="${escapeHtml(values.budgetUsd)}" placeholder="Optional" />
            </div>

            <div class="orc-context">${escapeHtml(model.helperText)}</div>
            <div id="project-error" class="orc-error" data-visible="false"></div>
            <div class="orc-actions">
              <button id="project-submit" class="orc-button" type="submit">${escapeHtml(model.submitLabel)}</button>
            </div>
          </form>
        </section>
      </div>

      <script>
        const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
        const model = ${JSON.stringify(model)};
        const domainOptions = Object.fromEntries(model.domainOptions.map((option) => [option.id, option.description]));
        const templateOptions = Object.fromEntries(model.templateOptions.map((option) => [option.id, option.description]));
        const form = document.getElementById('project-intake-form');
        const errorEl = document.getElementById('project-error');
        const submitEl = document.getElementById('project-submit');
        const domainInput = document.getElementById('project-domain');
        const templateInput = document.getElementById('project-template');
        const domainCopyEl = document.getElementById('project-domain-copy');
        const templateCopyEl = document.getElementById('project-template-copy');

        function showError(message) {
          errorEl.textContent = message || '';
          errorEl.setAttribute('data-visible', message ? 'true' : 'false');
        }

        function updateHelperCopy() {
          domainCopyEl.textContent = domainOptions[domainInput.value] || '';
          templateCopyEl.textContent = templateOptions[templateInput.value] || '';
        }

        domainInput.addEventListener('change', updateHelperCopy);
        templateInput.addEventListener('change', updateHelperCopy);

        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const formData = new FormData(form);
          const name = String(formData.get('name') || '').trim();
          if (!name) {
            showError('Project name is required.');
            return;
          }

          showError('');
          submitEl.disabled = true;
          submitEl.textContent = 'Creating...';

          const payload = {
            name,
            description: String(formData.get('description') || ''),
            domainId: String(formData.get('domainId') || 'product-factory'),
            template: String(formData.get('template') || 'standard'),
            budgetUsd: String(formData.get('budgetUsd') || ''),
          };

          if (vscode) {
            vscode.postMessage({ type: 'submit-project-intake', payload });
          }
        });

        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message?.type === 'project-intake-error') {
            submitEl.disabled = false;
            submitEl.textContent = model.submitLabel;
            showError(message.error || 'Project creation failed.');
          }
        });
      </script>
    </body>
  </html>`;
}
