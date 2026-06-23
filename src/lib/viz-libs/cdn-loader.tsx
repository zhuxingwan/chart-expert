'use client'

import * as React from 'react'

/**
 * CDN-hosted versions of the three heavy viz libraries.
 * Loading them via <script> tags keeps the webpack bundle small so the
 * Next.js dev server doesn't OOM trying to compile 200MB+ of source.
 */
const CDN_SCRIPTS = [
  {
    id: 'echarts',
    src: 'https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js',
    check: () => typeof window !== 'undefined' && !!(window as unknown as { echarts?: unknown }).echarts,
  },
  {
    id: 'mermaid',
    src: 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js',
    check: () => typeof window !== 'undefined' && !!(window as unknown as { mermaid?: unknown }).mermaid,
  },
  // NOTE: @antv/infographic is bundled directly (not CDN) because its UMD build
  // has hidden external deps (lodash `_`, graphlib) that break CDN loading.
]

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface LoadState {
  echarts: LoadStatus
  mermaid: LoadStatus
}

const LibContext = React.createContext<{
  status: LoadState
}>({
  status: { echarts: 'idle', mermaid: 'idle' },
})

export function useVizLibs() {
  return React.useContext(LibContext)
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)))
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export function VizLibLoader({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<LoadState>({
    echarts: 'idle',
    mermaid: 'idle',
  })

  React.useEffect(() => {
    let cancelled = false
    const update = (id: keyof LoadState, s: LoadStatus) => {
      if (cancelled) return
      setStatus((prev) => ({ ...prev, [id]: s }))
    }

    CDN_SCRIPTS.forEach((s) => {
      const id = s.id as keyof LoadState
      if (s.check()) {
        update(id, 'loaded')
        return
      }
      update(id, 'loading')
      loadScript(s.src)
        .then(() => {
          if (s.check()) update(id, 'loaded')
          else update(id, 'error')
        })
        .catch(() => update(id, 'error'))
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <LibContext.Provider value={{ status }}>
      {children}
    </LibContext.Provider>
  )
}

/** Get the echarts instance from the CDN-loaded global. */
export function getECharts(): any | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { echarts?: any }
  return w.echarts ?? null
}

/** Get the mermaid instance from the CDN-loaded global. */
export function getMermaid(): any | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { mermaid?: any }
  return w.mermaid ?? null
}

/** Get the AntV Infographic constructor (bundled, not CDN). */
export function getInfographic(): any | null {
  // Lazy import the bundled module — returns the Infographic class.
  // This is a synchronous getter for API parity with getECharts/getMermaid;
  // the actual module is pre-bundled by webpack so no network fetch occurs.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@antv/infographic')
    return mod.Infographic ?? mod.default?.Infographic ?? null
  } catch {
    return null
  }
}
