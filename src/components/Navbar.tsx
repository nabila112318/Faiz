import React from 'react';
import { RefreshCw, Clock, Database, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SyncState, SheetsConfig } from '../services/sheetsService';

interface NavbarProps {
  syncState: SyncState;
  config: SheetsConfig;
  onRefresh: () => void;
  countdown: number;
  onOpenSyncSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  syncState,
  config,
  onRefresh,
  countdown,
  onOpenSyncSettings,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold tracking-wider text-lg">
              MR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-tight">
                  Material Readiness & Risk Monitoring
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/80 text-blue-300 border border-blue-700/50">
                  PPIC Manufacturing
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sumber Data: Sheet <span className="text-slate-200 font-mono font-medium">"{config.sheetName}"</span>
              </p>
            </div>
          </div>

          {/* Sync status & Actions */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <button
              onClick={onOpenSyncSettings}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Klik untuk melihat konfigurasi integrasi data"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              {syncState.status === 'DEMO_ACTIVE' && (
                <span className="text-amber-400 flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  MODE DEMO
                </span>
              )}
              {syncState.status === 'SYNCED' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  TERHUBUNG
                </span>
              )}
              {syncState.status === 'ERROR' && (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  KONEKSI GAGAL
                </span>
              )}
            </button>

            {/* Last update time */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1.5 rounded border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Update: {syncState.lastSyncSuccessTime || 'Belum'}</span>
              {config.autoSyncEnabled && (
                <span className="text-slate-500 ml-1">({countdown}s)</span>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={syncState.isSyncing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition disabled:opacity-50 cursor-pointer active:scale-95"
              aria-label="Segarkan data Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Menyinkronkan...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
