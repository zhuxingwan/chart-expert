# Task: URL-SYNC-EDITORS

## Agent
main

## Summary
Added an optional `onTemplateChange?: (templateId: string) => void` callback prop to all three editors (ECharts, Mermaid, Infographic) and wired them up in `chart-tool-app.tsx` so that template switches made *inside* an editor now propagate up to the parent `doc.templateId`. The existing `useEffect` that syncs `doc.templateId` → URL then keeps the `?chart=<engine>:<libraryType>` query param in sync automatically.

## Changes

### `src/components/echarts-editor/echarts-editor.tsx`
- Added `onTemplateChange?: (templateId: string) => void` to `EChartsEditorProps`.
- Added `onTemplateChange` to the destructure in `EChartsEditor(...)`.
- In `applyTemplate` (which is the single funnel called by both the gallery click handler and the chart-type `Select` via `onTemplateIdChange`), added `onTemplateChange?.('echarts:' + tpl.id)` after `setCurrentTemplateId(tpl.id)`.
- Added `onTemplateChange` to the `applyTemplate` useCallback dependency array so the closure stays correct.

### `src/components/mermaid-editor/mermaid-editor.tsx`
- Added `onTemplateChange?: (templateId: string) => void` to `MermaidEditorProps`.
- Added `onTemplateChange` to the destructure in `MermaidEditor(...)`.
- In `applyTemplate`, after `setLocal(...)`, added `onTemplateChange?.('mermaid:' + tpl.id)`.
- Added `onTemplateChange` to the `applyTemplate` useCallback dependency array.

### `src/components/infographic-editor/infographic-editor.tsx`
- Added `onTemplateChange?: (templateId: string) => void` to `InfographicEditorProps`.
- Added `onTemplateChange` to the destructure in `InfographicEditor(...)`.
- In `applyTemplate`, after `setLocal(...)`, added `onTemplateChange?.('infographic:' + tpl.id)`.
- Added `onTemplateChange` to the `applyTemplate` useCallback dependency array.

### `src/components/chart-tool/chart-tool-app.tsx`
- Passed `onTemplateChange={(tid) => setDoc((d) => (d ? { ...d, templateId: tid } : d))}` to all three editor instances (ECharts, Mermaid, Infographic).
- The existing `useEffect` on `[doc]` already calls `updateUrlChart(doc.templateId)` whenever `doc` changes, so the URL `?chart=<engine>:<libraryType>` is now kept in sync when the user switches templates from inside any editor's template gallery.

## Verification
- `bun run lint` — passes (no errors).
- Dev server is up on port 3000; `GET /?chart=echarts:bar` etc. continue to return 200.

## Notes / Risks
- The `onTemplateChange` prop is OPTIONAL (`?:`) so existing callers that don't pass it still work unchanged.
- The unified `templateId` format used is `<engine>:<libraryType>`:
  - ECharts: `echarts:<id>` (e.g. `echarts:bar`, `echarts:line`)
  - Mermaid: `mermaid:<id>` (e.g. `mermaid:flowchart`, `mermaid:sequence`)
  - Infographic: `infographic:<id>` (e.g. `infographic:list-row-simple-horizontal-arrow`)
- ECharts gallery click handler `onClick={() => applyTemplate(tpl)}` and the chart-type Select via `onTemplateIdChange` both funnel through `applyTemplate`, so a single call site covers both UI entry points.
- Mermaid and Infographic editors also have a single `applyTemplate` entry point used by their galleries, so both engine's template switches are covered.
