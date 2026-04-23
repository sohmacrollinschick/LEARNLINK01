import { openDB } from "idb";

const DB_NAME = "LearnLinkOffline";
const DB_VERSION = 4;
const MEDIA_STORES = ["offline_videos", "offline_docs"];
const QUERY_CACHE_STORE = "query_cache";
const SYNC_QUEUE_STORE = "sync_queue";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const createMediaStore = (db, storeName) => {
  const store = db.createObjectStore(storeName, { keyPath: "localId", autoIncrement: true });
  store.createIndex("userId", "userId", { unique: false });
  store.createIndex("sourceId", "sourceId", { unique: false });
  store.createIndex("lessonId", "lessonId", { unique: false });
};

const ensureMediaStoreIndexes = (store) => {
  if (!store.indexNames.contains("userId")) store.createIndex("userId", "userId", { unique: false });
  if (!store.indexNames.contains("sourceId")) store.createIndex("sourceId", "sourceId", { unique: false });
  if (!store.indexNames.contains("lessonId")) store.createIndex("lessonId", "lessonId", { unique: false });
};

const ensureCacheStoreIndexes = (store) => {
  if (!store.indexNames.contains("userId")) store.createIndex("userId", "userId", { unique: false });
  if (!store.indexNames.contains("updatedAt")) store.createIndex("updatedAt", "updatedAt", { unique: false });
};

const ensureQueueStoreIndexes = (store) => {
  if (!store.indexNames.contains("userId")) store.createIndex("userId", "userId", { unique: false });
  if (!store.indexNames.contains("createdAt")) store.createIndex("createdAt", "createdAt", { unique: false });
  if (!store.indexNames.contains("dedupeKey")) store.createIndex("dedupeKey", "dedupeKey", { unique: false });
  if (!store.indexNames.contains("nextRetryAt")) store.createIndex("nextRetryAt", "nextRetryAt", { unique: false });
  if (!store.indexNames.contains("deadLetter")) store.createIndex("deadLetter", "deadLetter", { unique: false });
};

const scopedCacheKey = (key, userId = null) => `${userId ?? "anonymous"}::${key}`;

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
};

const getSyncDedupeKey = (action, payload = {}, userId = null) => {
  const uid = userId ?? "anonymous";
  if (action === "update_profile_notifications") return `${action}:${uid}`;
  if (action === "upsert_user_preferences") return `${action}:${uid}`;
  if (action === "upsert_course_progress" && payload.video_id) return `${action}:${uid}:${payload.video_id}`;
  if (action === "upsert_offline_download" && payload.lesson_id) return `${action}:${uid}:${payload.lesson_id}`;
  return `${action}:${uid}:${stableStringify(payload)}`;
};

const mergeSyncPayload = (action, current = {}, incoming = {}) => {
  if (action === "upsert_course_progress") {
    return {
      ...current,
      ...incoming,
      completed_parts: Math.max(Number(current.completed_parts) || 0, Number(incoming.completed_parts) || 0),
      total_parts: Math.max(Number(current.total_parts) || 0, Number(incoming.total_parts) || 0),
      progress_percentage: Math.max(
        Number(current.progress_percentage) || 0,
        Number(incoming.progress_percentage) || 0,
      ),
    };
  }
  return { ...current, ...incoming };
};

const computeBackoffMs = (attempts) => {
  const base = Math.min(10 * 60 * 1000, 1000 * 2 ** Math.max(0, attempts - 1));
  const jitter = Math.floor(Math.random() * 500);
  return base + jitter;
};

export const offlineManager = {
  async getDB() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        MEDIA_STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            createMediaStore(db, storeName);
            return;
          }
          ensureMediaStoreIndexes(transaction.objectStore(storeName));
        });

        if (!db.objectStoreNames.contains(QUERY_CACHE_STORE)) {
          const cache = db.createObjectStore(QUERY_CACHE_STORE, { keyPath: "cacheKey" });
          cache.createIndex("userId", "userId", { unique: false });
          cache.createIndex("updatedAt", "updatedAt", { unique: false });
        } else {
          ensureCacheStoreIndexes(transaction.objectStore(QUERY_CACHE_STORE));
        }

        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const queue = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "localId", autoIncrement: true });
          queue.createIndex("userId", "userId", { unique: false });
          queue.createIndex("createdAt", "createdAt", { unique: false });
          queue.createIndex("dedupeKey", "dedupeKey", { unique: false });
          queue.createIndex("nextRetryAt", "nextRetryAt", { unique: false });
          queue.createIndex("deadLetter", "deadLetter", { unique: false });
        } else {
          ensureQueueStoreIndexes(transaction.objectStore(SYNC_QUEUE_STORE));
        }
      },
    });
  },

  async saveItem(storeName, item, blob, userId = null) {
    const db = await this.getDB();
    return db.put(storeName, {
      ...item,
      sourceId: item.id ?? item.sourceId ?? null,
      lessonId: item.lessonId ?? null,
      blob: blob ?? item.blob ?? null,
      userId,
      savedAt: new Date().toISOString(),
    });
  },

  async getAll(storeName, userId = null) {
    const db = await this.getDB();
    const rows = await db.getAll(storeName);
    return userId ? rows.filter((item) => item.userId === userId) : rows;
  },

  async getByIndex(storeName, indexName, value) {
    const db = await this.getDB();
    return db.getAllFromIndex(storeName, indexName, value);
  },

  async getVideoByLesson(userId, lessonId) {
    const rows = await this.getByIndex("offline_videos", "lessonId", lessonId);
    return rows.find((row) => row.userId === userId) || null;
  },

  async deleteItem(storeName, localId) {
    const db = await this.getDB();
    return db.delete(storeName, localId);
  },

  async removeItem(storeName, localId) {
    return this.deleteItem(storeName, localId);
  },

  async getUserDownloads(userId) {
    const db = await this.getDB();
    if (!db.objectStoreNames.contains("offline_videos")) return [];
    const items = await db.getAllFromIndex("offline_videos", "userId", userId);
    return items || [];
  },

  async clearUserData(userId) {
    const db = await this.getDB();
    for (const storeName of MEDIA_STORES) {
      const tx = db.transaction(storeName, "readwrite");
      const index = tx.store.index("userId");
      let cursor = await index.openCursor(userId);
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
      await tx.done;
    }
    return true;
  },

  async clearStore(storeName) {
    const db = await this.getDB();
    if (db.objectStoreNames.contains(storeName)) {
      await db.clear(storeName);
      return true;
    }
    return false;
  },

  async hasStore(storeName) {
    const db = await this.getDB();
    return db.objectStoreNames.contains(storeName);
  },

  async setCache(key, value, userId = null) {
    const db = await this.getDB();
    const cacheKey = scopedCacheKey(key, userId);
    return db.put(QUERY_CACHE_STORE, {
      cacheKey,
      key,
      userId,
      value,
      updatedAt: new Date().toISOString(),
    });
  },

  async getCache(key, userId = null, maxAgeMs = null) {
    const db = await this.getDB();
    const row = await db.get(QUERY_CACHE_STORE, scopedCacheKey(key, userId));
    if (!row) return null;

    if (typeof maxAgeMs === "number") {
      const age = Date.now() - new Date(row.updatedAt).getTime();
      if (age > maxAgeMs) return null;
    }
    return row.value ?? null;
  },

  async enqueueSync(action, payload, userId = null) {
    const db = await this.getDB();
    const now = new Date().toISOString();
    const dedupeKey = getSyncDedupeKey(action, payload, userId);

    const matches = await db.getAllFromIndex(SYNC_QUEUE_STORE, "dedupeKey", dedupeKey);
    const openItem = matches.find((row) => !row.deadLetter);
    if (openItem) {
      return db.put(SYNC_QUEUE_STORE, {
        ...openItem,
        payload: mergeSyncPayload(action, openItem.payload || {}, payload || {}),
        updatedAt: now,
        nextRetryAt: now,
        lastError: null,
      });
    }

    return db.add(SYNC_QUEUE_STORE, {
      action,
      payload,
      userId,
      dedupeKey,
      attempts: 0,
      deadLetter: false,
      createdAt: now,
      updatedAt: now,
      nextRetryAt: now,
      lastError: null,
    });
  },

  async getPendingSync(userId = null) {
    const db = await this.getDB();
    const rows = await db.getAll(SYNC_QUEUE_STORE);
    const now = Date.now();
    return rows
      .filter((row) => (userId ? row.userId === userId : true))
      .filter((row) => !row.deadLetter)
      .filter((row) => !row.nextRetryAt || new Date(row.nextRetryAt).getTime() <= now)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async removeSync(localId) {
    const db = await this.getDB();
    return db.delete(SYNC_QUEUE_STORE, localId);
  },

  async markSyncFailure(localId, errorMessage = null, maxAttempts = 8) {
    const db = await this.getDB();
    const row = await db.get(SYNC_QUEUE_STORE, localId);
    if (!row) return;

    const attempts = (row.attempts ?? 0) + 1;
    const deadLetter = attempts >= maxAttempts;
    await db.put(SYNC_QUEUE_STORE, {
      ...row,
      attempts,
      deadLetter,
      updatedAt: new Date().toISOString(),
      nextRetryAt: new Date(Date.now() + computeBackoffMs(attempts)).toISOString(),
      lastError: errorMessage,
    });
  },

  async processSyncQueue({ userId = null, handlers = {}, maxItems = 50 } = {}) {
    if (!navigator.onLine) return { processed: 0, failed: 0 };

    const queue = await this.getPendingSync(userId);
    let processed = 0;
    let failed = 0;

    for (const item of queue.slice(0, maxItems)) {
      const handler = handlers[item.action];
      if (!handler) {
        failed += 1;
        await this.markSyncFailure(item.localId, `Missing sync handler for action ${item.action}`);
        continue;
      }

      try {
        await handler(item.payload, item);
        await this.removeSync(item.localId);
        processed += 1;
      } catch (error) {
        failed += 1;
        await this.markSyncFailure(item.localId, error?.message ?? "Sync failed");
      }
    }

    return { processed, failed };
  },

  async getSyncQueueStats(userId = null) {
    const db = await this.getDB();
    const all = await db.getAll(SYNC_QUEUE_STORE);
    const scoped = all.filter((row) => (userId ? row.userId === userId : true));
    return {
      total: scoped.length,
      deadLetter: scoped.filter((row) => row.deadLetter).length,
      retrying: scoped.filter((row) => !row.deadLetter && (row.attempts ?? 0) > 0).length,
    };
  },

  async runMaintenance({ cacheMaxAgeMs = 14 * ONE_DAY_MS, queueMaxAgeMs = 30 * ONE_DAY_MS } = {}) {
    const db = await this.getDB();
    const now = Date.now();

    const cacheRows = await db.getAll(QUERY_CACHE_STORE);
    for (const row of cacheRows) {
      if (!row?.updatedAt) continue;
      if (now - new Date(row.updatedAt).getTime() > cacheMaxAgeMs) {
        await db.delete(QUERY_CACHE_STORE, row.cacheKey);
      }
    }

    const queueRows = await db.getAll(SYNC_QUEUE_STORE);
    for (const row of queueRows) {
      if (!row?.createdAt) continue;
      if (row.deadLetter && now - new Date(row.createdAt).getTime() > queueMaxAgeMs) {
        await db.delete(SYNC_QUEUE_STORE, row.localId);
      }
    }
  },
};
