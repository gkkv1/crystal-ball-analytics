// src/data/revenueData.js
// Deterministic synthetic dataset generator
// All records are mathematically coherent — no random independent values
// ~2,000 atomic records covering all analytical dimensions

import { DIMENSION_TREE } from './dimensions.js';

// ─── Base revenue configuration ─────────────────────────────────────────────
// Per-subUnit base annual revenue for FY23 (in INR Crores)
// Growth rates and variances are deterministic per cluster type

const SUBUNIT_BASE = {
  'connected-vehicles': 820,
  'manufacturing-ops': 650,
  'avionics-systems': 480,
  'defence-it': 310,
  'oil-gas': 920,
  'renewables': 540,
  'smart-grid': 410,
  'chip-design': 680,
  'embedded-systems': 390,
  'iot-platforms': 520,
  'diagnostics-imaging': 560,
  'pharma-tech': 340,
};

// YoY growth factors per cluster (deterministic)
const CLUSTER_GROWTH = {
  'industrial-mobility': [1.0, 1.14, 1.08, 1.31, 1.18], // FY23-FY27
  'energy-utilities':    [1.0, 1.22, 1.16, 1.28, 1.21],
  'hi-tech-products':    [1.0, 1.18, 0.96, 1.42, 1.15],
  'life-sciences':       [1.0, 1.11, 1.13, 1.09, 1.07],
};

// Quarter seasonality multipliers (Q1 weakest, Q4 strongest)
const QUARTER_MUL = { Q1: 0.22, Q2: 0.25, Q3: 0.26, Q4: 0.27 };

// Week within quarter ramp-up (weeks 1-13, end-of-quarter acceleration)
const WEEK_RAMP = [
  0.055, 0.062, 0.068, 0.072, 0.075, 0.078, 0.080, 0.082, 0.084, 0.086, 0.090, 0.092, 0.076,
];

// Geo revenue split per sub-unit (must sum to 1.0)
const GEO_SPLIT = {
  'connected-vehicles':   { 'North America': 0.45, 'Europe': 0.35, 'Japan': 0.20 },
  'manufacturing-ops':    { 'North America': 0.40, 'India': 0.30, 'Europe': 0.30 },
  'avionics-systems':     { 'North America': 0.50, 'Europe': 0.35, 'Middle East': 0.15 },
  'defence-it':           { 'North America': 0.60, 'India': 0.40 },
  'oil-gas':              { 'North America': 0.40, 'Middle East': 0.38, 'India': 0.22 },
  'renewables':           { 'Europe': 0.45, 'North America': 0.35, 'India': 0.20 },
  'smart-grid':           { 'North America': 0.44, 'Europe': 0.35, 'Australia': 0.21 },
  'chip-design':          { 'North America': 0.50, 'Europe': 0.28, 'APAC': 0.22 },
  'embedded-systems':     { 'Europe': 0.45, 'North America': 0.35, 'Japan': 0.20 },
  'iot-platforms':        { 'North America': 0.42, 'APAC': 0.38, 'Europe': 0.20 },
  'diagnostics-imaging':  { 'North America': 0.48, 'Europe': 0.32, 'India': 0.20 },
  'pharma-tech':          { 'North America': 0.55, 'Europe': 0.45 },
};

// Client revenue split per sub-unit (must sum to 1.0)
const CLIENT_SPLIT = {
  'connected-vehicles':   { 'General Motors': 0.28, 'Toyota Motor': 0.25, 'BMW Group': 0.24, 'Stellantis': 0.13, 'Renault': 0.10 },
  'manufacturing-ops':    { 'Ford Motor': 0.32, 'Volkswagen': 0.30, 'Honda': 0.22, 'Hyundai': 0.16 },
  'avionics-systems':     { 'Boeing': 0.35, 'Airbus': 0.33, 'Lockheed Martin': 0.22, 'Safran': 0.10 },
  'defence-it':           { 'Raytheon': 0.42, 'BAE Systems': 0.35, 'L3Harris': 0.23 },
  'oil-gas':              { 'ExxonMobil': 0.28, 'Shell': 0.27, 'BP': 0.25, 'Saudi Aramco': 0.20 },
  'renewables':           { 'Siemens Energy': 0.30, 'GE Vernova': 0.28, 'Vestas': 0.25, 'Enel': 0.17 },
  'smart-grid':           { 'Duke Energy': 0.32, 'National Grid': 0.28, 'E.ON': 0.22, 'AGL Energy': 0.18 },
  'chip-design':          { 'Qualcomm': 0.30, 'Intel': 0.28, 'NXP Semiconductors': 0.22, 'Infineon': 0.20 },
  'embedded-systems':     { 'Texas Instruments': 0.35, 'STMicroelectronics': 0.35, 'Microchip': 0.30 },
  'iot-platforms':        { 'Apple': 0.32, 'Samsung Electronics': 0.30, 'Bosch': 0.22, 'Philips': 0.16 },
  'diagnostics-imaging':  { 'GE Healthcare': 0.38, 'Philips Healthcare': 0.34, 'Siemens Healthineers': 0.28 },
  'pharma-tech':          { 'Pfizer': 0.28, 'Novartis': 0.27, 'AstraZeneca': 0.25, 'Roche': 0.20 },
};

// AOP is set slightly above previous year actuals — realistic optimism
// Balanced so ~50% of clusters/geos can outperform (achievable targets)
const AOP_OPTIMISM = {
  'industrial-mobility': 1.04,  // tight target — often hit or exceeded
  'energy-utilities':    1.06,  // moderate optimism
  'hi-tech-products':    1.08,  // slightly aggressive
  'life-sciences':       1.03,  // conservative — usually met
};

// Performance variance: geo-level actual vs AOP multiplier
// Mixed so some geos beat AOP (>1.0) and some miss (<1.0) — realistic picture
const GEO_PERFORMANCE = {
  'North America': 1.06,   // strong — consistently outperforms
  'Europe':        0.97,   // slight underperformance (macro headwinds)
  'India':         1.10,   // rapid growth, beats targets
  'Japan':         1.01,   // on target
  'Middle East':   1.04,   // above plan — ramp-up market
  'APAC':          0.98,   // modest miss
  'Australia':     1.02,   // slightly above plan
};

// BG projection: typically 1-2% above cluster projection
const BG_PROJ_PREMIUM = 1.02;
// Cluster projection: roughly equal to actual (realistic mid-quarter estimate)
const CLUSTER_PROJ_PREMIUM = 1.008;
// SU projection: closest to actual (most granular)
const SU_PROJ_PREMIUM = 1.003;

const FISCAL_YEARS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// Calendar week labels for Q2 FY27 (01-Jul to 30-Sep)
// Generalized week label by quarter
function getWeekLabel(fy, q, weekIdx) {
  // weekIdx: 0-12
  const fyNum = parseInt(fy.replace('FY', '')) + 2000;
  const qStartMonth = { Q1: 3, Q2: 6, Q3: 9, Q4: 12 }; // April-based fiscal
  const month = qStartMonth[q];
  const baseDate = new Date(fyNum - (month >= 4 && month <= 12 ? 1 : 0), month - 1, 1);
  baseDate.setDate(baseDate.getDate() + weekIdx * 7);
  const dd = String(baseDate.getDate()).padStart(2, '0');
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][baseDate.getMonth()];
  const yr = String(baseDate.getFullYear()).slice(2);
  return `${dd}-${mon}-${yr}`;
}

function getWeekNum(fy, q, weekIdx) {
  const base = { Q1: 1, Q2: 14, Q3: 27, Q4: 40 };
  return `W${base[q] + weekIdx}`;
}

// ─── Generator ───────────────────────────────────────────────────────────────
let recordId = 0;

function generateRecords() {
  const records = [];

  DIMENSION_TREE.forEach((cluster) => {
    const clusterGrowth = CLUSTER_GROWTH[cluster.id];
    const aopOptimism = AOP_OPTIMISM[cluster.id];

    cluster.bgs.forEach((bg) => {
      bg.subUnits.forEach((subUnit) => {
        const baseAnnual = SUBUNIT_BASE[subUnit.id] || 400;
        const geoSplit = GEO_SPLIT[subUnit.id] || {};
        const clientSplit = CLIENT_SPLIT[subUnit.id] || {};
        const geos = Object.keys(geoSplit);
        const clients = Object.keys(clientSplit);

        FISCAL_YEARS.forEach((fy, fyIdx) => {
          const annualRevenue = baseAnnual * clusterGrowth[fyIdx];
          const prevAnnualRevenue = fyIdx > 0 ? baseAnnual * clusterGrowth[fyIdx - 1] : annualRevenue * 0.88;
          const annualAOP = annualRevenue * aopOptimism;

          // FY27 is partial (only Q1-Q2 have actuals, Q3-Q4 are projected)
          const currentFY = fy === 'FY27';

          QUARTERS.forEach((quarter, qIdx) => {
            const qMul = QUARTER_MUL[quarter];
            const qRevenue = annualRevenue * qMul;
            const qAOP = annualAOP * qMul;
            const prevQRevenue = qIdx > 0
              ? annualRevenue * Object.values(QUARTER_MUL)[qIdx - 1]
              : prevAnnualRevenue * QUARTER_MUL.Q4;

            // FY27: Q1 has actuals, Q2 partially complete, Q3-Q4 projected
            const isFuture = currentFY && qIdx >= 2;
            const isPartial = currentFY && qIdx === 1;

            for (let wk = 0; wk < 13; wk++) {
              const wkRamp = WEEK_RAMP[wk];
              const wkRevBase = qRevenue * wkRamp;

              geos.forEach((geo) => {
                const geoFrac = geoSplit[geo] || 0;
                const geoPerfMul = GEO_PERFORMANCE[geo] || 1.0;
                const wkGeoRev = wkRevBase * geoFrac;

                clients.forEach((client) => {
                  const clientFrac = clientSplit[client] || 0;
                  const wkClientRev = wkGeoRev * clientFrac;

                  // Actual: apply geo performance variance to revenue
                  // Future quarters: actual = 0 (not yet realized)
                  let actual = isFuture ? 0 : wkClientRev * geoPerfMul;
                  // Partial quarter: ~70% realized (more progress shown)
                  if (isPartial) actual = wkClientRev * geoPerfMul * 0.72;

                  // Target = AOP per this period slice (no extra markup)
                  const target = wkClientRev * (qAOP / qRevenue);
                  // AOP is based on base revenue plan, not inflated further
                  const aopVal = wkClientRev * aopOptimism;
                  const bgProj = actual > 0 ? actual * BG_PROJ_PREMIUM : wkClientRev * 1.01;
                  const clusterProj = actual > 0 ? actual * CLUSTER_PROJ_PREMIUM : wkClientRev * 1.005;
                  const suProj = actual > 0 ? actual * SU_PROJ_PREMIUM : wkClientRev;

                  // Prev quarter revenue (for QoQ)
                  const prevQkRev = prevQRevenue * wkRamp * geoFrac * clientFrac;

                  records.push({
                    id: `R${++recordId}`,
                    fiscalYear: fy,
                    quarter,
                    week: getWeekNum(fy, quarter, wk),
                    weekLabel: getWeekNum(fy, quarter, wk),
                    weekDate: getWeekLabel(fy, quarter, wk),
                    weekIndex: wk,
                    bgCluster: cluster.id,
                    bgClusterLabel: cluster.label,
                    bg: bg.id,
                    bgLabel: bg.label,
                    subUnit: subUnit.id,
                    subUnitLabel: subUnit.label,
                    geo,
                    groupClient: client,
                    aop: Math.round(aopVal * 100) / 100,
                    target: Math.round(target * 100) / 100,
                    actualRevenue: Math.round(actual * 100) / 100,
                    bgProjection: Math.round(bgProj * 100) / 100,
                    clusterProjection: Math.round(clusterProj * 100) / 100,
                    subUnitProjection: Math.round(suProj * 100) / 100,
                    prevPeriodRevenue: Math.round(prevQkRev * 100) / 100,
                    isFuture,
                    isPartial,
                  });
                }); // clients
              }); // geos
            } // weeks
          }); // quarters
        }); // fiscal years
      }); // sub-units
    }); // bgs
  }); // clusters

  return records;
}

// Export singleton dataset — generated once, never mutated
export const RAW_REVENUE_RECORDS = generateRecords();

// Quick sanity log (remove in production)
// console.log(`Generated ${RAW_REVENUE_RECORDS.length} revenue records`);
