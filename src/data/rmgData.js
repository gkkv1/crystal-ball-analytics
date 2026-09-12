// src/data/rmgData.js
// Single Source of Truth synthetic dataset for RMG Performance (WON-HC Report)
// Synthesizes realistic weekly headcount additions across the dimension hierarchy.

import { DIMENSION_TREE } from './dimensions.js';

export const RMG_WEEKS = [
  { id: 'Wk14', label: '31-Mar-26', fullLabel: '31-Mar-26 Wk14', weekNum: 14, quarter: 'Q4', fy: 'FY26' },
  { id: 'Wk18', label: '30-Apr-26', fullLabel: '30-Apr-26 Wk18', weekNum: 18, quarter: 'Q1', fy: 'FY27' },
  { id: 'Wk22', label: '31-May-26', fullLabel: '31-May-26 Wk22', weekNum: 22, quarter: 'Q1', fy: 'FY27' },
  { id: 'Wk23', label: '03-Jun-26', fullLabel: '03-Jun-26 Wk23', weekNum: 23, quarter: 'Q1', fy: 'FY27' },
  { id: 'Wk24', label: '08-Jun-26', fullLabel: '08-Jun-26 Wk24', weekNum: 24, quarter: 'Q1', fy: 'FY27' },
  { id: 'Wk25', label: '22-Jun-26', fullLabel: '22-Jun-26 Wk25', weekNum: 25, quarter: 'Q1', fy: 'FY27' },
  { id: 'Wk27', label: '29-Jun-26', fullLabel: '29-Jun-26 Wk27', weekNum: 27, quarter: 'Q1', fy: 'FY27' },
  { id: 'Wk28', label: '09-Jul-26', fullLabel: '09-Jul-26 Wk28', weekNum: 28, quarter: 'Q2', fy: 'FY27' },
  { id: 'Wk29', label: '06-Jul-26', fullLabel: '06-Jul-26 Wk29', weekNum: 29, quarter: 'Q2', fy: 'FY27' },
  { id: 'Wk30', label: '13-Jul-26', fullLabel: '13-Jul-26 Wk30', weekNum: 30, quarter: 'Q2', fy: 'FY27' },
];

export const CURRENT_WEEK_ID = 'Wk30';
export const CURRENT_QUARTER = 'Q2';
export const CURRENT_FY = 'FY27';

// Deterministic pseudo-random number generator for stable synthetic data
function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate realistic synthetic records
function generateRmgRecords() {
  const records = [];
  const rng = pseudoRandom(4291);
  let idCounter = 1;

  // Cluster volume factors for realistic proportional sizes
  const clusterWeights = {
    'industrial-mobility': 1.45,
    'energy-utilities':    1.15,
    'hi-tech-products':    1.30,
    'life-sciences':       0.95,
  };

  DIMENSION_TREE.forEach(cluster => {
    const cWeight = clusterWeights[cluster.id] || 1.0;

    cluster.bgs.forEach(bg => {
      bg.subUnits.forEach(su => {
        su.geos.forEach(geo => {
          su.clients.forEach(client => {
            // Account variations per client
            const accountSuffixes = ['Digital Eng', 'Embedded Tech', 'Systems & Ops'];

            accountSuffixes.forEach((suffix, sIdx) => {
              const accountName = `${client} - ${suffix}`;
              const baseCapacity = Math.floor(18 + rng() * 32 * cWeight);

              RMG_WEEKS.forEach((week, wIdx) => {
                // Seasonal trend curve across weeks
                const weekFactor = 0.85 + Math.sin((wIdx + sIdx) * 0.75) * 0.35 + (rng() * 0.2 - 0.1);
                const wonHC = Math.max(0, Math.round(baseCapacity * weekFactor));

                records.push({
                  id: `rmg-${idCounter++}`,
                  weekId: week.id,
                  weekDate: week.label,
                  weekFullLabel: week.fullLabel,
                  weekNum: week.weekNum,
                  quarter: week.quarter,
                  fiscalYear: week.fy,
                  bgCluster: cluster.id,
                  bgClusterLabel: cluster.label,
                  bg: bg.id,
                  bgLabel: bg.label,
                  subUnit: su.id,
                  subUnitLabel: su.label,
                  geo,
                  groupClient: client,
                  accountName,
                  wonHC,
                });
              });
            });
          });
        });
      });
    });
  });

  return records;
}

export const RAW_RMG_RECORDS = generateRmgRecords();
