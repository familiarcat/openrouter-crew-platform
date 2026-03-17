'use client';

import React from 'react';
import { ProjectWorkbenchModel, WorkbenchAction } from './types';

interface ProjectWorkbenchViewProps {
  model: ProjectWorkbenchModel;
  onAction?: (action: WorkbenchAction) => void;
}

function actionClass(kind: WorkbenchAction['kind']): string {
  if (kind === 'primary') {
    return 'border-sky-400/50 bg-sky-500/10 text-white';
  }
  if (kind === 'secondary') {
    return 'border-white/15 bg-white/5 text-white';
  }
  return 'border-white/10 bg-transparent text-slate-300';
}

export function ProjectWorkbenchView({ model, onAction }: ProjectWorkbenchViewProps) {
  const renderAction = (action: WorkbenchAction) => {
    const content = (
      <>
        <span className="mb-1 block font-semibold">{action.label}</span>
        <span className="block text-xs leading-5 text-slate-400">{action.description}</span>
      </>
    );

    if (action.href) {
      return (
        <a
          href={action.href}
          className={`rounded-2xl border px-4 py-3 transition-colors hover:border-sky-300/60 hover:bg-sky-500/10 ${actionClass(action.kind)}`}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onAction?.(action)}
        className={`rounded-2xl border px-4 py-3 text-left transition-colors hover:border-sky-300/60 hover:bg-sky-500/10 ${actionClass(action.kind)}`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-8">
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-8 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <h1 className="mb-3 text-4xl font-bold text-white">{model.title}</h1>
          <p className="max-w-4xl text-sm leading-7 text-slate-300">{model.subtitle}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {model.heroActions.map((action) => (
            <React.Fragment key={action.id}>{renderAction(action)}</React.Fragment>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {model.metrics.map((metric) => (
          <article key={metric.id} className="rounded-2xl border border-white/10 bg-[#16181d] p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">{metric.label}</p>
            <p className="mb-1 text-3xl font-bold text-white">{metric.value}</p>
            <p className="text-xs text-slate-400">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4">
        {model.stages.map((stage) => (
          <article key={stage.id} id={stage.id} className="rounded-3xl border border-white/10 bg-[#111827] p-6">
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{stage.title}</p>
              <h2 className="text-lg font-semibold text-slate-100">{stage.description}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {stage.cards.map((card) => (
                <div key={card.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="mb-2 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mb-4 text-sm leading-6 text-slate-300">{card.description}</p>
                  {renderAction(card.action)}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Projects</p>
          <h2 className="text-lg font-semibold text-slate-100">Shared operating view</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {model.projects.length ? (
            model.projects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">{project.name}</h3>
                    <p className="text-sm leading-6 text-slate-300">{project.description}</p>
                  </div>
                  <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                    {project.status}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>{project.domain}</span>
                  <span>{project.updatedLabel}</span>
                </div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
                    style={{ width: `${project.utilizationPercent}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>{project.budgetLabel}</span>
                  <span>{project.teamLabel}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-400">
              No projects are available yet. Start from the shared creation lane above.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProjectWorkbenchView;
