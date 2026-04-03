import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CostWarningBannerProps {
  forceBudgetModel: boolean;
  constrainedAt?: string;
  className?: string;
}

/**
 * CostWarningBanner Component
 * Displays a visual warning when a project has been placed into "Budget Mode"
 * by the Variance Circuit Breaker.
 */
export const CostWarningBanner: React.FC<CostWarningBannerProps> = ({
  forceBudgetModel,
  constrainedAt,
  className,
}) => {
  if (!forceBudgetModel) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 border rounded-lg bg-amber-950/20 border-amber-500/50 text-amber-200 shadow-sm animate-in fade-in duration-500",
        className
      )}
    >
      <div className="flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-bold">Circuit Breaker Active: Budget Mode Forced</p>
        <p className="opacity-90 leading-relaxed">
          This project has exceeded cost variance thresholds (>30%). All agents are currently restricted to budget-tier models (Haiku) to stabilize spending.
          {constrainedAt && (
            <span className="block mt-1 text-[10px] uppercase tracking-wider opacity-70 font-mono">
              Constraint active since: {new Date(constrainedAt).toLocaleString()}
            </span>
          )}
        </p>
      </div>
      <div className="flex-shrink-0 hidden sm:block">
        <ShieldAlert className="w-5 h-5 opacity-30" />
      </div>
    </div>
  );
};