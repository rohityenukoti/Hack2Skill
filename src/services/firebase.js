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
import { MOCK_CENTERS, MOCK_INVENTORY, MOCK_FEEDBACK } from '../utils/mockData';
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
if (!localStorage.getItem(LOCAL_FEEDBACK_KEY)) {
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(MOCK_FEEDBACK));
} else {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '{}');
    const hasAny = Object.values(parsed).some((items) => Array.isArray(items) && items.length > 0);
    if (!hasAny) {
      localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(MOCK_FEEDBACK));
    }
  } catch {
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(MOCK_FEEDBACK));
  }
}

const localListeners = new Set();

function triggerLocalUpdate() {
  localListeners.forEach((listener) => listener());
}

function mirrorCentersToLocal(centers) {
  localStorage.setItem(LOCAL_CENTERS_KEY, JSON.stringify(centers));
}

function mirrorInventoryToLocal(centerId, items) {
  const allInv = JSON.parse(localStorage.getItem(LOCAL_INVENTORY_KEY) || '{}');
  allInv[centerId] = items;
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(allInv));
}

function mirrorCenterPatchToLocal(centerId, patch) {
  const centers = JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]');
  const index = centers.findIndex((c) => c.id === centerId);
  if (index !== -1) {
    centers[index] = { ...centers[index], ...patch };
    mirrorCentersToLocal(centers);
  }
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
        const feedbackItems = MOCK_FEEDBACK[center.id] || [];
        for (const [idx, fb] of feedbackItems.entries()) {
          await setDoc(doc(db, `centers/${center.id}/feedback`, `demo-${idx}`), fb);
        }
      }
    }
  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}

export function subscribeToCenters(onUpdate, options = {}) {
  const { role, centerId } = options;

  if (useRealFirebase && db) {
    // Health center staff may only read their own center doc — a collection
    // query on /centers is rejected by Firestore security rules.
    if (role === 'healthcenter') {
      if (!centerId) {
        onUpdate([]);
        return () => {};
      }
      return onSnapshot(
        doc(db, 'centers', centerId),
        (snapshot) => {
          onUpdate(snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : []);
        },
        (error) => {
          console.error('subscribeToCenters failed:', error);
        }
      );
    }

    const centersQuery = query(collection(db, 'centers'));
    return onSnapshot(
      centersQuery,
      (snapshot) => {
        const centers = [];
        snapshot.forEach((d) => centers.push({ id: d.id, ...d.data() }));
        onUpdate(centers);
      },
      (error) => {
        console.error('subscribeToCenters failed:', error);
      }
    );
  }
  return subscribeToCentersLocal(onUpdate, options);
}

function subscribeToCentersLocal(onUpdate, options = {}) {
  const fetchLocal = () => {
    let centers = JSON.parse(localStorage.getItem(LOCAL_CENTERS_KEY) || '[]');
    if (options.role === 'healthcenter' && options.centerId) {
      centers = centers.filter((c) => c.id === options.centerId);
    }
    onUpdate(centers);
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
        mirrorInventoryToLocal(centerId, items);
      },
      (error) => {
        console.error(`subscribeToInventory(${centerId}) failed:`, error);
      }
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
      mirrorCenterPatchToLocal(centerId, payload);
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
      const allInv = JSON.parse(localStorage.getItem(LOCAL_INVENTORY_KEY) || '{}');
      const centerInv = allInv[centerId] || [];
      const invIndex = centerInv.findIndex((i) => i.name === itemName);
      if (invIndex !== -1) {
        centerInv[invIndex] = { ...centerInv[invIndex], ...payload };
        mirrorInventoryToLocal(centerId, centerInv);
      }
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
    const statusPatch = {
      status,
      lastUpdated: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'centers', centerId), statusPatch);
    mirrorCenterPatchToLocal(centerId, statusPatch);
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
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(MOCK_FEEDBACK));
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
      mirrorFeedbackToLocal(centerId, entry);
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

function mirrorFeedbackToLocal(centerId, entry) {
  const allFeedback = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '{}');
  if (!allFeedback[centerId]) allFeedback[centerId] = [];
  allFeedback[centerId].push(entry);
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(allFeedback));
}

function mirrorFeedbackListToLocal(centerId, items) {
  const allFeedback = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '{}');
  allFeedback[centerId] = items;
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(allFeedback));
}

export function subscribeToAllFeedback(centers, onUpdate) {
  const unsubscribes = centers.map((center) =>
    subscribeToFeedback(center.id, (items) => {
      onUpdate(center.id, items);
    })
  );
  return () => unsubscribes.forEach((unsub) => unsub());
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
      mirrorFeedbackListToLocal(centerId, items);
      onUpdate(items);
    }, () => onUpdate(getFeedbackForCenter(centerId)));
  }
  onUpdate(getFeedbackForCenter(centerId));
  const fetchLocal = () => onUpdate(getFeedbackForCenter(centerId));
  localListeners.add(fetchLocal);
  return () => localListeners.delete(fetchLocal);
}
