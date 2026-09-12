// src/data/financeData.js
// Deterministic synthetic Finance dataset
// Covers: Revenue, Gross Margin, Cost breakdown, Realization (rates), BTA %
// Uses the same DIMENSION_TREE as revenueData for dimensional consistency

import { DIMENSION_TREE } from './dimensions.js';

// ─── Base revenue (same scale as revenueData) ──────────────────────────────
const SUBUNIT_BASE = {
  'connected-vehicles': 820, 'manufacturing-ops': 650, 'avionics-systems': 480,
  'defence-it': 310, 'oil-gas': 920, 'renewables': 540, 'smart-grid': 410,
  'chip-design': 680, 'embedded-systems': 390, 'iot-platforms': 520,
  'diagnostics-imaging': 560, 'pharma-tech': 340,
};

const CLUSTER_GROWTH = {
  'industrial-mobility': [1.0, 1.14, 1.08, 1.31, 1.18],
  'energy-utilities':    [1.0, 1.22, 1.16, 1.28, 1.21],
  'hi-tech-products':    [1.0, 1.18, 0.96, 1.42, 1.15],
  'life-sciences':       [1.0, 1.11, 1.13, 1.09, 1.07],
};

const QUARTER_MUL = { Q1: 0.22, Q2: 0.25, Q3: 0.26, Q4: 0.27 };

// AOP (same as revenue)
const AOP_OPTIMISM = {
  'industrial-mobility': 1.04,
  'energy-utilities':    1.06,
  'hi-tech-products':    1.08,
  'life-sciences':       1.03,
};

// ─── Gross Margin % by cluster ──────────────────────────────────────────────
// Base + year-on-year delta array (FY24, FY25, FY26, FY27 deltas)
const CLUSTER_GM = {
  'industrial-mobility': { base: 42.0, deltas: [1.5, -0.8, -1.5, -3.5] },  // pressure in FY27
  'energy-utilities':    { base: 43.5, deltas: [1.8, 0.5, -1.2, -2.0] },
  'hi-tech-products':    { base: 50.5, deltas: [2.0, -1.0, -6.5, -3.2] },   // IP margins eroding
  'life-sciences':       { base: 44.2, deltas: [0.8, 0.6, -0.8, -1.2] },
};

// Geo adjustment to GM% (additive)
const GEO_GM_ADJ = {
  'North America': 2.0, 'Europe': 0.5, 'India': -4.0,
  'Japan': 2.5, 'Middle East': 1.5, 'APAC': 0.0, 'Australia': 1.5,
};

// ─── Cost mix (fraction of totalCostPct) ───────────────────────────────────
const CLUSTER_COST_MIX = {
  'industrial-mobility': { boughtOut: 0.76, manPower: 0.17, airFare: 0.04, others: 0.03 },
  'energy-utilities':    { boughtOut: 0.78, manPower: 0.15, airFare: 0.04, others: 0.03 },
  'hi-tech-products':    { boughtOut: 0.72, manPower: 0.20, airFare: 0.05, others: 0.03 },
  'life-sciences':       { boughtOut: 0.75, manPower: 0.18, airFare: 0.04, others: 0.03 },
};

// ─── Realization rates (blended effective rate, arbitrary units ~ INR K/PM) ─
// Higher cluster = higher IP value-add = higher realization
const CLUSTER_REALIZ = {
  'industrial-mobility': { offshore: 68.0, onsite: 15.5 },
  'energy-utilities':    { offshore: 70.0, onsite: 16.5 },
  'hi-tech-products':    { offshore: 75.5, onsite: 18.0 },
  'life-sciences':       { offshore: 69.5, onsite: 16.0 },
};

// Geo adjustment to realization (additive)
const GEO_REALIZ_ADJ = {
  'North America': { offshore: 4.0, onsite: 2.0 },
  'Europe':        { offshore: 1.5, onsite: 0.5 },
  'India':         { offshore: -3.0, onsite: -1.0 },
  'Japan':         { offshore: 3.0, onsite: 1.5 },
  'Middle East':   { offshore: 2.0, onsite: 1.0 },
  'APAC':          { offshore: 0.5, onsite: 0.0 },
  'Australia':     { offshore: 2.5, onsite: 1.0 },
};

// Yearly realization trend (delta per FY, cumulatively added)
const FY_REALIZ_TREND = [0, 1.8, 2.5, 1.2, 0.8];

// ─── BTA % (Billing to AOP ratio) ──────────────────────────────────────────
const CLUSTER_BTA = {
  'industrial-mobility': { offshore: 97.5, onsite: 98.5, adjusted: 98.0 },
  'energy-utilities':    { offshore: 99.5, onsite: 100.5, adjusted: 100.0 },
  'hi-tech-products':    { offshore: 95.5, onsite: 96.5, adjusted: 96.0 },
  'life-sciences':       { offshore: 101.5, onsite: 102.5, adjusted: 102.0 },
};

// Quarter BTA seasonal multiplier
const Q_BTA_ADJ = { Q1: -0.8, Q2: 0.2, Q3: 0.8, Q4: 1.2 };

// Yearly BTA trend (delta per FY, cumulatively added) — slight headwinds
const FY_BTA_TREND = [0, 0.8, -1.5, -2.5, -2.0];

// ─── Geo / Client splits (same as revenueData) ─────────────────────────────
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

const FISCAL_YEARS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

let finRecId = 0;

function generateFinanceRecords() {
  const records = [];

  DIMENSION_TREE.forEach((cluster) => {
    const growth       = CLUSTER_GROWTH[cluster.id];
    const gmCfg        = CLUSTER_GM[cluster.id];
    const costMix      = CLUSTER_COST_MIX[cluster.id];
    const realizBase   = CLUSTER_REALIZ[cluster.id];
    const btaBase      = CLUSTER_BTA[cluster.id];
    const aopOpt       = AOP_OPTIMISM[cluster.id];

    cluster.bgs.forEach((bg) => {
      bg.subUnits.forEach((subUnit) => {
        const baseAnnual  = SUBUNIT_BASE[subUnit.id] || 400;
        const geoSplit    = GEO_SPLIT[subUnit.id]    || {};
        const clientSplit = CLIENT_SPLIT[subUnit.id] || {};
        const geos        = Object.keys(geoSplit);
        const clients     = Object.keys(clientSplit);

        FISCAL_YEARS.forEach((fy, fyIdx) => {
          const annualRev = baseAnnual * growth[fyIdx];
          const annualAOP = annualRev * aopOpt;

          // Cumulative GM% for this FY
          const gmPctBase = gmCfg.base + gmCfg.deltas.slice(0, fyIdx).reduce((a, b) => a + b, 0);

          // Cumulative realization trend
          const realizTrend = FY_REALIZ_TREND[fyIdx];

          // Cumulative BTA trend
          const btaTrend = FY_BTA_TREND[fyIdx];

          const isFY27 = fy === 'FY27';

          QUARTERS.forEach((quarter, qIdx) => {
            const qMul    = QUARTER_MUL[quarter];
            const qRev    = annualRev * qMul;
            const qAOP    = annualAOP * qMul;

            const isFuture  = isFY27 && qIdx >= 2;
            const isPartial = isFY27 && qIdx === 1;
            const revFactor = isFuture ? 0 : isPartial ? 0.72 : 1.0;

            geos.forEach((geo) => {
              const geoFrac     = geoSplit[geo] || 0;
              const geoGMAdj    = GEO_GM_ADJ[geo] || 0;
              const geoRAdj     = GEO_REALIZ_ADJ[geo] || { offshore: 0, onsite: 0 };

              clients.forEach((client) => {
                const clientFrac = clientSplit[client] || 0;
                const baseRev    = qRev * geoFrac * clientFrac;
                const revenue    = baseRev * revFactor;

                // GM%: cluster base + geo adj + tiny quarterly variation
                const gmPct = Math.max(28, Math.min(62, gmPctBase + geoGMAdj + (qIdx * 0.08)));
                const grossMargin = revenue * gmPct / 100;

                // Cost breakdown (each as % of revenue)
                const totalCostPct = 100 - gmPct;
                const boughtOutPct = totalCostPct * costMix.boughtOut;
                const manPowerPct  = totalCostPct * costMix.manPower;
                const airFarePct   = totalCostPct * costMix.airFare;
                const othersPct    = totalCostPct * costMix.others;

                // Realization (absolute blended rate)
                const offshoreRealization = realizBase.offshore + geoRAdj.offshore + realizTrend;
                const onsiteRealization   = realizBase.onsite   + geoRAdj.onsite   + realizTrend * 0.3;

                // BTA % (with quarterly + yearly adjustments)
                const qBTAAdj     = Q_BTA_ADJ[quarter] || 0;
                const offshoreBTA = Math.max(85, btaBase.offshore + btaTrend + qBTAAdj);
                const onsiteBTA   = Math.max(85, btaBase.onsite   + btaTrend + qBTAAdj);
                const adjustedBTA = Math.max(85, btaBase.adjusted + btaTrend + qBTAAdj);

                // AOP%
                const sliceAOP = qAOP * geoFrac * clientFrac;
                const aopPct   = sliceAOP > 0 ? (revenue / sliceAOP) * 100 : 0;

                records.push({
                  id:              `FIN${++finRecId}`,
                  fiscalYear:      fy,
                  quarter,

                  bgCluster:      cluster.id,
                  bgClusterLabel: cluster.label,
                  bg:             bg.id,
                  bgLabel:        bg.label,
                  subUnit:        subUnit.id,
                  subUnitLabel:   subUnit.label,
                  geo,
                  groupClient:    client,

                  revenue:          round(revenue),
                  grossMargin:      round(grossMargin),
                  grossMarginPct:   round1(gmPct),

                  boughtOutPct:  round1(boughtOutPct),
                  manPowerPct:   round1(manPowerPct),
                  airFarePct:    round1(airFarePct),
                  othersPct:     round1(othersPct),
                  totalCostPct:  round1(totalCostPct),

                  offshoreRealization: round1(offshoreRealization),
                  onsiteRealization:   round1(onsiteRealization),

                  offshoreBTA:   round1(offshoreBTA),
                  onsiteBTA:     round1(onsiteBTA),
                  adjustedBTA:   round1(adjustedBTA),

                  aop:    round(sliceAOP),
                  aopPct: round1(aopPct),

                  isFuture,
                  isPartial,
                });
              }); // clients
            }); // geos
          }); // quarters
        }); // fiscal years
      }); // sub units
    }); // bgs
  }); // clusters

  return records;
}

const round  = (v) => Math.round(v * 100) / 100;
const round1 = (v) => Math.round(v * 10)  / 10;

export const RAW_FINANCE_RECORDS = generateFinanceRecords();
