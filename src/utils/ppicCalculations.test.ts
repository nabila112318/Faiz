import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNumericValue,
  extractMaterialCodeAndName,
  normalizeUnit,
  parseDateString,
  calculateDataAgeInDays,
  processMaterialRow,
  computePPICKPIs,
  detectHeaders,
  parseSheetRows,
  DEFAULT_RISK_CONFIG,
  RawMaterialRow,
} from './ppicCalculations.ts';

test('parseNumericValue handles various formats cleanly', () => {
  assert.equal(parseNumericValue('1250'), 1250);
  assert.equal(parseNumericValue('1,250.50'), 1250.5);
  assert.equal(parseNumericValue('1.250,50'), 1250.5);
  assert.equal(parseNumericValue('-'), 0);
  assert.equal(parseNumericValue(''), 0);
  assert.equal(parseNumericValue(null), 0);
  assert.equal(parseNumericValue(500), 500);
});

test('extractMaterialCodeAndName identifies bracketed or prefixed codes', () => {
  const r1 = extractMaterialCodeAndName('[MAT-K01] KAIN TC COMBED 30S NAVY');
  assert.equal(r1.code, 'MAT-K01');
  assert.equal(r1.name, 'KAIN TC COMBED 30S NAVY');

  const r2 = extractMaterialCodeAndName('KANCING 4 LUBANG [KNC-04]');
  assert.equal(r2.code, 'KNC-04');
  assert.equal(r2.name, 'KANCING 4 LUBANG');

  const r3 = extractMaterialCodeAndName('BEN-01 - BENANG JAHIT HITAM');
  assert.equal(r3.code, 'BEN-01');
  assert.equal(r3.name, 'BENANG JAHIT HITAM');
});

test('normalizeUnit safely unifies equivalent representations without merging different units', () => {
  assert.equal(normalizeUnit('yard'), 'YDS');
  assert.equal(normalizeUnit('YDS'), 'YDS');
  assert.equal(normalizeUnit('Dozen(s)'), 'DOZEN');
  assert.equal(normalizeUnit('Gros'), 'GROS');
  assert.equal(normalizeUnit('PCS'), 'PCS');
  assert.notEqual(normalizeUnit('YDS'), normalizeUnit('GROS'));
});

test('readiness logic flags READY, NOT READY, and CHECK DATA accurately', () => {
  const refDate = new Date('2026-10-21T00:00:00Z');

  // Case 1: Perfect match (Fulfilled & OKE) -> READY
  const rowReady: RawMaterialRow = {
    or: 'OR 1095',
    style: 'STY-A',
    tanggalUpdate: '2026-10-20',
    displayName: '[MAT-01] KAIN COMBED',
    quantity: 100,
    receivedQty: 100,
    satuan: 'YDS',
    ket: 'OKE',
  };
  const resReady = processMaterialRow(rowReady, 0, DEFAULT_RISK_CONFIG, refDate);
  assert.equal(resReady.readinessStatus, 'READY');
  assert.equal(resReady.shortage, 0);
  assert.equal(resReady.hasDiscrepancy, false);

  // Case 2: Shortage exists and status BELUM -> NOT READY
  const rowNotReady: RawMaterialRow = {
    or: 'OR 1095',
    style: 'STY-A',
    tanggalUpdate: '2026-10-19',
    displayName: '[MAT-02] KANCING',
    quantity: 50,
    receivedQty: 20,
    satuan: 'GROS',
    ket: 'BELUM',
  };
  const resNotReady = processMaterialRow(rowNotReady, 1, DEFAULT_RISK_CONFIG, refDate);
  assert.equal(resNotReady.readinessStatus, 'NOT READY');
  assert.equal(resNotReady.shortage, 30);
  assert.equal(resNotReady.calculatedDiff, -30);

  // Case 3: Contradiction! Status OKE but shortage > 0 -> CHECK DATA
  const rowConflict1: RawMaterialRow = {
    or: 'OR 1014',
    style: 'STY-B',
    tanggalUpdate: '2026-10-18',
    displayName: '[MAT-03] RESLETING',
    quantity: 100,
    receivedQty: 40,
    satuan: 'PCS',
    ket: 'OKE', // contradictory
  };
  const resConflict1 = processMaterialRow(rowConflict1, 2, DEFAULT_RISK_CONFIG, refDate);
  assert.equal(resConflict1.readinessStatus, 'CHECK DATA');
  assert.equal(resConflict1.hasDiscrepancy, true);

  // Case 4: Contradiction! Status BELUM but full received -> CHECK DATA
  const rowConflict2: RawMaterialRow = {
    or: 'OR 1036',
    style: 'STY-C',
    tanggalUpdate: '2026-10-18',
    displayName: '[MAT-04] BENANG',
    quantity: 50,
    receivedQty: 50,
    satuan: 'CONE',
    ket: 'BELUM', // contradictory
  };
  const resConflict2 = processMaterialRow(rowConflict2, 3, DEFAULT_RISK_CONFIG, refDate);
  assert.equal(resConflict2.readinessStatus, 'CHECK DATA');
  assert.equal(resConflict2.hasDiscrepancy, true);
});

test('Stale data risk warns when Kolom D exceeds configured threshold', () => {
  const refDate = new Date('2026-10-21T00:00:00Z');
  const oldDate = '2026-10-01'; // 20 days ago (> threshold 7 days)
  
  const rowStale: RawMaterialRow = {
    or: 'OR 1095',
    style: 'STY-A',
    tanggalUpdate: oldDate,
    displayName: '[MAT-05] INTERLINING',
    quantity: 200,
    receivedQty: 100,
    satuan: 'MTR',
    ket: 'BELUM',
  };

  const processed = processMaterialRow(rowStale, 0, DEFAULT_RISK_CONFIG, refDate);
  assert.equal(processed.isStale, true);
  assert.equal(processed.dataAgeDays, 20);
  assert.equal(processed.staleDataRisk.level, 'CRITICAL');
});

test('Delivery Delay Risk is strictly distinguished and marked NOT_EVALUABLE if dates absent', () => {
  const refDate = new Date('2026-10-21T00:00:00Z');
  const row: RawMaterialRow = {
    or: 'OR 1095',
    style: 'STY-A',
    tanggalUpdate: '2026-10-20',
    displayName: '[MAT-01] KAIN',
    quantity: 100,
    receivedQty: 0,
    satuan: 'YDS',
    ket: 'BELUM',
  };
  const processed = processMaterialRow(row, 0, DEFAULT_RISK_CONFIG, refDate);
  assert.equal(processed.deliveryDelayRisk.status, 'NOT_EVALUABLE');
  assert.match(processed.deliveryDelayRisk.message, /data jadwal pengiriman\/kebutuhan belum tersedia/);
});

test('KPI summary aggregates safely without mixing units', () => {
  const refDate = new Date('2026-10-21T00:00:00Z');
  const rows: RawMaterialRow[] = [
    {
      or: 'OR 1095',
      style: 'STY-A',
      tanggalUpdate: '2026-10-20',
      displayName: '[MAT-01] KAIN A',
      quantity: 100,
      receivedQty: 100,
      satuan: 'YDS',
      ket: 'OKE',
    },
    {
      or: 'OR 1095',
      style: 'STY-A',
      tanggalUpdate: '2026-10-20',
      displayName: '[MAT-02] KANCING B',
      quantity: 50,
      receivedQty: 20,
      satuan: 'GROS',
      ket: 'BELUM',
    },
    {
      or: 'OR 1014',
      style: 'STY-B',
      tanggalUpdate: '2026-10-20',
      displayName: '[MAT-01] KAIN A',
      quantity: 80,
      receivedQty: 40,
      satuan: 'YDS',
      ket: 'BELUM',
    },
  ];

  const processed = rows.map((r, i) => processMaterialRow(r, i, DEFAULT_RISK_CONFIG, refDate));
  const kpis = computePPICKPIs(processed);

  assert.equal(kpis.totalRows, 3);
  assert.equal(kpis.readyRows, 1);
  assert.equal(kpis.notReadyRows, 2);
  assert.equal(kpis.uniqueMaterialsCount, 2);
  assert.equal(kpis.impactedOrsCount, 2); // OR 1095 and OR 1014

  // Check that KAIN A (YDS) was aggregated together across ORs: 0 + 40 = 40 YDS
  const kainShortage = kpis.shortagesByMaterialAndUnit.find(s => s.materialCode === 'MAT-01');
  assert.ok(kainShortage);
  assert.equal(kainShortage.totalShortage, 40);
  assert.equal(kainShortage.unit, 'YDS');

  // Check that KANCING B (GROS) remained separate: 30 GROS
  const kancingShortage = kpis.shortagesByMaterialAndUnit.find(s => s.materialCode === 'MAT-02');
  assert.ok(kancingShortage);
  assert.equal(kancingShortage.totalShortage, 30);
  assert.equal(kancingShortage.unit, 'GROS');
});

test('detectHeaders reliably locates sheet Rekap column headers', () => {
  const rawTable = [
    ['REKAPITULASI MATERIAL ORDER PPIC', '', '', '', '', '', '', '', '', ''],
    ['No', 'OR', 'Style', 'Tanggal', 'Order Lines/Product/Display Name', 'Order Lines/Quantity', 'Order Lines/Received Qty', 'Kekurangan/Kelebihan', 'Satuan', 'Ket'],
    ['1', 'OR 1095', 'JACKET-01', '2026-10-18', '[KAIN-01] Canvas', '500', '250', '-250', 'YDS', 'BELUM'],
  ];

  const mapping = detectHeaders(rawTable);
  assert.ok(mapping);
  assert.equal(mapping.headerRowIndex, 1);
  assert.equal(mapping.colOR, 1);
  assert.equal(mapping.colStyle, 2);
  assert.equal(mapping.colTanggal, 3);
  assert.equal(mapping.colDisplayName, 4);

  const parsed = parseSheetRows(rawTable, mapping);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].or, 'OR 1095');
  assert.equal(parsed[0].style, 'JACKET-01');
  assert.equal(parsed[0].displayName, '[KAIN-01] Canvas');
});
