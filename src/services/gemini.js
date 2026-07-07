import {
  callAnalyzeDistrict,
  callParseVoiceReport,
  isCloudFunctionsAvailable,
} from './api';
import { MOCK_FEEDBACK_SUMMARIES } from '../utils/mockData';

function getSimulatedInsights(centers, inventories) {
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
        interventionBrief: `${center.name} requires immediate district intervention.`,
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

export function isAiBackendLive() {
  return isCloudFunctionsAvailable();
}

export async function generateForecastingAndRedistribution(centers, inventories) {
  if (isCloudFunctionsAvailable()) {
    try {
      const result = await callAnalyzeDistrict(centers, inventories);
      if (result) return result;
    } catch (error) {
      console.error('Cloud Function analyzeDistrict failed, using local simulation:', error);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve(getSimulatedInsights(centers, inventories)), 800);
  });
}

export async function parseVoiceInput(transcript, centerName) {
  if (isCloudFunctionsAvailable()) {
    try {
      const result = await callParseVoiceReport(transcript, centerName);
      if (result) return result;
    } catch (error) {
      console.error('Cloud Function parseVoiceReport failed, using local fallback:', error);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve(parseVoiceFallback(transcript, centerName)), 600);
  });
}

function getSimulatedFeedbackSummaries(centers, feedbackByCenter) {
  return MOCK_FEEDBACK_SUMMARIES
    .filter((item) => centers.some((c) => c.id === item.centerId))
    .map((item) => {
      const liveItems = feedbackByCenter[item.centerId] || [];
      if (liveItems.length === 0) return item;
      const avgRating = Math.round(
        (liveItems.reduce((sum, fb) => sum + (fb.rating || 0), 0) / liveItems.length) * 10
      ) / 10;
      return {
        ...item,
        avgRating,
        reviewCount: liveItems.length,
      };
    });
}

export async function summarizeCitizenFeedback(centers, feedbackByCenter) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      summaries: getSimulatedFeedbackSummaries(centers, feedbackByCenter),
      isMock: true,
    }), 900);
  });
}

export { getSimulatedInsights };
