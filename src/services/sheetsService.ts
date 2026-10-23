/**
 * Google Sheets Integration & Synchronization Service
 * Supports Google Apps Script Web App (recommended), Google Sheets CSV Export,
 * and clearly-labeled benchmark test data.
 */

import {
  RawMaterialRow,
  ProcessedMaterialItem,
  RiskWeightsConfig,
  DEFAULT_RISK_CONFIG,
  processMaterialRow,
  detectHeaders,
  parseSheetRows,
  computePPICKPIs,
  PPICKPISummary,
} from '../utils/ppicCalculations.ts';

export type DataSourceType = 'apps_script' | 'google_csv' | 'demo';

export interface SheetsConfig {
  sourceType: DataSourceType;
  spreadsheetId: string;
  sheetName: string;
  appsScriptUrl: string;
  autoSyncEnabled: boolean;
  autoSyncIntervalSec: number; // default 60
  riskConfig: RiskWeightsConfig;
}

export interface SyncState {
  isConnecting: boolean;
  isSyncing: boolean;
  lastSyncSuccessTime: string | null;
  lastAttemptTime: string | null;
  status: 'IDLE' | 'SYNCED' | 'ERROR' | 'DEMO_ACTIVE';
  errorMessage: string | null;
  rawRowCount: number;
  sourceDescription: string;
  cachedAt: string | null;
}

export const DEFAULT_CONFIG: SheetsConfig = {
  sourceType: 'demo',
  spreadsheetId: '',
  sheetName: 'Rekap',
  appsScriptUrl: '',
  autoSyncEnabled: true,
  autoSyncIntervalSec: 60,
  riskConfig: DEFAULT_RISK_CONFIG,
};

const STORAGE_KEY_CONFIG = 'ppic_dashboard_config_v1';
const STORAGE_KEY_CACHE = 'ppic_dashboard_cache_v1';

export function loadSavedConfig(): SheetsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        riskConfig: {
          ...DEFAULT_RISK_CONFIG,
          ...(parsed.riskConfig || {}),
        },
      };
    }
  } catch (e) {
    console.warn('Failed to load saved config from localStorage', e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(cfg: SheetsConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

/**
 * Benchmark PPIC manufacturing dataset for sheet "Rekap".
 * Strictly labeled as DEMO for initial inspection and verification.
 * Contains realistic manufacturing materials, orders (OR 1095, OR 1014, OR 1036, OR 1088),
 * multiple units (YDS, GROS, PCS, DOZEN), realistic date stamps, and deliberate edge cases
 * (such as row 7 having status OKE with shortfall to test the CHECK DATA safeguard).
 */
export const DEMO_REKAP_DATA: RawMaterialRow[] = [
  {
    or: 'OR 1095',
    style: 'HOODIE-ST-01',
    tanggalUpdate: '2026-10-20',
    displayName: '[KAIN-FLC280] KAIN FLEECE COTTON 280GSM BLACK',
    quantity: 1200,
    receivedQty: 1200,
    kekuranganKelebihan: 0,
    satuan: 'YDS',
    ket: 'OKE',
  },
  {
    or: 'OR 1095',
    style: 'HOODIE-ST-01',
    tanggalUpdate: '2026-10-19',
    displayName: '[RIB-COT1X1] RIB COTTON 1X1 MATCHING BLACK',
    quantity: 180,
    receivedQty: 90,
    kekuranganKelebihan: -90,
    satuan: 'YDS',
    ket: 'BELUM',
  },
  {
    or: 'OR 1095',
    style: 'HOODIE-ST-01',
    tanggalUpdate: '2026-10-18',
    displayName: '[ZIP-MTL5] METAL ZIPPER OPEN END 5MM BLACK OXIDE',
    quantity: 850,
    receivedQty: 0,
    kekuranganKelebihan: -850,
    satuan: 'PCS',
    ket: 'BELUM',
  },
  {
    or: 'OR 1095',
    style: 'HOODIE-ST-01',
    tanggalUpdate: '2026-10-19',
    displayName: '[DRW-CRD8] DRAWSTRING FLAT COTTON CORD 8MM W/ METAL TIP',
    quantity: 850,
    receivedQty: 850,
    kekuranganKelebihan: 0,
    satuan: 'PCS',
    ket: 'OKE',
  },
  {
    or: 'OR 1014',
    style: 'POLO-DRY-22',
    tanggalUpdate: '2026-10-20',
    displayName: '[KAIN-PK30] KAIN PIQUE COMBED 30S NAVY',
    quantity: 2400,
    receivedQty: 2400,
    kekuranganKelebihan: 0,
    satuan: 'YDS',
    ket: 'OKE',
  },
  {
    or: 'OR 1014',
    style: 'POLO-DRY-22',
    tanggalUpdate: '2026-10-20',
    displayName: '[KLR-JKD01] KERAH RAJUT JACQUARD TIPIS 2-LINE NAVY/WHITE',
    quantity: 150,
    receivedQty: 150,
    kekuranganKelebihan: 0,
    satuan: 'DOZEN',
    ket: 'OKE',
  },
  {
    or: 'OR 1014',
    style: 'POLO-DRY-22',
    tanggalUpdate: '2026-10-15', // 6 days ago
    displayName: '[KNC-PRL18] KANCING MUTIARA POLO 18L 4-HOLE NAVY',
    quantity: 45,
    receivedQty: 25,
    kekuranganKelebihan: -20,
    satuan: 'GROS',
    ket: 'OKE', // Intentionally contradictory to trigger CHECK DATA!
  },
  {
    or: 'OR 1014',
    style: 'POLO-DRY-22',
    tanggalUpdate: '2026-10-05', // 16 days ago -> STALE DATA
    displayName: '[LBL-CARE01] PRINTED SATIN CARE LABEL MULTI-LANGUAGE',
    quantity: 2000,
    receivedQty: 0,
    kekuranganKelebihan: -2000,
    satuan: 'PCS',
    ket: 'BELUM',
  },
  {
    or: 'OR 1036',
    style: 'CARGO-TC-09',
    tanggalUpdate: '2026-10-20',
    displayName: '[KAIN-TWL] KAIN RIPSTOP TWILL 20S ARMY GREEN',
    quantity: 3100,
    receivedQty: 2000,
    kekuranganKelebihan: -1100,
    satuan: 'YDS',
    ket: 'BELUM',
  },
  {
    or: 'OR 1036',
    style: 'CARGO-TC-09',
    tanggalUpdate: '2026-10-18',
    displayName: '[TRM-SNP24] SNAP BUTTON METAL BRASS 24L HEAVY DUTY',
    quantity: 60,
    receivedQty: 30,
    kekuranganKelebihan: -30,
    satuan: 'GROS',
    ket: 'BELUM',
  },
  {
    or: 'OR 1036',
    style: 'CARGO-TC-09',
    tanggalUpdate: '2026-10-02', // 19 days ago -> CRITICAL STALE
    displayName: '[BNG-TK40] BENANG COATS ASTRA 40/2 ARMY',
    quantity: 80,
    receivedQty: 80,
    kekuranganKelebihan: 0,
    satuan: 'CONE',
    ket: 'BELUM', // Contradictory: full quantity received but status BELUM -> CHECK DATA
  },
  {
    or: 'OR 1088',
    style: 'WIND-LIGHT-03',
    tanggalUpdate: '2026-10-19',
    displayName: '[KAIN-TASLAN] TASLAN WATERPROOF 70D CHARCOAL',
    quantity: 950,
    receivedQty: 950,
    kekuranganKelebihan: 0,
    satuan: 'YDS',
    ket: 'OKE',
  },
  {
    or: 'OR 1088',
    style: 'WIND-LIGHT-03',
    tanggalUpdate: '2026-10-19',
    displayName: '[FURING-MESH] FURING POLYESTER MESH BLACK',
    quantity: 450,
    receivedQty: 500, // Surplus +50 YDS
    kekuranganKelebihan: 50,
    satuan: 'YDS',
    ket: 'OKE',
  },
];

/**
 * Standard, ready-to-copy Google Apps Script Code
 * Users can paste this directly into their Google Sheet's Script Editor.
 */
export const APPS_SCRIPT_CODE_TEMPLATE = `/**
 * Google Apps Script for Material Readiness & Delivery Risk Dashboard
 * Sheet Target: "Rekap"
 * Deploy: Extensions > Apps Script > Paste this code > Deploy as Web App
 * Access: Anyone
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : "Rekap";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Sheet '" + sheetName + "' tidak ditemukan di spreadsheet ini.",
      availableSheets: ss.getSheets().map(function(s) { return s.getName(); })
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    sheetName: sheetName,
    spreadsheetTitle: ss.getName(),
    spreadsheetId: ss.getId(),
    rowCount: data.length,
    timestamp: new Date().toISOString(),
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Fetch data using Google Apps Script Web App
 */
export async function fetchFromAppsScript(url: string, sheetName: string = 'Rekap'): Promise<{
  rows: RawMaterialRow[];
  spreadsheetTitle?: string;
  rowCount: number;
}> {
  if (!url || !url.startsWith('http')) {
    throw new Error('URL Google Apps Script tidak valid. Masukkan URL Web App Google Apps Script.');
  }

  const fetchUrl = new URL(url);
  fetchUrl.searchParams.set('sheet', sheetName);
  fetchUrl.searchParams.set('_t', Date.now().toString()); // prevent browser caching

  const response = await fetch(fetchUrl.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Koneksi ke Apps Script gagal (HTTP ${response.status}: ${response.statusText}).`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || 'Google Apps Script mengembalikan status kegagalan.');
  }

  const rawGrid = json.data;
  if (!Array.isArray(rawGrid) || rawGrid.length <= 1) {
    throw new Error(`Sheet '${sheetName}' berhasil diakses namun tidak berisi baris data.`);
  }

  const mapping = detectHeaders(rawGrid);
  const rows = parseSheetRows(rawGrid, mapping || undefined);

  return {
    rows,
    spreadsheetTitle: json.spreadsheetTitle,
    rowCount: rows.length,
  };
}

/**
 * Fetch data using Google Sheets CSV Export endpoint
 * Format: https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet={SHEET}
 */
export async function fetchFromGoogleSheetsCsv(spreadsheetId: string, sheetName: string = 'Rekap'): Promise<{
  rows: RawMaterialRow[];
  rowCount: number;
}> {
  // Extract clean ID if user pasted full URL
  let cleanId = spreadsheetId.trim();
  const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    cleanId = match[1];
  }

  if (!cleanId || cleanId.length < 15) {
    throw new Error('Spreadsheet ID tidak valid. Periksa format Spreadsheet ID.');
  }

  const encodedSheet = encodeURIComponent(sheetName);
  const targetUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}&_t=${Date.now()}`;

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Gagal mengambil spreadsheet (HTTP ${response.status}). Pastikan Spreadsheet telah dibagikan dengan akses 'Anyone with the link can view'.`);
  }

  const csvText = await response.text();
  if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin') || csvText.includes('<html')) {
    throw new Error('Akses ditolak: Google Sheets meminta login. Pastikan spreadsheet memiliki izin baca (Anyone with link: Viewer) atau gunakan opsi Google Apps Script.');
  }

  const grid = parseCsvToGrid(csvText);
  if (grid.length <= 1) {
    throw new Error(`Sheet '${sheetName}' tidak memiliki baris data.`);
  }

  const mapping = detectHeaders(grid);
  const rows = parseSheetRows(grid, mapping || undefined);

  return {
    rows,
    rowCount: rows.length,
  };
}

/**
 * Robust CSV parser that handles quoted commas and line breaks
 */
function parseCsvToGrid(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Main Sync Pipeline
 */
export async function syncMaterialData(config: SheetsConfig): Promise<{
  items: ProcessedMaterialItem[];
  kpis: PPICKPISummary;
  syncState: SyncState;
}> {
  const attemptTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
  
  if (config.sourceType === 'demo') {
    const items = DEMO_REKAP_DATA.map((r, i) => processMaterialRow(r, i, config.riskConfig));
    const kpis = computePPICKPIs(items);
    return {
      items,
      kpis,
      syncState: {
        isConnecting: false,
        isSyncing: false,
        lastSyncSuccessTime: attemptTime,
        lastAttemptTime: attemptTime,
        status: 'DEMO_ACTIVE',
        errorMessage: null,
        rawRowCount: DEMO_REKAP_DATA.length,
        sourceDescription: 'Dataset Simulasi & Benchmark PPIC (Sheet "Rekap")',
        cachedAt: new Date().toISOString(),
      },
    };
  }

  try {
    let rawRows: RawMaterialRow[] = [];
    let sourceDesc = '';

    if (config.sourceType === 'apps_script') {
      const res = await fetchFromAppsScript(config.appsScriptUrl, config.sheetName);
      rawRows = res.rows;
      sourceDesc = `Google Apps Script Web App (${res.spreadsheetTitle || config.sheetName})`;
    } else if (config.sourceType === 'google_csv') {
      const res = await fetchFromGoogleSheetsCsv(config.spreadsheetId, config.sheetName);
      rawRows = res.rows;
      sourceDesc = `Google Sheets CSV Export (ID: ${config.spreadsheetId}, Sheet: ${config.sheetName})`;
    }

    if (rawRows.length === 0) {
      throw new Error(`Data berhasil dibaca tetapi tidak ada baris material yang valid di sheet '${config.sheetName}'. Periksa nama kolom dan isi tabel.`);
    }

    const items = rawRows.map((r, i) => processMaterialRow(r, i, config.riskConfig));
    const kpis = computePPICKPIs(items);

    // Save to cache for offline fallback
    try {
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify({
        items,
        kpis,
        sourceDesc,
        timestamp: attemptTime,
      }));
    } catch (e) {
      // cache storage optional
    }

    return {
      items,
      kpis,
      syncState: {
        isConnecting: false,
        isSyncing: false,
        lastSyncSuccessTime: attemptTime,
        lastAttemptTime: attemptTime,
        status: 'SYNCED',
        errorMessage: null,
        rawRowCount: rawRows.length,
        sourceDescription: sourceDesc,
        cachedAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Gagal menyinkronkan data dari Google Sheets.';
    
    // Check if we have cached data
    let cachedPayload: any = null;
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CACHE);
      if (cached) cachedPayload = JSON.parse(cached);
    } catch (e) {
      // ignore
    }

    if (cachedPayload && cachedPayload.items && cachedPayload.items.length > 0) {
      return {
        items: cachedPayload.items,
        kpis: cachedPayload.kpis,
        syncState: {
          isConnecting: false,
          isSyncing: false,
          lastSyncSuccessTime: cachedPayload.timestamp || 'Sebelumnya',
          lastAttemptTime: attemptTime,
          status: 'ERROR',
          errorMessage: `${errorMsg} (Menampilkan data cache terakhir).`,
          rawRowCount: cachedPayload.items.length,
          sourceDescription: cachedPayload.sourceDesc || 'Data Cache',
          cachedAt: new Date().toISOString(),
        },
      };
    }

    // No cache: return empty or throw
    throw new Error(errorMsg);
  }
}
