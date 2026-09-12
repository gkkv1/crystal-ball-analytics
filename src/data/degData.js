// src/data/degData.js
// SINGLE SOURCE OF TRUTH for DEG Performance module
// Generates deterministic synthetic CSI data per (cluster, bg, subUnit, geo, period)

import { DIMENSION_TREE } from './dimensions.js';

export const DEG_PERIODS   = ['FY25H1', 'FY25H2', 'FY26H1', 'FY26H2', 'FY27H1'];
export const DEG_HALF_YEARS = ['H1', 'H2'];
export const DEG_FISCAL_YEARS = ['FY25', 'FY26', 'FY27'];

// Base CSI score (%) per cluster
const CLUSTER_CSI_BASE = {
  'industrial-mobility': 94.2,
  'energy-utilities':    92.6,
  'hi-tech-products':    95.4,
  'life-sciences':       93.8,
};

// Period-level modifiers (keeps slight realistic variation)
const PERIOD_MOD = {
  FY25H1: 0.0,
  FY25H2: +0.6,
  FY26H1: -0.9,
  FY26H2: +0.4,
  FY27H1: +1.1,
};

// Base project count per cluster per period (total across all sub-units)
const CLUSTER_PROJECTS = {
  'industrial-mobility': 180,
  'energy-utilities':    130,
  'hi-tech-products':    110,
  'life-sciences':        90,
};

// Project count variation by period
const PERIOD_PROJ_MUL = { FY25H1: 0.85, FY25H2: 1.10, FY26H1: 0.70, FY26H2: 1.05, FY27H1: 0.60 };

// Seeded pseudo-random
function sr(seed) {
  const x = Math.sin(seed + 1) * 100000;
  return x - Math.floor(x);
}
function r1(v) { return Math.round(v * 10)  / 10;  }
function r2(v) { return Math.round(v * 100) / 100; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

const records = [];
let recIdx = 0;

DIMENSION_TREE.forEach((cluster, cI) => {
  const csiBase  = CLUSTER_CSI_BASE[cluster.id];
  const projBase = CLUSTER_PROJECTS[cluster.id];

  cluster.bgs.forEach((bg, bI) => {
    const bgShare = 1 / cluster.bgs.length;

    bg.subUnits.forEach((su, suI) => {
      const suShare = 1 / bg.subUnits.length;

      su.geos.forEach((geo, gI) => {
        const geoShare = 1 / su.geos.length;

        DEG_PERIODS.forEach((period, pI) => {
          const seed = cI * 10000 + bI * 2000 + suI * 400 + gI * 80 + pI * 13;

          const csiVariance   = -2.0 + sr(seed + 1) * 4.0;   // ±2%
          const csiScore      = clamp(r1(csiBase + PERIOD_MOD[period] + csiVariance), 82, 100);

          const projMul       = PERIOD_PROJ_MUL[period];
          const projVariance  = 0.80 + sr(seed + 2) * 0.40;
          const totalProjects = Math.max(1, Math.round(projBase * bgShare * suShare * geoShare * projMul * projVariance * 80));

          // Derived counts — all mathematically tied to totalProjects
          const csi100Pct      = clamp(r1(28 + sr(seed + 3) * 12), 20, 45);
          const csi100Count    = Math.round(totalProjects * csi100Pct / 100);
          const csi100RespPct  = clamp(r1(42 + sr(seed + 4) * 15), 30, 60);

          const lowCsiPct      = clamp(r1(8 + sr(seed + 5) * 7), 4, 18);
          const lowCsiCount    = Math.round(totalProjects * lowCsiPct / 100);

          const loyaltyPct     = clamp(r1(70 + sr(seed + 6) * 15), 55, 88);
          const loyaltyCount   = Math.round(totalProjects * loyaltyPct / 100);

          const rankingPct     = clamp(r1(62 + sr(seed + 7) * 14), 48, 80);
          const rankingCount   = Math.round(totalProjects * rankingPct / 100);

          records.push({
            id:              `D${++recIdx}`,
            period,
            fiscalYear:      period.slice(0, 4),
            halfYear:        period.slice(4),
            bgCluster:       cluster.id,
            bgClusterLabel:  cluster.label,
            bg:              bg.id,
            bgLabel:         bg.label,
            subUnit:         su.id,
            subUnitLabel:    su.label,
            geo,
            groupClient:     su.clients[Math.floor(sr(seed + 8) * su.clients.length)],

            totalProjects,
            csiScore,
            csi100Count,
            csi100Pct,
            csi100RespPct,
            lowCsiCount,
            lowCsiPct,
            loyaltyCount,
            loyaltyPct,
            rankingCount,
            rankingPct,
          });
        });
      });
    });
  });
});

export const RAW_DEG_RECORDS = records;
