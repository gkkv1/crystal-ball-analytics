// src/data/dimensions.js
// SINGLE SOURCE OF TRUTH for the cascading filter hierarchy
// cluster → bg → subUnit → geo → clients

export const DIMENSION_TREE = [
  {
    id: 'industrial-mobility',
    label: 'Industrial & Mobility',
    bgs: [
      {
        id: 'automotive-bg',
        label: 'Automotive BG',
        subUnits: [
          {
            id: 'connected-vehicles',
            label: 'Connected Vehicles',
            geos: ['North America', 'Europe', 'Japan'],
            clients: ['General Motors', 'Toyota Motor', 'BMW Group', 'Stellantis', 'Renault'],
          },
          {
            id: 'manufacturing-ops',
            label: 'Manufacturing Operations',
            geos: ['North America', 'India', 'Europe'],
            clients: ['Ford Motor', 'Volkswagen', 'Honda', 'Hyundai'],
          },
        ],
      },
      {
        id: 'aerospace-defence',
        label: 'Aerospace & Defence BG',
        subUnits: [
          {
            id: 'avionics-systems',
            label: 'Avionics & Systems',
            geos: ['North America', 'Europe', 'Middle East'],
            clients: ['Boeing', 'Airbus', 'Lockheed Martin', 'Safran'],
          },
          {
            id: 'defence-it',
            label: 'Defence IT',
            geos: ['North America', 'India'],
            clients: ['Raytheon', 'BAE Systems', 'L3Harris'],
          },
        ],
      },
    ],
  },
  {
    id: 'energy-utilities',
    label: 'Energy & Utilities',
    bgs: [
      {
        id: 'energy-bg',
        label: 'Energy BG',
        subUnits: [
          {
            id: 'oil-gas',
            label: 'Oil & Gas',
            geos: ['North America', 'Middle East', 'India'],
            clients: ['ExxonMobil', 'Shell', 'BP', 'Saudi Aramco'],
          },
          {
            id: 'renewables',
            label: 'Renewables & Grid',
            geos: ['Europe', 'North America', 'India'],
            clients: ['Siemens Energy', 'GE Vernova', 'Vestas', 'Enel'],
          },
        ],
      },
      {
        id: 'utilities-bg',
        label: 'Utilities BG',
        subUnits: [
          {
            id: 'smart-grid',
            label: 'Smart Grid & Infra',
            geos: ['North America', 'Europe', 'Australia'],
            clients: ['Duke Energy', 'National Grid', 'E.ON', 'AGL Energy'],
          },
        ],
      },
    ],
  },
  {
    id: 'hi-tech-products',
    label: 'Hi-Tech & Products',
    bgs: [
      {
        id: 'semiconductor-bg',
        label: 'Semiconductor BG',
        subUnits: [
          {
            id: 'chip-design',
            label: 'Chip Design Services',
            geos: ['North America', 'Europe', 'APAC'],
            clients: ['Qualcomm', 'Intel', 'NXP Semiconductors', 'Infineon'],
          },
          {
            id: 'embedded-systems',
            label: 'Embedded Systems',
            geos: ['Europe', 'North America', 'Japan'],
            clients: ['Texas Instruments', 'STMicroelectronics', 'Microchip'],
          },
        ],
      },
      {
        id: 'consumer-tech-bg',
        label: 'Consumer Technology BG',
        subUnits: [
          {
            id: 'iot-platforms',
            label: 'IoT Platforms',
            geos: ['North America', 'APAC', 'Europe'],
            clients: ['Apple', 'Samsung Electronics', 'Bosch', 'Philips'],
          },
        ],
      },
    ],
  },
  {
    id: 'life-sciences',
    label: 'Life Sciences & Healthcare',
    bgs: [
      {
        id: 'medtech-bg',
        label: 'MedTech BG',
        subUnits: [
          {
            id: 'diagnostics-imaging',
            label: 'Diagnostics & Imaging',
            geos: ['North America', 'Europe', 'India'],
            clients: ['GE Healthcare', 'Philips Healthcare', 'Siemens Healthineers'],
          },
          {
            id: 'pharma-tech',
            label: 'Pharma Technology',
            geos: ['North America', 'Europe'],
            clients: ['Pfizer', 'Novartis', 'AstraZeneca', 'Roche'],
          },
        ],
      },
    ],
  },
];

// Flattened helpers for cascading filter logic
export function getClusters() {
  return DIMENSION_TREE.map((c) => ({ id: c.id, label: c.label }));
}

export function getBGsForCluster(clusterId) {
  if (!clusterId || clusterId === 'All') {
    return DIMENSION_TREE.flatMap((c) => c.bgs.map((b) => ({ id: b.id, label: b.label })));
  }
  const cluster = DIMENSION_TREE.find((c) => c.id === clusterId);
  return cluster ? cluster.bgs.map((b) => ({ id: b.id, label: b.label })) : [];
}

export function getSubUnitsForBG(bgId) {
  if (!bgId || bgId === 'All') {
    return DIMENSION_TREE.flatMap((c) =>
      c.bgs.flatMap((b) => b.subUnits.map((s) => ({ id: s.id, label: s.label })))
    );
  }
  const bg = DIMENSION_TREE.flatMap((c) => c.bgs).find((b) => b.id === bgId);
  return bg ? bg.subUnits.map((s) => ({ id: s.id, label: s.label })) : [];
}

export function getGeosForSubUnit(subUnitId) {
  if (!subUnitId || subUnitId === 'All') {
    const all = DIMENSION_TREE.flatMap((c) =>
      c.bgs.flatMap((b) => b.subUnits.flatMap((s) => s.geos))
    );
    return [...new Set(all)].sort();
  }
  const su = DIMENSION_TREE.flatMap((c) =>
    c.bgs.flatMap((b) => b.subUnits)
  ).find((s) => s.id === subUnitId);
  return su ? [...new Set(su.geos)].sort() : [];
}

export function getClientsForPath(subUnitId, geo) {
  let subUnits = DIMENSION_TREE.flatMap((c) => c.bgs.flatMap((b) => b.subUnits));
  if (subUnitId && subUnitId !== 'All') {
    subUnits = subUnits.filter((s) => s.id === subUnitId);
  }
  let clients = subUnits.flatMap((s) => s.clients);
  return [...new Set(clients)].sort();
}

// Flat lookup map: subUnitId → clusterId
export const SUBUNIT_TO_CLUSTER = {};
export const SUBUNIT_TO_BG = {};
DIMENSION_TREE.forEach((c) => {
  c.bgs.forEach((b) => {
    b.subUnits.forEach((s) => {
      SUBUNIT_TO_CLUSTER[s.id] = c.id;
      SUBUNIT_TO_BG[s.id] = b.id;
    });
  });
});

// BG → Cluster map
export const BG_TO_CLUSTER = {};
DIMENSION_TREE.forEach((c) => {
  c.bgs.forEach((b) => {
    BG_TO_CLUSTER[b.id] = c.id;
  });
});
