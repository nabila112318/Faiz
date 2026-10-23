import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { ProcessedMaterialItem, ReadinessStatus, RiskLevel } from '../utils/ppicCalculations';

interface ReadinessTableViewProps {
  items: ProcessedMaterialItem[];
  onSelectItem: (item: ProcessedMaterialItem) => void;
  initialStatusFilter?: string;
  initialRiskFilter?: RiskLevel | null;
}

export const ReadinessTableView: React.FC<ReadinessTableViewProps> = ({
  items,
  onSelectItem,
  initialStatusFilter,
  initialRiskFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [orFilter, setOrFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>(initialRiskFilter || 'ALL');
  const [onlyStale, setOnlyStale] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'shortage' | 'risk' | 'date' | 'or'>('shortage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Unique ORs for dropdown
  const uniqueOrs = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.or) set.add(i.or); });
    return Array.from(set).sort();
  }, [items]);

  // Filtering and sorting
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = item.materialCode.toLowerCase().includes(query);
        const matchesName = item.materialName.toLowerCase().includes(query);
        const matchesOr = item.or.toLowerCase().includes(query);
        const matchesStyle = item.style.toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesOr && !matchesStyle) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && item.readinessStatus !== statusFilter) {
        return false;
      }

      // OR
      if (orFilter !== 'ALL' && item.or !== orFilter) {
        return false;
      }

      // Risk
      if (riskFilter !== 'ALL' && item.overallRiskLevel !== riskFilter) {
        return false;
      }

      // Stale only
      if (onlyStale && !item.isStale) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'shortage') {
        comparison = a.shortage - b.shortage;
      } else if (sortBy === 'risk') {
        comparison = a.overallRiskScore - b.overallRiskScore;
      } else if (sortBy === 'date') {
        comparison = (a.dataAgeDays ?? 999) - (b.dataAgeDays ?? 999);
      } else if (sortBy === 'or') {
        comparison = a.or.localeCompare(b.or);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [items, searchQuery, statusFilter, orFilter, riskFilter, onlyStale, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setOrFilter('ALL');
    setRiskFilter('ALL');
    setOnlyStale(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Kode Material, Nama, OR, atau Style..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="READY">READY</option>
              <option value="NOT READY">NOT READY</option>
              <option value="CHECK DATA">CHECK DATA (Konflik)</option>
            </select>

            {/* OR Filter */}
            <select
              value={orFilter}
              onChange={(e) => {
                setOrFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua OR</option>
              {uniqueOrs.map(or => (
                <option key={or} value={or}>{or}</option>
              ))}
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Tingkat Risiko</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            {/* Stale toggle */}
            <button
              onClick={() => {
                setOnlyStale(!onlyStale);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                onlyStale
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Data Usang Saja</span>
            </button>

            {/* Reset */}
            {(searchQuery || statusFilter !== 'ALL' || orFilter !== 'ALL' || riskFilter !== 'ALL' || onlyStale) && (
              <button
                onClick={resetFilters}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sorting and Result Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> dari {items.length} baris material
          </div>
          <div className="flex items-center gap-2">
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer"
            >
              <option value="shortage">Kekurangan Terbesar</option>
              <option value="risk">Skor Risiko</option>
              <option value="date">Umur Data Update</option>
              <option value="or">Nomor OR</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-100 rounded cursor-pointer"
              title={sortOrder === 'desc' ? 'Urutan Menurun (Z-A / Besar-Kecil)' : 'Urutan Menaik (A-Z / Kecil-Besar)'}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Material Readiness Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">OR & Style</th>
                <th className="py-3 px-3">Kode & Nama Material</th>
                <th className="py-3 px-3 text-right">Kebutuhan</th>
                <th className="py-3 px-3 text-right">Diterima</th>
                <th className="py-3 px-3 text-right">Defisit / Surplus</th>
                <th className="py-3 px-3 text-center">Satuan</th>
                <th className="py-3 px-3 text-center">Tanggal Update (Kolom D)</th>
                <th className="py-3 px-3 text-center">Status Sumber</th>
                <th className="py-3 px-3 text-center">Kesiapan</th>
                <th className="py-3 px-3 text-center">Risiko</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-6 h-6 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">Tidak ada material yang cocok dengan filter.</p>
                      <button
                        onClick={resetFilters}
                        className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    {/* OR & Style */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 font-mono text-xs">{item.or || '-'}</div>
                      <div className="text-[11px] text-slate-500">{item.style || '-'}</div>
                    </td>

                    {/* Material */}
                    <td className="py-3 px-3 max-w-xs">
                      <span className="font-mono text-blue-700 font-bold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-block mb-0.5">
                        {item.materialCode}
                      </span>
                      <div className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-900">
                        {item.materialName}
                      </div>
                    </td>

                    {/* Kebutuhan */}
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {item.quantity.toLocaleString('id-ID')}
                    </td>

                    {/* Diterima */}
                    <td className="py-3 px-3 text-right font-medium text-blue-700">
                      {item.receivedQty.toLocaleString('id-ID')}
                    </td>

                    {/* Defisit / Surplus */}
                    <td className="py-3 px-3 text-right font-bold">
                      {item.shortage > 0 ? (
                        <span className="text-rose-600">
                          -{item.shortage.toLocaleString('id-ID')}
                        </span>
                      ) : item.surplus > 0 ? (
                        <span className="text-emerald-600">
                          +{item.surplus.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Satuan */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.normalizedSatuan}
                      </span>
                    </td>

                    {/* Tanggal Update & Umur Data */}
                    <td className="py-3 px-3 text-center">
                      <div className="text-slate-700 font-medium text-[11px]">{item.tanggalUpdate}</div>
                      {item.dataAgeDays !== null ? (
                        <div className={`text-[10px] font-bold ${item.isStale ? 'text-amber-700' : 'text-slate-400'}`}>
                          {item.dataAgeDays} hari lalu {item.isStale && '⚠️'}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">-</div>
                      )}
                    </td>

                    {/* Status Sumber */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {item.ket}
                      </span>
                    </td>

                    {/* Kesiapan */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.readinessStatus === 'READY'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.readinessStatus === 'NOT READY'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {item.readinessStatus === 'READY' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {item.readinessStatus === 'NOT READY' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {item.readinessStatus === 'CHECK DATA' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                        {item.readinessStatus}
                      </span>
                    </td>

                    {/* Tingkat Risiko */}
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

                    {/* Aksi */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Lihat Detail & Rekomendasi PPIC"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
