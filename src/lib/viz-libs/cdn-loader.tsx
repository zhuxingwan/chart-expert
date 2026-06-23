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
  {
    id: 'antv-infographic',
    src: 'https://cdn.jsdelivr.net/npm/@antv/infographic@0.2.19/dist/infographic.min.js',
    check: () => {
      if (typeof window === 'undefined') return false
      const w = window as unknown as { AntVInfographic?: { Infographic?: unknown } }
      return !!w.AntVInfographic?.Infographic
    },
  },
]

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface LoadState {
  echarts: LoadStatus
  mermaid: LoadStatus
  infographic: LoadStatus
}

const LibContext = React.createContext<{
  status: LoadState
}>({
  status: { echarts: 'idle', mermaid: 'idle', infographic: 'idle' },
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
    infographic: 'idle',
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

/** Get the AntV Infographic constructor from the CDN-loaded global. */
export function getInfographic(): any | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AntVInfographic?: { Infographic?: any } }
  return w.AntVInfographic?.Infographic ?? null
}
