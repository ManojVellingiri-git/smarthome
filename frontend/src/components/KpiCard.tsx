import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string | number;
    isPositiveGood?: boolean;
    label?: string;
  };
  icon: LucideIcon;
  iconColor?: string;
  subtext?: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'cyan';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  delta,
  icon: Icon,
  iconColor = 'text-cyan-400',
  subtext,
  badge,
  badgeVariant = 'cyan',
  className = '',
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden group ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />

      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 ${iconColor} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold font-heading text-white tracking-tight">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {delta && (
          <div className="flex items-center gap-1 font-medium">
            <span
              className={
                delta.isPositiveGood
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }
            >
              {delta.value}
            </span>
            {delta.label && <span className="text-slate-400">{delta.label}</span>}
          </div>
        )}

        {subtext && !delta && <span className="text-slate-400">{subtext}</span>}

        {badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              badgeVariant === 'success'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : badgeVariant === 'warning'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
