import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function extractJson(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in model response');
  return JSON.parse(jsonMatch[0]);
}

export function getSimulatedInsights(centers, inventories) {
  const alerts = [];
  const forecasting = [];
  const redistributions = [];
  const underperformingCenters = [];

  Object.keys(inventories).forEach((centerId) => {
    const center = centers.find((c) => c.id === centerId);
    if (!center) return;
    const inv = inventories[centerId] || [];

    inv.forEach((item) => {
      const daysLeft = item.stock / (item.dailyUsage || 1);
      forecasting.push({
        centerName: center.name,
        itemName: item.name,
        stock: item.stock,
        dailyUsage: item.dailyUsage,
        daysRemaining: Math.round(daysLeft * 10) / 10,
        forecastStatus: daysLeft <= 2 ? 'critical' : daysLeft <= 5 ? 'warning' : 'stable',
      });

      if (item.stock === 0) {
        alerts.push({
          type: 'critical',
          title: `Stockout Alert: ${item.name}`,
          message: `${center.name} is completely out of ${item.name}. Immediate replenishment required.`,
          centerId: center.id,
        });
      } else if (item.stock < item.minRequired) {
        alerts.push({
          type: 'warning',
          title: `Low Stock: ${item.name}`,
          message: `${center.name} has only ${item.stock} units of ${item.name} remaining.`,
          centerId: center.id,
        });
      }
    });

    if (center.doctors.present === 0) {
      alerts.push({
        type: 'critical',
        title: 'Staff Absence Alert',
        message: `No doctors are present at ${center.name} today.`,
        centerId: center.id,
      });
    }

    if (center.beds.occupied >= center.beds.total) {
      alerts.push({
        type: 'warning',
        title: 'Bed Capacity Reached',
        message: `${center.name} bed occupancy is at 100%.`,
        centerId: center.id,
      });
    }

    if (center.status === 'critical' || center.doctors.present === 0) {
      underperformingCenters.push({
        centerId: center.id,
        centerName: center.name,
        severity: 'high',
        interventionBrief: `${center.name} requires immediate district intervention: zero doctor attendance and/or critical resource shortages.`,
      });
    }
  });

  const itemShortages = [];
  const itemSurpluses = [];

  Object.keys(inventories).forEach((cId) => {
    (inventories[cId] || []).forEach((item) => {
      const surplus = item.stock - item.minRequired;
      if (surplus > 10) {
        itemSurpluses.push({ centerId: cId, itemName: item.name, surplusAmount: surplus });
      } else if (item.stock < item.minRequired / 2) {
        itemShortages.push({
          centerId: cId,
          itemName: item.name,
          shortageAmount: item.minRequired - item.stock,
        });
      }
    });
  });

  itemShortages.forEach((shortage) => {
    const matches = itemSurpluses.filter((s) => s.itemName === shortage.itemName);
    if (matches.length > 0) {
      const donor = matches[0];
      const donorCenter = centers.find((c) => c.id === donor.centerId);
      const recipientCenter = centers.find((c) => c.id === shortage.centerId);
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
            urgency: recipientCenter.status === 'critical' ? 'High' : 'Medium',
            distanceEstimate: '8.5 km',
            reason: `${recipientCenter.name} has severe stock shortage; ${donorCenter.name} has surplus.`,
          });
          donor.surplusAmount -= transferQty;
        }
      }
    }
  });

  return { alerts, forecasting, redistributions, underperformingCenters, isMock: true };
}

export async function analyzeDistrictData(centers, inventories, trendSummary = null) {
  const client = getGeminiClient();
  if (!client) {
    return getSimulatedInsights(centers, inventories);
  }

  const dataContext = {
    centers: centers.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      beds: c.beds,
      doctors: c.doctors,
      footfall: c.footfall,
      status: c.status,
    })),
    inventories,
    trendSummary,
  };

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `You are an expert AI healthcare supply chain manager for rural Indian PHCs and CHCs in Dharwad district.

Analyze this real-time district data:
${JSON.stringify(dataContext, null, 2)}

Return JSON with:
- alerts: array of { type: "critical"|"warning", title, message, centerId }
- forecasting: array of { centerName, itemName, stock, dailyUsage, daysRemaining, forecastStatus: "stable"|"warning"|"critical" }
- redistributions: array of { itemName, fromId, fromName, toId, toName, quantity, urgency: "High"|"Medium", distanceEstimate, reason }
- underperformingCenters: array of { centerId, centerName, severity: "high"|"medium", interventionBrief } — plain-language briefs for district administrators on centers needing intervention`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    parsed.isMock = false;
    return parsed;
  } catch (error) {
    console.error('Gemini analyzeDistrict error:', error);
    return getSimulatedInsights(centers, inventories);
  }
}

export async function parseVoiceTranscript(transcript, centerName) {
  const client = getGeminiClient();
  if (!client) {
    return parseVoiceFallback(transcript, centerName);
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `You are an AI intake assistant for rural health centers in India. A worker at "${centerName}" submitted this speech transcript (Hindi, Kannada, Telugu, Tamil, or Hinglish):

"${transcript}"

Extract database updates for medicine inventory, doctor attendance, or bed occupancy.

Return JSON: { success: boolean, operation: "update"|"staff"|"bed"|"unknown", itemName: string, quantity: number, confidence: 0-1, detectedText: string, translatedText: string }`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini parseVoice error:', error);
    return parseVoiceFallback(transcript, centerName);
  }
}

function parseVoiceFallback(transcript, centerName) {
  const text = transcript.toLowerCase();
  let itemName = '';
  let quantity = 0;
  let operation = 'update';

  if (text.includes('paracetamol') || text.includes('पैरासिटामोल')) itemName = 'Paracetamol (500mg)';
  else if (text.includes('insulin') || text.includes('इंसुलिन')) itemName = 'Insulin (10ml)';
  else if (text.includes('amoxicillin')) itemName = 'Amoxicillin (250mg)';
  else if (text.includes('ors')) itemName = 'ORS Packets';
  else if (text.includes('amlodipine')) itemName = 'Amlodipine (5mg)';

  const numMatch = text.match(/\d+/);
  if (numMatch) quantity = parseInt(numMatch[0], 10);

  if (text.includes('doctor') || text.includes('डॉक्टर') || text.includes('ವೈದ್ಯ')) operation = 'staff';
  else if (text.includes('bed') || text.includes('बिस्तर') || text.includes('ಹಾಸಿಗೆ')) operation = 'bed';

  return {
    success: true,
    operation,
    itemName,
    quantity,
    confidence: 0.88,
    detectedText: transcript,
    translatedText: `Voice intake for ${centerName}: "${transcript}" recognized.`,
  };
}

export function parseVoiceFallbackExport(transcript, centerName) {
  return parseVoiceFallback(transcript, centerName);
}
