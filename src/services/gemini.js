import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API storage key
const GEMINI_KEY = 'smart_health_gemini_key';

export function getSavedGeminiKey() {
  const saved = localStorage.getItem(GEMINI_KEY);
  if (saved) return saved;
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function saveGeminiKey(key) {
  if (!key) {
    localStorage.removeItem(GEMINI_KEY);
  } else {
    localStorage.setItem(GEMINI_KEY, key);
  }
}

// Initialise Gemini Client
function getGeminiClient() {
  const key = getSavedGeminiKey();
  if (!key) return null;
  try {
    return new GoogleGenerativeAI(key);
  } catch (e) {
    console.error("Failed to initialize Gemini AI client:", e);
    return null;
  }
}

// --- SIMULATION FALLBACK (Runs when no API key is present) ---

function getSimulatedInsights(centers, inventories) {
  // Let's generate extremely realistic insights based on the current data state!
  const alerts = [];
  const forecasting = [];
  const redistributions = [];

  // Look at center inventories for stockout warnings
  Object.keys(inventories).forEach(centerId => {
    const center = centers.find(c => c.id === centerId);
    if (!center) return;
    const inv = inventories[centerId] || [];

    inv.forEach(item => {
      const daysLeft = item.stock / (item.dailyUsage || 1);
      
      // Forecasting
      forecasting.push({
        centerName: center.name,
        itemName: item.name,
        stock: item.stock,
        dailyUsage: item.dailyUsage,
        daysRemaining: Math.round(daysLeft * 10) / 10,
        forecastStatus: daysLeft <= 2 ? "critical" : daysLeft <= 5 ? "warning" : "stable"
      });

      // Stock alerts
      if (item.stock === 0) {
        alerts.push({
          type: "critical",
          title: `Stockout Alert: ${item.name}`,
          message: `${center.name} is completely out of ${item.name}. Immediate replenishment required.`,
          centerId: center.id
        });
      } else if (item.stock < item.minRequired) {
        alerts.push({
          type: "warning",
          title: `Low Stock: ${item.name}`,
          message: `${center.name} has only ${item.stock} units of ${item.name} remaining (minimum threshold: ${item.minRequired}).`,
          centerId: center.id
        });
      }
    });

    // Check doctor attendance & occupancy alerts
    if (center.doctors.present === 0) {
      alerts.push({
        type: "critical",
        title: "Staff Absence Alert",
        message: `No doctors are present at ${center.name} today. Patient care is severely impacted.`,
        centerId: center.id
      });
    }

    if (center.beds.occupied >= center.beds.total) {
      alerts.push({
        type: "warning",
        title: "Bed Capacity Reached",
        message: `${center.name} bed occupancy is at 100% (${center.beds.occupied}/${center.beds.total}).`,
        centerId: center.id
      });
    }
  });

  // Calculate smart redistribution suggestions!
  // Find items in critical state in one center and check if other centers have a surplus
  const itemShortages = [];
  const itemSurpluses = [];

  Object.keys(inventories).forEach(cId => {
    const inv = inventories[cId] || [];
    inv.forEach(item => {
      const surplus = item.stock - item.minRequired;
      if (surplus > 10) {
        itemSurpluses.push({ centerId: cId, itemName: item.name, surplusAmount: surplus });
      } else if (item.stock < item.minRequired / 2) {
        itemShortages.push({ centerId: cId, itemName: item.name, shortageAmount: item.minRequired - item.stock });
      }
    });
  });

  itemShortages.forEach(shortage => {
    // Find a surplus center for this item
    const matches = itemSurpluses.filter(s => s.itemName === shortage.itemName);
    if (matches.length > 0) {
      // Pick the first one
      const donor = matches[0];
      const donorCenter = centers.find(c => c.id === donor.centerId);
      const recipientCenter = centers.find(c => c.id === shortage.centerId);

      if (donorCenter && recipientCenter) {
        const transferQty = Math.min(Math.floor(donor.surplusAmount / 2), shortage.shortageAmount);
        if (transferQty > 0) {
          redistributions.push({
            itemName: shortage.itemName,
            fromId: donorCenter.id,
            fromName: donorCenter.name,
            toId: recipientCenter.id,
            toName: recipientCenter.name,
            quantity: transferQty,
            urgency: recipientCenter.status === "critical" ? "High" : "Medium",
            distanceEstimate: "8.5 km",
            reason: `${recipientCenter.name} has severe stock shortage (${shortage.shortageAmount} units below threshold), whereas ${donorCenter.name} has an excess surplus.`
          });
          // Update surplus logic in simulation list to not over-allocate
          donor.surplusAmount -= transferQty;
        }
      }
    }
  });

  return { alerts, forecasting, redistributions, isMock: true };
}

// --- GEMINI API CALLS ---

export async function generateForecastingAndRedistribution(centers, inventories) {
  const client = getGeminiClient();
  
  if (!client) {
    // Fall back to simulation
    console.log("Using simulated AI analysis (No Gemini API key configured).");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getSimulatedInsights(centers, inventories));
      }, 1000);
    });
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prepare prompt
    const dataContext = {
      centers: centers.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        beds: c.beds,
        doctors: c.doctors,
        footfall: c.footfall,
        status: c.status
      })),
      inventories: inventories
    };

    const prompt = `
      You are an expert AI logistics and healthcare supply chain manager for rural Indian Primary Health Centers (PHCs) and Community Health Centers (CHCs).
      You are given the following real-time database state representing a district:
      
      \`\`\`json
      ${JSON.stringify(dataContext, null, 2)}
      \`\`\`
      
      Based on this data, analyze and generate:
      1. **Forecasting**: Predict resource remaining days for medicines (stock divided by daily usage). Predict if a stockout is imminent (within 3 days).
      2. **Alerts**: Highlight critical operational alerts (e.g. 0 stock of vital medicines, 0 doctors present, bed occupancy >= 100%).
      3. **Redistributions**: Create actionable resource redistribution suggestions. Suggest transferring medicines from a center with a healthy surplus (stock > minRequired) to a nearby center with a critical shortage (stock < minRequired/2). Make sure to recommend the donor center, recipient center, item, quantity, and explain the logical reasoning.

      You must return your output strictly in JSON format. Do not write markdown tags other than the JSON block itself. The JSON must match the following schema:
      {
        "alerts": [
          { "type": "critical"|"warning", "title": "Alert Title", "message": "Details about the alert", "centerId": "center-id-linked" }
        ],
        "forecasting": [
          { "centerName": "Center Name", "itemName": "Item Name", "stock": 10, "dailyUsage": 2, "daysRemaining": 5.0, "forecastStatus": "stable"|"warning"|"critical" }
        ],
        "redistributions": [
          {
            "itemName": "Medicine Name",
            "fromId": "donor-center-id",
            "fromName": "Donor Center Name",
            "toId": "recipient-center-id",
            "toName": "Recipient Center Name",
            "quantity": 30,
            "urgency": "High"|"Medium",
            "distanceEstimate": "estimated road distance, e.g. 10 km",
            "reason": "Clear explanation of why this redistribution is optimal"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON blocks out of the markdown response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      parsedData.isMock = false;
      return parsedData;
    }
    
    throw new Error("Could not parse JSON from Gemini response");
  } catch (error) {
    console.error("Gemini API error, falling back to simulation:", error);
    return getSimulatedInsights(centers, inventories);
  }
}

// Translate and structure voice updates
export async function parseVoiceInput(transcript, centerName) {
  const client = getGeminiClient();
  
  if (!client) {
    // Basic regex parser for mock demonstration
    console.log("Using regex voice parsing simulation.");
    return new Promise((resolve) => {
      setTimeout(() => {
        const text = transcript.toLowerCase();
        let itemName = "";
        let quantity = 0;
        let operation = "update"; // "update", "staff", "bed"
        
        // Simple stock checks
        if (text.includes("paracetamol") || text.includes("बुखार की दवा")) {
          itemName = "Paracetamol (500mg)";
        } else if (text.includes("insulin") || text.includes("इंसुलिन")) {
          itemName = "Insulin (10ml)";
        } else if (text.includes("amoxicillin") || text.includes("एंटीबायोटिक")) {
          itemName = "Amoxicillin (250mg)";
        } else if (text.includes("ors") || text.includes("ओआरएस")) {
          itemName = "ORS Packets";
        } else if (text.includes("amlodipine") || text.includes("बीपी की दवा")) {
          itemName = "Amlodipine (5mg)";
        }

        // Search for numbers
        const numMatch = text.match(/\d+/);
        if (numMatch) {
          quantity = parseInt(numMatch[0]);
        }

        if (text.includes("doctor") || text.includes("डॉक्टर") || text.includes("चिकित्सक")) {
          operation = "staff";
        } else if (text.includes("bed") || text.includes("बिस्तर") || text.includes("मरीज")) {
          operation = "bed";
        }

        resolve({
          success: true,
          operation,
          itemName,
          quantity,
          confidence: 0.88,
          detectedText: transcript,
          translatedText: `Voice intake for ${centerName}: "${transcript}" recognized.`
        });
      }, 800);
    });
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an AI intake assistant for rural health centers in India. You are given a speech-to-text transcript (which might be in Hindi, Kannada, Telugu, Tamil, or in English/Hinglish) from a local worker at "${centerName}".
      
      Transcript: "${transcript}"

      Analyze the transcript and translate it. Extract what database updates need to be made.
      The potential database updates are:
      1. Medicine inventory update (e.g. setting/adjusting stock levels of medicines like 'Paracetamol (500mg)', 'Amoxicillin (250mg)', 'Insulin (10ml)', 'ORS Packets', 'Amlodipine (5mg)').
      2. Doctor attendance update (changing present doctor counts).
      3. Bed occupancy updates (adjusting occupied beds counts).

      Return your response strictly in JSON format matching this schema:
      {
        "success": true|false,
        "operation": "update"|"staff"|"bed"|"unknown",
        "itemName": "Specific item name matching standard names or empty if not inventory",
        "quantity": number, // Extracted count (e.g. 5 doctors, 10 beds, 0 paracetamol, or adjusted stock)
        "confidence": 0.0 to 1.0,
        "detectedText": "original transcript",
        "translatedText": "English translation and descriptive action summary"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in voice parser response");
  } catch (e) {
    console.error("Gemini voice parse error:", e);
    return { success: false, operation: "unknown", itemName: "", quantity: 0, confidence: 0 };
  }
}
