import React, { useState } from 'react';
import { Sliders, ShieldCheck, RotateCcw, Save, Check, Info, Clock, AlertTriangle } from 'lucide-react';
import { SheetsConfig } from '../services/sheetsService';
import { DEFAULT_RISK_CONFIG, RiskWeightsConfig } from '../utils/ppicCalculations';

interface SettingsViewProps {
  config: SheetsConfig;
  onSaveConfig: (updated: SheetsConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, onSaveConfig }) => {
  const [shortageWeight, setShortageWeight] = useState(config.riskConfig.shortageWeight * 100);
  const [staleDataWeight, setStaleDataWeight] = useState(config.riskConfig.staleDataWeight * 100);
  const [consistencyWeight, setConsistencyWeight] = useState(config.riskConfig.consistencyWeight * 100);
  const [staleDaysThreshold, setStaleDaysThreshold] = useState(config.riskConfig.staleDaysThreshold || 7);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSyncEnabled);
  const [autoSyncIntervalSec, setAutoSyncIntervalSec] = useState(config.autoSyncIntervalSec || 60);

  const [saved, setSaved] = useState(false);

  const totalWeight = shortageWeight + staleDataWeight + consistencyWeight;
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1;

  const handleSave = () => {
    if (!isWeightValid) return;

    const newRiskConfig: RiskWeightsConfig = {
      shortageWeight: shortageWeight / 100,
      staleDataWeight: staleDataWeight / 100,
      consistencyWeight: consistencyWeight / 100,
      staleDaysThreshold: Number(staleDaysThreshold) || 7,
    };

    const updated: SheetsConfig = {
      ...config,
      autoSyncEnabled,
      autoSyncIntervalSec: Number(autoSyncIntervalSec) || 60,
      riskConfig: newRiskConfig,
    };

    onSaveConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetDefaults = () => {
    setShortageWeight(DEFAULT_RISK_CONFIG.shortageWeight * 100);
    setStaleDataWeight(DEFAULT_RISK_CONFIG.staleDataWeight * 100);
    setConsistencyWeight(DEFAULT_RISK_CONFIG.consistencyWeight * 100);
    setStaleDaysThreshold(DEFAULT_RISK_CONFIG.staleDaysThreshold);
    setAutoSyncEnabled(true);
    setAutoSyncIntervalSec(60);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Konfigurasi Parameter & Bobot Risiko PPIC
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan formula perhitungan risiko ketersediaan material dan sinkronisasi agar sesuai dengan SOP manufaktur Anda.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* 1. Risk Scoring Weights Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bobot Scoring Risiko Gabungan (Harus Total = 100%)
            </h3>
            <p className="text-xs text-slate-500">
              Rumus: Skor Risiko = Σ (Bobot Faktor × Skor Faktor). Normalisasi 0 - 100.
            </p>
          </div>
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            isWeightValid
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
          }`}>
            Total Bobot: {totalWeight}% {isWeightValid ? '✓ Valid' : '⚠️ Harus 100%'}
          </div>
        </div>

        {/* Shortage Weight Slider */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              1. Bobot Kekurangan Kuantitas (Shortage Severity):
            </span>
            <span className="font-mono font-black text-blue-700 text-sm">{shortageWeight}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={80}
            step={5}
            value={shortageWeight}
            onChange={(e) => setShortageWeight(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            Mengukur keparahan defisit material terhadap kuantitas kebutuhan produksi.
          </p>
        </div>

        {/* Stale Data Weight Slider */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              2. Bobot Keusangan Informasi Kolom D (Stale Data):
            </span>
            <span className="font-mono font-black text-amber-700 text-sm">{staleDataWeight}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={staleDataWeight}
            onChange={(e) => setStaleDataWeight(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            Mengukur potensi deviasi fisik ketika data belum diperbarui dalam waktu lama.
          </p>
        </div>

        {/* Consistency Weight Slider */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              3. Bobot Inkonsistensi / Konflik Data (CHECK DATA):
            </span>
            <span className="font-mono font-black text-purple-700 text-sm">{consistencyWeight}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={40}
            step={5}
            value={consistencyWeight}
            onChange={(e) => setConsistencyWeight(Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            Pemberian penalti risiko ketika status sumber bertentangan dengan kuantitas fisik.
          </p>
        </div>
      </div>

      {/* 2. Stale Data Threshold Setting */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Ambang Batas Umur Data Update (Kolom D)
          </h3>
          <p className="text-xs text-slate-500">
            Berapa hari data material boleh tidak diperbarui sebelum sistem memberi peringatan data usang.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={staleDaysThreshold}
              onChange={(e) => setStaleDaysThreshold(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs font-semibold text-slate-700">Hari</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[3, 5, 7, 10, 14].map(days => (
              <button
                key={days}
                onClick={() => setStaleDaysThreshold(days)}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                  staleDaysThreshold === days
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {days} Hari
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          Catatan: Parameter ini disesuaikan dengan siklus update tim logistik gudang/purchasing perusahaan.
        </p>
      </div>

      {/* 3. Auto Sync Setting */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Interval Sinkronisasi Otomatis Google Sheets
          </h3>
          <p className="text-xs text-slate-500">
            Mengambil data terbaru secara berkala tanpa perlu reload browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={(e) => setAutoSyncEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
            <span>Aktifkan Sinkronisasi Otomatis</span>
          </label>

          {autoSyncEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Interval:</span>
              <select
                value={autoSyncIntervalSec}
                onChange={(e) => setAutoSyncIntervalSec(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
              >
                <option value={30}>30 Detik (Real-time)</option>
                <option value={60}>60 Detik (Standar Rekomendasi)</option>
                <option value={120}>2 Menit (Hemat Kuota)</option>
                <option value={300}>5 Menit</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Units Dictionary & Safety Reference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Protokol Keamanan Agregasi Satuan Material</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sesuai aturan PPIC Manufaktur, sistem <strong>tidak pernah menjumlahkan kuantitas dari satuan yang berbeda</strong> (misal YDS dengan GROS atau PCS). Semua agregasi defisit dikelompokkan secara terisolasi per kode material dan satuannya.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] pt-1">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">YDS (Yard Fabric)</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">GROS (144 Pcs Button/Trims)</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">DOZEN (12 Pcs Collar/Cuff)</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">PCS (Zipper/Label)</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">CONE (Thread)</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {!isWeightValid && (
          <span className="text-xs text-rose-600 font-bold">
            Total bobot harus bernilai 100% untuk menyimpan!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={!isWeightValid}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Konfigurasi Berhasil Disimpan!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Parameter</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
