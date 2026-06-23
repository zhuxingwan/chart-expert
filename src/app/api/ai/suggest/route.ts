import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface SuggestBody {
  engine: 'echarts' | 'mermaid' | 'infographic'
  prompt: string
  currentType?: string
}

const SYSTEM_PROMPT = `You are a senior data visualization consultant. The user is a NON-technical person using a visual chart-making tool. Based on their natural-language description, you will:

1. Recommend the most suitable chart/diagram type
2. Generate a ready-to-use configuration object

You MUST respond with valid JSON only, no markdown fences, no extra text.

Output schema:
{
  "recommendedType": "<one of the type ids listed below>",
  "recommendedTypeName": "<human-readable Chinese name>",
  "reason": "<one short Chinese sentence explaining why this type>",
  "config": { ... engine-specific configuration ... }
}

=== ECharts types (engine: "echarts") ===
Available type ids: bar, line, pie, scatter, radar, funnel, gauge, heatmap, treemap, sunburst, sankey, graph, boxplot, candlestick
For echarts config, use the schema:
{
  "title": { "text": "string", "subtext": "string" },
  "series": [
    { "name": "string", "type": "<bar|line|pie|...>", "data": [number|{name,value}] }
  ],
  "categories": ["string", ...],   // x-axis categories for cartesian charts
  "series_names": ["string", ...], // names of multiple series (optional)
  "series_data": [[number,...], ...], // multi-series values, parallel to series_names
  "legend": true,
  "theme": "default|dark|vintage|macarons|westeros|wonderland",
  "stack": false,
  "smooth": false,
  "horizontal": false
}

=== Mermaid types (engine: "mermaid") ===
Available type ids: flowchart, sequence, class, state, er, gantt, journey, mindmap, pie, gitgraph, timeline
For mermaid config, use:
{
  "code": "<full mermaid source code as a single string>",
  "theme": "default|dark|forest|neutral|base"
}

=== AntV Infographic types (engine: "infographic") ===
Available type ids are template names from the @antv/infographic library (276 built-in templates).
Pick the closest template id from these popular ones:
- list-row-simple-horizontal-arrow, list-row-horizontal-icon-line, list-grid-compact-card, list-grid-badge-card, list-grid-progress-card, list-grid-circular-progress, list-pyramid-badge-card, list-sector-simple, list-waterfall-compact-card, list-zigzag-up-compact-card
- sequence-timeline-simple, sequence-timeline-done-list, sequence-timeline-rounded-rect-node, sequence-steps-badge-card, sequence-steps-simple, sequence-snake-steps-compact-card, sequence-snake-steps-pill-badge, sequence-roadmap-vertical-badge-card, sequence-roadmap-vertical-pill-badge, sequence-circular-simple, sequence-ascending-stairs-3d-simple, sequence-funnel-simple, sequence-pyramid-simple, sequence-interaction-default-badge-card, sequence-interaction-compact-capsule-item
- compare-binary-horizontal-simple-vs, compare-binary-horizontal-compact-card-arrow, compare-hierarchy-row-letter-card-compact-card, compare-hierarchy-left-right-circle-node-pill-badge, compare-swot, compare-quadrant-simple-illus
- hierarchy-tree-tech-style-capsule-item, hierarchy-tree-tech-style-compact-card, hierarchy-tree-distributed-origin-capsule-item, hierarchy-tree-curved-line-badge-card, hierarchy-tree-lr-tech-style-capsule-item, hierarchy-mindmap-default-capsule-item (if available), hierarchy-structure-default-compact-card (if available)
- relation-network-simple-circle-node, relation-network-icon-badge, relation-circle-icon-badge, relation-dagre-flow-tb-compact-card, relation-dagre-flow-lr-compact-card, relation-dagre-flow-tb-animated-capsule
- chart-pie-plain-text, chart-pie-donut-compact-card, chart-pie-pill-badge, chart-column-simple, chart-bar-plain-text, chart-line-plain-text, chart-wordcloud
For infographic config, use:
{
  "template": "<template id from above>",
  "data": {
    "title": { "text": "string", "subtext": "string" },
    "lists": [ { "label": "string", "desc": "string", "value": 0, "icon": "emoji-or-keyword", "children": [ ...recursive... ] } ],
    "nodes": [ { "id": "string", "label": "string", "group": "string" } ],
    "edges": [ { "from": "string", "to": "string", "label": "string" } ]
  },
  "theme": "light" | "dark" | "hand-drawn"
}
Rules for infographic:
- For list / sequence / chart templates, use "lists" array with simple flat items.
- For hierarchy templates, use "lists" with one root whose "children" form the tree.
- For relation templates, use "nodes" and "edges" (edge uses "from"/"to" referencing node ids).
- For compare templates, use "lists" with 2 (binary) or 4 (quadrant) top-level groups, each with children.
- "icon" can be a single emoji or a short keyword (e.g. "rocket", "trophy", "target").
- Always include a Chinese title in "data.title.text".

Rules:
- Always fill in concrete sample data based on the user's description (don't use "Lorem ipsum" placeholders).
- Use Chinese labels for the sample data unless the user writes English.
- Keep sample data small (5-12 entries) and realistic.
- For mermaid, write complete, syntactically-valid mermaid code.
- Output STRICT JSON only.`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestBody
    if (!body.engine || !body.prompt) {
      return NextResponse.json(
        { error: 'engine and prompt are required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Engine: ${body.engine}\nUser request: ${body.prompt}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content ?? ''
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
        { status: 502 }
      )
    }

    return NextResponse.json({ result: parsed })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}
