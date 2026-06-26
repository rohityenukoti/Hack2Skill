import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs, 
  query 
} from 'firebase/firestore';
import { MOCK_CENTERS, MOCK_INVENTORY } from '../utils/mockData';

// Config local storage key
const CONFIG_KEY = 'smart_health_firebase_config';

export function getSavedFirebaseConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  // Try environment variables as fallback
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  }
  return null;
}

export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(CONFIG_KEY);
  } else {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
  window.location.reload();
}

// Check if Firebase is active
const config = getSavedFirebaseConfig();
let db = null;
let useRealFirebase = false;

if (config && config.apiKey) {
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    db = getFirestore(app);
    useRealFirebase = true;
    console.log("Firebase initialized successfully in LIVE mode.");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
}

// --- LOCAL STORAGE FALLBACK IMPLEMENTATION ---
const LOCAL_CENTERS_KEY = 'smart_health_centers';
const LOCAL_INVENTORY_KEY = 'smart_health_inventory';

// Initialize Local DB if empty
if (!localStorage.getItem(LOCAL_CENTERS_KEY)) {
  localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(MOCK_CENTERS));
}
if (!localStorage.getItem(LOCAL_INVENTORY_KEY)) {
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(MOCK_INVENTORY));
}

// Local listeners storage
const localListeners = new Set();

function triggerLocalUpdate() {
  localListeners.forEach(listener => listener());
}

// --- PUBLIC DATABASE API (REAL-TIME) ---

export function isFirebaseLive() {
  return useRealFirebase;
}

// Seeder: Push mock data to Firestore database if it is empty
export async function seedFirestoreIfEmpty() {
  if (!useRealFirebase || !db) return;
  try {
    const centersRef = collection(db, "centers");
    const snapshot = await getDocs(centersRef);
    if (snapshot.empty) {
      console.log("Seeding Firestore with initial mock data...");
      for (const center of MOCK_CENTERS) {
        await setDoc(doc(db, "centers", center.id), center);
        
        // Seed inventory subcollection
        const inventoryItems = MOCK_INVENTORY[center.id] || [];
        for (const item of inventoryItems) {
          const cleanItemName = item.name.replace(/[^a-zA-Z0-9]/g, '_');
          await setDoc(doc(db, `centers/${center.id}/inventory`, cleanItemName), item);
        }
      }
      console.log("Seeding completed successfully.");
    }
  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
}

// Subscribe to all health centers
export function subscribeToCenters(onUpdate) {
  if (useRealFirebase && db) {
    const centersQuery = query(collection(db, "centers"));
    return onSnapshot(centersQuery, (snapshot) => {
      const centers = [];
      snapshot.forEach((doc) => {
        centers.push({ id: doc.id, ...doc.data() });
      });
      onUpdate(centers);
    }, (error) => {
      console.error("Firestore centers subscription error, falling back to local:", error);
      // Fallback
      subscribeToCentersLocal(onUpdate);
    });
  } else {
    return subscribeToCentersLocal(onUpdate);
  }
}

function subscribeToCentersLocal(onUpdate) {
  const fetchLocal = () => {
    const data = JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]');
    onUpdate(data);
  };
  
  fetchLocal();
  localListeners.add(fetchLocal);
  return () => {
    localListeners.delete(fetchLocal);
  };
}

// Subscribe to inventory for a single center
export function subscribeToInventory(centerId, onUpdate) {
  if (useRealFirebase && db) {
    const invColRef = collection(db, `centers/${centerId}/inventory`);
    return onSnapshot(invColRef, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push(doc.data());
      });
      onUpdate(items);
    }, (error) => {
      console.error(`Firestore inventory sub error for ${centerId}:`, error);
      subscribeToInventoryLocal(centerId, onUpdate);
    });
  } else {
    return subscribeToInventoryLocal(centerId, onUpdate);
  }
}

function subscribeToInventoryLocal(centerId, onUpdate) {
  const fetchLocal = () => {
    const allInv = JSON.parse(localStorage.getItem(LOCAL_INVENTORY_KEY) || '{}');
    const centerInv = allInv[centerId] || [];
    onUpdate(centerInv);
  };
  
  fetchLocal();
  localListeners.add(fetchLocal);
  return () => {
    localListeners.delete(fetchLocal);
  };
}

// Update general center details
export async function updateCenterDetails(centerId, updates) {
  // Add timestamp
  updates.lastUpdated = new Date().toISOString();

  // Dynamic status evaluation based on thresholds
  // We can calculate status from beds, doctors, and stock when full update occurs
  if (updates.beds && updates.doctors) {
    const isOvercrowded = updates.beds.occupied / updates.beds.total >= 0.9;
    const hasNoDoctors = updates.doctors.present === 0;
    if (hasNoDoctors || (isOvercrowded && hasNoDoctors)) {
      updates.status = "critical";
    } else if (updates.beds.occupied / updates.beds.total >= 0.8 || updates.doctors.present === 1) {
      updates.status = "warning";
    } else {
      updates.status = "normal";
    }
  }

  if (useRealFirebase && db) {
    try {
      const centerRef = doc(db, "centers", centerId);
      await updateDoc(centerRef, updates);
      return true;
    } catch (e) {
      console.error("Firestore updateCenterDetails failed, updating locally:", e);
    }
  }

  // Local update
  const centers = JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]');
  const index = centers.findIndex(c => c.id === centerId);
  if (index !== -1) {
    centers[index] = { ...centers[index], ...updates };
    localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(centers));
    triggerLocalUpdate();
    return true;
  }
  return false;
}

// Update inventory item stock/usage
export async function updateInventoryItem(centerId, itemName, updates) {
  if (useRealFirebase && db) {
    try {
      const cleanItemName = itemName.replace(/[^a-zA-Z0-9]/g, '_');
      const itemRef = doc(db, `centers/${centerId}/inventory`, cleanItemName);
      await updateDoc(itemRef, updates);
      
      // Re-evaluate center status based on inventory stock-outs
      await evaluateCenterInventoryStatus(centerId);
      return true;
    } catch (e) {
      console.error("Firestore updateInventoryItem failed:", e);
    }
  }

  // Local update
  const allInv = JSON.parse(localStorage.getItem(LOCAL_INVENTORY_KEY) || '{}');
  const centerInv = allInv[centerId] || [];
  const index = centerInv.findIndex(i => i.name === itemName);
  if (index !== -1) {
    centerInv[index] = { ...centerInv[index], ...updates };
    allInv[centerId] = centerInv;
    localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(allInv));
    
    // Evaluate status locally
    evaluateCenterInventoryStatusLocal(centerId, centerInv);
    triggerLocalUpdate();
    return true;
  }
  return false;
}

// Helper to evaluate if inventory stock-outs trigger center warning/critical status
async function evaluateCenterInventoryStatus(centerId) {
  if (!useRealFirebase || !db) return;
  try {
    const invColRef = collection(db, `centers/${centerId}/inventory`);
    const snapshot = await getDocs(invColRef);
    const items = [];
    snapshot.forEach(doc => items.push(doc.data()));
    
    let criticalCount = 0;
    let warningCount = 0;
    
    items.forEach(item => {
      if (item.stock === 0) {
        criticalCount++;
      } else if (item.stock < item.minRequired) {
        warningCount++;
      }
    });

    const centerRef = doc(db, "centers", centerId);
    let status = "normal";
    if (criticalCount > 0) {
      status = "critical";
    } else if (warningCount > 1) {
      status = "warning";
    }
    
    await updateDoc(centerRef, { status, lastUpdated: new Date().toISOString() });
  } catch (e) {
    console.error("evaluateCenterInventoryStatus failed:", e);
  }
}

function evaluateCenterInventoryStatusLocal(centerId, items) {
  let criticalCount = 0;
  let warningCount = 0;
  
  items.forEach(item => {
    if (item.stock === 0) {
      criticalCount++;
    } else if (item.stock < item.minRequired) {
      warningCount++;
    }
  });

  const centers = JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]');
  const index = centers.findIndex(c => c.id === centerId);
  if (index !== -1) {
    let status = "normal";
    
    // Check doctor/beds as well
    const center = centers[index];
    const isOvercrowded = center.beds.occupied / center.beds.total >= 0.9;
    const hasNoDoctors = center.doctors.present === 0;

    if (criticalCount > 0 || hasNoDoctors) {
      status = "critical";
    } else if (warningCount > 1 || isOvercrowded || center.doctors.present === 1) {
      status = "warning";
    }
    
    centers[index].status = status;
    centers[index].lastUpdated = new Date().toISOString();
    localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(centers));
  }
}

// Reset data
export function resetDatabase() {
  localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(MOCK_CENTERS));
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(MOCK_INVENTORY));
  triggerLocalUpdate();
}

// --- FEEDBACK SYSTEM ---
const LOCAL_FEEDBACK_KEY = 'smart_health_feedback';

// Save feedback for a center
export async function saveFeedback(centerId, feedbackObj) {
  // TODO: If useRealFirebase, save to Firestore subcollection
  
  const allFeedback = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '{}');
  if (!allFeedback[centerId]) {
    allFeedback[centerId] = [];
  }
  allFeedback[centerId].push(feedbackObj);
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(allFeedback));
  triggerLocalUpdate();
  return true;
}

// Get feedback for a center
export function getFeedbackForCenter(centerId) {
  const allFeedback = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '{}');
  return allFeedback[centerId] || [];
}

