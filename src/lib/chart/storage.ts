'use client'

import type { SavedChart, ChartEngine } from '@/types/chart'

export async function listCharts(engine?: ChartEngine): Promise<SavedChart[]> {
  const res = await fetch('/api/charts', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load charts')
  const data = await res.json()
  let charts: SavedChart[] = data.charts ?? []
  if (engine) charts = charts.filter((c) => c.engine === engine)
  return charts
}

export async function saveChart(input: {
  title: string
  engine: ChartEngine
  type: string
  config: unknown
  thumbnail?: string
}): Promise<SavedChart> {
  const res = await fetch('/api/charts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to save chart')
  const data = await res.json()
  return data.chart
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
  const res = await fetch(`/api/charts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to update chart')
  const data = await res.json()
  return data.chart
}

export async function deleteChart(id: string): Promise<void> {
  const res = await fetch(`/api/charts/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete chart')
}

export async function getChart(id: string): Promise<SavedChart> {
  const res = await fetch(`/api/charts/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load chart')
  const data = await res.json()
  return data.chart
}
