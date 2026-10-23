import React from 'react';
import { PPICKPISummary, RiskLevel } from '../utils/ppicCalculations';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Flame, AlertCircle } from 'lucide-react';

interface ChartsProps {
  kpis: PPICKPISummary;
  onFilterStatus?: (status: string) => void;
  onFilterRisk?: (risk: RiskLevel) => void;
}

export const Charts: React.FC<ChartsProps> = ({ kpis, onFilterStatus, onFilterRisk }) => {
  // Donut chart calculations
  const total = kpis.totalRows || 1;
  const readyPct = Math.round((kpis.readyRows / total) * 100);
  const notReadyPct = Math.round((kpis.notReadyRows / total) * 100);
  const checkDataPct = 100 - readyPct - notReadyPct;

  // Circumference for r=40
  const circumference = 2 * Math.PI * 40;
  const readyDash = (kpis.readyRows / total) * circumference;
  const notReadyDash = (kpis.notReadyRows / total) * circumference;
  const checkDataDash = (kpis.checkDataRows / total) * circumference;

  const notReadyOffset = -readyDash;
  const checkDataOffset = -(readyDash + notReadyDash);

  // Risk distribution
  const riskTotal = kpis.totalRows || 1;
  const lowPct = Math.round((kpis.lowRiskCount / riskTotal) * 100);
  const medPct = Math.round((kpis.mediumRiskCount / riskTotal) * 100);
  const highPct = Math.round((kpis.highRiskCount / riskTotal) * 100);
  const critPct = Math.round((kpis.criticalRiskCount / riskTotal) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Readiness Composition Donut Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Komposisi Kesiapan Material
            </h3>
            <p className="text-xs text-slate-500">
              Berdasarkan pemenuhan kuantitas & status sumber sheet "Rekap"
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded">
            Total {kpis.totalRows} Baris
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="14"
              />
              {/* Ready slice (emerald) */}
              {kpis.readyRows > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={`${readyDash} ${circumference}`}
                  strokeDashoffset={0}
                  className="transition-all duration-500"
                />
              )}
              {/* Not Ready slice (amber/rose) */}
              {kpis.notReadyRows > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="14"
                  strokeDasharray={`${notReadyDash} ${circumference}`}
                  strokeDashoffset={notReadyOffset}
                  className="transition-all duration-500"
                />
              )}
              {/* Check Data slice (amber) */}
              {kpis.checkDataRows > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="14"
                  strokeDasharray={`${checkDataDash} ${circumference}`}
                  strokeDashoffset={checkDataOffset}
                  className="transition-all duration-500"
                />
              )}
            </svg>
            {/* Center metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-800 leading-none">
                {kpis.readinessPercentage}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Siap Produksi
              </span>
            </div>
          </div>

          {/* Legend and interactive buttons */}
          <div className="space-y-2.5 w-full sm:w-auto">
            <button
              onClick={() => onFilterStatus && onFilterStatus('READY')}
              className="w-full flex items-center justify-between gap-4 p-2 rounded-lg bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-700">READY</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-800">{kpis.readyRows} baris</span>
                <span className="text-[11px] text-emerald-600 block">{readyPct}%</span>
              </div>
            </button>

            <button
              onClick={() => onFilterStatus && onFilterStatus('NOT READY')}
              className="w-full flex items-center justify-between gap-4 p-2 rounded-lg bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-xs font-semibold text-slate-700">NOT READY</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-800">{kpis.notReadyRows} baris</span>
                <span className="text-[11px] text-rose-600 block">{notReadyPct}%</span>
              </div>
            </button>

            <button
              onClick={() => onFilterStatus && onFilterStatus('CHECK DATA')}
              className="w-full flex items-center justify-between gap-4 p-2 rounded-lg bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-xs font-semibold text-slate-700">CHECK DATA</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-800">{kpis.checkDataRows} baris</span>
                <span className="text-[11px] text-amber-600 block">{checkDataPct}%</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Risk Distribution Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Distribusi Tingkat Risiko Material
            </h3>
            <p className="text-xs text-slate-500">
              Berdasarkan bobot kekurangan kuantitas, umur data update, & konsistensi
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">Skor 0 - 100</span>
        </div>

        <div className="space-y-3.5 pt-1">
          {/* Critical */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                CRITICAL (Skor ≥ 75)
              </span>
              <span className="text-slate-600 font-bold">
                {kpis.criticalRiskCount} item ({critPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-rose-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(critPct > 0 ? 4 : 0, critPct))}%` }}
              ></div>
            </div>
          </div>

          {/* High */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-orange-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                HIGH (Skor 50 - 74)
              </span>
              <span className="text-slate-600 font-bold">
                {kpis.highRiskCount} item ({highPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(highPct > 0 ? 4 : 0, highPct))}%` }}
              ></div>
            </div>
          </div>

          {/* Medium */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                MEDIUM (Skor 25 - 49)
              </span>
              <span className="text-slate-600 font-bold">
                {kpis.mediumRiskCount} item ({medPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(medPct > 0 ? 4 : 0, medPct))}%` }}
              ></div>
            </div>
          </div>

          {/* Low */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                LOW (Skor &lt; 25)
              </span>
              <span className="text-slate-600 font-bold">
                {kpis.lowRiskCount} item ({lowPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(lowPct > 0 ? 4 : 0, lowPct))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Material Shortages (Safe Unit Grouping) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Material dengan Defisit / Kekurangan Terbesar
            </h3>
            <p className="text-xs text-slate-500">
              Agregasi aman dikelompokkan berdasarkan Kode Material dan Satuan asli (tidak dijumlahkan sembarangan antar satuan berbeda)
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {kpis.shortagesByMaterialAndUnit.length} Item Mengalami Defisit
          </span>
        </div>

        {kpis.shortagesByMaterialAndUnit.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Tidak ada kekurangan material. Semua material telah tercukupi!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {kpis.shortagesByMaterialAndUnit.slice(0, 6).map((item, idx) => (
              <div
                key={`${item.materialCode}-${item.unit}`}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {item.materialCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.riskLevel === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : item.riskLevel === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.riskLevel}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5 line-clamp-2">
                    {item.materialName}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-500">
                    Defisit:
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600">
                      -{item.totalShortage.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 ml-1">
                      {item.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-[10px] text-slate-400">
                  Terdampak pada {item.affectedOrCount} Order ({item.affectedOrs.join(', ')})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Impact By Production Order (OR) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Kesiapan Berdasarkan Order Rilis (OR)
            </h3>
            <p className="text-xs text-slate-500">
              Tingkat kesiapan material untuk setiap nomor OR dan Style yang terdampak
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">Nomor OR</th>
                <th className="py-2.5 px-3">Style Terkait</th>
                <th className="py-2.5 px-3 text-center">Total Item</th>
                <th className="py-2.5 px-3 text-center">Ready</th>
                <th className="py-2.5 px-3 text-center">Belum Ready</th>
                <th className="py-2.5 px-3 text-center">Kesiapan OR</th>
                <th className="py-2.5 px-3 text-center">Status Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kpis.impactByOr.map((orItem) => (
                <tr key={orItem.or} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                    {orItem.or}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {orItem.styles.join(', ') || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                    {orItem.totalItems}
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                    {orItem.readyItems}
                  </td>
                  <td className="py-2.5 px-3 text-center text-rose-600 font-bold">
                    {orItem.notReadyItems + orItem.checkDataItems}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            orItem.readinessRate >= 80 ? 'bg-emerald-500' : orItem.readinessRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${orItem.readinessRate}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {orItem.readinessRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        orItem.maxRiskLevel === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : orItem.maxRiskLevel === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : orItem.maxRiskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {orItem.maxRiskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
