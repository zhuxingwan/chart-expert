'use client'

import type { SavedChart, ChartEngine } from '@/types/chart'

/**
 * Pure-frontend chart storage backed by IndexedDB.
 * No server, no API routes, no Prisma — the app is a lightweight SPA.
 */

const DB_NAME = 'chart-workshop'
const DB_VERSION = 1
const STORE = 'charts'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('engine', 'engine', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const store = transaction.objectStore(STORE)
        const request = fn(store)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
  )
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export async function listCharts(engine?: ChartEngine): Promise<SavedChart[]> {
  const all = await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys())
  const keys = (all as unknown as IDBValidKey[]) ?? []
  const items = await Promise.all(
    keys.map((k) =>
      tx<SavedChart>('readonly', (s) => s.get(k))
    )
  )
  let charts = items.filter((c): c is SavedChart => !!c)
  if (engine) charts = charts.filter((c) => c.engine === engine)
  charts.sort((a, b) => b.updatedAt - a.updatedAt)
  return charts
}

export async function saveChart(input: {
  title: string
  engine: ChartEngine
  type: string
  config: unknown
  thumbnail?: string
}): Promise<SavedChart> {
  const now = Date.now()
  const chart: SavedChart = {
    id: genId(),
    title: input.title,
    engine: input.engine,
    type: input.type,
    config: input.config,
    thumbnail: input.thumbnail ?? null,
    createdAt: now,
    updatedAt: now,
  }
  await tx('readwrite', (s) => s.add(chart))
  return chart
}

export async function updateChart(
  id: string,
  input: Partial<{
    title: string
    engine: ChartEngine
    type: string
    config: unknown
    thumbnail: string
  }>
): Promise<SavedChart> {
  const existing = await tx<SavedChart>('readonly', (s) => s.get(id))
  if (!existing) throw new Error('Chart not found')
  const updated: SavedChart = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }
  await tx('readwrite', (s) => s.put(updated))
  return updated
}

export async function deleteChart(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id))
}

export async function getChart(id: string): Promise<SavedChart> {
  const chart = await tx<SavedChart>('readonly', (s) => s.get(id))
  if (!chart) throw new Error('Chart not found')
  return chart
}
