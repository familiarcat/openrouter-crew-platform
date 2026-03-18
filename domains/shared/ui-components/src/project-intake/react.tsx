'use client';

import React from 'react';
import { ProjectIntakeModel, ProjectIntakeValues } from './types';

interface ProjectIntakeViewProps {
  model: ProjectIntakeModel;
  values: ProjectIntakeValues;
  error?: string;
  isSubmitting?: boolean;
  backHref?: string;
  onChange: (field: keyof ProjectIntakeValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white transition-all focus:border-sky-400/60 focus:outline-none focus:ring-1 focus:ring-sky-400/60';
}

export function ProjectIntakeView({
  model,
  values,
  error,
  isSubmitting,
  backHref,
  onChange,
  onSubmit,
}: ProjectIntakeViewProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-8 shadow-2xl shadow-black/20">
        {backHref ? (
          <a href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <span aria-hidden="true">←</span>
            <span>Back to Projects</span>
          </a>
        ) : null}
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Shared Creation Lane</p>
        <h1 className="mb-3 text-4xl font-bold text-white">{model.title}</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">{model.subtitle}</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-6 rounded-3xl border border-white/10 bg-[#111827] p-8">
        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-200" htmlFor="project-intake-name">
            Project Name
          </label>
          <input
            id="project-intake-name"
            value={values.name}
            onChange={(event) => onChange('name', event.target.value)}
            className={fieldClassName()}
            placeholder="e.g., Unified Project Ops"
          />
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-200" htmlFor="project-intake-description">
            Description
          </label>
          <textarea
            id="project-intake-description"
            rows={4}
            value={values.description}
            onChange={(event) => onChange('description', event.target.value)}
            className={fieldClassName()}
            placeholder="Describe the goal, scope, and operating context for the project."
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="project-intake-domain">
              Domain
            </label>
            <select
              id="project-intake-domain"
              value={values.domainId}
              onChange={(event) => onChange('domainId', event.target.value)}
              className={fieldClassName()}
            >
              {model.domainOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-6 text-slate-400">
              {model.domainOptions.find((option) => option.id === values.domainId)?.description}
            </p>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="project-intake-template">
              Template
            </label>
            <select
              id="project-intake-template"
              value={values.template}
              onChange={(event) => onChange('template', event.target.value)}
              className={fieldClassName()}
            >
              {model.templateOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs leading-6 text-slate-400">
              {model.templateOptions.find((option) => option.id === values.template)?.description}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-200" htmlFor="project-intake-budget">
            Budget (USD)
          </label>
          <input
            id="project-intake-budget"
            type="number"
            min="0"
            step="0.01"
            value={values.budgetUsd}
            onChange={(event) => onChange('budgetUsd', event.target.value)}
            className={fieldClassName()}
            placeholder="Optional"
          />
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
            disabled={isSubmitting}
            className="rounded-2xl border border-sky-400/50 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-sky-300/70 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : model.submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectIntakeView;
