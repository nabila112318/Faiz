import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Code2,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Table,
} from 'lucide-react';
import {
  SheetsConfig,
  SyncState,
  DataSourceType,
  APPS_SCRIPT_CODE_TEMPLATE,
} from '../services/sheetsService';

interface DataSyncViewProps {
  config: SheetsConfig;
  syncState: SyncState;
  onSaveConfig: (updated: SheetsConfig) => void;
  onRefreshNow: () => void;
}

export const DataSyncView: React.FC<DataSyncViewProps> = ({
  config,
  syncState,
  onSaveConfig,
  onRefreshNow,
}) => {
  const [activeTab, setActiveTab] = useState<DataSourceType>(config.sourceType);
  const [appsScriptUrl, setAppsScriptUrl] = useState(config.appsScriptUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || '');
  const [sheetName, setSheetName] = useState(config.sheetName || 'Rekap');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSyncEnabled);
  const [autoSyncIntervalSec, setAutoSyncIntervalSec] = useState(config.autoSyncIntervalSec || 60);

  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleApplyConfig = (type: DataSourceType) => {
    const updated: SheetsConfig = {
      ...config,
      sourceType: type,
      appsScriptUrl: appsScriptUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim() || 'Rekap',
      autoSyncEnabled,
      autoSyncIntervalSec,
    };
    onSaveConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Connection Header & Health Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Status Integrasi Single Source of Truth
              </span>
              {syncState.status === 'DEMO_ACTIVE' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Mode Simulasi / Benchmark
                </span>
              )}
              {syncState.status === 'SYNCED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Terhubung & Sinkron
                </span>
              )}
              {syncState.status === 'ERROR' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Koneksi Gagal
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {syncState.sourceDescription}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sheet Target: <span className="font-mono font-bold text-slate-700">"{config.sheetName}"</span> | Total Baris Terproses: <span className="font-bold text-slate-800">{syncState.rawRowCount}</span>
            </p>
          </div>

          <button
            onClick={onRefreshNow}
            disabled={syncState.isSyncing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncState.isSyncing ? 'Menyinkronkan...' : 'Tes & Sinkronkan Sekarang'}</span>
          </button>
        </div>

        {/* Sync Info Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Waktu Sinkron Terakhir:</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {syncState.lastSyncSuccessTime || 'Belum pernah'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Percobaan Terakhir:</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {syncState.lastAttemptTime || '-'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Interval Auto-Sync:</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {config.autoSyncEnabled ? `Setiap ${config.autoSyncIntervalSec} detik` : 'Manual (Nonaktif)'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Status Caching:</span>
            <span className="font-bold text-emerald-700 mt-0.5 block">
              Aktif (Mencegah Limit API)
            </span>
          </div>
        </div>

        {/* Error Notice */}
        {syncState.errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Kesalahan Koneksi Spreadsheet:</strong>
              <p className="mt-0.5 text-rose-800">{syncState.errorMessage}</p>
              {syncState.lastSyncSuccessTime && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Data terakhir yang berhasil disinkronkan ({syncState.lastSyncSuccessTime}) tetap dipertahankan.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Integration Method Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Pilih Metode Integrasi Google Sheets
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Pilih salah satu pendekatan di bawah ini sesuai arsitektur Google Sheets perusahaan Anda:
        </p>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Method 1: Google Apps Script */}
          <button
            onClick={() => setActiveTab('apps_script')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              activeTab === 'apps_script'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                Direkomendasikan
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">Google Apps Script</div>
            <p className="text-xs text-slate-500 mt-1">
              Backend sederhana gratis tanpa API Key atau OAuth. Menyediakan endpoint JSON CORS langsung dari spreadsheet.
            </p>
          </button>

          {/* Method 2: Google Sheets CSV / Direct ID */}
          <button
            onClick={() => setActiveTab('google_csv')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              activeTab === 'google_csv'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Direct CSV
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">Google Sheets ID / URL</div>
            <p className="text-xs text-slate-500 mt-1">
              Menggunakan ID spreadsheet publik/viewer via endpoint gviz Google untuk pembacaan real-time.
            </p>
          </button>

          {/* Method 3: Demo / Benchmark Simulation */}
          <button
            onClick={() => setActiveTab('demo')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              activeTab === 'demo'
                ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-amber-600" />
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Uji Coba
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">Mode Demo / Benchmark</div>
            <p className="text-xs text-slate-500 mt-1">
              Dataset simulasi PPIC lengkap (OR 1095, 1014, 1036) untuk menguji rumus, grafik, dan filter tanpa Google Sheet aktif.
            </p>
          </button>
        </div>

        {/* Tab 1 Config: Apps Script */}
        {activeTab === 'apps_script' && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                URL Google Apps Script Web App:
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Masukkan URL Deployment Web App Apps Script Anda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Sheet:
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Rekap"
                className="w-48 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 ml-2">Default sesuai acuan: "Rekap"</span>
            </div>

            {/* Step by step deployment guide with copyable Code.gs */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  Langkah Setup Google Apps Script (1 Menit):
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Kode Tersalin!' : 'Salin Kode Code.gs'}</span>
                </button>
              </div>

              <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside pl-1 leading-relaxed">
                <li>Buka Google Spreadsheet Anda yang memuat sheet <strong className="text-slate-800">"Rekap"</strong>.</li>
                <li>Klik menu <strong className="text-slate-800">Extensions (Ekstensi) &gt; Apps Script</strong>.</li>
                <li>Hapus kode bawaan, lalu paste kode <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">Code.gs</code> di bawah ini.</li>
                <li>Klik <strong className="text-slate-800">Deploy (Terapkan) &gt; New deployment (Penerapan baru)</strong>.</li>
                <li>Pilih jenis <strong className="text-slate-800">Web App</strong>, lalu set <em className="text-slate-800">Who has access (Siapa yang memiliki akses)</em> menjadi <strong className="text-blue-700">"Anyone" (Siapa saja)</strong>.</li>
                <li>Salin URL Web App yang dihasilkan dan tempelkan pada kolom URL di atas!</li>
              </ol>

              {/* Code snippet preview */}
              <div className="mt-3 relative">
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {APPS_SCRIPT_CODE_TEMPLATE}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleApplyConfig('apps_script')}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer"
              >
                {saveSuccess ? 'Konfigurasi Tersimpan!' : 'Simpan & Hubungkan ke Apps Script'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2 Config: Google Sheets CSV */}
        {activeTab === 'google_csv' && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Spreadsheet ID atau Link Google Sheets:
              </label>
              <input
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau https://docs.google.com/spreadsheets/d/..."
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Pastikan akses berbagi spreadsheet diatur ke <strong className="text-slate-700">"Anyone with the link can view"</strong> agar data dapat dibaca tanpa kredensial rahasia di client.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Sheet:
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Rekap"
                className="w-48 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleApplyConfig('google_csv')}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer"
              >
                {saveSuccess ? 'Konfigurasi Tersimpan!' : 'Simpan & Hubungkan Google Sheets'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3 Config: Demo */}
        {activeTab === 'demo' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <strong className="text-xs font-bold text-amber-950">
                Mode Simulasi / Benchmark PPIC Aktif
              </strong>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Mode ini menggunakan kumpulan data acuan manufaktur (OR 1095, OR 1014, OR 1036, OR 1088) dengan berbagai satuan (YDS, GROS, DOZEN, PCS) untuk memverifikasi logika PPIC secara independen. Tidak ada koneksi eksternal yang dibutuhkan.
            </p>
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => handleApplyConfig('demo')}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow transition cursor-pointer"
              >
                {saveSuccess ? 'Mode Demo Aktif' : 'Gunakan Mode Demo Ini'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Column Mapping Reference (Kolom B - J Verification) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-600" />
              Pemetaan Kolom Spreadsheet Sheet "Rekap"
            </h3>
            <p className="text-xs text-slate-500">
              Sistem secara otomatis mendeteksi baris header dan memetakan Kolom B hingga J sesuai acuan PPIC:
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Deteksi Otomatis Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Kolom</th>
                <th className="py-2.5 px-3">Header Acuan</th>
                <th className="py-2.5 px-3">Field Aplikasi</th>
                <th className="py-2.5 px-3">Tipe Data</th>
                <th className="py-2.5 px-3">Keterangan Khusus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom B</td>
                <td className="py-2.5 px-3 font-semibold">OR</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">or</td>
                <td className="py-2.5 px-3">String / Teks</td>
                <td className="py-2.5 px-3 text-slate-500">Nomor Order Rilis (e.g. OR 1095)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom C</td>
                <td className="py-2.5 px-3 font-semibold">Style</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">style</td>
                <td className="py-2.5 px-3">String / Teks</td>
                <td className="py-2.5 px-3 text-slate-500">Model atau kode gaya garmen</td>
              </tr>
              <tr className="bg-amber-50/50">
                <td className="py-2.5 px-3 font-mono font-bold text-amber-700">Kolom D</td>
                <td className="py-2.5 px-3 font-semibold text-amber-900">Tanggal</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">tanggalUpdate</td>
                <td className="py-2.5 px-3">Tanggal / ISO</td>
                <td className="py-2.5 px-3 text-amber-900 font-medium">
                  Tanggal terakhir update informasi. BUKAN tanggal kebutuhan atau kedatangan!
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom E</td>
                <td className="py-2.5 px-3 font-semibold">Order Lines/Product/Display Name</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">displayName</td>
                <td className="py-2.5 px-3">String / Teks</td>
                <td className="py-2.5 px-3 text-slate-500">Nama lengkap & kode unik material [KODE]</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom F</td>
                <td className="py-2.5 px-3 font-semibold">Order Lines/Quantity</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">quantity</td>
                <td className="py-2.5 px-3">Numerik</td>
                <td className="py-2.5 px-3 text-slate-500">Kebutuhan material untuk proses produksi</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom G</td>
                <td className="py-2.5 px-3 font-semibold">Order Lines/Received Qty</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">receivedQty</td>
                <td className="py-2.5 px-3">Numerik</td>
                <td className="py-2.5 px-3 text-slate-500">Kuantitas fisik material yang telah diterima</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom H</td>
                <td className="py-2.5 px-3 font-semibold">Kekurangan/Kelebihan</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">kekuranganKelebihan</td>
                <td className="py-2.5 px-3">Numerik</td>
                <td className="py-2.5 px-3 text-slate-500">Selisih (Received - Qty), divalidasi silang</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom I</td>
                <td className="py-2.5 px-3 font-semibold">Satuan</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">satuan</td>
                <td className="py-2.5 px-3">String / Teks</td>
                <td className="py-2.5 px-3 text-slate-500">Satuan resmi: YDS, GROS, DOZEN, PCS, dll.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">Kolom J</td>
                <td className="py-2.5 px-3 font-semibold">Ket</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">ket</td>
                <td className="py-2.5 px-3">String / Teks</td>
                <td className="py-2.5 px-3 text-slate-500">Status sumber: OKE atau BELUM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
