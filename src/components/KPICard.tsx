import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon: LucideIcon;
  calculationLogic: string;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  badge,
  badgeType = 'neutral',
  icon: Icon,
  calculationLogic,
  colorScheme = 'slate',
}) => {
  const [showFormula, setShowFormula] = React.useState(false);

  const colorStyles = {
    blue: {
      border: 'border-blue-100 hover:border-blue-200',
      bg: 'bg-white',
      iconBg: 'bg-blue-50 text-blue-600',
      valColor: 'text-slate-900',
    },
    emerald: {
      border: 'border-emerald-100 hover:border-emerald-200',
      bg: 'bg-white',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valColor: 'text-emerald-700',
    },
    amber: {
      border: 'border-amber-100 hover:border-amber-200',
      bg: 'bg-white',
      iconBg: 'bg-amber-50 text-amber-600',
      valColor: 'text-amber-700',
    },
    rose: {
      border: 'border-rose-100 hover:border-rose-200',
      bg: 'bg-white',
      iconBg: 'bg-rose-50 text-rose-600',
      valColor: 'text-rose-700',
    },
    slate: {
      border: 'border-slate-200 hover:border-slate-300',
      bg: 'bg-white',
      iconBg: 'bg-slate-100 text-slate-700',
      valColor: 'text-slate-900',
    },
    violet: {
      border: 'border-violet-100 hover:border-violet-200',
      bg: 'bg-white',
      iconBg: 'bg-violet-50 text-violet-600',
      valColor: 'text-violet-700',
    },
  }[colorScheme];

  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeType];

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition hover:shadow relative ${colorStyles.border} ${colorStyles.bg}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-medium ${colorStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </h3>
          </div>
        </div>

        {/* Info button for calculation transparency */}
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
          title="Lihat formula & logika kalkulasi"
          aria-label={`Informasi formula ${title}`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${colorStyles.valColor}`}>
          {value}
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeStyles}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
      )}

      {/* Transparent formula tooltip/drawer */}
      {showFormula && (
        <div className="mt-3 p-2.5 bg-slate-900 text-slate-200 text-xs rounded-lg border border-slate-800 animate-in fade-in duration-150">
          <div className="font-semibold text-blue-300 mb-1 flex items-center gap-1">
            <span>Formula & Logika Perhitungan:</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">{calculationLogic}</p>
          <button
            onClick={() => setShowFormula(false)}
            className="mt-2 text-slate-400 hover:text-white underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};
