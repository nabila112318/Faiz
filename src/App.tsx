/**
 * Material Readiness & Risk Monitoring Dashboard for PPIC Teams
 * Single Source of Truth: Google Sheets (Sheet "Rekap")
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadSavedConfig,
  saveConfig,
  syncMaterialData,
  SheetsConfig,
  SyncState,
  DEFAULT_CONFIG,
} from './services/sheetsService';
import {
  ProcessedMaterialItem,
  PPICKPISummary,
  RiskLevel,
  computePPICKPIs,
} from './utils/ppicCalculations';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { ReadinessTableView } from './components/ReadinessTableView';
import { RiskAnalysisView } from './components/RiskAnalysisView';
import { DataSyncView } from './components/DataSyncView';
import { SettingsView } from './components/SettingsView';
import { MaterialDetailModal } from './components/MaterialDetailModal';
import { AlertCircle, AlertTriangle, Database, RefreshCw } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SheetsConfig>(() => loadSavedConfig());
  const [items, setItems] = useState<ProcessedMaterialItem[]>([]);
  const [kpis, setKpis] = useState<PPICKPISummary>(() => computePPICKPIs([]));
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedItem, setSelectedItem] = useState<ProcessedMaterialItem | null>(null);

  // Cross-view filters
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('ALL');
  const [tableRiskFilter, setTableRiskFilter] = useState<RiskLevel | null>(null);

  const [syncState, setSyncState] = useState<SyncState>({
    isConnecting: false,
    isSyncing: true,
    lastSyncSuccessTime: null,
    lastAttemptTime: null,
    status: 'IDLE',
    errorMessage: null,
    rawRowCount: 0,
    sourceDescription: 'Memuat data...',
    cachedAt: null,
  });

  const [countdown, setCountdown] = useState<number>(config.autoSyncIntervalSec || 60);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Core Sync Handler
  const performSync = useCallback(async (currentConfig: SheetsConfig) => {
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    try {
      const result = await syncMaterialData(currentConfig);
      setItems(result.items);
      setKpis(result.kpis);
      setSyncState(result.syncState);
    } catch (err: any) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        status: 'ERROR',
        errorMessage: err?.message || 'Gagal menyinkronkan data Google Sheets.',
        lastAttemptTime: new Date().toLocaleTimeString('id-ID') + ' WIB',
      }));
    }
    setCountdown(currentConfig.autoSyncIntervalSec || 60);
  }, []);

  // Initial load
  useEffect(() => {
    performSync(config);
  }, [performSync, config]);

  // Periodic Auto-Sync & Countdown Ticker
  useEffect(() => {
    if (!config.autoSyncEnabled) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    setCountdown(config.autoSyncIntervalSec);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          performSync(config);
          return config.autoSyncIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [config, performSync]);

  // Save config wrapper
  const handleSaveConfig = (updated: SheetsConfig) => {
    setConfig(updated);
    saveConfig(updated);
    performSync(updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        syncState={syncState}
        config={config}
        onRefresh={() => performSync(config)}
        countdown={countdown}
        onOpenSyncSettings={() => setActiveTab('sync')}
      />

      {/* Demo Notice Banner (Prominent transparency) */}
      {syncState.status === 'DEMO_ACTIVE' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-semibold shadow-inner border-b border-amber-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse"></span>
            <span>
              <strong>MODE SIMULASI / BENCHMARK AKTIF:</strong> Data di bawah adalah data simulasi PPIC untuk sheet "Rekap". Hubungkan Google Sheets nyata Anda di menu Data & Sync.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('sync')}
            className="px-3 py-1 bg-slate-950 text-white rounded font-bold hover:bg-slate-900 transition flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Hubungkan Google Sheets</span>
          </button>
        </div>
      )}

      {/* Sync Error Banner if any */}
      {syncState.status === 'ERROR' && syncState.errorMessage && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-200 flex-shrink-0" />
            <span>{syncState.errorMessage}</span>
          </div>
          <button
            onClick={() => performSync(config)}
            className="px-2.5 py-0.5 bg-white text-rose-800 rounded font-bold hover:bg-rose-50 transition text-[11px] cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main Layout (Sidebar + Content View) */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          kpis={kpis}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <OverviewView
              kpis={kpis}
              items={items}
              onSelectTab={setActiveTab}
              onFilterStatus={(status) => {
                setTableStatusFilter(status);
                setActiveTab('readiness');
              }}
              onFilterRisk={(risk) => {
                setTableRiskFilter(risk);
                setActiveTab('risk');
              }}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          )}

          {activeTab === 'readiness' && (
            <ReadinessTableView
              items={items}
              onSelectItem={(item) => setSelectedItem(item)}
              initialStatusFilter={tableStatusFilter}
              initialRiskFilter={tableRiskFilter}
            />
          )}

          {activeTab === 'risk' && (
            <RiskAnalysisView
              items={items}
              riskConfig={config.riskConfig}
              onSelectItem={(item) => setSelectedItem(item)}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'sync' && (
            <DataSyncView
              config={config}
              syncState={syncState}
              onSaveConfig={handleSaveConfig}
              onRefreshNow={() => performSync(config)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              config={config}
              onSaveConfig={handleSaveConfig}
            />
          )}
        </main>
      </div>

      {/* Detail Modal */}
      <MaterialDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
