# Worklog for REFACTOR-CDN task

- **Task ID**: REFACTOR-CDN
- **Agent**: full-stack-developer
- **Task**: Refactor three editor components (echarts / mermaid / infographic) to use CDN-loaded globals instead of bundled imports, to prevent the Next.js dev server from OOMing when webpack tries to compile 200MB+ of vendor source.

## Files modified

1. `src/components/echarts-editor/echarts-editor.tsx`
   - Removed `echarts/core`, `echarts/charts`, `echarts/components`, `echarts/renderers` imports.
   - Added `import { useVizLibs, getECharts } from '@/lib/viz-libs/cdn-loader'` + `Loader2` from lucide.
   - Deleted `echarts.use([...])` block, `THEME_LOADED`, `THEME_LOADERS`, `ensureTheme` — themes are passed directly to `echarts.init(dom, themeName)`.
   - `renderChart` now calls `getECharts()` lazily and bails if not loaded; `chartRef` typed as `any`.
   - Added `echartsLoaded` flag from `useVizLibs()`; debounced re-render effect depends on it.
   - Added a `Loader2` spinner overlay ("正在加载图表库…") over the preview area when `!echartsLoaded`.

2. `src/components/echarts-editor/echarts-option-builder.ts`
   - Removed `import type { EChartsCoreOption } from 'echarts/core'`.
   - Defined local `type EChartsOption = Record<string, unknown>` and used it for the function return type + `base` object.

3. `src/components/echarts-editor/echarts-templates.ts`
   - Removed `westeros` and `wonderland` from `THEME_OPTIONS` (not shipped with the CDN build). Kept: default, dark, vintage, macarons.

4. `src/components/mermaid-editor/mermaid-editor.tsx`
   - Removed `import mermaid from 'mermaid'`.
   - Added `import { useVizLibs, getMermaid } from '@/lib/viz-libs/cdn-loader'` + `Loader2`.
   - In `PreviewPanel`, added `useVizLibs()` + `mermaidLoaded` flag.
   - Both `mermaid.initialize` and `mermaid.render` effects call `getMermaid()` lazily, gated on `mermaidLoaded`.
   - Added spinner overlay over the canvas when `!mermaidLoaded`.

5. `src/components/infographic-editor/infographic-editor.tsx`
   - Removed `import { Infographic as InfographicEngine } from '@antv/infographic'`.
   - Added `import { useVizLibs, getInfographic } from '@/lib/viz-libs/cdn-loader'` + `Loader2`.
   - In `PreviewPanel`, added `useVizLibs()` + `infographicLoaded` flag; `engineRef` typed as `any`.
   - Engine-creation effect calls `getInfographic()` lazily, gated on `infographicLoaded`, re-creates engine when status flips. Render effect similarly gated.
   - Added spinner overlay over the canvas when `!infographicLoaded`.

6. `src/components/chart-tool/chart-tool-app.tsx`
   - Imported `VizLibLoader` from `@/lib/viz-libs/cdn-loader`.
   - Wrapped the entire returned JSX tree with `<VizLibLoader>…</VizLibLoader>` so all editors can read CDN status via context.

## Key decisions

- **Lazy access pattern**: Each editor calls `getECharts()` / `getMermaid()` / `getInfographic()` inside the relevant effect (not at module load). This is safe because the editors are loaded via `next/dynamic({ ssr: false })`, so they only run in the browser.
- **Loading state UX**: All three editors render a centered `Loader2` spinner with the text "正在加载图表库…" overlaid on the preview area while the CDN scripts load. The actual preview container (with its ref) is always mounted so refs and ResizeObservers stay valid; only the overlay appears/disappears.
- **Effect dependency on load status**: The render effects depend on the new `*Loaded` boolean so they re-fire when the CDN finishes loading. The very first render happens via the existing debounced effect — no extra "kick" effect needed.
- **Type strategy**: Since `echarts`, `@antv/infographic` are externalized via webpack, TypeScript can't resolve their types. Used `any` for `chartRef` / `engineRef`, and a local `Record<string, unknown>` alias for the echarts option type. `next.config.ts` already has `typescript.ignoreBuildErrors: true`, but using `any` keeps ESLint happy too.
- **Themes**: The CDN full build of echarts ships `dark`, `vintage`, `macarons` (and `default`). Removed `westeros` / `wonderland` from the picker since they aren't in the CDN bundle. Unknown theme names passed to `echarts.init(dom, name)` silently fall back to default — no try/catch needed.

## Acceptance check

- `bun run lint` → exit code 0, no errors, no warnings.
- `rg "from ['\"](echarts|echarts/|mermaid|@antv/infographic)['\"]"` under `src/` → no matches (all imports removed).
- `rg "echarts\.use|ensureTheme|THEME_LOADERS|THEME_LOADED|echarts\.ECharts"` → only a documentation comment remains; no actual code references.
- Prop signatures (`config`, `onChange`, `previewRef`) unchanged on all three editors — parent shell unaffected.
- All features preserved: template galleries, data editors, export buttons (PNG/JSON/SVG/clipboard), theme switching, random data, AI suggestion flow.

## What this fixes

The Next.js dev server was OOMing when webpack tried to compile the heavy viz libraries (echarts 62MB, mermaid 76MB, @antv/infographic 17MB) into the client bundle. With `next.config.ts` externalizing these three imports to CDN globals and the editors now using `getECharts()` / `getMermaid()` / `getInfographic()` instead of `import`, the webpack bundle no longer pulls in that vendor source — client compilation should stay well within memory limits.
