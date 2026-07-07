import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  query,
  addDoc,
  orderBy,
} from 'firebase/firestore';
import { MOCK_CENTERS, MOCK_INVENTORY } from '../utils/mockData';
import { getDb, isFirebaseLive } from './firebaseApp';

export { isFirebaseLive, getSavedFirebaseConfig, saveFirebaseConfig } from './firebaseApp';

const db = getDb();
const useRealFirebase = isFirebaseLive();

const LOCAL_CENTERS_KEY = 'smart_health_centers';
const LOCAL_INVENTORY_KEY = 'smart_health_inventory';
const LOCAL_FEEDBACK_KEY = 'smart_health_feedback';

if (!localStorage.getItem(LOCAL_CENTERS_KEY)) {
  localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(MOCK_CENTERS));
}
if (!localStorage.getItem(LOCAL_INVENTORY_KEY)) {
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(MOCK_INVENTORY));
}

const localListeners = new Set();

function triggerLocalUpdate() {
  localListeners.forEach((listener) => listener());
}

function withAudit(updates, source = 'portal') {
  return {
    ...updates,
    lastUpdated: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source,
  };
}

export async function seedFirestoreIfEmpty() {
  if (!useRealFirebase || !db) return;
  try {
    const centersRef = collection(db, 'centers');
    const snapshot = await getDocs(centersRef);
    if (snapshot.empty) {
      for (const center of MOCK_CENTERS) {
        await setDoc(doc(db, 'centers', center.id), center);
        const inventoryItems = MOCK_INVENTORY[center.id] || [];
        for (const item of inventoryItems) {
          const cleanItemName = item.name.replace(/[^a-zA-Z0-9]/g, '_');
          await setDoc(doc(db, `centers/${center.id}/inventory`, cleanItemName), item);
        }
      }
    }
  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}

export function subscribeToCenters(onUpdate) {
  if (useRealFirebase && db) {
    const centersQuery = query(collection(db, 'centers'));
    return onSnapshot(
      centersQuery,
      (snapshot) => {
        const centers = [];
        snapshot.forEach((d) => centers.push({ id: d.id, ...d.data() }));
        onUpdate(centers);
      },
      () => subscribeToCentersLocal(onUpdate)
    );
  }
  return subscribeToCentersLocal(onUpdate);
}

function subscribeToCentersLocal(onUpdate) {
  const fetchLocal = () => {
    onUpdate(JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]'));
  };
  fetchLocal();
  localListeners.add(fetchLocal);
  return () => localListeners.delete(fetchLocal);
}

export function subscribeToInventory(centerId, onUpdate) {
  if (useRealFirebase && db) {
    const invColRef = collection(db, `centers/${centerId}/inventory`);
    return onSnapshot(
      invColRef,
      (snapshot) => {
        const items = [];
        snapshot.forEach((d) => items.push(d.data()));
        onUpdate(items);
      },
      () => subscribeToInventoryLocal(centerId, onUpdate)
    );
  }
  return subscribeToInventoryLocal(centerId, onUpdate);
}

function subscribeToInventoryLocal(centerId, onUpdate) {
  const fetchLocal = () => {
    const allInv = JSON.parse(localStorage.getItem(LOCAL_INVENTORY_KEY) || '{}');
    onUpdate(allInv[centerId] || []);
  };
  fetchLocal();
  localListeners.add(fetchLocal);
  return () => localListeners.delete(fetchLocal);
}

export async function updateCenterDetails(centerId, updates, source = 'portal') {
  const payload = withAudit(updates, source);

  if (payload.beds && payload.doctors) {
    const isOvercrowded = payload.beds.occupied / payload.beds.total >= 0.9;
    const hasNoDoctors = payload.doctors.present === 0;
    if (hasNoDoctors || (isOvercrowded && hasNoDoctors)) {
      payload.status = 'critical';
    } else if (payload.beds.occupied / payload.beds.total >= 0.8 || payload.doctors.present === 1) {
      payload.status = 'warning';
    } else {
      payload.status = 'normal';
    }
  }

  if (useRealFirebase && db) {
    try {
      await updateDoc(doc(db, 'centers', centerId), payload);
      return true;
    } catch (e) {
      console.error('Firestore updateCenterDetails failed:', e);
    }
  }

  const centers = JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]');
  const index = centers.findIndex((c) => c.id === centerId);
  if (index !== -1) {
    centers[index] = { ...centers[index], ...payload };
    localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(centers));
    triggerLocalUpdate();
    return true;
  }
  return false;
}

export async function updateInventoryItem(centerId, itemName, updates, source = 'portal') {
  const payload = { ...updates, updatedAt: new Date().toISOString(), source };

  if (useRealFirebase && db) {
    try {
      const cleanItemName = itemName.replace(/[^a-zA-Z0-9]/g, '_');
      await updateDoc(doc(db, `centers/${centerId}/inventory`, cleanItemName), payload);
      await evaluateCenterInventoryStatus(centerId);
      return true;
    } catch (e) {
      console.error('Firestore updateInventoryItem failed:', e);
    }
  }

  const allInv = JSON.parse(localStorage.getItem(LOCAL_INVENTORY_KEY) || '{}');
  const centerInv = allInv[centerId] || [];
  const index = centerInv.findIndex((i) => i.name === itemName);
  if (index !== -1) {
    centerInv[index] = { ...centerInv[index], ...payload };
    allInv[centerId] = centerInv;
    localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(allInv));
    evaluateCenterInventoryStatusLocal(centerId, centerInv);
    triggerLocalUpdate();
    return true;
  }
  return false;
}

async function evaluateCenterInventoryStatus(centerId) {
  if (!useRealFirebase || !db) return;
  try {
    const snapshot = await getDocs(collection(db, `centers/${centerId}/inventory`));
    const items = [];
    snapshot.forEach((d) => items.push(d.data()));
    let criticalCount = 0;
    let warningCount = 0;
    items.forEach((item) => {
      if (item.stock === 0) criticalCount += 1;
      else if (item.stock < item.minRequired) warningCount += 1;
    });
    let status = 'normal';
    if (criticalCount > 0) status = 'critical';
    else if (warningCount > 1) status = 'warning';
    await updateDoc(doc(db, 'centers', centerId), {
      status,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    console.error('evaluateCenterInventoryStatus failed:', e);
  }
}

function evaluateCenterInventoryStatusLocal(centerId, items) {
  let criticalCount = 0;
  let warningCount = 0;
  items.forEach((item) => {
    if (item.stock === 0) criticalCount += 1;
    else if (item.stock < item.minRequired) warningCount += 1;
  });
  const centers = JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]');
  const index = centers.findIndex((c) => c.id === centerId);
  if (index !== -1) {
    const center = centers[index];
    const hasNoDoctors = center.doctors.present === 0;
    let status = 'normal';
    if (criticalCount > 0 || hasNoDoctors) status = 'critical';
    else if (warningCount > 1 || center.beds.occupied / center.beds.total >= 0.8) status = 'warning';
    centers[index].status = status;
    centers[index].lastUpdated = new Date().toISOString();
    localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(centers));
  }
}

export function resetDatabase() {
  localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(MOCK_CENTERS));
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(MOCK_INVENTORY));
  triggerLocalUpdate();
}

export async function saveFeedback(centerId, feedbackObj) {
  const entry = {
    ...feedbackObj,
    timestamp: feedbackObj.timestamp || new Date().toISOString(),
  };

  if (useRealFirebase && db) {
    try {
      await addDoc(collection(db, `centers/${centerId}/feedback`), entry);
      return true;
    } catch (e) {
      console.error('Firestore saveFeedback failed:', e);
    }
  }

  const allFeedback = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '{}');
  if (!allFeedback[centerId]) allFeedback[centerId] = [];
  allFeedback[centerId].push(entry);
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(allFeedback));
  triggerLocalUpdate();
  return true;
}

export function getFeedbackForCenter(centerId) {
  const allFeedback = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '{}');
  return allFeedback[centerId] || [];
}

export function subscribeToFeedback(centerId, onUpdate) {
  if (useRealFirebase && db) {
    const q = query(
      collection(db, `centers/${centerId}/feedback`),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      onUpdate(items);
    }, () => onUpdate(getFeedbackForCenter(centerId)));
  }
  onUpdate(getFeedbackForCenter(centerId));
  const fetchLocal = () => onUpdate(getFeedbackForCenter(centerId));
  localListeners.add(fetchLocal);
  return () => localListeners.delete(fetchLocal);
}
