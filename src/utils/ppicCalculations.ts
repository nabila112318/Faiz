/**
 * PPIC Calculations, Risk Scoring & Data Parsing Module
 * Core business logic decoupled from React UI for deterministic testing and accuracy.
 */

export interface RawMaterialRow {
  or: string;
  style: string;
  tanggalUpdate: string; // Kolom D: Tanggal terakhir pembaruan informasi material
  displayName: string;   // Kolom E: Order Lines/Product/Display Name
  quantity: number | string;     // Kolom F: Kebutuhan
  receivedQty: number | string;  // Kolom G: Diterima
  kekuranganKelebihan?: number | string; // Kolom H: Selisih dari spreadsheet
  satuan: string;        // Kolom I: Satuan
  ket: string;           // Kolom J: Status sumber (OKE, BELUM, dll.)
  // Optional extended columns if present in future or custom sheets
  tanggalKebutuhan?: string;
  tanggalEstimasiKedatangan?: string;
}

export type ReadinessStatus = 'READY' | 'NOT READY' | 'CHECK DATA';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProcessedMaterialItem {
  id: string;
  rowIndex: number;
  or: string;
  style: string;
  materialCode: string;
  materialName: string;
  rawDisplayName: string;
  tanggalUpdate: string;
  parsedDate: string | null;
  dataAgeDays: number | null;
  isStale: boolean;
  quantity: number;
  receivedQty: number;
  spreadsheetDiff: number;
  calculatedDiff: number; // receivedQty - quantity
  shortage: number;       // max(0, quantity - receivedQty)
  surplus: number;        // max(0, receivedQty - quantity)
  satuan: string;
  normalizedSatuan: string;
  ket: string;
  readinessStatus: ReadinessStatus;
  statusNotes: string[];
  hasDiscrepancy: boolean;
  
  // Risk Categories
  shortageRisk: {
    level: RiskLevel;
    score: number;
    explanation: string;
  };
  staleDataRisk: {
    level: RiskLevel;
    score: number;
    ageDays: number | null;
    explanation: string;
  };
  deliveryDelayRisk: {
    status: 'NOT_EVALUABLE' | 'EVALUATED';
    message: string;
    delayDays: number | null;
  };
  
  overallRiskScore: number; // 0 - 100
  overallRiskLevel: RiskLevel;
  mitigationRecommendation: string;
  priorityFollowUp: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RiskWeightsConfig {
  shortageWeight: number; // Default 0.50
  staleDataWeight: number; // Default 0.30
  consistencyWeight: number; // Default 0.20
  staleDaysThreshold: number; // Default 7 days
}

export const DEFAULT_RISK_CONFIG: RiskWeightsConfig = {
  shortageWeight: 0.50,
  staleDataWeight: 0.30,
  consistencyWeight: 0.20,
  staleDaysThreshold: 7,
};

/**
 * Robust numeric parser supporting both comma and period decimals,
 * thousand separators, currency symbols, and empty/dash values.
 */
export function parseNumericValue(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  const clean = String(val).trim();
  if (clean === '-' || clean === 'N/A' || clean === 'null') return 0;

  // If format is Indonesian (e.g. 1.250,50) where dot is thousand and comma is decimal
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(clean)) {
    const standardized = clean.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(standardized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // If format is English (e.g. 1,250.50) where comma is thousand
  const noCommas = clean.replace(/,/g, '');
  const parsed = parseFloat(noCommas);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Extracts material code and clean name from Display Name
 * Examples:
 * "[MAT-001] KAIN COMBED 30S" -> code: "MAT-001", name: "KAIN COMBED 30S"
 * "KANCING 4 HOLE [KNC-04]" -> code: "KNC-04", name: "KANCING 4 HOLE"
 * "BENANG JAHIT 40/2 HITAM" -> code: "BENANG-40-2", name: "BENANG JAHIT 40/2 HITAM"
 */
export function extractMaterialCodeAndName(displayName: string): { code: string; name: string } {
  if (!displayName || typeof displayName !== 'string') {
    return { code: 'UNKNOWN', name: 'Unknown Material' };
  }
  const trimmed = displayName.trim();
  
  // Look for [CODE] pattern
  const bracketMatch = trimmed.match(/\[([A-Za-z0-9\-_./]+)\]/);
  if (bracketMatch) {
    const code = bracketMatch[1].trim();
    const cleanName = trimmed.replace(/\[[A-Za-z0-9\-_./]+\]/, '').replace(/\s+/g, ' ').trim();
    return {
      code,
      name: cleanName || code,
    };
  }

  // Look for (CODE) pattern
  const parenMatch = trimmed.match(/\(([A-Za-z0-9\-_./]{3,15})\)/);
  if (parenMatch) {
    const code = parenMatch[1].trim();
    const cleanName = trimmed.replace(/\([A-Za-z0-9\-_./]{3,15}\)/, '').replace(/\s+/g, ' ').trim();
    return {
      code,
      name: cleanName || code,
    };
  }

  // Look for prefixed code e.g. "MAT-001 - Kain Rayon"
  const prefixMatch = trimmed.match(/^([A-Za-z0-9\-_]{3,15})\s*[-:]\s*(.+)$/);
  if (prefixMatch) {
    return {
      code: prefixMatch[1].trim(),
      name: prefixMatch[2].trim(),
    };
  }

  // Fallback: create a deterministic synthetic code from product initials/tokens
  const words = trimmed.split(/[\s-]+/).filter(Boolean);
  const code = words.slice(0, 3).map(w => w.toUpperCase().slice(0, 4)).join('-');
  return {
    code: code || 'MAT',
    name: trimmed,
  };
}

/**
 * Normalize unit strings safely without blindly conflating incompatible units.
 * YDS and Yard are normalized to 'YDS'.
 * Gros, Dozen, PCS, Roll, KG are kept distinct.
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return 'UNIT';
  const clean = unit.trim().toUpperCase();
  if (clean === 'YARD' || clean === 'YARDS' || clean === 'YD' || clean === 'YDS') return 'YDS';
  if (clean === 'DOZEN' || clean === 'DOZ' || clean === 'DOZENS' || clean === 'DOZEN(S)') return 'DOZEN';
  if (clean === 'GROS' || clean === 'GROSS') return 'GROS';
  if (clean === 'PCS' || clean === 'PC' || clean === 'PIECE' || clean === 'PIECES') return 'PCS';
  if (clean === 'METER' || clean === 'MTR' || clean === 'M') return 'MTR';
  if (clean === 'KG' || clean === 'KGS' || clean === 'KILOGRAM') return 'KG';
  if (clean === 'ROLL' || clean === 'ROLLS') return 'ROLL';
  return clean;
}

/**
 * Parse date from column D ("Tanggal terakhir update data")
 * Supports standard ISO YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, or Excel date numbers.
 */
export function parseDateString(dateStr: string | number | null | undefined): { parsedDate: Date | null; iso: string | null } {
  if (!dateStr) return { parsedDate: null, iso: null };
  
  if (typeof dateStr === 'number') {
    // Excel serial date (e.g. 45000)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const target = new Date(excelEpoch.getTime() + dateStr * 86400000);
    if (!isNaN(target.getTime())) {
      return { parsedDate: target, iso: target.toISOString().split('T')[0] };
    }
  }

  const str = String(dateStr).trim();
  if (!str) return { parsedDate: null, iso: null };

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { parsedDate: date, iso };
    }
  }

  // YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { parsedDate: date, iso };
    }
  }

  // Standard Date parse fallback
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return { parsedDate: fallback, iso: fallback.toISOString().split('T')[0] };
  }

  return { parsedDate: null, iso: null };
}

/**
 * Calculate age of information in days from Column D
 */
export function calculateDataAgeInDays(parsedDate: Date | null, referenceDate: Date = new Date()): number | null {
  if (!parsedDate) return null;
  const diffTime = referenceDate.getTime() - parsedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Process a single material row from sheet "Rekap"
 */
export function processMaterialRow(
  raw: RawMaterialRow,
  index: number,
  config: RiskWeightsConfig = DEFAULT_RISK_CONFIG,
  referenceDate: Date = new Date()
): ProcessedMaterialItem {
  const or = String(raw.or || '').trim();
  const style = String(raw.style || '').trim();
  const rawDisplayName = String(raw.displayName || '').trim();
  const ketRaw = String(raw.ket || '').trim();
  const satuanRaw = String(raw.satuan || '').trim();

  const quantity = Math.max(0, parseNumericValue(raw.quantity));
  const receivedQty = Math.max(0, parseNumericValue(raw.receivedQty));
  
  // Selisih calculation:
  // Standard PPIC convention: receivedQty - quantity
  // e.g. Received: 50, Kebutuhan: 100 -> Selisih = -50 (Kekurangan 50)
  // e.g. Received: 120, Kebutuhan: 100 -> Selisih = +20 (Kelebihan 20)
  const calculatedDiff = receivedQty - quantity;
  const spreadsheetDiff = raw.kekuranganKelebihan !== undefined && raw.kekuranganKelebihan !== ''
    ? parseNumericValue(raw.kekuranganKelebihan)
    : calculatedDiff;

  const shortage = Math.max(0, quantity - receivedQty);
  const surplus = Math.max(0, receivedQty - quantity);

  const { code: materialCode, name: materialName } = extractMaterialCodeAndName(rawDisplayName);
  const normalizedSatuan = normalizeUnit(satuanRaw);

  const { parsedDate, iso: dateIso } = parseDateString(raw.tanggalUpdate);
  const dataAgeDays = calculateDataAgeInDays(parsedDate, referenceDate);
  const isStale = dataAgeDays !== null && dataAgeDays > config.staleDaysThreshold;

  // Normalized Ket status
  const ketUpper = ketRaw.toUpperCase();
  const isSourceOke = ketUpper.includes('OKE') || ketUpper.includes('OK') || ketUpper.includes('READY') || ketUpper.includes('LENGKAP');
  const isSourceBelum = ketUpper.includes('BELUM') || ketUpper.includes('NOT') || ketUpper.includes('KURANG') || ketUpper.includes('PENDING');

  const statusNotes: string[] = [];
  let readinessStatus: ReadinessStatus;
  let hasDiscrepancy = false;

  // Check for conflicts between quantity and status
  if (isSourceOke && shortage > 0) {
    // Contradiction: Status OKE but still has shortage!
    readinessStatus = 'CHECK DATA';
    hasDiscrepancy = true;
    statusNotes.push(`Status tertulis '${ketRaw}' namun kuantitas masih kurang ${shortage} ${normalizedSatuan}. Periksa fisik gudang.`);
  } else if (isSourceBelum && shortage === 0 && quantity > 0) {
    // Contradiction: Status BELUM but full quantity has been received!
    readinessStatus = 'CHECK DATA';
    hasDiscrepancy = true;
    statusNotes.push(`Status tertulis '${ketRaw}' namun kuantitas sudah tercukupi (${receivedQty}/${quantity} ${normalizedSatuan}). Verifikasi update status.`);
  } else if (!rawDisplayName || quantity === 0) {
    readinessStatus = 'CHECK DATA';
    hasDiscrepancy = true;
    statusNotes.push('Data baris tidak lengkap (nama material atau kuantitas kebutuhan 0/kosong).');
  } else if (shortage === 0 && isSourceOke) {
    readinessStatus = 'READY';
  } else if (shortage > 0) {
    readinessStatus = 'NOT READY';
  } else if (shortage === 0) {
    readinessStatus = 'READY';
  } else {
    readinessStatus = 'NOT READY';
  }

  // Cross-check spreadsheetDiff with calculatedDiff
  if (Math.abs(spreadsheetDiff - calculatedDiff) > 0.01 && raw.kekuranganKelebihan !== undefined && raw.kekuranganKelebihan !== '') {
    // Allow for inverted sign if spreadsheet recorded shortage as positive number
    const invertedMatch = Math.abs(spreadsheetDiff + calculatedDiff) <= 0.01;
    if (!invertedMatch) {
      statusNotes.push(`Nilai selisih spreadsheet (${spreadsheetDiff}) berbeda dengan kalkulasi Received - Qty (${calculatedDiff}).`);
    }
  }

  // Category A: Material Shortage Risk Scoring (0 - 100)
  let shortageScore = 0;
  let shortageLevel: RiskLevel = 'LOW';
  let shortageExplanation = 'Kebutuhan material terpenuhi.';

  if (quantity === 0 && receivedQty === 0) {
    shortageScore = 10;
    shortageLevel = 'LOW';
    shortageExplanation = 'Kuantitas kebutuhan 0.';
  } else if (shortage === 0) {
    shortageScore = 0;
    shortageLevel = 'LOW';
    shortageExplanation = surplus > 0 
      ? `Material lengkap dengan surplus +${surplus} ${normalizedSatuan}.`
      : 'Material lengkap 100%.';
  } else {
    const shortageRatio = quantity > 0 ? shortage / quantity : 1;
    if (receivedQty === 0 && (isSourceBelum || shortageRatio >= 0.8)) {
      shortageScore = 100;
      shortageLevel = 'CRITICAL';
      shortageExplanation = `Belum ada penerimaan sama sekali (0/${quantity} ${normalizedSatuan}) - Kekurangan 100%.`;
    } else if (shortageRatio >= 0.5) {
      shortageScore = 80;
      shortageLevel = 'HIGH';
      shortageExplanation = `Kekurangan ${shortage} ${normalizedSatuan} (${Math.round(shortageRatio * 100)}% dari kebutuhan).`;
    } else if (shortageRatio >= 0.2) {
      shortageScore = 55;
      shortageLevel = 'MEDIUM';
      shortageExplanation = `Kekurangan sedang: ${shortage} ${normalizedSatuan} (${Math.round(shortageRatio * 100)}% dari kebutuhan).`;
    } else {
      shortageScore = 25;
      shortageLevel = 'LOW';
      shortageExplanation = `Kekurangan minor: ${shortage} ${normalizedSatuan} (${Math.round(shortageRatio * 100)}% dari kebutuhan).`;
    }
  }

  // Category B: Stale Data Risk Scoring (0 - 100)
  let staleScore = 0;
  let staleLevel: RiskLevel = 'LOW';
  let staleExplanation = '';

  if (dataAgeDays === null) {
    staleScore = 60;
    staleLevel = 'HIGH';
    staleExplanation = 'Tanggal pembaruan informasi tidak tersedia/tidak valid. Perlu konfirmasi.';
  } else if (dataAgeDays <= 3) {
    staleScore = 10;
    staleLevel = 'LOW';
    staleExplanation = `Data sangat mutakhir (diperbarui ${dataAgeDays} hari yang lalu).`;
  } else if (dataAgeDays <= config.staleDaysThreshold) {
    staleScore = 30;
    staleLevel = 'MEDIUM';
    staleExplanation = `Umur data normal (${dataAgeDays} hari sejak update terakhir).`;
  } else if (dataAgeDays <= 14) {
    staleScore = 75;
    staleLevel = 'HIGH';
    staleExplanation = `Peringatan: Data belum diperbarui selama ${dataAgeDays} hari (melewati batas ${config.staleDaysThreshold} hari).`;
  } else {
    staleScore = 100;
    staleLevel = 'CRITICAL';
    staleExplanation = `Kritis: Data usang! Terakhir diperbarui ${dataAgeDays} hari lalu. Sangat berisiko data fisik sudah berubah.`;
  }

  // Category C: Delivery Delay Risk (Strict PPIC Rule)
  // "Kolom D pada sheet 'Rekap' merupakan tanggal update, BUKAN tanggal kebutuhan atau kedatangan.
  // Jangan mencampur umur data dengan durasi keterlambatan pengiriman!"
  const deliveryDelayRisk: ProcessedMaterialItem['deliveryDelayRisk'] = {
    status: 'NOT_EVALUABLE',
    message: 'Belum dapat dinilai: data jadwal pengiriman/kebutuhan belum tersedia pada sheet Rekap.',
    delayDays: null,
  };

  // Consistency Score (0 - 100)
  const consistencyScore = hasDiscrepancy ? 85 : 0;

  // Overall Weighted Risk Score (0 - 100)
  const overallRiskScore = Math.min(
    100,
    Math.round(
      shortageScore * config.shortageWeight +
      staleScore * config.staleDataWeight +
      consistencyScore * config.consistencyWeight
    )
  );

  let overallRiskLevel: RiskLevel;
  if (overallRiskScore >= 75) {
    overallRiskLevel = 'CRITICAL';
  } else if (overallRiskScore >= 50) {
    overallRiskLevel = 'HIGH';
  } else if (overallRiskScore >= 25) {
    overallRiskLevel = 'MEDIUM';
  } else {
    overallRiskLevel = 'LOW';
  }

  // Mitigation Recommendations based on factual root cause
  let mitigationRecommendation = '';
  let priorityFollowUp: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  if (hasDiscrepancy) {
    mitigationRecommendation = 'Prioritas: Rekonsiliasi data antara catatan penerimaan fisik gudang dan status spreadsheet.';
    priorityFollowUp = 'URGENT';
  } else if (shortageLevel === 'CRITICAL' && isStale) {
    mitigationRecommendation = `URGENT: Material belum diterima (defisit ${shortage} ${normalizedSatuan}) dan data belum diupdate ${dataAgeDays} hari. Segera hubungi Purchasing & Supplier untuk konfirmasi status delivery.`;
    priorityFollowUp = 'URGENT';
  } else if (shortageLevel === 'CRITICAL') {
    mitigationRecommendation = `Kekurangan total ${shortage} ${normalizedSatuan}. Hubungi Supplier untuk meminta jadwal kedatangan parsial batch pertama agar lini produksi tidak terhenti.`;
    priorityFollowUp = 'URGENT';
  } else if (shortageLevel === 'HIGH') {
    mitigationRecommendation = `Kekurangan ${shortage} ${normalizedSatuan}. Koordinasikan dengan tim Cutting/Sewing untuk penyesuaian urutan OR atau alokasi sisa bahan.`;
    priorityFollowUp = 'HIGH';
  } else if (isStale && shortage > 0) {
    mitigationRecommendation = `Data sudah ${dataAgeDays} hari tidak diupdate. Mintakan bukti Surat Jalan / GRN terbaru ke tim logistik masuk.`;
    priorityFollowUp = 'HIGH';
  } else if (isStale) {
    mitigationRecommendation = `Informasi terakhir diperbarui ${dataAgeDays} hari lalu. Lakukan pengecekan rutin berkala.`;
    priorityFollowUp = 'MEDIUM';
  } else if (shortageLevel === 'MEDIUM') {
    mitigationRecommendation = `Pantau sisa pengiriman ${shortage} ${normalizedSatuan}. Pastikan jadwal kirim supplier sesuai target produksi.`;
    priorityFollowUp = 'MEDIUM';
  } else if (surplus > 0) {
    mitigationRecommendation = `Surplus +${surplus} ${normalizedSatuan}. Simpan sebagai cadangan atau kembalikan jika berlebih sesuai SOP inventory.`;
    priorityFollowUp = 'LOW';
  } else {
    mitigationRecommendation = 'Material siap digunakan untuk proses produksi sesuai jadwal PPIC.';
    priorityFollowUp = 'LOW';
  }

  return {
    id: `${or || 'NO_OR'}-${style || 'NO_STYLE'}-${materialCode}-${index}`,
    rowIndex: index + 1,
    or,
    style,
    materialCode,
    materialName,
    rawDisplayName,
    tanggalUpdate: raw.tanggalUpdate || '-',
    parsedDate: dateIso,
    dataAgeDays,
    isStale,
    quantity,
    receivedQty,
    spreadsheetDiff,
    calculatedDiff,
    shortage,
    surplus,
    satuan: satuanRaw || 'UNIT',
    normalizedSatuan,
    ket: ketRaw || '-',
    readinessStatus,
    statusNotes,
    hasDiscrepancy,
    shortageRisk: {
      level: shortageLevel,
      score: shortageScore,
      explanation: shortageExplanation,
    },
    staleDataRisk: {
      level: staleLevel,
      score: staleScore,
      ageDays: dataAgeDays,
      explanation: staleExplanation,
    },
    deliveryDelayRisk,
    overallRiskScore,
    overallRiskLevel,
    mitigationRecommendation,
    priorityFollowUp,
  };
}

/**
 * Aggregations and PPIC KPI Summary
 */
export interface PPICKPISummary {
  totalRows: number;
  readyRows: number;
  notReadyRows: number;
  checkDataRows: number;
  readinessPercentage: number;
  
  // Unique groupings
  uniqueMaterialsCount: number;
  impactedOrsCount: number;
  impactedStylesCount: number;
  
  // Risk counts
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  staleDataCount: number;

  // Shortages grouped safely by material and normalized unit
  shortagesByMaterialAndUnit: Array<{
    materialCode: string;
    materialName: string;
    unit: string;
    totalShortage: number;
    affectedOrCount: number;
    affectedOrs: string[];
    riskLevel: RiskLevel;
  }>;

  // Impact per OR
  impactByOr: Array<{
    or: string;
    totalItems: number;
    readyItems: number;
    notReadyItems: number;
    checkDataItems: number;
    readinessRate: number;
    styles: string[];
    maxRiskLevel: RiskLevel;
  }>;
}

export function computePPICKPIs(items: ProcessedMaterialItem[]): PPICKPISummary {
  const totalRows = items.length;
  if (totalRows === 0) {
    return {
      totalRows: 0,
      readyRows: 0,
      notReadyRows: 0,
      checkDataRows: 0,
      readinessPercentage: 0,
      uniqueMaterialsCount: 0,
      impactedOrsCount: 0,
      impactedStylesCount: 0,
      criticalRiskCount: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      staleDataCount: 0,
      shortagesByMaterialAndUnit: [],
      impactByOr: [],
    };
  }

  let readyRows = 0;
  let notReadyRows = 0;
  let checkDataRows = 0;
  let criticalRiskCount = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let staleDataCount = 0;

  const uniqueMaterials = new Set<string>();
  const impactedOrs = new Set<string>();
  const impactedStyles = new Set<string>();

  // Map for aggregating shortages strictly by MaterialCode + Unit
  const shortageMap = new Map<string, {
    materialCode: string;
    materialName: string;
    unit: string;
    totalShortage: number;
    affectedOrs: Set<string>;
    maxRisk: RiskLevel;
  }>();

  // Map for OR impact
  const orMap = new Map<string, {
    or: string;
    total: number;
    ready: number;
    notReady: number;
    checkData: number;
    styles: Set<string>;
    maxRiskScore: number;
  }>();

  for (const item of items) {
    uniqueMaterials.add(item.materialCode);

    if (item.readinessStatus === 'READY') {
      readyRows++;
    } else if (item.readinessStatus === 'NOT READY') {
      notReadyRows++;
      if (item.or) impactedOrs.add(item.or);
      if (item.style) impactedStyles.add(item.style);
    } else {
      checkDataRows++;
      if (item.or) impactedOrs.add(item.or);
      if (item.style) impactedStyles.add(item.style);
    }

    if (item.overallRiskLevel === 'CRITICAL') criticalRiskCount++;
    else if (item.overallRiskLevel === 'HIGH') highRiskCount++;
    else if (item.overallRiskLevel === 'MEDIUM') mediumRiskCount++;
    else lowRiskCount++;

    if (item.isStale) staleDataCount++;

    // Aggregate shortages
    if (item.shortage > 0) {
      const groupKey = `${item.materialCode}__${item.normalizedSatuan}`;
      const existing = shortageMap.get(groupKey);
      if (existing) {
        existing.totalShortage += item.shortage;
        if (item.or) existing.affectedOrs.add(item.or);
        if (item.overallRiskScore > (existing.maxRisk === 'CRITICAL' ? 100 : existing.maxRisk === 'HIGH' ? 75 : 50)) {
          existing.maxRisk = item.overallRiskLevel;
        }
      } else {
        shortageMap.set(groupKey, {
          materialCode: item.materialCode,
          materialName: item.materialName,
          unit: item.normalizedSatuan,
          totalShortage: item.shortage,
          affectedOrs: new Set(item.or ? [item.or] : []),
          maxRisk: item.overallRiskLevel,
        });
      }
    }

    // Aggregate by OR
    const orKey = item.or || 'UNKNOWN_OR';
    const orEntry = orMap.get(orKey) || {
      or: orKey,
      total: 0,
      ready: 0,
      notReady: 0,
      checkData: 0,
      styles: new Set<string>(),
      maxRiskScore: 0,
    };
    orEntry.total++;
    if (item.readinessStatus === 'READY') orEntry.ready++;
    else if (item.readinessStatus === 'NOT READY') orEntry.notReady++;
    else orEntry.checkData++;
    if (item.style) orEntry.styles.add(item.style);
    if (item.overallRiskScore > orEntry.maxRiskScore) orEntry.maxRiskScore = item.overallRiskScore;
    orMap.set(orKey, orEntry);
  }

  const readinessPercentage = totalRows > 0 ? Math.round((readyRows / totalRows) * 1000) / 10 : 0;

  // Convert shortages map to sorted list (largest shortages first)
  const shortagesByMaterialAndUnit = Array.from(shortageMap.values())
    .map(s => ({
      materialCode: s.materialCode,
      materialName: s.materialName,
      unit: s.unit,
      totalShortage: Math.round(s.totalShortage * 100) / 100,
      affectedOrCount: s.affectedOrs.size,
      affectedOrs: Array.from(s.affectedOrs),
      riskLevel: s.maxRisk,
    }))
    .sort((a, b) => b.totalShortage - a.totalShortage);

  // Convert OR impact
  const impactByOr = Array.from(orMap.values())
    .map(o => ({
      or: o.or,
      totalItems: o.total,
      readyItems: o.ready,
      notReadyItems: o.notReady,
      checkDataItems: o.checkData,
      readinessRate: o.total > 0 ? Math.round((o.ready / o.total) * 100) : 0,
      styles: Array.from(o.styles),
      maxRiskLevel: (o.maxRiskScore >= 75 ? 'CRITICAL' : o.maxRiskScore >= 50 ? 'HIGH' : o.maxRiskScore >= 25 ? 'MEDIUM' : 'LOW') as RiskLevel,
    }))
    .sort((a, b) => a.readinessRate - b.readinessRate);

  return {
    totalRows,
    readyRows,
    notReadyRows,
    checkDataRows,
    readinessPercentage,
    uniqueMaterialsCount: uniqueMaterials.size,
    impactedOrsCount: impactedOrs.size,
    impactedStylesCount: impactedStyles.size,
    criticalRiskCount,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    staleDataCount,
    shortagesByMaterialAndUnit,
    impactByOr,
  };
}

/**
 * Intelligent Header Detection for Google Sheets "Rekap"
 * Scans 2D array (e.g. from Google Apps Script or CSV) to locate the exact header row
 * and map columns B through J dynamically.
 */
export interface ColumnIndexMap {
  headerRowIndex: number;
  colOR: number;
  colStyle: number;
  colTanggal: number;
  colDisplayName: number;
  colQuantity: number;
  colReceived: number;
  colDiff: number;
  colSatuan: number;
  colKet: number;
}

export function detectHeaders(rows: any[][]): ColumnIndexMap | null {
  if (!rows || rows.length === 0) return null;

  // Look for header row within the first 10 rows
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r].map(c => String(c || '').trim().toLowerCase());
    
    // Check key signatures
    let colOR = -1;
    let colStyle = -1;
    let colTanggal = -1;
    let colDisplayName = -1;
    let colQuantity = -1;
    let colReceived = -1;
    let colDiff = -1;
    let colSatuan = -1;
    let colKet = -1;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (/^or$|^order\s*reference|^or\s*no/i.test(cell)) colOR = c;
      else if (/^style|^model|^style\s*no/i.test(cell)) colStyle = c;
      else if (/^tanggal|^date|^tgl\s*update|^last\s*update/i.test(cell)) colTanggal = c;
      else if (/order\s*lines\/product|product|display\s*name|nama\s*material|material/i.test(cell)) colDisplayName = c;
      else if (/order\s*lines\/quantity|quantity|kebutuhan|qty\s*order|qty\s*kebutuhan/i.test(cell) && !cell.includes('received')) colQuantity = c;
      else if (/received\s*qty|diterima|qty\s*terima|received/i.test(cell)) colReceived = c;
      else if (/kekurangan|selisih|diff|balance|kelebihan/i.test(cell)) colDiff = c;
      else if (/satuan|unit|uom/i.test(cell)) colSatuan = c;
      else if (/^ket$|^keterangan$|^status$/i.test(cell)) colKet = c;
    }

    // If at least 4 critical columns match (e.g. OR or Style, Product, Qty, Received or Ket)
    const matches = [colOR, colStyle, colDisplayName, colQuantity, colReceived, colKet].filter(idx => idx !== -1).length;
    if (matches >= 3) {
      // Fallback standard positions (B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9) if any wasn't named explicitly
      return {
        headerRowIndex: r,
        colOR: colOR !== -1 ? colOR : 1,
        colStyle: colStyle !== -1 ? colStyle : 2,
        colTanggal: colTanggal !== -1 ? colTanggal : 3,
        colDisplayName: colDisplayName !== -1 ? colDisplayName : 4,
        colQuantity: colQuantity !== -1 ? colQuantity : 5,
        colReceived: colReceived !== -1 ? colReceived : 6,
        colDiff: colDiff !== -1 ? colDiff : 7,
        colSatuan: colSatuan !== -1 ? colSatuan : 8,
        colKet: colKet !== -1 ? colKet : 9,
      };
    }
  }

  // Fallback to strict prompt specification:
  // Kolom B (1): OR, C (2): Style, D (3): Tanggal, E (4): Product, F (5): Qty, G (6): Received, H (7): Selisih, I (8): Satuan, J (9): Ket
  return {
    headerRowIndex: 0,
    colOR: 1,
    colStyle: 2,
    colTanggal: 3,
    colDisplayName: 4,
    colQuantity: 5,
    colReceived: 6,
    colDiff: 7,
    colSatuan: 8,
    colKet: 9,
  };
}

/**
 * Parses 2D array of spreadsheet values into RawMaterialRow[]
 */
export function parseSheetRows(rows: any[][], mapping?: ColumnIndexMap): RawMaterialRow[] {
  if (!rows || rows.length <= 1) return [];
  const map = mapping || detectHeaders(rows) || {
    headerRowIndex: 0,
    colOR: 1,
    colStyle: 2,
    colTanggal: 3,
    colDisplayName: 4,
    colQuantity: 5,
    colReceived: 6,
    colDiff: 7,
    colSatuan: 8,
    colKet: 9,
  };

  const results: RawMaterialRow[] = [];
  for (let r = map.headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const orVal = String(row[map.colOR] ?? '').trim();
    const styleVal = String(row[map.colStyle] ?? '').trim();
    const nameVal = String(row[map.colDisplayName] ?? '').trim();

    // Skip empty filler rows
    if (!orVal && !styleVal && !nameVal) continue;

    results.push({
      or: orVal,
      style: styleVal,
      tanggalUpdate: String(row[map.colTanggal] ?? '').trim(),
      displayName: nameVal,
      quantity: row[map.colQuantity] ?? 0,
      receivedQty: row[map.colReceived] ?? 0,
      kekuranganKelebihan: row[map.colDiff] ?? '',
      satuan: String(row[map.colSatuan] ?? '').trim(),
      ket: String(row[map.colKet] ?? '').trim(),
    });
  }

  return results;
}
