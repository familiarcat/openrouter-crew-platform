import { WorkItemIntakeModel, WorkItemIntakeValues } from './types';

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

function renderSprintOptions(model: WorkItemIntakeModel, values: WorkItemIntakeValues): string {
  const sprintOptions = model.sprintOptionsByProject[values.projectId] || [];
  if (sprintOptions.length === 0) {
    return '<option value="">No sprint available</option>';
  }

  return sprintOptions
    .map((option) => renderOption(option.id, option.label, option.id === values.sprintId))
    .join('');
}

export function renderWorkItemIntakeHtml(
  model: WorkItemIntakeModel,
  values: WorkItemIntakeValues,
): string {
  const selectedProject = model.projectOptions.find((option) => option.id === values.projectId);
  const selectedSprint = (model.sprintOptionsByProject[values.projectId] || []).find(
    (option) => option.id === values.sprintId,
  );
  const selectedType = model.workTypeOptions.find((option) => option.id === values.workType);

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
        .orc-shell { max-width: 960px; margin: 0 auto; padding: 28px 22px 40px; display: grid; gap: 18px; }
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
        h1 { margin: 0 0 10px; font-size: 30px; }
        .orc-copy, .orc-helper, .orc-context { color: #cbd5e1; line-height: 1.6; font-size: 13px; }
        form { display: grid; gap: 18px; }
        .orc-field { display: grid; gap: 8px; }
        .orc-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        label { font-size: 13px; font-weight: 600; color: #e2e8f0; }
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
        textarea { resize: vertical; min-height: 110px; }
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
        .orc-error[data-visible="true"] { display: block; }
        .orc-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .orc-button {
          border-radius: 16px;
          border: 1px solid rgba(56, 189, 248, 0.45);
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(59, 130, 246, 0.22));
          color: #fff;
          font-weight: 700;
          padding: 12px 16px;
          cursor: pointer;
        }
        .orc-button:disabled { opacity: 0.65; cursor: wait; }
      </style>
    </head>
    <body>
      <div class="orc-shell">
        <section class="orc-card">
          <p class="orc-kicker">Shared Planning Lane</p>
          <h1>${escapeHtml(model.title)}</h1>
          <p class="orc-copy">${escapeHtml(model.subtitle)}</p>
        </section>

        <section class="orc-card">
          <form id="work-item-intake-form">
            <div class="orc-grid">
              <div class="orc-field">
                <label for="work-item-project">Project</label>
                <select id="work-item-project" name="projectId">
                  ${model.projectOptions.map((option) => renderOption(option.id, option.label, option.id === values.projectId)).join('')}
                </select>
                <div id="project-copy" class="orc-helper">${escapeHtml(selectedProject?.description || '')}</div>
              </div>

              <div class="orc-field">
                <label for="work-item-sprint">Sprint</label>
                <select id="work-item-sprint" name="sprintId">
                  ${renderSprintOptions(model, values)}
                </select>
                <div id="sprint-copy" class="orc-helper">${escapeHtml(selectedSprint?.description || 'Create a sprint first if needed.')}</div>
              </div>
            </div>

            <div class="orc-field">
              <label for="work-item-title">Title</label>
              <input id="work-item-title" name="title" value="${escapeHtml(values.title)}" placeholder="e.g., Shared Sprint Intake for Feature Work" />
            </div>

            <div class="orc-field">
              <label for="work-item-description">Description</label>
              <textarea id="work-item-description" name="description" placeholder="Describe the outcome, acceptance boundary, and any crew handoff context.">${escapeHtml(values.description)}</textarea>
            </div>

            <div class="orc-grid">
              <div class="orc-field">
                <label for="work-item-type">Work Type</label>
                <select id="work-item-type" name="workType">
                  ${model.workTypeOptions.map((option) => renderOption(option.id, option.label, option.id === values.workType)).join('')}
                </select>
                <div id="type-copy" class="orc-helper">${escapeHtml(selectedType?.description || '')}</div>
              </div>

              <div class="orc-field">
                <label for="work-item-priority">Priority</label>
                <select id="work-item-priority" name="priority">
                  ${['1', '2', '3', '4'].map((value) => renderOption(value, `P${value}`, value === values.priority)).join('')}
                </select>
              </div>

              <div class="orc-field">
                <label for="work-item-points">Story Points</label>
                <input id="work-item-points" name="storyPoints" type="number" min="0" step="1" value="${escapeHtml(values.storyPoints)}" placeholder="3" />
              </div>
            </div>

            <div class="orc-context">${escapeHtml(model.helperText)}</div>
            <div id="work-item-error" class="orc-error" data-visible="false"></div>
            <div class="orc-actions">
              <button id="work-item-submit" class="orc-button" type="submit">${escapeHtml(model.submitLabel)}</button>
            </div>
          </form>
        </section>
      </div>

      <script>
        const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
        const model = ${JSON.stringify(model)};
        const form = document.getElementById('work-item-intake-form');
        const errorEl = document.getElementById('work-item-error');
        const submitEl = document.getElementById('work-item-submit');
        const projectInput = document.getElementById('work-item-project');
        const sprintInput = document.getElementById('work-item-sprint');
        const typeInput = document.getElementById('work-item-type');
        const projectCopyEl = document.getElementById('project-copy');
        const sprintCopyEl = document.getElementById('sprint-copy');
        const typeCopyEl = document.getElementById('type-copy');

        const projectOptions = Object.fromEntries(model.projectOptions.map((option) => [option.id, option]));
        const typeOptions = Object.fromEntries(model.workTypeOptions.map((option) => [option.id, option]));

        function showError(message) {
          errorEl.textContent = message || '';
          errorEl.setAttribute('data-visible', message ? 'true' : 'false');
        }

        function updateSprintOptions() {
          const currentProjectId = projectInput.value;
          const sprintOptions = model.sprintOptionsByProject[currentProjectId] || [];
          sprintInput.innerHTML = sprintOptions.length
            ? sprintOptions.map((option) => '<option value="' + option.id + '">' + option.label + '</option>').join('')
            : '<option value="">No sprint available</option>';
          sprintInput.disabled = sprintOptions.length === 0;
          sprintCopyEl.textContent = sprintOptions[0]?.description || 'Create a sprint first if needed.';
        }

        function updateHelperCopy() {
          const currentProjectId = projectInput.value;
          const sprintOptions = model.sprintOptionsByProject[currentProjectId] || [];
          const currentSprint = sprintOptions.find((option) => option.id === sprintInput.value) || sprintOptions[0];
          projectCopyEl.textContent = projectOptions[currentProjectId]?.description || '';
          sprintCopyEl.textContent = currentSprint?.description || 'Create a sprint first if needed.';
          typeCopyEl.textContent = typeOptions[typeInput.value]?.description || '';
        }

        projectInput.addEventListener('change', () => {
          updateSprintOptions();
          updateHelperCopy();
        });
        sprintInput.addEventListener('change', updateHelperCopy);
        typeInput.addEventListener('change', updateHelperCopy);

        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const formData = new FormData(form);
          const title = String(formData.get('title') || '').trim();
          const sprintId = String(formData.get('sprintId') || '').trim();
          if (!title) {
            showError('Work item title is required.');
            return;
          }
          if (!sprintId) {
            showError('Select a sprint before creating work.');
            return;
          }

          showError('');
          submitEl.disabled = true;
          submitEl.textContent = 'Creating...';

          const payload = {
            projectId: String(formData.get('projectId') || ''),
            sprintId,
            title,
            description: String(formData.get('description') || ''),
            workType: String(formData.get('workType') || 'feature'),
            priority: String(formData.get('priority') || '2'),
            storyPoints: String(formData.get('storyPoints') || '3'),
          };

          if (vscode) {
            vscode.postMessage({ type: 'submit-work-item-intake', payload });
          }
        });

        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message?.type === 'work-item-intake-error') {
            submitEl.disabled = false;
            submitEl.textContent = model.submitLabel;
            showError(message.error || 'Work item creation failed.');
          }
        });
      </script>
    </body>
  </html>`;
}
