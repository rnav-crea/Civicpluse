import { Issue } from './types';

// Let's create high-quality inline SVGs represented as clean data URIs or base64
// for our seed reports, representing potholes, water leaks, broken streetlights, etc.
const getSVGDataUri = (type: string, color: string) => {
  const width = 400;
  const height = 300;
  let graphic = '';

  if (type === 'pothole') {
    graphic = `
      <rect width="100%" height="100%" fill="#2b2d31"/>
      <ellipse cx="200" cy="180" rx="110" ry="45" fill="#131416"/>
      <ellipse cx="190" cy="182" rx="90" ry="35" fill="#08090a"/>
      <path d="M120 180 C 130 195, 270 195, 280 180" stroke="#4a4d52" stroke-width="4" fill="none"/>
      <path d="M 80 180 L 110 180" stroke="#f59e0b" stroke-width="3" stroke-dasharray="5 5"/>
      <path d="M 290 180 L 320 180" stroke="#f59e0b" stroke-width="3" stroke-dasharray="5 5"/>
      <text x="50%" y="60" font-family="monospace" font-size="20" fill="#f87171" font-weight="bold" text-anchor="middle">CIVIC ALERT: POTHOLE</text>
      <text x="50%" y="100" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Deep asphalt structural damage detected</text>
    `;
  } else if (type === 'water_leak') {
    graphic = `
      <rect width="100%" height="100%" fill="#0f172a"/>
      <circle cx="200" cy="170" r="40" fill="#38bdf8" opacity="0.3"/>
      <circle cx="200" cy="170" r="20" fill="#0ea5e9"/>
      <path d="M200 80 L200 150 M170 110 L230 110" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/>
      <path d="M160 170 Q200 230 240 170" stroke="#38bdf8" stroke-width="6" fill="none" opacity="0.8"/>
      <path d="M140 190 Q200 270 260 190" stroke="#38bdf8" stroke-width="4" fill="none" opacity="0.5"/>
      <text x="50%" y="50" font-family="monospace" font-size="20" fill="#38bdf8" font-weight="bold" text-anchor="middle">WATER MAIN LEAK</text>
      <text x="50%" y="270" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">High pressure pipe burst &amp; pooling</text>
    `;
  } else if (type === 'streetlight') {
    graphic = `
      <rect width="100%" height="100%" fill="#18181b"/>
      <line x1="200" y1="50" x2="200" y2="220" stroke="#4b5563" stroke-width="8"/>
      <path d="M180 50 L220 50 L210 30 L190 30 Z" fill="#3f3f46"/>
      <circle cx="200" cy="65" r="12" fill="#52525b"/>
      <path d="M130 220 L270 220" stroke="#4b5563" stroke-width="12" stroke-linecap="round"/>
      <circle cx="200" cy="65" r="30" fill="#ef4444" opacity="0.2"/>
      <line x1="170" y1="65" x2="230" y2="65" stroke="#ef4444" stroke-width="3"/>
      <text x="50%" y="265" font-family="monospace" font-size="20" fill="#facc15" font-weight="bold" text-anchor="middle">OUTAGE: STREETLIGHT</text>
      <text x="50%" y="150" font-family="sans-serif" font-size="14" fill="#f87171" text-anchor="middle">Dark Zone Area Risk</text>
    `;
  } else {
    graphic = `
      <rect width="100%" height="100%" fill="#1e293b"/>
      <rect x="140" y="100" width="120" height="130" rx="10" fill="#475569"/>
      <rect x="160" y="80" width="80" height="20" rx="4" fill="#334155"/>
      <line x1="150" y1="130" x2="250" y2="130" stroke="#334155" stroke-width="4"/>
      <line x1="150" y1="160" x2="250" y2="160" stroke="#334155" stroke-width="4"/>
      <circle cx="200" cy="190" r="15" fill="#f43f5e" opacity="0.8"/>
      <text x="50%" y="50" font-family="monospace" font-size="20" fill="#fb7185" font-weight="bold" text-anchor="middle">ILLEGAL GARBAGE DUMP</text>
      <text x="50%" y="270" font-family="sans-serif" font-size="14" fill="#cbd5e1" text-anchor="middle">Sanitation &amp; health hazard</text>
    `;
  }

  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      ${graphic}
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
};

export const seedIssues: Issue[] = [
  {
    id: 'issue_001',
    category: 'pothole',
    severity: 4,
    severityReason: 'Large pothole on a highly trafficked main arterial road causing sudden braking and near-accidents.',
    department: 'Roads Department',
    summary: 'A substantial pothole is present in the middle lane of MG Road, approximately 1.5 feet wide and 5 inches deep, posing severe damage risk to light vehicles.',
    location: {
      lat: 17.6885,
      lng: 83.2195,
      name: 'MG Road, near Prema Hospital, Visakhapatnam'
    },
    area: 'Visakhapatnam',
    status: 'ESCALATED',
    reportedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('pothole', '#ef4444'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 2 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_002',
    category: 'water_leak',
    severity: 3,
    severityReason: 'Continuous fresh water leakage causing minor pooling but significant volume waste.',
    department: 'Water Supply & Sewerage',
    summary: 'A sub-surface water pipeline joint leak has broken through the pavement, leading to persistent potable water runoff flooding the local side alley.',
    location: {
      lat: 17.6920,
      lng: 83.2240,
      name: 'Park Street Crossroad, Visakhapatnam'
    },
    area: 'Visakhapatnam',
    status: 'OPEN',
    reportedAt: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('water_leak', '#f97316'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 5 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_003',
    category: 'streetlight',
    severity: 2,
    severityReason: 'Individual light fixture failure reducing pedestrian visibility at a public transport stop.',
    department: 'Electricity Board',
    summary: 'The main overhead LED street illumination panel next to the central bus terminal is completely burnt out, leaving the waiting platform in pitch darkness.',
    location: {
      lat: 17.6840,
      lng: 83.2260,
      name: 'Beach Road Bus Stop, Visakhapatnam'
    },
    area: 'Visakhapatnam',
    status: 'OPEN',
    reportedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('streetlight', '#eab308'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 24 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_004',
    category: 'garbage',
    severity: 4,
    severityReason: 'Large accumulation of mixed commercial and residential waste attracting stray animals and blocking the pedestrian sidewalk.',
    department: 'Sanitation & Health',
    summary: 'An unauthorized pile-up of household garbage and commercial plastic waste has accumulated on the curb, producing strong odors and obstructing the drainage channel.',
    location: {
      lat: 17.6960,
      lng: 83.2120,
      name: 'Sector 4, MVP Colony, Visakhapatnam'
    },
    area: 'Visakhapatnam',
    status: 'ESCALATED',
    reportedAt: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('garbage', '#ef4444'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 6 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_005',
    category: 'pothole',
    severity: 5,
    severityReason: 'Critical crater-sized road depression at an active intersection, high risk of severe vehicle crashes and bodily harm.',
    department: 'Roads Department',
    summary: 'An extremely deep road crater has developed right at the blind turn of the intersection, threatening motorcyclist safety and causing heavy traffic bottlenecks.',
    location: {
      lat: 17.6790,
      lng: 83.2080,
      name: 'Gajuwaka Main Rd, Visakhapatnam'
    },
    area: 'Visakhapatnam',
    status: 'ESCALATED',
    reportedAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('pothole', '#ef4444'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 3 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_006',
    category: 'pothole',
    severity: 5,
    severityReason: 'Severe highway erosion blocking two active traffic lanes.',
    department: 'Roads Department',
    summary: 'Multiple consecutive potholes forming a massive trench across the south lane of Colaba Road, inducing traffic stoppages.',
    location: {
      lat: 18.9218,
      lng: 72.8347,
      name: 'Colaba Causeway, Mumbai'
    },
    area: 'Mumbai',
    status: 'OPEN',
    reportedAt: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('pothole', '#ef4444'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 1 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_007',
    category: 'water_leak',
    severity: 3,
    severityReason: 'Broken commercial drain cover leaking stagnant water into public square.',
    department: 'Water Supply & Sewerage',
    summary: 'Stagnant grey water is flooding the pedestrian pathway in front of block E of Connaught Place, creating a slippery and unhygienic walking zone.',
    location: {
      lat: 28.6304,
      lng: 77.2177,
      name: 'Connaught Place, Block E, New Delhi'
    },
    area: 'Delhi',
    status: 'OPEN',
    reportedAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('water_leak', '#f97316'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 3 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_008',
    category: 'streetlight',
    severity: 2,
    severityReason: 'Flickering street illumination pole creating distracting driving conditions.',
    department: 'Electricity Board',
    summary: 'Street pole light #24 flashes intermittently, disrupting motorist sight and causing visual strain on the main thoroughfare.',
    location: {
      lat: 13.0604,
      lng: 80.2496,
      name: 'Anna Salai, near Spencer Plaza, Chennai'
    },
    area: 'Chennai',
    status: 'RESOLVED',
    reportedAt: Date.now() - 48 * 60 * 60 * 1000, // 2 days ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('streetlight', '#10b981'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 48 * 60 * 60 * 1000 - 120000,
    resolvedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago (took 24 hours to solve)
    resolvedBy: 'Inspector K. Rao',
    resolutionNotes: 'Municipal electrical crew replaced the flickering bulb choke and checked standard ground connection parameters. Fixture is fully operational.',
    resolutionImage: getSVGDataUri('streetlight', '#10b981')
  },
  {
    id: 'issue_009',
    category: 'garbage',
    severity: 3,
    severityReason: 'Construction debris dumped next to park boundary, impeding access.',
    department: 'Sanitation & Health',
    summary: 'Illegal disposal of concrete blocks, cement sacks, and construction gravel on the pedestrian track adjacent to the community park.',
    location: {
      lat: 12.9738,
      lng: 77.6119,
      name: 'MG Road, Metro Pillar 104, Bangalore'
    },
    area: 'Bangalore',
    status: 'OPEN',
    reportedAt: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('garbage', '#f97316'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 12 * 60 * 60 * 1000 - 120000
  },
  {
    id: 'issue_010',
    category: 'pothole',
    severity: 4,
    severityReason: 'Severe deep road cavity inside residential neighborhood endangering children and elderly.',
    department: 'Roads Department',
    summary: 'Deep pavement erosion at the entrance of Lane 3, Banjara Hills, creating a highly hazardous trap for incoming cars and motorcycles.',
    location: {
      lat: 17.4156,
      lng: 78.4347,
      name: 'Road No. 12, Banjara Hills, Hyderabad'
    },
    area: 'Hyderabad',
    status: 'ESCALATED',
    reportedAt: Date.now() - 10 * 60 * 60 * 1000, // 10 hours ago
    reportedBy: 'other',
    imageBase64: getSVGDataUri('pothole', '#ef4444'),
    photoSource: 'preset',
    photoCapturedAt: Date.now() - 10 * 60 * 60 * 1000 - 120000
  }
];
