import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const DEMO_USERS = [
  {
    email: 'admin@dharwad.demo',
    password: 'Admin@123456',
    role: 'admin',
    districtId: 'DHARWAD-01',
    displayName: 'District Health Officer',
  },
  {
    email: 'phc-narendra@dharwad.demo',
    password: 'Staff@123456',
    role: 'healthcenter',
    centerId: 'phc-narendra',
    displayName: 'PHC Narendra Staff',
  },
  {
    email: 'phc-hebballi@dharwad.demo',
    password: 'Staff@123456',
    role: 'healthcenter',
    centerId: 'phc-hebballi',
    displayName: 'PHC Hebballi Staff',
  },
  {
    email: 'chc-kalghatgi@dharwad.demo',
    password: 'Staff@123456',
    role: 'healthcenter',
    centerId: 'chc-kalghatgi',
    displayName: 'CHC Kalghatgi Staff',
  },
];

export async function seedDemoUsersAndData(mockCenters, mockInventory, mockFeedback = {}) {
  const auth = getAuth();
  const db = getFirestore();
  const results = [];

  for (const user of DEMO_USERS) {
    let uid;
    try {
      const existing = await auth.getUserByEmail(user.email);
      uid = existing.uid;
      results.push({ email: user.email, status: 'exists', uid });
    } catch {
      const created = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      uid = created.uid;
      results.push({ email: user.email, status: 'created', uid });
    }

    await db.doc(`users/${uid}`).set(
      {
        role: user.role,
        email: user.email,
        districtId: user.districtId ?? null,
        centerId: user.centerId ?? null,
        displayName: user.displayName,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  for (const center of mockCenters) {
    await db.doc(`centers/${center.id}`).set(center, { merge: true });
    const inventoryItems = mockInventory[center.id] || [];
    for (const item of inventoryItems) {
      const cleanItemName = item.name.replace(/[^a-zA-Z0-9]/g, '_');
      await db.doc(`centers/${center.id}/inventory/${cleanItemName}`).set(item, { merge: true });
    }
    const feedbackItems = mockFeedback[center.id] || [];
    for (const fb of feedbackItems) {
      const docId = fb.id || `demo-${center.id}-${fb.timestamp}`;
      await db.doc(`centers/${center.id}/feedback/${docId}`).set(fb, { merge: true });
    }
  }

  const feedbackSeeded = Object.values(mockFeedback).reduce((sum, items) => sum + items.length, 0);
  return { users: results, centersSeeded: mockCenters.length, feedbackSeeded };
}

export { DEMO_USERS };
