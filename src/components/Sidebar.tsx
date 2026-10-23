import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  AlertOctagon,
  Database,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { PPICKPISummary } from '../utils/ppicCalculations';

export type ActiveTab = 'overview' | 'readiness' | 'risk' | 'sync' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  kpis: PPICKPISummary;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, kpis }) => {
  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Overview Dashboard',
      description: 'KPI Kesiapan & Agregasi',
      icon: LayoutDashboard,
      badge: `${kpis.readinessPercentage}%`,
      badgeColor: kpis.readinessPercentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'readiness' as ActiveTab,
      label: 'Material Readiness',
      description: 'Monitoring & Selisih Stok',
      icon: Boxes,
      badge: kpis.notReadyRows > 0 ? `${kpis.notReadyRows} Kurang` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'risk' as ActiveTab,
      label: 'Material Risk Analysis',
      description: 'Shortage & Stale Data Risk',
      icon: AlertOctagon,
      badge: (kpis.criticalRiskCount + kpis.highRiskCount) > 0 ? `${kpis.criticalRiskCount + kpis.highRiskCount} Kritis/Tinggi` : undefined,
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      id: 'sync' as ActiveTab,
      label: 'Data & Sync Status',
      description: 'Integrasi Google Sheets',
      icon: Database,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings & Parameters',
      description: 'Bobot Risiko & Konfigurasi',
      icon: Sliders,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex lg:flex-col justify-between overflow-x-auto lg:overflow-x-visible">
      {/* Navigation list */}
      <div className="p-3 lg:p-4 w-full">
        <div className="hidden lg:block mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu PPIC
        </div>

        <nav className="flex lg:flex-col gap-1 w-full" aria-label="Sidebar Menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition text-sm font-medium whitespace-nowrap lg:whitespace-normal cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div>
                    <div className="leading-tight">{item.label}</div>
                    <div
                      className={`text-xs hidden lg:block ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`hidden lg:inline-flex text-xs px-2 py-0.5 rounded font-semibold ml-2 ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Summary Pill in bottom of desktop sidebar */}
      <div className="hidden lg:block p-4 m-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-2">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Panduan PPIC</span>
        </div>
        <p className="text-slate-400 leading-relaxed mb-2">
          Sheet <strong className="text-slate-200">"Rekap"</strong> digunakan untuk mencegah duplikasi. Kolom D merefleksikan tanggal update informasi material.
        </p>
        <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-slate-400">
          <span>Stok Kurang:</span>
          <span className="font-bold text-rose-400">{kpis.notReadyRows} baris</span>
        </div>
      </div>
    </aside>
  );
};
