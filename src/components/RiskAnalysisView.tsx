import React, { useState } from 'react';
import {
  AlertOctagon,
  Flame,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ProcessedMaterialItem, RiskLevel, RiskWeightsConfig } from '../utils/ppicCalculations';

interface RiskAnalysisViewProps {
  items: ProcessedMaterialItem[];
  riskConfig: RiskWeightsConfig;
  onSelectItem: (item: ProcessedMaterialItem) => void;
  onOpenSettings: () => void;
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({
  items,
  riskConfig,
  onSelectItem,
  onOpenSettings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SHORTAGE' | 'STALE' | 'CRITICAL'>('ALL');

  // Filtered by Category
  const criticalItems = items.filter(i => i.overallRiskLevel === 'CRITICAL');
  const highItems = items.filter(i => i.overallRiskLevel === 'HIGH');
  const staleItems = items.filter(i => i.isStale);
  const shortageItems = items.filter(i => i.shortage > 0);

  const displayedList = selectedCategory === 'CRITICAL'
    ? criticalItems
    : selectedCategory === 'STALE'
    ? staleItems
    : selectedCategory === 'SHORTAGE'
    ? shortageItems
    : items.filter(i => i.overallRiskLevel === 'CRITICAL' || i.overallRiskLevel === 'HIGH' || i.isStale);

  return (
    <div className="space-y-6">
      {/* Risk Architecture Header & Transparency Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Audit & Scoring Engine
              </span>
              <span className="text-xs text-slate-400">Formula Berbobot 100%</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              Analisis Risiko Ketersediaan & Umur Informasi Material
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Memisahkan secara ketat antara risiko defisit stok (Kategori A), risiko keusangan data Kolom D (Kategori B), serta keterlambatan pengiriman (Kategori C).
            </p>
          </div>

          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <span>Sesuaikan Bobot & Ambang Batas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Categories Explanation Cards */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          {/* Category A */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">Kategori A: Shortage Risk</span>
              <span className="text-[11px] font-mono text-slate-400">Bobot {Math.round(riskConfig.shortageWeight * 100)}%</span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Dihitung berdasarkan selisih kebutuhan vs diterima, rasio defisit, dan status sumber Kolom J.
            </p>
          </div>

          {/* Category B */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Kategori B: Stale Data Risk</span>
              <span className="text-[11px] font-mono text-slate-400">Bobot {Math.round(riskConfig.staleDataWeight * 100)}%</span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Dihitung dari umur data Kolom D. Data yang belum diupdate &gt; {riskConfig.staleDaysThreshold} hari ditandai untuk verifikasi fisik.
            </p>
          </div>

          {/* Category C */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300">Kategori C: Delivery Delay Risk</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                Khusus Jadwal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed italic">
              Status: <span className="text-slate-300 font-semibold">Belum dapat dinilai</span> karena data jadwal kebutuhan/kedatangan belum ada di sheet Rekap.
            </p>
          </div>
        </div>
      </div>

      {/* Strict PPIC Warning Box regarding Column D */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-blue-900 block mb-0.5">
            PENTING: Aturan PPIC Kolom D Sheet "Rekap"
          </strong>
          <p className="text-blue-800 leading-relaxed">
            Kolom D merupakan <strong>tanggal pembaruan informasi material</strong>, bukan tanggal kebutuhan potong atau tanggal rencana pengiriman.
            Sistem tidak mengklaim material terlambat hanya karena statusnya BELUM. Penilaian difokuskan pada risiko kekurangan kuantitas aktual dan perlunya konfirmasi ulang pada data yang belum diperbarui.
          </p>
        </div>
      </div>

      {/* Filter Tabs for Risk List */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua Material Berisiko ({items.filter(i => i.overallRiskLevel === 'CRITICAL' || i.overallRiskLevel === 'HIGH' || i.isStale).length})
        </button>

        <button
          onClick={() => setSelectedCategory('CRITICAL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'CRITICAL'
              ? 'bg-rose-600 text-white'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Risiko Kritis ({criticalItems.length})</span>
        </button>

        <button
          onClick={() => setSelectedCategory('STALE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'STALE'
              ? 'bg-amber-500 text-slate-900'
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Data Usang Kolom D ({staleItems.length})</span>
        </button>

        <button
          onClick={() => setSelectedCategory('SHORTAGE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            selectedCategory === 'SHORTAGE'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Defisit Stok Kuantitas ({shortageItems.length})
        </button>
      </div>

      {/* Risk Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedList.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Kondisi Material Stabil</p>
            <p className="text-xs text-slate-500 mt-1">Tidak ditemukan material dengan risiko pada kategori ini.</p>
          </div>
        ) : (
          displayedList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      OR: {item.or}
                    </span>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Style: {item.style}
                    </span>
                  </div>

                  {/* Overall Risk badge */}
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-extrabold ${
                        item.overallRiskLevel === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : item.overallRiskLevel === 'HIGH'
                          ? 'bg-orange-500 text-white'
                          : item.overallRiskLevel === 'MEDIUM'
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {item.overallRiskLevel}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Skor: {item.overallRiskScore}/100
                    </div>
                  </div>
                </div>

                {/* Material Info */}
                <div className="mt-2.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    [{item.materialCode}]
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.materialName}
                  </h3>
                </div>

                {/* Quantity & Shortage indicators */}
                <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Kebutuhan</span>
                    <span className="text-xs font-bold text-slate-800">
                      {item.quantity.toLocaleString('id-ID')} {item.normalizedSatuan}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 uppercase block font-semibold">Diterima</span>
                    <span className="text-xs font-bold text-blue-800">
                      {item.receivedQty.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 uppercase block font-semibold">Defisit</span>
                    <span className="text-xs font-bold text-rose-700">
                      {item.shortage > 0 ? `-${item.shortage.toLocaleString('id-ID')}` : '0'}
                    </span>
                  </div>
                </div>

                {/* Reasons & Causes */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <span className="font-semibold text-slate-800 min-w-16">Penyebab:</span>
                    <span className="text-slate-600">
                      {item.shortageRisk.explanation}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 text-slate-700">
                    <span className="font-semibold text-slate-800 min-w-16">Umur Data:</span>
                    <span className={`${item.isStale ? 'text-amber-800 font-semibold' : 'text-slate-600'}`}>
                      {item.staleDataRisk.explanation}
                    </span>
                  </div>

                  {item.hasDiscrepancy && (
                    <div className="flex items-start gap-1.5 text-amber-800 font-semibold bg-amber-50 p-1.5 rounded">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{item.statusNotes[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action recommendation */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-blue-900 font-medium line-clamp-1 pr-2">
                  <strong className="text-blue-950">Saran:</strong> {item.mitigationRecommendation}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(item);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex-shrink-0 transition cursor-pointer"
                >
                  Detail
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
