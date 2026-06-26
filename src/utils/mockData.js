export const MOCK_CENTERS = [
  {
    id: "phc-narendra",
    name: "PHC Narendra",
    type: "PHC",
    location: "Narendra, Dharwad Taluk",
    coordinates: { lat: 15.4883, lng: 74.9850 },
    status: "warning",
    beds: { total: 10, occupied: 8 },
    doctors: { total: 2, present: 1 },
    footfall: { today: 45, averageDaily: 35 },
    diagnosticTests: {
      "Malaria Antigen Kit": true,
      "Basic CBC Blood Test": true,
      "Chest X-Ray": false,
      "HIV Rapid Test": true,
      "Sputum for TB": false
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "phc-hebballi",
    name: "PHC Hebballi",
    type: "PHC",
    location: "Hebballi, Dharwad Taluk",
    coordinates: { lat: 15.4950, lng: 75.0920 },
    status: "critical",
    beds: { total: 8, occupied: 8 },
    doctors: { total: 2, present: 0 },
    footfall: { today: 65, averageDaily: 40 },
    diagnosticTests: {
      "Malaria Antigen Kit": true,
      "Basic CBC Blood Test": false,
      "Chest X-Ray": false,
      "HIV Rapid Test": false,
      "Sputum for TB": false
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "chc-kalghatgi",
    name: "CHC Kalghatgi",
    type: "CHC",
    location: "Kalghatgi Taluk HQ",
    coordinates: { lat: 15.1850, lng: 74.9650 },
    status: "normal",
    beds: { total: 30, occupied: 14 },
    doctors: { total: 6, present: 4 },
    footfall: { today: 120, averageDaily: 110 },
    diagnosticTests: {
      "Malaria Antigen Kit": true,
      "Basic CBC Blood Test": true,
      "Chest X-Ray": true,
      "HIV Rapid Test": true,
      "Sputum for TB": true
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "phc-mugad",
    name: "PHC Mugad",
    type: "PHC",
    location: "Mugad, Dharwad Taluk",
    coordinates: { lat: 15.4410, lng: 74.9080 },
    status: "normal",
    beds: { total: 6, occupied: 2 },
    doctors: { total: 1, present: 1 },
    footfall: { today: 18, averageDaily: 25 },
    diagnosticTests: {
      "Malaria Antigen Kit": true,
      "Basic CBC Blood Test": false,
      "Chest X-Ray": false,
      "HIV Rapid Test": true,
      "Sputum for TB": false
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "chc-kundgol",
    name: "CHC Kundgol",
    type: "CHC",
    location: "Kundgol Taluk HQ",
    coordinates: { lat: 15.2580, lng: 75.2450 },
    status: "warning",
    beds: { total: 25, occupied: 21 },
    doctors: { total: 5, present: 3 },
    footfall: { today: 98, averageDaily: 85 },
    diagnosticTests: {
      "Malaria Antigen Kit": true,
      "Basic CBC Blood Test": true,
      "Chest X-Ray": true,
      "HIV Rapid Test": true,
      "Sputum for TB": false
    },
    lastUpdated: new Date().toISOString()
  }
];

export const MOCK_INVENTORY = {
  "phc-narendra": [
    { name: "Paracetamol (500mg)", category: "Analgesic", stock: 110, minRequired: 300, dailyUsage: 25 },
    { name: "Amoxicillin (250mg)", category: "Antibiotic", stock: 150, minRequired: 200, dailyUsage: 18 },
    { name: "Insulin (10ml)", category: "Antidiabetic", stock: 6, minRequired: 20, dailyUsage: 2 },
    { name: "ORS Packets", category: "Rehydration", stock: 450, minRequired: 300, dailyUsage: 35 },
    { name: "Amlodipine (5mg)", category: "Antihypertensive", stock: 80, minRequired: 150, dailyUsage: 10 }
  ],
  "phc-hebballi": [
    { name: "Paracetamol (500mg)", category: "Analgesic", stock: 12, minRequired: 250, dailyUsage: 28 },
    { name: "Amoxicillin (250mg)", category: "Antibiotic", stock: 4, minRequired: 180, dailyUsage: 20 },
    { name: "Insulin (10ml)", category: "Antidiabetic", stock: 2, minRequired: 15, dailyUsage: 1.5 },
    { name: "ORS Packets", category: "Rehydration", stock: 480, minRequired: 250, dailyUsage: 40 },
    { name: "Amlodipine (5mg)", category: "Antihypertensive", stock: 110, minRequired: 120, dailyUsage: 8 }
  ],
  "chc-kalghatgi": [
    { name: "Paracetamol (500mg)", category: "Analgesic", stock: 850, minRequired: 800, dailyUsage: 75 },
    { name: "Amoxicillin (250mg)", category: "Antibiotic", stock: 620, minRequired: 500, dailyUsage: 55 },
    { name: "Insulin (10ml)", category: "Antidiabetic", stock: 115, minRequired: 80, dailyUsage: 8 },
    { name: "ORS Packets", category: "Rehydration", stock: 1200, minRequired: 1000, dailyUsage: 90 },
    { name: "Amlodipine (5mg)", category: "Antihypertensive", stock: 430, minRequired: 400, dailyUsage: 35 }
  ],
  "phc-mugad": [
    { name: "Paracetamol (500mg)", category: "Analgesic", stock: 310, minRequired: 200, dailyUsage: 15 },
    { name: "Amoxicillin (250mg)", category: "Antibiotic", stock: 220, minRequired: 150, dailyUsage: 10 },
    { name: "Insulin (10ml)", category: "Antidiabetic", stock: 45, minRequired: 15, dailyUsage: 1 },
    { name: "ORS Packets", category: "Rehydration", stock: 350, minRequired: 200, dailyUsage: 15 },
    { name: "Amlodipine (5mg)", category: "Antihypertensive", stock: 190, minRequired: 100, dailyUsage: 5 }
  ],
  "chc-kundgol": [
    { name: "Paracetamol (500mg)", category: "Analgesic", stock: 140, minRequired: 600, dailyUsage: 65 },
    { name: "Amoxicillin (250mg)", category: "Antibiotic", stock: 240, minRequired: 400, dailyUsage: 45 },
    { name: "Insulin (10ml)", category: "Antidiabetic", stock: 28, minRequired: 60, dailyUsage: 5 },
    { name: "ORS Packets", category: "Rehydration", stock: 890, minRequired: 700, dailyUsage: 70 },
    { name: "Amlodipine (5mg)", category: "Antihypertensive", stock: 290, minRequired: 300, dailyUsage: 25 }
  ]
};
