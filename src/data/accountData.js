// src/data/accountData.js
// Single source of truth synthetic dataset for Account Management / Account Performance
// Powers both Performance Analysis and Client Visit tabs.

import { DIMENSION_TREE } from './dimensions.js';

export const ACCOUNT_TABS = [
  { id: 'performance', label: 'Performance Analysis' },
  { id: 'client-visit', label: 'Client Visit' },
];

export const BUSINESS_DOMAINS = [
  { id: 'revenue', label: 'Revenue', unit: '₹ Cr',   field: 'revenue',       aopField: 'revenueAop' },
  { id: 'finance', label: 'Finance', unit: 'Margin%', field: 'financeMarginPct', aopField: 'financeAop' },
  { id: 'sales',   label: 'Sales',   unit: '$ M',    field: 'salesTCV',      aopField: 'salesTCVAop' },
  { id: 'rmg',     label: 'RMG',     unit: 'WON HC', field: 'rmgWonHC',      aopField: 'rmgAop' },
  { id: 'deg',     label: 'DEG',     unit: 'CSI%',   field: 'degScore',      aopField: 'degAop' },
];

export const FISCAL_YEARS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];

export const MONTH_ORDER = [
  { month: 'July',      quarter: 'Q2', fy: 'FY26' },
  { month: 'August',    quarter: 'Q2', fy: 'FY26' },
  { month: 'September', quarter: 'Q2', fy: 'FY26' },
  { month: 'October',   quarter: 'Q3', fy: 'FY26' },
  { month: 'November',  quarter: 'Q3', fy: 'FY26' },
  { month: 'December',  quarter: 'Q3', fy: 'FY26' },
  { month: 'January',   quarter: 'Q4', fy: 'FY26' },
  { month: 'February',  quarter: 'Q4', fy: 'FY26' },
  { month: 'March',     quarter: 'Q4', fy: 'FY26' },
  { month: 'April',     quarter: 'Q1', fy: 'FY27' },
  { month: 'May',       quarter: 'Q1', fy: 'FY27' },
  { month: 'June',      quarter: 'Q1', fy: 'FY27' },
];

export const MEETING_CATEGORIES = [
  { id: 'MFG',          label: 'MFG Meetings',         color: '#3B82F6' },
  { id: 'CBG',          label: 'CBG Meetings',         color: '#10B981' },
  { id: 'CMI',          label: 'CMI Meetings',         color: '#F59E0B' },
  { id: 'LS HC/ERU',    label: 'LS HC/ERU Meetings',    color: '#8B5CF6' },
  { id: 'Japan Ops',    label: 'Japan Ops Meetings',    color: '#EC4899' },
  { id: 'TS&S',         label: 'TS&S Meetings',         color: '#06B6D4' },
];

const IAE_BDD_LIST = [
  'Anand Ramiah', 'Vishal Jayaram', 'Suman Chatterjee',
  'Jason Fischel', 'Jyoti Jayarman', 'David Segat',
];

const IAE_BRM_LIST = [
  'Kiran Zingade', 'Santosh Devteppu', 'Ramesh Akerapu', 'David Segat',
];

const IAE_GEO_HEAD_LIST = [
  'K. Chitharanjan', 'Anoopiah Chidveenti', 'M. Nithiyanandam', 'Srivatsa V.',
];

// Deterministic random generator for stable synthetic data
function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate Account Performance Records
function generateAccountPerformance() {
  const records = [];
  const rng = pseudoRandom(78912);
  let id = 1;

  DIMENSION_TREE.forEach(cluster => {
    cluster.bgs.forEach(bg => {
      bg.subUnits.forEach(su => {
        su.clients.forEach(client => {
          const accountName = `${client} Global`;
          const bdd = IAE_BDD_LIST[Math.floor(rng() * IAE_BDD_LIST.length)];
          const brm = IAE_BRM_LIST[Math.floor(rng() * IAE_BRM_LIST.length)];
          const geoHead = IAE_GEO_HEAD_LIST[Math.floor(rng() * IAE_GEO_HEAD_LIST.length)];

          FISCAL_YEARS.forEach((fy, fyIdx) => {
            ['Q1', 'Q2', 'Q3', 'Q4'].forEach((quarter, qIdx) => {
              const baseGrowth = 1 + fyIdx * 0.12 + qIdx * 0.03;
              const revAop = Math.round((120 + rng() * 180) * baseGrowth);
              const revAct = Math.round(revAop * (0.88 + rng() * 0.22));

              const salesAop = Math.round((40 + rng() * 60) * baseGrowth);
              const salesTcv = Math.round(salesAop * (0.85 + rng() * 0.3));

              records.push({
                id: `perf-${id++}`,
                bgCluster: cluster.id,
                bgClusterLabel: cluster.label,
                bg: bg.id,
                bgLabel: bg.label,
                subUnit: su.id,
                subUnitLabel: su.label,
                groupClient: client,
                accountName,
                iaeBdd: bdd,
                iaeBrm: brm,
                iaeGeoHead: geoHead,
                fiscalYear: fy,
                quarter,
                revenue: revAct,
                revenueAop: revAop,
                salesTCV: salesTcv,
                salesTCVAop: salesAop,
                financeMarginPct: Math.round((21 + rng() * 8) * 10) / 10,
                financeAop: 24.0,
                rmgWonHC: Math.round(18 + rng() * 45),
                rmgAop: 35,
                degScore: Math.round((91 + rng() * 7) * 10) / 10,
                degAop: 94.0,
              });
            });
          });
        });
      });
    });
  });

  return records;
}

// Generate Client Visit Records
function generateClientVisits() {
  const visits = [];
  const rng = pseudoRandom(33421);
  let id = 1;

  const meetingTypes = [
    'Executive Review', 'Steering Committee', 'Innovation Workshop', 'Quarterly Business Review', 'Tech Showcase'
  ];

  const customerNames = [
    'Arvind Ramiah', 'Kiran Zingade', 'Santosh Devteppu', 'Suman Chatterjee',
    'Jyoti Jayarman', 'Vishal Jayaram', 'Ramesh Akerapu', 'David Segat',
    'Jason Fischel', 'Elena Rostova', 'Akira Tanaka', 'Michael Vance'
  ];

  const attendeePool = [
    'K. Chitharanjan (Chief Delivery Officer)',
    'Anoopiah Chidveenti (Global Delivery Head)',
    'Avinash Cheruvant (VP & Practice Leader)',
    'M. Nithiyanandam (Global Head Engineering)',
    'Srivatsa V. (Head Digital & Architecture)',
    'David Segat (IAE Geo Head)',
    'Shishir Suman (Centre Delivery Master)',
  ];

  const clusterKeys = ['industrial-mobility', 'energy-utilities', 'hi-tech-products', 'life-sciences'];

  // Create realistic meetings distribution matching the reference screenshot
  MONTH_ORDER.forEach((mObj, mIdx) => {
    // Generate 5 to 12 meetings per month
    const countThisMonth = Math.floor(5 + rng() * 9);

    for (let i = 0; i < countThisMonth; i++) {
      const clusterId = clusterKeys[Math.floor(rng() * clusterKeys.length)];
      const cluster = DIMENSION_TREE.find(c => c.id === clusterId);
      const bg = cluster.bgs[Math.floor(rng() * cluster.bgs.length)];
      const su = bg.subUnits[Math.floor(rng() * bg.subUnits.length)];
      const client = su.clients[Math.floor(rng() * su.clients.length)];

      const catObj = MEETING_CATEGORIES[Math.floor(rng() * MEETING_CATEGORIES.length)];
      const day = Math.floor(1 + rng() * 27);
      const year = mObj.fy === 'FY26' ? '2025' : '2026';
      const monthNumber = String((mIdx + 7) > 12 ? (mIdx + 7) - 12 : mIdx + 7).padStart(2, '0');
      const dateStr = `${year}-${monthNumber}-${String(day).padStart(2, '0')}`;

      const bdd = IAE_BDD_LIST[Math.floor(rng() * IAE_BDD_LIST.length)];
      const brm = IAE_BRM_LIST[Math.floor(rng() * IAE_BRM_LIST.length)];
      const geoHead = IAE_GEO_HEAD_LIST[Math.floor(rng() * IAE_GEO_HEAD_LIST.length)];

      const attendeeCount = 2 + Math.floor(rng() * 2);
      const selectedAttendees = [...attendeePool].sort(() => 0.5 - rng()).slice(0, attendeeCount);

      visits.push({
        id: `visit-${id++}`,
        groupClient: client,
        accountName: `${client} Global`,
        bgCluster: cluster.id,
        bgClusterLabel: cluster.label,
        bg: bg.id,
        subUnit: su.id,
        subUnitLabel: su.label,
        meetingCategory: catObj.id,
        meetingCategoryLabel: catObj.label,
        meetingDate: dateStr,
        fiscalYear: mObj.fy,
        quarter: mObj.quarter,
        month: mObj.month,
        customerName: customerNames[Math.floor(rng() * customerNames.length)],
        tcsAttendees: selectedAttendees.join(' · '),
        meetingType: meetingTypes[Math.floor(rng() * meetingTypes.length)],
        status: rng() > 0.15 ? 'Completed' : 'Scheduled',
        purpose: 'Strategic Growth & Delivery Review',
        iaeBdd: bdd,
        iaeBrm: brm,
        iaeGeoHead: geoHead,
      });
    }
  });

  return visits;
}

export const RAW_ACCOUNT_PERFORMANCE = generateAccountPerformance();
export const RAW_CLIENT_VISITS = generateClientVisits();
