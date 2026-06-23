import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface SuggestBody {
  engine: 'echarts' | 'mermaid' | 'antv-g6'
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

=== AntV G6 types (engine: "antv-g6") ===
Available type ids: force-network, tree-dendrogram, dagre-flow, radial-tree, compact-box
For antv-g6 config, use:
{
  "layout": "<force|dendrogram|dagre|radial|compactBox>",
  "nodes": [ { "id": "string", "label": "string", "group": "string" } ],
  "edges": [ { "source": "string", "target": "string", "label": "string" } ],
  "theme": "default|dark"
}

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
