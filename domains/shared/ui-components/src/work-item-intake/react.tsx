'use client';

import React from 'react';
import { WorkItemIntakeModel, WorkItemIntakeValues } from './types';

interface WorkItemIntakeViewProps {
  model: WorkItemIntakeModel;
  values: WorkItemIntakeValues;
  error?: string;
  isSubmitting?: boolean;
  backHref?: string;
  onChange: (field: keyof WorkItemIntakeValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white transition-all focus:border-sky-400/60 focus:outline-none focus:ring-1 focus:ring-sky-400/60';
}

export function WorkItemIntakeView({
  model,
  values,
  error,
  isSubmitting,
  backHref,
  onChange,
  onSubmit,
}: WorkItemIntakeViewProps) {
  const sprintOptions = model.sprintOptionsByProject[values.projectId] || [];
  const selectedProject = model.projectOptions.find((option) => option.id === values.projectId);
  const selectedSprint = sprintOptions.find((option) => option.id === values.sprintId);
  const selectedType = model.workTypeOptions.find((option) => option.id === values.workType);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-8 shadow-2xl shadow-black/20">
        {backHref ? (
          <a href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <span aria-hidden="true">←</span>
            <span>Back to Projects</span>
          </a>
        ) : null}
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Shared Planning Lane</p>
        <h1 className="mb-3 text-4xl font-bold text-white">{model.title}</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">{model.subtitle}</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-6 rounded-3xl border border-white/10 bg-[#111827] p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="work-item-project">
              Project
            </label>
            <select
              id="work-item-project"
              value={values.projectId}
              onChange={(event) => onChange('projectId', event.target.value)}
              className={fieldClassName()}
            >
              {model.projectOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-6 text-slate-400">{selectedProject?.description || 'Choose the project lane for this work item.'}</p>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="work-item-sprint">
              Sprint
            </label>
            <select
              id="work-item-sprint"
              value={values.sprintId}
              onChange={(event) => onChange('sprintId', event.target.value)}
              className={fieldClassName()}
              disabled={sprintOptions.length === 0}
            >
              {sprintOptions.length === 0 ? <option value="">No sprint available</option> : null}
              {sprintOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-6 text-slate-400">
              {selectedSprint?.description || 'Create a sprint first if this project does not have one yet.'}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-200" htmlFor="work-item-title">
            Title
          </label>
          <input
            id="work-item-title"
            value={values.title}
            onChange={(event) => onChange('title', event.target.value)}
            className={fieldClassName()}
            placeholder="e.g., Shared Sprint Intake for Feature Work"
          />
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-200" htmlFor="work-item-description">
            Description
          </label>
          <textarea
            id="work-item-description"
            rows={4}
            value={values.description}
            onChange={(event) => onChange('description', event.target.value)}
            className={fieldClassName()}
            placeholder="Describe the outcome, acceptance boundary, and any crew handoff context."
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="work-item-type">
              Work Type
            </label>
            <select
              id="work-item-type"
              value={values.workType}
              onChange={(event) => onChange('workType', event.target.value)}
              className={fieldClassName()}
            >
              {model.workTypeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-6 text-slate-400">{selectedType?.description}</p>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="work-item-priority">
              Priority
            </label>
            <select
              id="work-item-priority"
              value={values.priority}
              onChange={(event) => onChange('priority', event.target.value)}
              className={fieldClassName()}
            >
              <option value="1">P1</option>
              <option value="2">P2</option>
              <option value="3">P3</option>
              <option value="4">P4</option>
            </select>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="work-item-points">
              Story Points
            </label>
            <input
              id="work-item-points"
              type="number"
              min="0"
              step="1"
              value={values.storyPoints}
              onChange={(event) => onChange('storyPoints', event.target.value)}
              className={fieldClassName()}
              placeholder="3"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 text-sm leading-6 text-slate-300">
          {model.helperText}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          {backHref ? (
            <a href={backHref} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white">
              {model.cancelLabel}
            </a>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || sprintOptions.length === 0}
            className="rounded-2xl border border-sky-400/50 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-sky-300/70 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : model.submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkItemIntakeView;
