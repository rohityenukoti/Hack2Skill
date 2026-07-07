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

export const MOCK_FEEDBACK = {
  "phc-narendra": [
    {
      id: "demo-phc-narendra-0",
      source: "demo",
      centerId: "phc-narendra",
      centerName: "PHC Narendra",
      rating: 3,
      text: "Staff were polite but I had to wait over two hours. Paracetamol was out of stock when I needed it.",
      categories: ["Wait Time", "Medicine Availability", "Staff Behavior"],
      name: "Lakshmi B.",
      timestamp: "2026-07-05T09:15:00.000Z"
    },
    {
      id: "demo-phc-narendra-1",
      source: "demo",
      centerId: "phc-narendra",
      centerName: "PHC Narendra",
      rating: 4,
      text: "Clean facility and the nurse explained my prescription clearly. Queue management could be better in the morning.",
      categories: ["Cleanliness", "Staff Behavior", "Wait Time"],
      name: "Suresh G.",
      timestamp: "2026-07-03T11:40:00.000Z"
    },
    {
      id: "demo-phc-narendra-2",
      source: "demo",
      centerId: "phc-narendra",
      centerName: "PHC Narendra",
      rating: 2,
      text: "Came for a CBC test but was told kits are limited. Had to return the next day.",
      categories: ["Medicine Availability", "Facilities"],
      name: "Anonymous Citizen",
      timestamp: "2026-07-01T08:20:00.000Z"
    }
  ],
  "phc-hebballi": [
    {
      id: "demo-phc-hebballi-0",
      source: "demo",
      centerId: "phc-hebballi",
      centerName: "PHC Hebballi",
      rating: 1,
      text: "No doctor was available when I visited. Only one staff member was present and could not help with my child's fever.",
      categories: ["Staff Behavior", "Overall Experience"],
      name: "Priya M.",
      timestamp: "2026-07-06T10:05:00.000Z"
    },
    {
      id: "demo-phc-hebballi-1",
      source: "demo",
      centerId: "phc-hebballi",
      centerName: "PHC Hebballi",
      rating: 2,
      text: "Very crowded and no medicines in the pharmacy. People were waiting outside in the heat.",
      categories: ["Medicine Availability", "Wait Time", "Facilities"],
      name: "Ramesh K.",
      timestamp: "2026-07-04T14:30:00.000Z"
    },
    {
      id: "demo-phc-hebballi-2",
      source: "demo",
      centerId: "phc-hebballi",
      centerName: "PHC Hebballi",
      rating: 2,
      text: "Building is clean but services are severely understaffed. District should send a doctor urgently.",
      categories: ["Cleanliness", "Staff Behavior"],
      name: "Fatima S.",
      timestamp: "2026-07-02T16:45:00.000Z"
    }
  ],
  "chc-kalghatgi": [
    {
      id: "demo-chc-kalghatgi-0",
      source: "demo",
      centerId: "chc-kalghatgi",
      centerName: "CHC Kalghatgi",
      rating: 5,
      text: "Excellent care. Got my X-ray and blood test done the same day. Staff were helpful and spoke Kannada clearly.",
      categories: ["Facilities", "Staff Behavior", "Overall Experience"],
      name: "Venkatesh R.",
      timestamp: "2026-07-06T12:00:00.000Z"
    },
    {
      id: "demo-chc-kalghatgi-1",
      source: "demo",
      centerId: "chc-kalghatgi",
      centerName: "CHC Kalghatgi",
      rating: 4,
      text: "Good experience overall. Wait time was about 45 minutes but the doctor was thorough.",
      categories: ["Wait Time", "Staff Behavior"],
      name: "Anita D.",
      timestamp: "2026-07-03T09:50:00.000Z"
    }
  ],
  "phc-mugad": [
    {
      id: "demo-phc-mugad-0",
      source: "demo",
      centerId: "phc-mugad",
      centerName: "PHC Mugad",
      rating: 4,
      text: "Small center but well maintained. Got medicines without any issue and did not have to wait long.",
      categories: ["Medicine Availability", "Cleanliness", "Wait Time"],
      name: "Gopal N.",
      timestamp: "2026-07-05T15:20:00.000Z"
    },
    {
      id: "demo-phc-mugad-1",
      source: "demo",
      centerId: "phc-mugad",
      centerName: "PHC Mugad",
      rating: 5,
      text: "ASHA worker guided me through the Ayushman registration. Very satisfied with the visit.",
      categories: ["Staff Behavior", "Overall Experience"],
      name: "Shanta P.",
      timestamp: "2026-07-01T10:10:00.000Z"
    }
  ],
  "chc-kundgol": [
    {
      id: "demo-chc-kundgol-0",
      source: "demo",
      centerId: "chc-kundgol",
      centerName: "CHC Kundgol",
      rating: 3,
      text: "Beds were almost full and the OPD line was very long. Staff tried their best but the center needs more doctors.",
      categories: ["Wait Time", "Facilities", "Staff Behavior"],
      name: "Basavaraj H.",
      timestamp: "2026-07-06T08:30:00.000Z"
    },
    {
      id: "demo-chc-kundgol-1",
      source: "demo",
      centerId: "chc-kundgol",
      centerName: "CHC Kundgol",
      rating: 3,
      text: "Insulin was available but I was asked to come back for amoxicillin. Mixed experience.",
      categories: ["Medicine Availability", "Overall Experience"],
      name: "Anonymous Citizen",
      timestamp: "2026-07-04T11:15:00.000Z"
    },
    {
      id: "demo-chc-kundgol-2",
      source: "demo",
      centerId: "chc-kundgol",
      centerName: "CHC Kundgol",
      rating: 4,
      text: "Diagnostic facilities are good. Parking is difficult during market days.",
      categories: ["Facilities", "Overall Experience"],
      name: "Meena J.",
      timestamp: "2026-07-02T13:00:00.000Z"
    }
  ]
};

export const MOCK_FEEDBACK_SUMMARIES = [
  {
    centerId: "phc-narendra",
    centerName: "PHC Narendra",
    avgRating: 3.0,
    reviewCount: 3,
    summary: "Citizens appreciate polite staff and a clean facility, but recurring complaints center on long morning queues and intermittent medicine stock-outs—especially Paracetamol and diagnostic kits. Improving pharmacy replenishment and triage during peak hours would likely lift satisfaction scores."
  },
  {
    centerId: "phc-hebballi",
    centerName: "PHC Hebballi",
    avgRating: 1.7,
    reviewCount: 3,
    summary: "Feedback is overwhelmingly negative, with all recent reviews citing doctor absenteeism, empty pharmacy shelves, and long waits in overcrowded conditions. This center requires immediate district intervention—deploy on-call medical staff and emergency medicine supply before patient trust erodes further."
  },
  {
    centerId: "chc-kalghatgi",
    centerName: "CHC Kalghatgi",
    avgRating: 4.5,
    reviewCount: 2,
    summary: "Patients report a strong overall experience, highlighting same-day diagnostics, clear communication in local language, and attentive clinical staff. Minor wait-time concerns exist but do not overshadow the center's role as a reliable referral hub for the taluk."
  },
  {
    centerId: "phc-mugad",
    centerName: "PHC Mugad",
    avgRating: 4.5,
    reviewCount: 2,
    summary: "This low-footfall PHC receives consistently positive feedback for short wait times, medicine availability, and proactive ASHA support for scheme enrollment. It serves as a model for how smaller centers can deliver efficient primary care when adequately staffed."
  },
  {
    centerId: "chc-kundgol",
    centerName: "CHC Kundgol",
    avgRating: 3.3,
    reviewCount: 3,
    summary: "Reviews are mixed: citizens value diagnostic capabilities and staff effort under pressure, but overcrowding, near-full bed occupancy, and partial pharmacy stock-outs are common themes. Adding OPD capacity and stabilizing antibiotic supply would address the most frequent grievances."
  }
];
