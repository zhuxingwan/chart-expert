# Worklog for ECharts editor task (5-a)

- Task: Build a non-coder-friendly ECharts editor with 3-panel layout, template gallery, live preview, and full config form.
- Files created:
  - `src/components/echarts-editor/echarts-templates.ts` — 14 templates across 8 categories (bar, bar-horizontal, bar-stack, line, line-smooth, area, pie, pie-donut, scatter, radar, funnel, gauge, heatmap) with complete EChartsConfig defaults.
  - `src/components/echarts-editor/echarts-option-builder.ts` — `buildEChartsOption(config)` handles all 8 chart types (bar/line/pie/scatter/radar/funnel/gauge/heatmap) plus area (line+areaStyle) and stack variants.
  - `src/components/echarts-editor/echarts-editor.tsx` — main editor component with named `EChartsEditor` export (consumed by chart-tool-app via `m.EChartsEditor`).

## Key decisions

- **Theme support**: Only `dark`, `vintage`, `macarons` actually ship with echarts v6.1.0 (no `westeros`/`wonderland` files). All 6 names are still surfaced in the UI per the spec; `ensureTheme` only attempts to load themes whose modules exist and silently falls back for the rest. Themes are loaded via statically analyzable dynamic imports so Turbopack can code-split them.
- **Tree-shaken echarts**: `echarts/core` + only the chart/component/renderer modules we actually use are registered via `echarts.use([...])` — keeps the bundle lean.
- **Template tracking**: Added `currentTemplateId` state so the 图表类型 Select can show the right value (since multiple templates share a `type`, e.g. `bar` / `bar-horizontal` / `bar-stack`). When the parent pushes a config (AI suggestion / loaded chart), we best-effort match by exact defaultConfig equality, then by type.
- **Infinite-loop guard**: A `lastAppliedKey` ref tracks the JSON-stringified config we last applied. The effect that accepts new `config` from props only fires `setLocal` when the JSON differs.
- **No components created during render**: `StyleToggle` is declared as a top-level function (not inline inside `StyleEditor`) to satisfy the `react-hooks/static-components` ESLint rule.
- **Chinese labels** throughout, with `sonner` toast feedback on template switch / random data / exports.

## Editor layout

- **Left panel (20%, min 14%)**: Template gallery grouped by category, each card shows the chart-type icon and description.
- **Middle panel (40%, min 30%)**: Live preview card with `previewRef` on the outer wrapper and `chartContainerRef` on the inner div. Re-renders debounced 150ms; ResizeObserver calls `chart.resize()`.
- **Right panel (40%, min 30%)**: 5-section Accordion form (图表类型 / 标题 / 数据 / 样式 / 导出). The data section adapts per chart type (cartesian table, single-series list, radar indicators+values, gauge slider, scatter XY pairs, heatmap matrix). Random-data button included.

## Acceptance check

- `bun run lint` passes for all 3 new files (0 errors, 0 warnings from my files).
- Dev log shows no echarts-editor compilation errors after the fixes.
- All 12+ templates have complete default configs; option builder handles every type.
- PNG export uses `chart.getDataURL({type:'png', pixelRatio:2, backgroundColor:'#fff'})` and triggers download via a synthetic `<a>` click.
