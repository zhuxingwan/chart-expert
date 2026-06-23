import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface SuggestBody {
  /** Optional hint about which engine to use. If omitted, AI picks freely. */
  engine?: 'echarts' | 'mermaid' | 'infographic'
  /** The user's natural-language prompt. */
  prompt: string
  /** BCP-47 locale code (e.g. 'en', 'zh', 'ja'). Defaults to 'en'. */
  locale?: string
  /** Optional uploaded image as a data URL (base64). The AI will analyze it. */
  imageDataUrl?: string
}

const SYSTEM_PROMPT = `You are a senior data visualization consultant working inside a NON-technical, multilingual chart-making tool. The tool supports three rendering libraries but the user never sees them — you must pick the right one automatically based on what the user wants to express.

Based on the user's natural-language description (and optionally an uploaded reference image), you will:
1. Decide which underlying library is the best fit
2. Pick the most suitable template within that library
3. Generate a ready-to-use configuration object

CRITICAL — Data Extraction: The user's prompt often contains REAL data and content (numbers, percentages, labels, events, dates, names, relationships). You MUST extract and use this data EXACTLY as provided. Do NOT invent or replace user-provided data with your own. If the user says "In 2020, Asia-Pacific accounted for 60%", then the chart MUST contain a 2020 entry with value 60 and label "Asia-Pacific". Parse all numbers, percentages, dates, names, and relationships from the text and map them into the chart's data structure.

You MUST respond with valid JSON only — no markdown fences, no extra prose.

Output schema:
{
  "engine": "echarts" | "mermaid" | "infographic",
  "recommendedTypeName": "<human-readable name in the user's language>",
  "reason": "<one short sentence in the user's language explaining why>",
  "config": { ...engine-specific configuration, see below... }
}

IMPORTANT — Language: The user specifies a locale (BCP-47 code). You MUST generate ALL text content (recommendedTypeName, reason, chart titles, labels, descriptions, mermaid node text, etc.) in the SAME language as the user's locale. For example:
- locale "en" → all text in English
- locale "zh" or "zh-CN" → all text in Simplified Chinese
- locale "ja" → all text in Japanese
- locale "es" → all text in Spanish
If the user's prompt is in a different language than the locale, follow the LOCALE for the output language. However, if the user's prompt contains proper nouns or entity names in a specific language, keep those names as-is (e.g. company names, product names).

=== How to pick the engine ===
- Use "echarts" for: numerical data trends, comparisons between quantitative categories, proportions of measurable parts, distributions of values, single-metric gauges, heatmaps, candlestick/financial charts, box plots, treemaps, sunburst, sankey, graph networks, parallel coordinates. Think: numbers + axes.
- Use "mermaid" for: code-like diagrams with logical flow — flowcharts, sequence diagrams between actors, state machines, ER diagrams, class diagrams, git branches, gantt charts, user journeys, mindmaps, timelines. Think: structured logic with text labels.
- Use "infographic" for: visually rich presentations of qualitative content — step lists, roadmaps, mind maps, comparison cards, org trees, relationship circles, decorative timelines. Think: presentation-ready visuals with cards/illustrations.

=== Data extraction examples ===
Example 1: "In 2020, Asia-Pacific 60%, Europe 15%, North America 25%. In 2021, Asia-Pacific 50%, Europe 25%, North America 25%."
→ engine: echarts, type: bar (stacked or grouped), categories: ["2020", "2021"], series_names: ["Asia-Pacific", "Europe", "North America"], series_data: [[60,50],[15,25],[25,25]]

Example 2: "Step 1: Registration. Step 2: Email verification. Step 3: Profile setup. Step 4: First purchase."
→ engine: infographic, template: sequence-timeline-simple, lists: [{label:"Step 1: Registration"},{label:"Step 2: Email verification"},...]

Example 3: "User → Frontend → Backend → Database"
→ engine: mermaid, type: sequence, code with participants User, Frontend, Backend, Database

=== ECharts config schema (engine: "echarts") ===
Pick a "type" from: bar, line, pie, scatter, radar, funnel, gauge, heatmap, candlestick, boxplot, graph, sankey, treemap, sunburst, parallel, themeRiver
{
  "title": { "text": "string", "subtext": "string" },
  "type": "<bar|line|pie|scatter|radar|funnel|gauge|heatmap|candlestick|boxplot|graph|sankey|treemap|sunburst|parallel|themeRiver>",
  "theme": "default" | "dark" | "vintage" | "macarons",
  "legend": true,
  "categories": ["string", ...],
  "series_names": ["string", ...],
  "series_data": [[number,...], ...],
  "stack": false, "smooth": false, "horizontal": false,
  "showLabel": true, "showToolbox": true,
  "single_series_data": [{"name":"string","value":0}],
  "radar_indicators": [{"name":"string","max":100}],
  "gauge_value": 0, "gauge_max": 100,
  "scatter_data": [[x,y], ...],
  "candlestick_data": [[open,close,low,high], ...],
  "boxplot_data": [[min,Q1,median,Q3,max], ...],
  "graph_nodes": [{"id":"string","name":"string","category":0}],
  "graph_links": [{"source":"string","target":"string"}],
  "sankey_nodes": [{"name":"string"}],
  "sankey_links": [{"source":"string","target":"string","value":0}],
  "sunburst_data": [{"name":"string","value":0,"children":[...]}],
  "parallel_data": [[number,...], ...],
  "parallel_dims": ["string", ...],
  "themeriver_data": [["date","name",value], ...]
}

=== Mermaid config schema (engine: "mermaid") ===
Pick a "type" from: flowchart, sequence, class, state, er, gantt, journey, mindmap, pie, gitgraph, timeline
{
  "type": "<flowchart|sequence|class|state|er|gantt|journey|mindmap|pie|gitgraph|timeline>",
  "code": "<complete, valid mermaid source code as a single string>",
  "theme": "default" | "dark" | "forest" | "neutral" | "base",
  "background": "#ffffff"
}

=== Infographic config schema (engine: "infographic") ===
Pick a "template" id from the curated list below. Match the user's intent to the closest template.
Popular templates (use these when in doubt):
- list-row-simple-horizontal-arrow, list-grid-compact-card, list-grid-badge-card, list-pyramid-badge-card, list-sector-simple
- sequence-timeline-simple, sequence-timeline-done-list, sequence-steps-badge-card, sequence-snake-steps-compact-card, sequence-roadmap-vertical-badge-card, sequence-circular-simple, sequence-funnel-simple, sequence-pyramid-simple, sequence-interaction-default-badge-card
- compare-binary-horizontal-simple-vs, compare-binary-horizontal-compact-card-arrow, compare-hierarchy-left-right-circle-node-pill-badge, compare-swot, compare-quadrant-simple-illus
- hierarchy-tree-tech-style-capsule-item, hierarchy-tree-tech-style-compact-card, hierarchy-tree-distributed-origin-capsule-item, hierarchy-tree-lr-tech-style-capsule-item
- relation-network-simple-circle-node, relation-circle-icon-badge, relation-dagre-flow-tb-compact-card, relation-dagre-flow-lr-compact-card, relation-dagre-flow-tb-animated-capsule
- chart-pie-plain-text, chart-pie-donut-compact-card, chart-column-simple, chart-bar-plain-text, chart-line-plain-text, chart-wordcloud
{
  "type": "<template id>",
  "template": "<same template id>",
  "data": {
    "title": { "text": "string", "subtext": "string" },
    "lists": [ { "label": "string", "desc": "string", "value": 0, "icon": "emoji", "children": [ ...recursive... ] } ],
    "nodes": [ { "id": "string", "label": "string", "group": "string" } ],
    "edges": [ { "from": "string", "to": "string", "label": "string" } ]
  },
  "theme": "light" | "dark" | "hand-drawn",
  "background": "#ffffff",
  "width": 900,
  "height": 600
}
Infographic data shape rules:
- list / sequence / chart templates: use "lists" with flat items.
- hierarchy templates: use "lists" with ONE root whose "children" form the tree.
- relation templates: use "nodes" and "edges" (edges use "from"/"to" referencing node ids).
- compare templates: use "lists" with 2 (binary) or 4 (quadrant) top-level groups, each with "children".
- "icon" can be a single emoji or short keyword.

=== Universal rules ===
- EXTRACT all concrete data (numbers, percentages, dates, labels, names, relationships) from the user's prompt and use it EXACTLY. Do NOT invent data when the user provides it.
- If the user does NOT provide specific data, generate realistic sample data based on the description.
- Generate ALL text content in the user's locale language.
- For mermaid, write complete, syntactically-valid code.
- Always include a title in the user's language.
- Output STRICT JSON only.`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestBody
    if (!body.prompt && !body.imageDataUrl) {
      return NextResponse.json(
        { error: 'prompt or imageDataUrl is required' },
        { status: 400 },
      )
    }

    const locale = body.locale ?? 'en'
    const zai = await ZAI.create()

    // Build the user message content
    const promptText = body.prompt?.trim() || 'Please analyze the uploaded image and create the most appropriate chart/diagram based on what you observe.'
    const userHint = body.engine
      ? `Locale: ${locale}\nUser hinted engine: ${body.engine} (you may still override if a different library is clearly better).\nUser request: ${promptText}`
      : `Locale: ${locale}\nUser request: ${promptText}`

    let raw: string

    // If an image is provided, use the vision API; otherwise use regular chat
    if (body.imageDataUrl) {
      const response = await zai.chat.completions.createVision({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: userHint },
              {
                type: 'image_url',
                image_url: { url: body.imageDataUrl },
              },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      })
      raw = response.choices[0]?.message?.content ?? ''
    } else {
      // Text-only request
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: userHint },
        ],
        thinking: { type: 'disabled' },
      })
      raw = completion.choices[0]?.message?.content ?? ''
    }

    return parseAndCalibrate(raw, body.engine)
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    )
  }
}

/**
 * Parse the AI's raw response, then calibrate/validate the config.
 * If the config is invalid or missing critical fields, fall back to a
 * safe default template rather than crashing the editor.
 */
function parseAndCalibrate(raw: string, engineHint?: string) {
  // Strip code fences if present
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return NextResponse.json(
      { error: 'AI returned malformed JSON', raw: cleaned },
      { status: 502 },
    )
  }

  const result = parsed as {
    engine?: string
    recommendedTypeName?: string
    reason?: string
    config?: unknown
  }

  // ---- Calibration: validate and fix the engine ----
  const validEngines = ['echarts', 'mermaid', 'infographic']
  let engine = result.engine
  if (!engine || !validEngines.includes(engine)) {
    engine = engineHint ?? 'echarts'
  }

  // ---- Calibration: validate and fix the config ----
  let config = result.config
  let calibrationNote: string | undefined

  if (!config || typeof config !== 'object') {
    // Config is missing or invalid — fall back to a safe default
    config = getSafeDefault(engine)
    calibrationNote = 'AI config was missing; a default template was applied.'
  } else {
    const calibrated = calibrateConfig(engine, config as Record<string, unknown>)
    config = calibrated.config
    if (calibrated.fixed) {
      calibrationNote = calibrated.note
    }
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

/**
 * Validate and calibrate a config object for the given engine.
 * Returns the fixed config and a note describing what was corrected.
 */
function calibrateConfig(
  engine: string,
  config: Record<string, unknown>,
): { config: unknown; fixed: boolean; note?: string } {
  const notes: string[] = []

  if (engine === 'echarts') {
    // Ensure required fields exist
    if (!config.type || typeof config.type !== 'string') {
      config.type = 'bar'
      notes.push('chart type')
    }
    if (!config.title || typeof config.title !== 'object') {
      config.title = { text: '', subtext: '' }
    }
    // Ensure arrays exist
    if (!Array.isArray(config.categories)) config.categories = []
    if (!Array.isArray(config.series_names)) config.series_names = []
    if (!Array.isArray(config.series_data)) config.series_data = []
    // For pie/funnel, ensure single_series_data
    if ((config.type === 'pie' || config.type === 'funnel') && !Array.isArray(config.single_series_data)) {
      config.single_series_data = []
    }
    // For radar, ensure radar_indicators
    if (config.type === 'radar' && !Array.isArray(config.radar_indicators)) {
      config.radar_indicators = []
    }
    // For scatter, ensure scatter_data
    if (config.type === 'scatter' && !Array.isArray(config.scatter_data)) {
      config.scatter_data = []
    }
    // For gauge, ensure gauge_value
    if (config.type === 'gauge' && typeof config.gauge_value !== 'number') {
      config.gauge_value = 0
      config.gauge_max = 100
    }
  } else if (engine === 'mermaid') {
    if (!config.type || typeof config.type !== 'string') {
      config.type = 'flowchart'
      notes.push('diagram type')
    }
    if (!config.code || typeof config.code !== 'string') {
      // Missing code — provide a minimal valid mermaid stub
      config.code = 'flowchart TD\n    A([Start]) --> B([End])'
      notes.push('mermaid code')
    }
    if (!config.theme || typeof config.theme !== 'string') {
      config.theme = 'default'
    }
    if (!config.background || typeof config.background !== 'string') {
      config.background = '#ffffff'
    }
  } else if (engine === 'infographic') {
    if (!config.template || typeof config.template !== 'string') {
      config.template = 'list-grid-compact-card'
      config.type = config.template
      notes.push('template id')
    }
    // Ensure type matches template
    config.type = config.template
    if (!config.data || typeof config.data !== 'object') {
      config.data = { title: { text: '' }, lists: [] }
      notes.push('data')
    } else {
      const data = config.data as Record<string, unknown>
      if (!data.lists && !data.nodes) {
        data.lists = []
      }
    }
    if (!config.theme) config.theme = 'light'
    if (!config.background) config.background = '#ffffff'
    if (typeof config.width !== 'number') config.width = 900
    if (typeof config.height !== 'number') config.height = 600
  }

  const fixed = notes.length > 0
  return {
    config,
    fixed,
    note: fixed ? `Calibrated missing fields: ${notes.join(', ')}.` : undefined,
  }
}

/**
 * Generate a safe default config for fallback when the AI output is unusable.
 */
function getSafeDefault(engine: string): unknown {
  if (engine === 'mermaid') {
    return {
      type: 'flowchart',
      code: 'flowchart TD\n    A([Start]) --> B{Decision}\n    B -->|Yes| C[Action]\n    B -->|No| D[End]\n    C --> D',
      theme: 'default',
      background: '#ffffff',
    }
  }
  if (engine === 'infographic') {
    return {
      type: 'list-grid-compact-card',
      template: 'list-grid-compact-card',
      data: {
        title: { text: '', subtext: '' },
        lists: [
          { label: 'Item 1', desc: '', value: 50 },
          { label: 'Item 2', desc: '', value: 50 },
          { label: 'Item 3', desc: '', value: 50 },
        ],
      },
      theme: 'light',
      background: '#ffffff',
      width: 900,
      height: 600,
    }
  }
  // echarts default
  return {
    title: { text: '', subtext: '' },
    type: 'bar',
    theme: 'default',
    legend: true,
    categories: ['A', 'B', 'C', 'D'],
    series_names: ['Series 1'],
    series_data: [[10, 20, 30, 40]],
    stack: false,
    smooth: false,
    horizontal: false,
    showLabel: true,
    showToolbox: true,
  }
}
