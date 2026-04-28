// ── data.js — 25 Crises + 12 Volunteers ──────────────────────────────────────
// Ahmedabad zones: Maninagar, Satellite, Vatva, Naroda, Nikol, Navrangpura, Paldi, Bopal

const crisisPoints = [
  // ── CRITICAL (8) ──────────────────────────────────────────────────────────
  {
    id: "C001", title: "Food Shortage", type: "food", severity: "critical",
    lat: 22.9975, lng: 72.6101, zone: "Maninagar",
    description: "150 families without food supply for 3 days. Distribution network collapsed.",
    peopleAffected: 150, skillsNeeded: ["food distribution", "logistics"], volunteersAssigned: []
  },
  {
    id: "C002", title: "Flood Displacement", type: "flood", severity: "critical",
    lat: 22.9890, lng: 72.6580, zone: "Vatva",
    description: "200 residents displaced by flash flooding. Temporary shelter needed urgently.",
    peopleAffected: 200, skillsNeeded: ["rescue", "shelter management"], volunteersAssigned: []
  },
  {
    id: "C003", title: "Medical Emergency Camp", type: "medical", severity: "critical",
    lat: 23.0469, lng: 72.5614, zone: "Navrangpura",
    description: "Field clinic overwhelmed. 80 patients with no medical staff on site.",
    peopleAffected: 80, skillsNeeded: ["medical", "first-aid"], volunteersAssigned: []
  },
  {
    id: "C004", title: "Fire Evacuation", type: "fire", severity: "critical",
    lat: 23.0350, lng: 72.6800, zone: "Naroda",
    description: "Industrial fire spreading. 300 residents need immediate evacuation.",
    peopleAffected: 300, skillsNeeded: ["rescue", "first-aid"], volunteersAssigned: []
  },
  {
    id: "C005", title: "Drinking Water Contamination", type: "medical", severity: "critical",
    lat: 23.0280, lng: 72.6650, zone: "Nikol",
    description: "Municipal water supply contaminated. 500 households at risk of disease.",
    peopleAffected: 500, skillsNeeded: ["logistics", "medical"], volunteersAssigned: []
  },
  {
    id: "C006", title: "Collapsed Building", type: "shelter", severity: "critical",
    lat: 23.0150, lng: 72.5050, zone: "Satellite",
    description: "Partial building collapse. 12 people trapped, structural assessment needed.",
    peopleAffected: 12, skillsNeeded: ["rescue", "construction"], volunteersAssigned: []
  },
  {
    id: "C007", title: "Child Malnutrition Crisis", type: "food", severity: "critical",
    lat: 23.0600, lng: 72.5200, zone: "Bopal",
    description: "40 children under 5 showing severe malnutrition signs. Immediate nutrition support needed.",
    peopleAffected: 40, skillsNeeded: ["medical", "food distribution"], volunteersAssigned: []
  },
  {
    id: "C008", title: "Elderly Isolation Emergency", type: "medical", severity: "critical",
    lat: 22.9800, lng: 72.5800, zone: "Paldi",
    description: "60 elderly residents cut off from care services. Medical check-ups overdue by 2 weeks.",
    peopleAffected: 60, skillsNeeded: ["medical", "counseling"], volunteersAssigned: []
  },

  // ── MODERATE (10) ─────────────────────────────────────────────────────────
  {
    id: "C009", title: "Temporary Shelter Shortage", type: "shelter", severity: "moderate",
    lat: 22.9950, lng: 72.6200, zone: "Vatva",
    description: "90 families in makeshift camps. Need proper temporary housing setup.",
    peopleAffected: 90, skillsNeeded: ["shelter management", "logistics"], volunteersAssigned: []
  },
  {
    id: "C010", title: "Food Distribution Breakdown", type: "food", severity: "moderate",
    lat: 23.0400, lng: 72.6900, zone: "Naroda",
    description: "NGO food distribution point unmanned. 200 families missing daily rations.",
    peopleAffected: 200, skillsNeeded: ["food distribution"], volunteersAssigned: []
  },
  {
    id: "C011", title: "Mental Health Crisis", type: "medical", severity: "moderate",
    lat: 23.0500, lng: 72.5700, zone: "Navrangpura",
    description: "Post-flood trauma affecting 30 families. Counseling services urgently needed.",
    peopleAffected: 30, skillsNeeded: ["counseling"], volunteersAssigned: []
  },
  {
    id: "C012", title: "Road Blockage Relief", type: "flood", severity: "moderate",
    lat: 22.9700, lng: 72.5600, zone: "Paldi",
    description: "Debris blocking main relief route. Logistics coordination needed.",
    peopleAffected: 20, skillsNeeded: ["logistics", "rescue"], volunteersAssigned: []
  },
  {
    id: "C013", title: "Damaged Infrastructure", type: "shelter", severity: "moderate",
    lat: 23.0100, lng: 72.5100, zone: "Satellite",
    description: "Community center roof damaged. 150 people using it as shelter at risk.",
    peopleAffected: 150, skillsNeeded: ["construction"], volunteersAssigned: []
  },
  {
    id: "C014", title: "Medicine Supply Gap", type: "medical", severity: "moderate",
    lat: 23.0250, lng: 72.6700, zone: "Nikol",
    description: "Clinic running out of essential medicines. Logistics chain disrupted.",
    peopleAffected: 120, skillsNeeded: ["logistics", "medical"], volunteersAssigned: []
  },
  {
    id: "C015", title: "Flood Cleanup Operation", type: "flood", severity: "moderate",
    lat: 22.9920, lng: 72.6450, zone: "Vatva",
    description: "Floodwater receding but debris hazardous. Cleanup crew needed.",
    peopleAffected: 75, skillsNeeded: ["rescue", "logistics"], volunteersAssigned: []
  },
  {
    id: "C016", title: "School Damage Assessment", type: "shelter", severity: "moderate",
    lat: 23.0650, lng: 72.5300, zone: "Bopal",
    description: "3 schools structurally compromised. 800 children displaced from education.",
    peopleAffected: 800, skillsNeeded: ["construction"], volunteersAssigned: []
  },
  {
    id: "C017", title: "Livestock Disease Outbreak", type: "food", severity: "moderate",
    lat: 23.0450, lng: 72.6850, zone: "Naroda",
    description: "Livestock disease threatening food security for 50 farming families.",
    peopleAffected: 50, skillsNeeded: ["food distribution", "logistics"], volunteersAssigned: []
  },
  {
    id: "C018", title: "Sanitation Breakdown", type: "medical", severity: "moderate",
    lat: 23.0050, lng: 72.5900, zone: "Maninagar",
    description: "Sewage overflow in relief camp. Disease risk rising for 180 residents.",
    peopleAffected: 180, skillsNeeded: ["logistics", "medical"], volunteersAssigned: []
  },

  // ── LOW (7) ───────────────────────────────────────────────────────────────
  {
    id: "C019", title: "Clothing Distribution", type: "shelter", severity: "low",
    lat: 22.9850, lng: 72.5750, zone: "Paldi",
    description: "Displaced families need winter clothing. Warehouse has stock, needs volunteers.",
    peopleAffected: 60, skillsNeeded: ["food distribution", "logistics"], volunteersAssigned: []
  },
  {
    id: "C020", title: "Community Kitchen Setup", type: "food", severity: "low",
    lat: 23.0200, lng: 72.5000, zone: "Satellite",
    description: "Community kitchen needs setup for 100 daily meals. Equipment available.",
    peopleAffected: 100, skillsNeeded: ["food distribution"], volunteersAssigned: []
  },
  {
    id: "C021", title: "Children Psychosocial Support", type: "medical", severity: "low",
    lat: 23.0550, lng: 72.5150, zone: "Bopal",
    description: "20 children showing anxiety symptoms post-disaster. Play therapy sessions needed.",
    peopleAffected: 20, skillsNeeded: ["counseling"], volunteersAssigned: []
  },
  {
    id: "C022", title: "Document Recovery Aid", type: "shelter", severity: "low",
    lat: 23.0380, lng: 72.5620, zone: "Navrangpura",
    description: "Families lost ID documents in flood. Need help navigating government processes.",
    peopleAffected: 35, skillsNeeded: ["logistics"], volunteersAssigned: []
  },
  {
    id: "C023", title: "Water Point Maintenance", type: "flood", severity: "low",
    lat: 23.0300, lng: 72.6600, zone: "Nikol",
    description: "2 water distribution points need minor repairs. Functional but inefficient.",
    peopleAffected: 45, skillsNeeded: ["construction", "logistics"], volunteersAssigned: []
  },
  {
    id: "C024", title: "Elderly Welfare Check", type: "medical", severity: "low",
    lat: 23.0480, lng: 72.6820, zone: "Naroda",
    description: "25 elderly residents need routine welfare checks and medication reminders.",
    peopleAffected: 25, skillsNeeded: ["medical", "counseling"], volunteersAssigned: []
  },
  {
    id: "C025", title: "Volunteer Coordination Hub", type: "shelter", severity: "low",
    lat: 22.9780, lng: 72.6100, zone: "Vatva",
    description: "Coordination hub needs logistics support to manage incoming volunteer groups.",
    peopleAffected: 10, skillsNeeded: ["logistics"], volunteersAssigned: []
  }
];

const volunteers = [
  // ── AVAILABLE (6) ─────────────────────────────────────────────────────────
  {
    id: "V001", name: "Ravi Mehta", status: "available",
    skills: ["medical", "first-aid"],
    lat: 23.0150, lng: 72.5080, zone: "Satellite", assignedCrisis: null
  },
  {
    id: "V002", name: "Priya Sharma", status: "available",
    skills: ["food distribution", "logistics"],
    lat: 22.9960, lng: 72.6120, zone: "Maninagar", assignedCrisis: null
  },
  {
    id: "V003", name: "Arjun Patel", status: "available",
    skills: ["rescue", "first-aid"],
    lat: 22.9900, lng: 72.6560, zone: "Vatva", assignedCrisis: null
  },
  {
    id: "V004", name: "Sunita Desai", status: "available",
    skills: ["counseling", "medical"],
    lat: 22.9720, lng: 72.5620, zone: "Paldi", assignedCrisis: null
  },
  {
    id: "V005", name: "Kiran Joshi", status: "available",
    skills: ["logistics", "shelter management"],
    lat: 23.0420, lng: 72.6870, zone: "Naroda", assignedCrisis: null
  },
  {
    id: "V006", name: "Meera Nair", status: "available",
    skills: ["rescue", "logistics"],
    lat: 23.0620, lng: 72.5180, zone: "Bopal", assignedCrisis: null
  },

  // ── ENGAGED (4) ───────────────────────────────────────────────────────────
  {
    id: "V007", name: "Deepak Rao", status: "engaged",
    skills: ["medical", "first-aid"],
    lat: 23.0460, lng: 72.5600, zone: "Navrangpura", assignedCrisis: "C003"
  },
  {
    id: "V008", name: "Anita Verma", status: "engaged",
    skills: ["food distribution", "logistics"],
    lat: 23.0380, lng: 72.6810, zone: "Naroda", assignedCrisis: "C010"
  },
  {
    id: "V009", name: "Suresh Kumar", status: "engaged",
    skills: ["rescue", "shelter management"],
    lat: 22.9880, lng: 72.6570, zone: "Vatva", assignedCrisis: "C002"
  },
  {
    id: "V010", name: "Lakshmi Iyer", status: "engaged",
    skills: ["counseling"],
    lat: 23.0270, lng: 72.6660, zone: "Nikol", assignedCrisis: "C011"
  },

  // ── OFFLINE (2) ───────────────────────────────────────────────────────────
  {
    id: "V011", name: "Rahul Gupta", status: "offline",
    skills: ["construction", "logistics"],
    lat: 23.0100, lng: 72.5120, zone: "Satellite", assignedCrisis: null
  },
  {
    id: "V012", name: "Fatima Sheikh", status: "offline",
    skills: ["medical", "counseling"],
    lat: 23.0490, lng: 72.5650, zone: "Navrangpura", assignedCrisis: null
  }
];
