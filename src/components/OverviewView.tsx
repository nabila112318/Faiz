import React from 'react';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Calendar,
  Percent,
  Factory,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { PPICKPISummary, ProcessedMaterialItem, RiskLevel } from '../utils/ppicCalculations';
import { KPICard } from './KPICard';
import { Charts } from './Charts';

interface OverviewViewProps {
  kpis: PPICKPISummary;
  items: ProcessedMaterialItem[];
  onSelectTab: (tab: 'readiness' | 'risk' | 'sync' | 'settings') => void;
  onFilterStatus: (status: string) => void;
  onFilterRisk: (risk: RiskLevel) => void;
  onSelectItem: (item: ProcessedMaterialItem) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  kpis,
  items,
  onSelectTab,
  onFilterStatus,
  onFilterRisk,
  onSelectItem,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner Notice for PPIC Teams */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-sm border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              PPIC Material Intelligence
            </span>
            <span className="text-xs text-slate-300">
              Single Source of Truth: Sheet <strong className="text-white">"Rekap"</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
            Monitoring Kesiapan & Kontrol Risiko Pengiriman
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Mendeteksi defisit kuantitas sebelum jadwal potong/jahit, mengidentifikasi kontradiksi status sumber, dan memperingatkan umur data yang usang pada Kolom D.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => onSelectTab('readiness')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tabel Material</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectTab('risk')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Analisis Risiko</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Baris & Unik */}
        <KPICard
          title="Total Baris Material"
          value={kpis.totalRows}
          subtitle={`${kpis.uniqueMaterialsCount} kode material unik dianalisis`}
          badge={`${kpis.uniqueMaterialsCount} Unik`}
          icon={Boxes}
          colorScheme="blue"
          calculationLogic="Jumlah baris data material valid pada sheet Rekap setelah baris header dieliminasi. Item unik dihitung berdasarkan kode unik material yang diekstrak dari Kolom E."
        />

        {/* KPI 2: Material Ready */}
        <KPICard
          title="Material Ready"
          value={kpis.readyRows}
          subtitle={`${kpis.readinessPercentage}% terpenuhi tanpa defisit`}
          badge={`${kpis.readinessPercentage}%`}
          badgeType="success"
          icon={CheckCircle2}
          colorScheme="emerald"
          calculationLogic="Dihitung ketika kuantitas kebutuhan terpenuhi (Received Qty ≥ Quantity atau Kekurangan = 0) DAN status sumber Kolom J menunjukkan 'OKE'."
        />

        {/* KPI 3: Material Belum Ready / Defisit */}
        <KPICard
          title="Belum Ready / Defisit"
          value={kpis.notReadyRows}
          subtitle={`Menyebabkan potensi hambatan produksi`}
          badge={kpis.notReadyRows > 0 ? `${kpis.notReadyRows} Baris` : 'Aman'}
          badgeType={kpis.notReadyRows > 0 ? 'danger' : 'success'}
          icon={XCircle}
          colorScheme="rose"
          calculationLogic="Dihitung jika Received Qty < Quantity atau status sumber Kolom J adalah 'BELUM'. Jangan anggap kelebihan sebagai kekurangan."
        />

        {/* KPI 4: Check Data Contradictions */}
        <KPICard
          title="Check Data / Konflik"
          value={kpis.checkDataRows}
          subtitle="Status & kuantitas bertentangan"
          badge={kpis.checkDataRows > 0 ? 'Perlu Audit' : 'Valid'}
          badgeType={kpis.checkDataRows > 0 ? 'warning' : 'neutral'}
          icon={AlertTriangle}
          colorScheme="amber"
          calculationLogic="Dihitung jika terjadi ketidaksesuaian: misal status OKE tapi kuantitas masih kurang, atau status BELUM tapi kuantitas sudah tercukupi, atau kuantitas tidak valid. Mencegah kesalahan input manusia."
        />

        {/* KPI 5: Order Rilis (OR) Terdampak */}
        <KPICard
          title="OR Terdampak Defisit"
          value={`${kpis.impactedOrsCount} OR`}
          subtitle="Nomor OR yang belum lengkap"
          badge="Order Level"
          badgeType="warning"
          icon={Factory}
          colorScheme="violet"
          calculationLogic="Jumlah unik nomor OR (Kolom B) yang memiliki minimal 1 material berstatus NOT READY atau CHECK DATA. Membantu PPIC melihat dampak terhadap pesanan garmen/produk."
        />

        {/* KPI 6: Style Terdampak */}
        <KPICard
          title="Style Terdampak"
          value={`${kpis.impactedStylesCount} Style`}
          subtitle="Model dengan material kurang"
          badge="Product Line"
          badgeType="info"
          icon={Layers}
          colorScheme="blue"
          calculationLogic="Jumlah unik model Style (Kolom C) yang proses produksinya tertahan material belum lengkap."
        />

        {/* KPI 7: Risiko Kritis (Critical Risk) */}
        <KPICard
          title="Risiko Kritis"
          value={kpis.criticalRiskCount}
          subtitle="Defisit kuantitas berat / data usang"
          badge={kpis.criticalRiskCount > 0 ? 'Prioritas 1' : 'Nol'}
          badgeType={kpis.criticalRiskCount > 0 ? 'danger' : 'success'}
          icon={Flame}
          colorScheme="rose"
          calculationLogic="Material dengan skor risiko gabungan ≥ 75. Terjadi bila defisit > 60%, belum ada barang masuk sama sekali, atau data belum diupdate lebih dari batas kritis."
        />

        {/* KPI 8: Stale Data Warning (Kolom D) */}
        <KPICard
          title="Data Usang (Kolom D)"
          value={`${kpis.staleDataCount} Item`}
          subtitle="Belum diupdate > batas hari"
          badge="Re-konfirmasi"
          badgeType="warning"
          icon={Calendar}
          colorScheme="amber"
          calculationLogic="Dihitung dari umur data sejak tanggal pembaruan (Kolom D). Jika umur data melebihi ambang batas (default 7 hari), material ditandai untuk verifikasi ulang ke gudang/supplier."
        />
      </div>

      {/* Interactive Charts Section */}
      <Charts
        kpis={kpis}
        onFilterStatus={(status) => {
          onFilterStatus(status);
          onSelectTab('readiness');
        }}
        onFilterRisk={(risk) => {
          onFilterRisk(risk);
          onSelectTab('risk');
        }}
      />

      {/* Urgent Action Needed Highlight Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Material Membutuhkan Tindakan Segera (Prioritas Urgent / High)
            </h3>
            <p className="text-xs text-slate-500">
              Daftar material yang harus segera difollow-up tim PPIC & Purchasing
            </p>
          </div>
          <button
            onClick={() => onSelectTab('readiness')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            Lihat Semua ({items.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">OR / Style</th>
                <th className="py-2.5 px-3">Kode & Nama Material</th>
                <th className="py-2.5 px-3 text-right">Kebutuhan</th>
                <th className="py-2.5 px-3 text-right">Diterima</th>
                <th className="py-2.5 px-3 text-right">Defisit</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Tingkat Risiko</th>
                <th className="py-2.5 px-3">Tindakan Mitigasi yang Disarankan</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items
                .filter(i => i.readinessStatus !== 'READY' || i.overallRiskLevel === 'CRITICAL' || i.overallRiskLevel === 'HIGH')
                .slice(0, 5)
                .map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => onSelectItem(item)}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 font-mono">{item.or}</div>
                      <div className="text-[11px] text-slate-500">{item.style}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-blue-700 font-bold text-[11px]">
                        {item.materialCode}
                      </div>
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {item.materialName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {item.quantity.toLocaleString('id-ID')} {item.normalizedSatuan}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 font-medium">
                      {item.receivedQty.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.shortage > 0 ? (
                        <span className="font-bold text-rose-600">
                          -{item.shortage.toLocaleString('id-ID')} {item.normalizedSatuan}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.readinessStatus === 'READY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.readinessStatus === 'NOT READY'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {item.readinessStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.overallRiskLevel === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : item.overallRiskLevel === 'HIGH'
                          ? 'bg-orange-500 text-white'
                          : item.overallRiskLevel === 'MEDIUM'
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {item.overallRiskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs max-w-xs truncate">
                      {item.mitigationRecommendation}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                      >
                        Detail
                      </button>
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
