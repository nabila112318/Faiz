import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { ProcessedMaterialItem } from '../utils/ppicCalculations';

interface MaterialDetailModalProps {
  item: ProcessedMaterialItem | null;
  onClose: () => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({ item, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopySummary = () => {
    const summary = `[PPIC MATERIAL ALERT]\nOR: ${item.or} | Style: ${item.style}\nMaterial: ${item.materialCode} - ${item.materialName}\nKebutuhan: ${item.quantity} ${item.normalizedSatuan}\nDiterima: ${item.receivedQty} ${item.normalizedSatuan}\nDefisit: ${item.shortage} ${item.normalizedSatuan}\nStatus: ${item.readinessStatus} (Sumber: ${item.ket})\nTingkat Risiko: ${item.overallRiskLevel} (Skor: ${item.overallRiskScore}/100)\nUmur Data Update: ${item.dataAgeDays !== null ? `${item.dataAgeDays} hari` : 'Tidak diketahui'}\nRekomendasi Tindakan: ${item.mitigationRecommendation}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (item.readinessStatus) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            READY
          </span>
        );
      case 'NOT READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            NOT READY
          </span>
        );
      case 'CHECK DATA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            CHECK DATA
          </span>
        );
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-600 text-white">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500 text-white">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-400 text-slate-900">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">{level}</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Tutup jendela detail"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pr-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200">
              OR: {item.or || 'N/A'}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
              Style: {item.style || 'N/A'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Baris #{item.rowIndex}
            </span>
            {getStatusBadge()}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {item.materialName}
          </h2>
          <div className="text-xs font-mono text-slate-500 mt-0.5">
            Kode: <span className="font-bold text-slate-700">{item.materialCode}</span> | Raw: "{item.rawDisplayName}"
          </div>
        </div>

        {/* Contradiction Warning Banner if CHECK DATA */}
        {item.hasDiscrepancy && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1 text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>PERINGATAN KONSISTENSI DATA PPIC</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
              {item.statusNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Quantity Breakdown Cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Kebutuhan (Qty)</div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {item.quantity.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-400">{item.normalizedSatuan}</div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-700 uppercase">Diterima</div>
            <div className="text-lg font-black text-blue-900 mt-1">
              {item.receivedQty.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-blue-500">{item.normalizedSatuan}</div>
          </div>

          <div className={`p-3 rounded-xl border ${
            item.shortage > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : item.surplus > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="text-[11px] font-semibold uppercase">
              {item.shortage > 0 ? 'Defisit / Kurang' : item.surplus > 0 ? 'Surplus' : 'Selisih'}
            </div>
            <div className="text-lg font-black mt-1">
              {item.shortage > 0
                ? `-${item.shortage.toLocaleString('id-ID')}`
                : item.surplus > 0
                ? `+${item.surplus.toLocaleString('id-ID')}`
                : '0'}
            </div>
            <div className="text-[10px] opacity-75">{item.normalizedSatuan}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Status Sumber</div>
            <div className="text-lg font-black text-slate-800 mt-1">
              {item.ket}
            </div>
            <div className="text-[10px] text-slate-400">Kolom J Sheet</div>
          </div>
        </div>

        {/* 3-Category Risk Breakdown (Strict Rule Adherence) */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Analisis Risiko Transparan (3 Kategori PPIC)
          </h3>

          {/* Kategori A: Shortage Risk */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Kategori A: Material Shortage Risk
                </span>
                {getRiskBadge(item.shortageRisk.level)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {item.shortageRisk.explanation}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
              Skor: {item.shortageRisk.score}
            </span>
          </div>

          {/* Kategori B: Stale Data Risk */}
          <div className={`p-3 rounded-xl border ${
            item.isStale
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-slate-50/60 border-slate-200'
          } flex items-start justify-between gap-3`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Kategori B: Stale Data Risk (Kolom D)
                </span>
                {getRiskBadge(item.staleDataRisk.level)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {item.staleDataRisk.explanation}
              </p>
              <div className="text-[11px] text-slate-500 mt-1">
                Tanggal Update: <span className="font-semibold text-slate-700">{item.tanggalUpdate}</span>
                {item.dataAgeDays !== null && ` (${item.dataAgeDays} hari yang lalu)`}
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
              Skor: {item.staleDataRisk.score}
            </span>
          </div>

          {/* Kategori C: Delivery Delay Risk */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Kategori C: Delivery Delay Risk (Jadwal Pengiriman)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600">
                {item.deliveryDelayRisk.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 italic">
              {item.deliveryDelayRisk.message}
            </p>
          </div>
        </div>

        {/* Recommended Mitigation & Follow Up */}
        <div className="mt-5 p-4 rounded-xl bg-blue-50/80 border border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-700" />
              Rekomendasi Tindakan Mitigasi PPIC
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
              item.priorityFollowUp === 'URGENT'
                ? 'bg-rose-600 text-white'
                : item.priorityFollowUp === 'HIGH'
                ? 'bg-orange-500 text-white'
                : 'bg-blue-600 text-white'
            }`}>
              PRIORITAS: {item.priorityFollowUp}
            </span>
          </div>
          <p className="text-xs text-blue-950 font-medium leading-relaxed">
            {item.mitigationRecommendation}
          </p>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Ringkasan untuk Tim</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
