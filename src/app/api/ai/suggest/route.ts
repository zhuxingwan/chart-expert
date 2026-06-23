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
- Use "echarts" for: numerical data trends, comparisons, proportions, distributions, gauges, heatmaps, candlestick, boxplot, graph, sankey, treemap, sunburst, parallel, themeRiver. Think: numbers + axes.
- Use "mermaid" for: code-like diagrams with logical flow — flowcharts, sequence diagrams between actors, state machines, ER diagrams, class diagrams, git branches, gantt, journey, mindmap, pie, timeline. Think: structured logic with text labels.
- Use "infographic" for: visually rich, presentation-ready visuals — this is the PREFERRED engine for most qualitative content. Use it when the user wants:
  * Step-by-step guides, tutorials, onboarding flows, how-to instructions
  * Roadmaps, project plans, milestones, product launch timelines
  * Comparison of two options (pros/cons, VS, before/after)
  * SWOT analysis, quadrant analysis, 2x2 matrices
  * Organization charts, team structures, reporting hierarchies
  * Feature lists, benefit lists, checklists, to-do lists
  * Relationship maps, network diagrams, ecosystem maps
  * Mind maps, concept maps, brainstorming summaries
  * Process flows, pipelines, funnels
  * Card-based layouts, badge cards, progress cards
  * Any visually appealing, card/illustration-style presentation
  * Content that combines text + icons + visual hierarchy
  Think: presentation-ready visuals with cards, icons, and decorative elements.

=== ECharts config ===
type: bar|line|pie|scatter|radar|funnel|gauge|heatmap|candlestick|boxplot|graph|sankey|treemap|sunburst|parallel|themeRiver
{ "title": {"text":"","subtext":""}, "type":"", "theme":"default|dark|vintage|macarons", "legend":true, "categories":[], "series_names":[], "series_data":[[]], "stack":false, "smooth":false, "horizontal":false, "showLabel":true, "showToolbox":true, "single_series_data":[{"name":"","value":0}], "radar_indicators":[{"name":"","max":100}], "gauge_value":0, "gauge_max":100, "scatter_data":[[0,0]], "candlestick_data":[[0,0,0,0]], "boxplot_data":[[0,0,0,0,0]], "graph_nodes":[{"id":"","name":"","category":0}], "graph_links":[{"source":"","target":""}], "sankey_nodes":[{"name":""}], "sankey_links":[{"source":"","target":"","value":0}], "sunburst_data":[{"name":"","value":0}], "parallel_data":[[]], "parallel_dims":[], "themeriver_data":[["","",0]] }

=== Mermaid config ===
{ "type":"flowchart|sequence|class|state|er|gantt|journey|mindmap|pie|gitgraph|timeline", "code":"", "theme":"default|dark|forest|neutral|base", "background":"#ffffff" }

=== Infographic config ===
Pick a "template" id from the full list below. Match the user's intent to the closest template.

LIST templates (for flat lists, feature lists, checklists, key points):
- list-row-simple-horizontal-arrow, list-row-horizontal-icon-line, list-row-circular-progress, list-row-simple-illus
- list-grid-simple, list-grid-compact-card, list-grid-badge-card, list-grid-progress-card, list-grid-circular-progress, list-grid-ribbon-card, list-grid-candy-card-lite, list-grid-done-list, list-grid-horizontal-icon-arrow
- list-column-done-list, list-column-simple-vertical-arrow, list-column-vertical-icon-arrow
- list-pyramid-badge-card, list-pyramid-compact-card, list-pyramid-rounded-rect-node
- list-sector-simple, list-sector-plain-text, list-sector-half-plain-text
- list-waterfall-compact-card, list-waterfall-badge-card
- list-zigzag-up-compact-card, list-zigzag-down-compact-card

SEQUENCE templates (for steps, timelines, roadmaps, processes, funnels):
- sequence-timeline-simple, sequence-timeline-plain-text, sequence-timeline-done-list, sequence-timeline-rounded-rect-node, sequence-timeline-simple-illus
- sequence-steps-simple, sequence-steps-badge-card, sequence-steps-simple-illus
- sequence-snake-steps-compact-card, sequence-snake-steps-pill-badge, sequence-snake-steps-simple, sequence-snake-steps-simple-illus
- sequence-color-snake-steps-horizontal-icon-line, sequence-color-snake-steps-simple-illus
- sequence-roadmap-vertical-plain-text, sequence-roadmap-vertical-simple, sequence-roadmap-vertical-badge-card, sequence-roadmap-vertical-pill-badge, sequence-roadmap-vertical-quarter-circular, sequence-roadmap-vertical-quarter-simple-card, sequence-roadmap-vertical-underline-text
- sequence-horizontal-zigzag-simple, sequence-horizontal-zigzag-plain-text, sequence-horizontal-zigzag-simple-illus, sequence-horizontal-zigzag-simple-horizontal-arrow, sequence-horizontal-zigzag-horizontal-icon-line, sequence-horizontal-zigzag-underline-text
- sequence-zigzag-steps-underline-text, sequence-circle-arrows-indexed-card
- sequence-zigzag-pucks-3d-simple, sequence-zigzag-pucks-3d-underline-text, sequence-zigzag-pucks-3d-indexed-card
- sequence-ascending-stairs-3d-simple, sequence-ascending-stairs-3d-underline-text, sequence-ascending-steps
- sequence-cylinders-3d-simple, sequence-circular-simple, sequence-circular-underline-text
- sequence-filter-mesh-simple, sequence-filter-mesh-underline-text, sequence-mountain-underline-text
- sequence-pyramid-simple, sequence-funnel-simple
- sequence-stairs-front-simple, sequence-stairs-front-compact-card, sequence-stairs-front-pill-badge
- sequence-interaction-default-badge-card, sequence-interaction-default-compact-card, sequence-interaction-default-capsule-item, sequence-interaction-default-rounded-rect-node
- sequence-interaction-compact-capsule-item, sequence-interaction-wide-capsule-item
- sequence-interaction-default-dashed-capsule-item, sequence-interaction-default-animated-capsule-item

COMPARE templates (for comparisons, VS, pros/cons, SWOT, quadrants):
- compare-binary-horizontal-simple-vs, compare-binary-horizontal-compact-card-vs, compare-binary-horizontal-badge-card-vs, compare-binary-horizontal-underline-text-vs
- compare-binary-horizontal-simple-arrow, compare-binary-horizontal-compact-card-arrow, compare-binary-horizontal-simple-fold
- compare-hierarchy-row-letter-card-compact-card, compare-hierarchy-row-letter-card-rounded-rect-node
- compare-hierarchy-left-right-circle-node-pill-badge, compare-hierarchy-left-right-circle-node-plain-text
- compare-swot, compare-quadrant-quarter-simple-card, compare-quadrant-quarter-circular, compare-quadrant-simple-illus

HIERARCHY templates (for org charts, tree structures, mind maps):
- hierarchy-tree-tech-style-capsule-item, hierarchy-tree-tech-style-compact-card, hierarchy-tree-tech-style-rounded-rect-node, hierarchy-tree-tech-style-badge-card
- hierarchy-tree-dashed-line-capsule-item, hierarchy-tree-distributed-origin-capsule-item, hierarchy-tree-curved-line-capsule-item, hierarchy-tree-dashed-arrow-capsule-item
- hierarchy-tree-lr-tech-style-capsule-item, hierarchy-tree-lr-dashed-line-capsule-item
- hierarchy-tree-bt-tech-style-capsule-item, hierarchy-tree-rl-distributed-origin-capsule-item
- hierarchy-tree-curved-line-badge-card, hierarchy-tree-curved-line-compact-card, hierarchy-tree-curved-line-rounded-rect-node

RELATION templates (for network diagrams, relationship maps, flow diagrams):
- relation-network-simple-circle-node, relation-network-icon-badge
- relation-circle-circular-progress, relation-circle-icon-badge
- relation-dagre-flow-tb-simple-circle-node, relation-dagre-flow-tb-compact-card, relation-dagre-flow-tb-badge-card
- relation-dagre-flow-lr-simple-circle-node, relation-dagre-flow-lr-compact-card
- relation-dagre-flow-tb-animated-capsule, relation-dagre-flow-lr-animated-capsule

CHART templates (for pie/donut/bar/line/wordcloud in infographic style):
- chart-pie-plain-text, chart-pie-compact-card, chart-pie-pill-badge
- chart-pie-donut-plain-text, chart-pie-donut-compact-card, chart-pie-donut-pill-badge
- chart-column-simple, chart-bar-plain-text, chart-line-plain-text
- chart-wordcloud, chart-wordcloud-rotate

QUADRANT templates:
- quadrant-quarter-simple-card, quadrant-quarter-circular, quadrant-simple-illus

{ "type":"<template id>", "template":"<same template id>", "data": {"title":{"text":"","subtext":""}, "lists":[{"label":"","desc":"","value":0,"icon":"emoji","children":[...]}], "nodes":[{"id":"","label":"","group":""}], "edges":[{"from":"","to":"","label":""}]}, "theme":"light|dark|hand-drawn", "background":"#ffffff", "width":900, "height":600 }
Infographic data shape rules:
- list / sequence / chart templates: use "lists" with flat items.
- hierarchy templates: use "lists" with ONE root whose "children" form the tree.
- relation templates: use "nodes" and "edges" (edges use "from"/"to" referencing node ids).
- compare templates: use "lists" with 2 (binary) or 4 (quadrant) top-level groups, each with "children".
- "icon" should be a short English keyword (e.g. "rocket", "trophy", "target", "growth", "idea", "check", "star", "heart", "user", "code"). The engine will automatically fetch an appropriate SVG icon based on the keyword. Do NOT use emoji.

=== Universal rules ===
- EXTRACT all concrete data from the user's prompt and use it EXACTLY.
- If no specific data provided, generate realistic sample data.
- Generate ALL text content in the user's locale language.
- For mermaid, write complete, syntactically-valid code.
- CRITICAL for infographic: Keep ALL text SHORT and CONCISE — this is an infographic, not a document.
  * Title: max 30 characters
  * Subtitle: max 50 characters
  * Item label: max 20 characters (2-4 words, like "Market Research" or "Q1 Launch")
  * Item desc: max 40 characters (one short sentence summary)
  * Use keywords, not full sentences
  * Summarize and condense — the visual layout breaks with long text
- For infographic "icon": use a short English keyword (e.g. "rocket", "trophy", "target", "growth", "idea", "check", "star", "heart", "user", "code", "chart", "globe", "lightbulb"). The engine fetches an SVG icon based on the keyword. Do NOT use emoji. If unsure, omit the icon field.
- Output STRICT JSON only.`

// ─── Domain Signature (EXACT COPY from note app) ────────────────────────
// This is NOT a PRO license check — it's a simple anti-third-party-call
// mechanism. The signature is generated using the requesting domain as part
// of the HMAC key, so only requests from noterich.com (or our app served
// from the same domain) can pass the server-side verification.

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

// ─── Compression (matches note app) ──────────────────────────────────────

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
    const formData = new FormData()
    formData.append('payload', new File([input], 'payload.json', { type: 'application/json' }))
    return formData
  }
}

// ─── Main API handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestBody
    if (!body.prompt && !body.imageDataUrl) {
      return NextResponse.json({ error: 'prompt or imageDataUrl is required' }, { status: 400 })
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

    // Call the noterich.com AI API with domain signature (anti-third-party-call,
    // NOT a PRO license check — AI is available to all users)
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
