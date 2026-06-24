/**
 * Client-side AI suggestion — calls noterich.com API directly.
 * Used in static export mode (no server-side API routes).
 */

async function generateRequestSignature(method: string, path: string, timestamp: number): Promise<string> {
  const domain = 'noterich.com'
  const key = `${domain}::noterich_sig_v1`
  const payload = `${method.toUpperCase()}|${path}|${timestamp}`
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const SYSTEM_PROMPT = `You are a senior data visualization consultant in a NON-technical, multilingual chart tool. Pick the right library automatically.

Respond with valid JSON only:
{"engine":"echarts"|"mermaid"|"infographic","recommendedTypeName":"<name>","reason":"<sentence>","config":{...}}

- echarts: numerical data (bar,line,pie,scatter,radar,funnel,gauge,heatmap,etc.)
- mermaid: flow diagrams (flowchart,sequence,state,er,gantt,journey,mindmap,timeline,etc.)
- infographic: visual presentations (steps,roadmaps,comparisons,org charts,SWOT,etc.)
- EXTRACT real data from user prompt EXACTLY.
- Generate ALL text in user's locale.
- Infographic: title≤30 chars, label≤20 chars, desc≤40 chars. icon="mingcute/icon-name".
- STRICT JSON only.`

export async function suggestChart(body: {
  engine?: 'echarts' | 'mermaid' | 'infographic'
  prompt: string
  locale?: string
  imageDataUrl?: string
}): Promise<any> {
  const locale = body.locale ?? 'en'
  const promptText = body.prompt?.trim() || 'Analyze the image and create the best chart.'

  const messageContent: any[] = []
  if (body.imageDataUrl) {
    messageContent.push({ image_url: { url: body.imageDataUrl }, type: 'image_url' })
  }
  messageContent.push({ text: `Locale: ${locale}\nUser request: ${promptText}`, type: 'text' })

  const payload = {
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: messageContent },
    ],
    stream: false,
    temperature: 0.7,
    top_p: 0.95,
  }

  const timestamp = Date.now()
  const apiUrl = 'https://www.noterich.com/api.php?api=general&path=/v1/chat/completions'
  const signature = await generateRequestSignature('POST', '/v1/chat/completions', timestamp)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Sig': signature,
      'X-Request-Ts': timestamp.toString(),
      'X-Request-Dom': btoa('noterich.com'),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) throw new Error(`AI API error: ${response.status}`)
  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content ?? ''
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned)
}
