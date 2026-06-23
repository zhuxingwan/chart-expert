import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface SuggestBody {
  engine?: 'echarts' | 'mermaid' | 'infographic'
  prompt: string
  locale?: string
  imageDataUrl?: string
}

const SYSTEM_PROMPT = `You are a senior data visualization consultant working inside a NON-technical, multilingual chart-making tool. The tool supports three rendering libraries but the user never sees them — you must pick the right one automatically based on what the user wants to express.

Based on the user's natural-language description (and optionally an uploaded reference image), you will:
1. Decide which underlying library is the best fit
2. Pick the most suitable template within that library
3. Generate a ready-to-use configuration object

CRITICAL — Data Extraction: The user's prompt often contains REAL data and content (numbers, percentages, labels, events, dates, names, relationships). You MUST extract and use this data EXACTLY as provided. Do NOT invent or replace user-provided data with your own.

You MUST respond with valid JSON only — no markdown fences, no extra prose.

Output schema:
{
  "engine": "echarts" | "mermaid" | "infographic",
  "recommendedTypeName": "<human-readable name in the user's language>",
  "reason": "<one short sentence in the user's language explaining why>",
  "config": { ...engine-specific configuration, see below... }
}

IMPORTANT — Language: The user specifies a locale (BCP-47 code). You MUST generate ALL text content in the SAME language as the user's locale.

=== How to pick the engine ===
- Use "echarts" for: numerical data trends, comparisons, proportions, distributions, gauges, heatmaps, candlestick, boxplot, graph, sankey, treemap, sunburst, parallel, themeRiver.
- Use "mermaid" for: flowcharts, sequence diagrams, state machines, ER diagrams, class diagrams, git branches, gantt, journey, mindmap, pie, timeline.
- Use "infographic" for: step lists, roadmaps, mind maps, comparison cards, org trees, relationship circles, decorative timelines.

=== ECharts config ===
type: bar|line|pie|scatter|radar|funnel|gauge|heatmap|candlestick|boxplot|graph|sankey|treemap|sunburst|parallel|themeRiver
{ "title": {"text":"","subtext":""}, "type":"", "theme":"default|dark|vintage|macarons", "legend":true, "categories":[], "series_names":[], "series_data":[[]], "stack":false, "smooth":false, "horizontal":false, "showLabel":true, "showToolbox":true, "single_series_data":[{"name":"","value":0}], "radar_indicators":[{"name":"","max":100}], "gauge_value":0, "gauge_max":100, "scatter_data":[[0,0]], "candlestick_data":[[0,0,0,0]], "boxplot_data":[[0,0,0,0,0]], "graph_nodes":[{"id":"","name":"","category":0}], "graph_links":[{"source":"","target":""}], "sankey_nodes":[{"name":""}], "sankey_links":[{"source":"","target":"","value":0}], "sunburst_data":[{"name":"","value":0}], "parallel_data":[[]], "parallel_dims":[], "themeriver_data":[["","",0]] }

=== Mermaid config ===
{ "type":"flowchart|sequence|class|state|er|gantt|journey|mindmap|pie|gitgraph|timeline", "code":"", "theme":"default|dark|forest|neutral|base", "background":"#ffffff" }

=== Infographic config ===
template: list-row-simple-horizontal-arrow, list-grid-compact-card, sequence-timeline-simple, sequence-steps-badge-card, compare-binary-horizontal-simple-vs, compare-swot, hierarchy-tree-tech-style-capsule-item, relation-network-simple-circle-node, relation-dagre-flow-tb-compact-card, chart-pie-plain-text, chart-wordcloud, etc.
{ "type":"", "template":"", "data": {"title":{"text":"","subtext":""}, "lists":[{"label":"","desc":"","value":0,"icon":"","children":[]}], "nodes":[{"id":"","label":"","group":""}], "edges":[{"from":"","to":"","label":""}]}, "theme":"light|dark|hand-drawn", "background":"#ffffff", "width":900, "height":600 }

=== Universal rules ===
- EXTRACT all concrete data from the user's prompt and use it EXACTLY.
- If no specific data provided, generate realistic sample data.
- Generate ALL text content in the user's locale language.
- For mermaid, write complete, syntactically-valid code.
- Output STRICT JSON only.`

// ─── Domain Signature (matches note app's signedFetch) ──────────────────

async function generateRequestSignature(method: string, path: string, timestamp: number): Promise<string> {
  const domain = 'noterich.com'
  const key = `${domain}::noterich_sig_v1`
  const payload = `${method.toUpperCase()}|${path}|${timestamp}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const payloadData = encoder.encode(payload)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData)

  return Buffer.from(signature).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function signedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const parsed = new URL(url)
  let path = parsed.pathname + parsed.search
  const pathParam = parsed.searchParams.get('path')
  if (pathParam) {
    path = pathParam
  }

  const timestamp = Date.now()
  const signature = await generateRequestSignature(options.method || 'GET', path, timestamp)

  const headers = new Headers(options.headers)
  headers.set('X-Request-Sig', signature)
  headers.set('X-Request-Ts', timestamp.toString())
  headers.set('X-Request-Dom', Buffer.from('noterich.com').toString('base64'))

  return fetch(url, { ...options, headers })
}

// ─── Compression (matches note app's compressToFile) ─────────────────────

async function compressPayload(data: string): Promise<FormData> {
  const encoder = new TextEncoder()
  const input = encoder.encode(data)

  try {
    const cs = new CompressionStream('gzip')
    const writer = cs.writable.getWriter()
    writer.write(input)
    writer.close()
    const compressed = await new Response(cs.readable).arrayBuffer()
    const file = new File([compressed], 'payload.gz', { type: 'application/gzip' })
    const formData = new FormData()
    formData.append('payload', file)
    return formData
  } catch {
    // Fallback: no compression
    const formData = new FormData()
    formData.append('payload', new File([input], 'payload.json', { type: 'application/json' }))
    return formData
  }
}

// ─── License decryption (matches note app) ───────────────────────────────

const IV_LENGTH = 16

async function deriveKeyFromParams(password: string, salt: string): Promise<ArrayBuffer> {
  const combined = password + salt
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  const keyBytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = (hash >> ((i % 4) * 8)) & 0xff
  }
  return keyBytes.buffer
}

function getDeriveSalt(): string {
  const WEBICON_PATH_D = 'M22.266 3.834a12.7 12.7 0 0 1 3.194.319c10.765 2.446 7.71 15.16 7.951 23.149.02.66.055 1.165.414 1.737 1.484 1.192 3.724-.94 4.96-1.82.047 3.194.432 7.023-1.783 9.62-2.9 3.401-9.023 2.953-12.214.162-5.819-5.09-3.274-14.17-3.848-20.956-.14-.903-.248-2.55-1.277-2.806-2.546.55-1.905 9.046-1.903 11.107l-.004 14.444q-6.539.047-13.076-.021c-.035-1.486-.04-3.02-.02-4.507.13-10.036-.195-20.16.03-30.187l8.263-.016c1.381 0 3.457-.06 4.765.04.073.233.077.34.1.58.87-.008 2.717-.729 4.448-.845m-4.58 3.315c-.025.82-.23 4.093.1 4.614 2.211-.717 4-.498 4.702 2.144 1.861 6.998-2.623 17.779 4.738 22.513 1.653.982 4.264 1.003 6.168.59 2.914-1.129 3.355-3.198 3.507-6.033-2.127.555-4.656.681-5.183-2.042-1.344-6.942 2.66-16.998-4.075-21.94-1.598-1.1-4.356-1.376-6.326-1.125-1.497.216-2.325.434-3.63 1.28'
  return WEBICON_PATH_D.slice(0, 50)
}

async function decryptLicense(encryptedData: Uint8Array, key: ArrayBuffer): Promise<any> {
  const keyMaterial = new Uint8Array(key)
  for (const ivLen of [16, 12, 0, 8, 4, 20, 24]) {
    if (ivLen >= encryptedData.length) continue
    const ciphertext = encryptedData.slice(ivLen)
    const decryptedBuffer = new Uint8Array(ciphertext.length)
    for (let i = 0; i < ciphertext.length; i++) {
      decryptedBuffer[i] = ciphertext[i] ^ keyMaterial[i % keyMaterial.length]
    }
    const jsonString = new TextDecoder().decode(decryptedBuffer)
    try {
      const parsed = JSON.parse(jsonString)
      if (parsed && typeof parsed === 'object' && parsed.user && parsed.expiry && parsed.type) {
        return parsed
      }
    } catch {}
  }
  throw new Error('Decryption failed')
}

async function validateLicenseKey(key: string, email: string): Promise<boolean> {
  try {
    const binaryString = Buffer.from(key, 'base64').toString('binary')
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const derivedKey = await deriveKeyFromParams('noterich.com', getDeriveSalt())
    const decryptedData = await decryptLicense(bytes, derivedKey)
    if (decryptedData.user !== email) return false
    if (Date.now() > decryptedData.expiry) return false
    if (decryptedData.type !== 'pro') return false
    return true
  } catch {
    return false
  }
}

// ─── Main API handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestBody
    if (!body.prompt && !body.imageDataUrl) {
      return NextResponse.json({ error: 'prompt or imageDataUrl is required' }, { status: 400 })
    }

    // ─── License check ───────────────────────────────────────────────────
    const licenseKey = req.headers.get('x-license-key')
    const licenseEmail = req.headers.get('x-license-email')
    if (!licenseKey || !licenseEmail) {
      return NextResponse.json({ error: 'License required' }, { status: 403 })
    }
    const isValid = await validateLicenseKey(licenseKey, licenseEmail)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired license' }, { status: 403 })
    }

    const locale = body.locale ?? 'en'
    const promptText = body.prompt?.trim() || 'Please analyze the uploaded image and create the most appropriate chart.'

    // Build messages
    const messageContent: unknown[] = []
    if (body.imageDataUrl) {
      messageContent.push({ image_url: { url: body.imageDataUrl }, type: 'image_url' })
    }
    messageContent.push({ text: `Locale: ${locale}\nUser request: ${promptText}`, type: 'text' })

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: messageContent },
    ]

    const payload = {
      max_tokens: 4096,
      messages,
      stream: false,
      temperature: 0.7,
      top_p: 0.95,
    }

    const payloadJson = JSON.stringify(payload)

    // Try compressed, fall back to raw JSON
    let fetchBody: BodyInit
    let fetchHeaders: Record<string, string> = {}

    try {
      const formData = await compressPayload(payloadJson)
      fetchBody = formData
    } catch {
      fetchBody = payloadJson
      fetchHeaders['Content-Type'] = 'application/json'
    }

    const apiUrl = 'https://www.noterich.com/api.php?api=general&path=/v1/chat/completions'
    const response = await signedFetch(apiUrl, {
      body: fetchBody,
      headers: fetchHeaders,
      method: 'POST',
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json({ error: `AI API error: ${response.status} ${errText}` }, { status: 502 })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ''

    return parseAndCalibrate(raw, body.engine)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

function parseAndCalibrate(raw: string, engineHint?: string) {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'AI returned malformed JSON', raw: cleaned }, { status: 502 })
  }

  const result = parsed as { engine?: string; recommendedTypeName?: string; reason?: string; config?: unknown }

  const validEngines = ['echarts', 'mermaid', 'infographic']
  let engine = result.engine
  if (!engine || !validEngines.includes(engine)) {
    engine = engineHint ?? 'echarts'
  }

  let config = result.config
  let calibrationNote: string | undefined

  if (!config || typeof config !== 'object') {
    config = getSafeDefault(engine)
    calibrationNote = 'AI config was missing; a default template was applied.'
  } else {
    const calibrated = calibrateConfig(engine, config as Record<string, unknown>)
    config = calibrated.config
    if (calibrated.fixed) calibrationNote = calibrated.note
  }

  return NextResponse.json({
    result: {
      engine,
      recommendedTypeName: result.recommendedTypeName ?? '',
      reason: result.reason ?? '',
      config,
      calibrationNote,
    },
  })
}

function calibrateConfig(engine: string, config: Record<string, unknown>): { config: unknown; fixed: boolean; note?: string } {
  const notes: string[] = []
  if (engine === 'echarts') {
    if (!config.type || typeof config.type !== 'string') { config.type = 'bar'; notes.push('chart type') }
    if (!config.title || typeof config.title !== 'object') config.title = { text: '', subtext: '' }
    if (!Array.isArray(config.categories)) config.categories = []
    if (!Array.isArray(config.series_names)) config.series_names = []
    if (!Array.isArray(config.series_data)) config.series_data = []
  } else if (engine === 'mermaid') {
    if (!config.type || typeof config.type !== 'string') { config.type = 'flowchart'; notes.push('diagram type') }
    if (!config.code || typeof config.code !== 'string') { config.code = 'flowchart TD\n    A([Start]) --> B([End])'; notes.push('mermaid code') }
    if (!config.theme) config.theme = 'default'
    if (!config.background) config.background = '#ffffff'
  } else if (engine === 'infographic') {
    if (!config.template || typeof config.template !== 'string') { config.template = 'list-grid-compact-card'; config.type = config.template; notes.push('template id') }
    config.type = config.template
    if (!config.data || typeof config.data !== 'object') { config.data = { title: { text: '' }, lists: [] }; notes.push('data') }
    if (!config.theme) config.theme = 'light'
    if (!config.background) config.background = '#ffffff'
    if (typeof config.width !== 'number') config.width = 900
    if (typeof config.height !== 'number') config.height = 600
  }
  return { config, fixed: notes.length > 0, note: notes.length > 0 ? `Calibrated: ${notes.join(', ')}` : undefined }
}

function getSafeDefault(engine: string): unknown {
  if (engine === 'mermaid') return { type: 'flowchart', code: 'flowchart TD\n    A([Start]) --> B{Decision}\n    B -->|Yes| C[Action]\n    B -->|No| D[End]\n    C --> D', theme: 'default', background: '#ffffff' }
  if (engine === 'infographic') return { type: 'list-grid-compact-card', template: 'list-grid-compact-card', data: { title: { text: '' }, lists: [{ label: 'Item 1', desc: '', value: 50 }, { label: 'Item 2', desc: '', value: 50 }, { label: 'Item 3', desc: '', value: 50 }] }, theme: 'light', background: '#ffffff', width: 900, height: 600 }
  return { title: { text: '', subtext: '' }, type: 'bar', theme: 'default', legend: true, categories: ['A', 'B', 'C', 'D'], series_names: ['Series 1'], series_data: [[10, 20, 30, 40]], stack: false, smooth: false, horizontal: false, showLabel: true, showToolbox: true }
}
