import { BigQuery } from '@google-cloud/bigquery';
import { getFirestore } from 'firebase-admin/firestore';

const bigquery = new BigQuery();
const DATASET_ID = 'health_ops';

async function ensureDataset() {
  const [datasets] = await bigquery.getDatasets();
  const exists = datasets.some((d) => d.id === DATASET_ID);
  if (!exists) {
    await bigquery.createDataset(DATASET_ID, { location: 'asia-south1' });
  }
}

export async function syncFirestoreToBigQuery() {
  await ensureDataset();
  const db = getFirestore();
  const centersSnap = await db.collection('centers').get();

  const centersRows = [];
  const inventoryRows = [];
  const feedbackRows = [];
  const syncedAt = new Date().toISOString();

  for (const centerDoc of centersSnap.docs) {
    const center = centerDoc.data();
    centersRows.push({
      center_id: centerDoc.id,
      name: center.name,
      type: center.type,
      status: center.status,
      beds_total: center.beds?.total ?? 0,
      beds_occupied: center.beds?.occupied ?? 0,
      doctors_total: center.doctors?.total ?? 0,
      doctors_present: center.doctors?.present ?? 0,
      footfall_today: center.footfall?.today ?? 0,
      footfall_avg: center.footfall?.averageDaily ?? 0,
      synced_at: syncedAt,
    });

    const invSnap = await db.collection(`centers/${centerDoc.id}/inventory`).get();
    invSnap.forEach((itemDoc) => {
      const item = itemDoc.data();
      inventoryRows.push({
        center_id: centerDoc.id,
        item_name: item.name,
        category: item.category ?? '',
        stock: item.stock ?? 0,
        min_required: item.minRequired ?? 0,
        daily_usage: item.dailyUsage ?? 0,
        synced_at: syncedAt,
      });
    });

    const fbSnap = await db.collection(`centers/${centerDoc.id}/feedback`).get();
    fbSnap.forEach((fbDoc) => {
      const fb = fbDoc.data();
      feedbackRows.push({
        center_id: centerDoc.id,
        rating: fb.rating ?? 0,
        category: fb.category ?? '',
        comment: fb.comment ?? '',
        timestamp: fb.timestamp ?? syncedAt,
        synced_at: syncedAt,
      });
    });
  }

  const dataset = bigquery.dataset(DATASET_ID);

  if (centersRows.length > 0) {
    await dataset.table('centers_daily').insert(centersRows).catch(async (err) => {
      if (err.code === 404) {
        await dataset.createTable('centers_daily', {
          schema: [
            { name: 'center_id', type: 'STRING' },
            { name: 'name', type: 'STRING' },
            { name: 'type', type: 'STRING' },
            { name: 'status', type: 'STRING' },
            { name: 'beds_total', type: 'INTEGER' },
            { name: 'beds_occupied', type: 'INTEGER' },
            { name: 'doctors_total', type: 'INTEGER' },
            { name: 'doctors_present', type: 'INTEGER' },
            { name: 'footfall_today', type: 'INTEGER' },
            { name: 'footfall_avg', type: 'INTEGER' },
            { name: 'synced_at', type: 'TIMESTAMP' },
          ],
        });
        await dataset.table('centers_daily').insert(centersRows);
      } else {
        throw err;
      }
    });
  }

  if (inventoryRows.length > 0) {
    await dataset.table('inventory_daily').insert(inventoryRows).catch(async (err) => {
      if (err.code === 404) {
        await dataset.createTable('inventory_daily', {
          schema: [
            { name: 'center_id', type: 'STRING' },
            { name: 'item_name', type: 'STRING' },
            { name: 'category', type: 'STRING' },
            { name: 'stock', type: 'INTEGER' },
            { name: 'min_required', type: 'INTEGER' },
            { name: 'daily_usage', type: 'INTEGER' },
            { name: 'synced_at', type: 'TIMESTAMP' },
          ],
        });
        await dataset.table('inventory_daily').insert(inventoryRows);
      } else {
        throw err;
      }
    });
  }

  return {
    centersSynced: centersRows.length,
    inventorySynced: inventoryRows.length,
    feedbackSynced: feedbackRows.length,
    syncedAt,
  };
}

export async function getInventoryTrendSummary() {
  try {
    const query = `
      SELECT
        center_id,
        item_name,
        AVG(stock) AS avg_stock,
        AVG(daily_usage) AS avg_daily_usage,
        COUNT(*) AS snapshot_count
      FROM \`${process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT}.${DATASET_ID}.inventory_daily\`
      WHERE synced_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY center_id, item_name
      HAVING snapshot_count >= 1
      ORDER BY avg_stock ASC
      LIMIT 50
    `;
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch {
    return null;
  }
}
