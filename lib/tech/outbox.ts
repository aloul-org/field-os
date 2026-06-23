/**
 * Offline upload outbox for the technician PWA (spec Module 7). Photo/voice
 * uploads that fail (no signal) are stored in IndexedDB and retried
 * automatically when connectivity returns — so a technician in a basement can
 * keep working and nothing is lost. Blobs are stored directly (IndexedDB
 * supports them; localStorage does not).
 */

const DB_NAME = "fieldos-outbox";
const STORE = "uploads";

export interface OutboxRecord {
  id?: number;
  kind: "photo" | "voice";
  jobId: string;
  /** photo only */
  photoType?: string;
  blob: Blob;
  filename: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(record: Omit<OutboxRecord, "id">): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getAll(): Promise<OutboxRecord[]> {
  const db = await openDB();
  const items = await new Promise<OutboxRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OutboxRecord[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

async function remove(id: number): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function count(): Promise<number> {
  try {
    return (await getAll()).length;
  } catch {
    return 0;
  }
}

function endpointFor(kind: OutboxRecord["kind"]): string {
  return kind === "photo" ? "/api/tech/photo" : "/api/tech/voice-report";
}

function bodyFor(record: OutboxRecord): FormData {
  const fd = new FormData();
  fd.set("jobId", record.jobId);
  if (record.kind === "photo") {
    fd.set("photoType", record.photoType ?? "progress");
    fd.set("file", record.blob, record.filename);
  } else {
    fd.set("audio", record.blob, record.filename);
  }
  return fd;
}

/**
 * Replay every queued upload. Stops at the first failure (still offline) and
 * returns how many succeeded so the UI can update its indicator.
 */
export async function flush(): Promise<{ sent: number; remaining: number }> {
  let sent = 0;
  const items = await getAll();
  for (const item of items) {
    try {
      const res = await fetch(endpointFor(item.kind), { method: "POST", body: bodyFor(item) });
      if (!res.ok) break;
      if (item.id != null) await remove(item.id);
      sent += 1;
    } catch {
      break; // still offline — try again on the next online event
    }
  }
  const remaining = (await getAll()).length;
  return { sent, remaining };
}
