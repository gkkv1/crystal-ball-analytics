// src/data/salesData.js
// SINGLE SOURCE OF TRUTH for the Sales Performance module
// Generates deterministic synthetic TCV data at aggregate + opportunity level

import { DIMENSION_TREE } from './dimensions.js';

// ─── Constants ────────────────────────────────────────────────────────────
const FISCAL_YEARS  = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const QUARTERS      = ['Q1', 'Q2', 'Q3', 'Q4'];
const SALES_GEOS    = ['Americas', 'UK', 'Europe', 'Japan', 'LATAM', 'India', 'ANZ', 'APAC', 'MEA'];

export const LARGE_DEAL_THRESHOLD = 40; // $Mn — configurable

// Base TCV AOP ($Mn) per cluster per FY23
const CLUSTER_AOP_BASE = {
  'industrial-mobility': 680,
  'energy-utilities':    480,
  'hi-tech-products':    360,
  'life-sciences':       280,
};

// YoY growth multiplier per FY index (0=FY23 .. 4=FY27)
const CLUSTER_GROWTH = {
  'industrial-mobility': [1.00, 1.09, 1.19, 1.26, 1.38],
  'energy-utilities':    [1.00, 1.11, 1.20, 1.26, 1.34],
  'hi-tech-products':    [1.00, 1.13, 1.22, 1.32, 1.45],
  'life-sciences':       [1.00, 1.07, 1.13, 1.20, 1.27],
};

// FY achievement rate (tcvWon / tcvAOP)
const FY_ACHIEVE = { FY23: 1.04, FY24: 1.07, FY25: 1.06, FY26: 0.74, FY27: 0.24 };

// Quarter weight (AOP split)
const Q_WEIGHT = { Q1: 0.23, Q2: 0.25, Q3: 0.26, Q4: 0.26 };

// Geo share per cluster
const GEO_SPLIT = {
  'industrial-mobility': { Americas: 0.30, UK: 0.10, Europe: 0.22, Japan: 0.14, LATAM: 0.05, India: 0.07, ANZ: 0.04, APAC: 0.06, MEA: 0.02 },
  'energy-utilities':    { Americas: 0.27, UK: 0.14, Europe: 0.18, Japan: 0.03, LATAM: 0.09, India: 0.11, ANZ: 0.06, APAC: 0.07, MEA: 0.05 },
  'hi-tech-products':    { Americas: 0.36, UK: 0.11, Europe: 0.19, Japan: 0.11, LATAM: 0.03, India: 0.09, ANZ: 0.04, APAC: 0.05, MEA: 0.02 },
  'life-sciences':       { Americas: 0.42, UK: 0.14, Europe: 0.26, Japan: 0.04, LATAM: 0.04, India: 0.05, ANZ: 0.02, APAC: 0.02, MEA: 0.01 },
};

// New deal % of AOP
const NEW_DEAL_PCT = {
  'industrial-mobility': 0.47, 'energy-utilities': 0.53,
  'hi-tech-products': 0.56,    'life-sciences': 0.43,
};

// Sub SPs per cluster
const SUB_SPS = {
  'industrial-mobility': ['TCS Manufacturing Integration','TCS SDV Platform Services','TCS Smart Manufacturing','TCS Digital Thread & IoT','TCS Product Lifecycle Mgmt','TCS Electric Mobility'],
  'energy-utilities':    ['TCS Mesh Energy','TCS DD Eles & Energy Tech','TES IA-GT Convergence','TCS MES & LIMS Services'],
  'hi-tech-products':    ['TCS Software Solutions','TCS Arms & Defense Design','BFS New Platform'],
  'life-sciences':       ['TCS Software Solutions','TCS MES & LIMS Services','TCS Life Sciences Platform'],
};

const PROJECT_TYPES = ['Transformation','Cost Optimization','Cloud Migration','Digital Engineering','Analytics & AI','Managed Services'];
const SALES_STAGES  = ['Won','Qualified','Scoping','Proposal','Negotiation','Lost','Shelved'];
const STAGE_DIST    = [0.42, 0.18, 0.14, 0.10, 0.06, 0.05, 0.05]; // CDF-ready

const OWNERS = {
  sales:    ['Rajesh Kumar','Priya Sharma','Arun Patel','Sunita Rao','Vikram Singh','Meena Joshi','Suresh Nair','Deepa Krishnan'],
  presales: ['Amit Gupta','Sneha Verma','Karan Mehta','Pooja Iyer','Rohit Sinha','Anita Bose'],
  solution: ['Dr. Ravi Menon','Prof. Nalini Jha','Sanjay Dubey','Kavita Singh','Arjun Kapoor'],
};

const OPP_TEMPLATES = [
  '{client} – {sp} Digital Transformation',
  '{client} – {sp} Platform Modernization',
  '{client} – {sp} Global Implementation',
  '{client} – {sp} AI Enablement Program',
  '{client} – {sp} Managed Services',
  '{client} – {sp} Cloud Migration Initiative',
  '{client} – {sp} Innovation Partnership',
  '{client} – {sp} Smart Operations',
];

// ─── Seeded pseudo-random ─────────────────────────────────────────────────
function sr(seed) {
  const x = Math.sin(seed + 1) * 100000;
  return x - Math.floor(x);
}
function r2(v) { return Math.round(v * 100) / 100; }
function pick(arr, seed) { return arr[Math.floor(sr(seed) * arr.length)]; }

// ─── Generate aggregate records ───────────────────────────────────────────
let recIdx = 0;
const records = [];

DIMENSION_TREE.forEach((cluster, cI) => {
  const aopBase   = CLUSTER_AOP_BASE[cluster.id];
  const growth    = CLUSTER_GROWTH[cluster.id];
  const geoSplit  = GEO_SPLIT[cluster.id];
  const ndPct     = NEW_DEAL_PCT[cluster.id];
  const subSPs    = SUB_SPS[cluster.id];

  cluster.bgs.forEach((bg, bI) => {
    const bgShare = 1 / cluster.bgs.length; // equal split across BGs

    FISCAL_YEARS.forEach((fy, fyI) => {
      const aopFY   = aopBase * growth[fyI] * bgShare;
      const achieve = FY_ACHIEVE[fy];

      bg.subUnits.forEach((su, suI) => {
        const suShare = 1 / bg.subUnits.length;

        QUARTERS.forEach((quarter, qI) => {
          const qAOP = aopFY * suShare * Q_WEIGHT[quarter];

          // FY27 Q3+ is future (no won data yet)
          const isFuture  = fy === 'FY27' && qI >= 2;
          const isPartial = fy === 'FY27' && qI === 1;
          const wonFactor = isFuture ? 0 : isPartial ? 0.38 : achieve;

          SALES_GEOS.forEach((salesGeo, gI) => {
            const gFrac = geoSplit[salesGeo] || 0;
            if (gFrac < 0.01) return;

            const seed    = cI * 8000 + bI * 2000 + suI * 400 + fyI * 80 + qI * 10 + gI;
            const variance = 0.88 + sr(seed) * 0.24;

            const tcvAOP       = r2(qAOP * gFrac * variance);
            const tcvWon       = r2(tcvAOP * wonFactor * (0.94 + sr(seed + 1) * 0.12));
            const remaining    = Math.max(0, tcvAOP - tcvWon);
            const tcvQualified = r2(isFuture ? tcvAOP * 0.62 : remaining * (0.50 + sr(seed + 2) * 0.18));
            const tcvPipeline  = r2(isFuture ? tcvAOP * 0.88 : tcvQualified + remaining * (0.20 + sr(seed + 3) * 0.15));
            const tcvShelved   = r2(tcvAOP * 0.04 * sr(seed + 4));
            const newDealAOP   = r2(tcvAOP * ndPct);
            const ndAchieve    = Math.max(0, wonFactor - 0.05);
            const newDealWon   = r2(newDealAOP * ndAchieve * (0.88 + sr(seed + 5) * 0.18));
            const newDealPipe  = r2(Math.max(0, newDealAOP - newDealWon) * 0.58);

            records.push({
              id:             `R${++recIdx}`,
              fiscalYear:     fy,
              quarter,
              bgCluster:      cluster.id,
              bgClusterLabel: cluster.label,
              bg:             bg.id,
              bgLabel:        bg.label,
              subUnit:        su.id,
              subUnitLabel:   su.label,
              salesGeo,
              groupClient:    pick(su.clients, seed + 6),
              subSP:          pick(subSPs, seed + 7),
              projectType:    pick(PROJECT_TYPES, seed + 8),
              ai:             sr(seed + 9) > 0.38 ? 'Yes' : 'No',
              newRenew:       sr(seed + 10) > 0.44 ? 'New' : 'Renew',
              tcvAOP, tcvWon, tcvPipeline, tcvQualified, tcvShelved,
              newDealAOP, newDealWon, newDealPipeline: newDealPipe,
              isFuture, isPartial,
            });
          });
        });
      });
    });
  });
});

export const RAW_SALES_RECORDS = records;

// ─── Generate Opportunity-level records ──────────────────────────────────
let oppCount = 1000;
const opps   = [];

DIMENSION_TREE.forEach((cluster, cI) => {
  const subSPs  = SUB_SPS[cluster.id];
  const aopBase = CLUSTER_AOP_BASE[cluster.id];
  const growth  = CLUSTER_GROWTH[cluster.id];

  // ~45 opportunities per cluster
  for (let i = 0; i < 45; i++) {
    const seed  = cI * 700 + i * 17;
    const fyI   = Math.floor(sr(seed) * 5);
    const fy    = FISCAL_YEARS[fyI];
    const qI    = Math.floor(sr(seed + 1) * 4);
    const q     = QUARTERS[qI];
    const geoI  = Math.floor(sr(seed + 2) * SALES_GEOS.length);
    const geo   = SALES_GEOS[geoI];
    const bg    = cluster.bgs[Math.floor(sr(seed + 3) * cluster.bgs.length)];
    const su    = bg.subUnits[Math.floor(sr(seed + 4) * bg.subUnits.length)];
    const client= pick(su.clients, seed + 5);
    const sp    = pick(subSPs, seed + 6);
    const tmpl  = OPP_TEMPLATES[Math.floor(sr(seed + 7) * OPP_TEMPLATES.length)];

    // Stage determination (bias earlier FYs toward Won)
    let stageR = sr(seed + 8);
    if (fyI <= 2) stageR *= 0.55;
    if (fy === 'FY27' && qI >= 2) stageR = 0.6 + sr(seed + 9) * 0.35;
    let cumP = 0;
    let stage = 'Qualified';
    for (let s = 0; s < SALES_STAGES.length; s++) {
      cumP += STAGE_DIST[s];
      if (stageR <= cumP) { stage = SALES_STAGES[s]; break; }
    }

    const tcvBase = (aopBase * growth[fyI]) / 45;
    const tcv     = r2(tcvBase * (0.25 + sr(seed + 10) * 3.2));
    const expTCV  = r2(tcv * (1.0 + sr(seed + 11) * 0.25));

    // Dates
    const yr   = 2022 + fyI;
    const mo   = qI * 3 + 1;
    const day  = 1 + Math.floor(sr(seed + 12) * 27);
    const rDate= `${yr}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const sMo  = mo + 1 > 12 ? 12 : mo + 1;
    const sDay = 1 + Math.floor(sr(seed + 13) * 27);
    const sDate= `${yr}-${String(sMo).padStart(2,'0')}-${String(sDay).padStart(2,'0')}`;

    opps.push({
      id:                    `OPP-${++oppCount}`,
      opportunityName:       tmpl.replace('{client}', client.split(' ')[0]).replace('{sp}', sp.split(' ').slice(1, 3).join(' ')),
      accountName:           client,
      groupClient:           client,
      salesStage:            stage,
      subSP:                 sp,
      salesGeo:              geo,
      bgCluster:             cluster.id,
      bgClusterLabel:        cluster.label,
      bg:                    bg.id,
      bgLabel:               bg.label,
      subUnit:               su.id,
      subUnitLabel:          su.label,
      fiscalYear:            fy,
      quarter:               q,
      week:                  `W${String(Math.floor(sr(seed + 14) * 13) + 1).padStart(2, '0')}`,
      tcv,
      expectedTCV:           expTCV,
      projectType:           pick(PROJECT_TYPES, seed + 15),
      ai:                    sr(seed + 16) > 0.38 ? 'Yes' : 'No',
      newRenew:              sr(seed + 17) > 0.44 ? 'New' : 'Renew',
      isNewDeal:             sr(seed + 17) > 0.44,
      isLargeStrategicDeal:  tcv >= LARGE_DEAL_THRESHOLD,
      salesOwner:            pick(OWNERS.sales, seed + 18),
      presalesOwner:         pick(OWNERS.presales, seed + 19),
      solutionOwner:         pick(OWNERS.solution, seed + 20),
      receivedDate:          rDate,
      expectedSubmissionDate:sDate,
      status:                stage === 'Won' ? 'Closed Won' : stage === 'Lost' ? 'Closed Lost' : 'Active',
    });
  }
});

export const SALES_OPPORTUNITIES = opps;
export const SALES_GEO_LIST      = SALES_GEOS;
export const SUB_SP_LIST         = [...new Set(Object.values(SUB_SPS).flat())];
