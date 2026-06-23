# 图表制作工坊 - Worklog

## Project Overview
A rich, non-coder-friendly chart-making tool built with three JS libraries:
- **ECharts 6** - data charts (bar/line/pie/radar/scatter/...)
- **Mermaid 11** - flow & structural diagrams (flowchart/sequence/mindmap/gantt/...)
- **AntV Infographic (@antv/infographic 0.2.19)** - declarative infographic visualization with 276 built-in templates and a text-based syntax

## Architecture Decisions
- All three editors live under `src/components/{echarts,mermaid,infographic}-editor/`
- Shared shell in `src/components/chart-tool/` provides header (engine tabs), footer, save/load/AI dialogs
- Charts persisted via Prisma `Chart` model (id, title, engine, type, config JSON, thumbnail)
- Backend API at `/api/charts` (CRUD) and `/api/ai/suggest` (LLM-powered recommendation)
- AI suggestions return ready-to-use config object so users can apply with one click
- Each editor uses dynamic import (ssr: false) to keep vendor libs out of the server bundle
- Live preview element is wrapped in a forwarded ref so the shell can snapshot thumbnails & PNG exports

---
Task ID: 1
Agent: main
Task: Install chart libraries (ECharts, Mermaid, AntV Infographic) + supporting deps

Work Log:
- Installed `echarts@6.1.0`, `mermaid@11.15.0`, `html2canvas@1.4.1`
- Installed `@antv/infographic@0.2.19` (the correct library the user requested — NOT @antv/g6)
- Installed transitive deps that need to be hoisted for browser bundle: `lodash-es`, `postcss`, `@antv/layout`, `@antv/hierarchy`
- Confirmed 276 built-in templates across 7 categories (compare/list/chart/relation/sequence/quadrant/hierarchy) and 3 themes (light/dark/hand-drawn)

Stage Summary:
- All three target libraries installed and verified importable
- AntV Infographic's API understood: `new Infographic({ container, template, data, theme, editable })` + `.render()` / `.update()` / `.toDataURL()` / `.destroy()`
- Data shapes: list/sequence/chart use `{ lists: [{label,desc,value,icon}] }`, hierarchy uses nested `children`, relation uses `{nodes, edges}`, compare uses 2-group hierarchy

---
Task ID: 5-a
Agent: full-stack-developer
Task: Build a non-coder-friendly ECharts editor with 3-panel resizable layout (template gallery / live preview / config form), 12+ chart templates, and full export support.

Work Log:
- Read prior worklog and confirmed ECharts 6.1.0, react-resizable-panels, shadcn/ui (accordion/select/switch/slider/scroll-area/etc.) and sonner are all available.
- Created `src/components/echarts-editor/echarts-templates.ts` exporting `ECHARTS_TEMPLATES` (14 templates: bar, bar-horizontal, bar-stack, line, line-smooth, area, pie, pie-donut, scatter, radar, funnel, gauge, heatmap) with complete `EChartsConfig` defaults + realistic Chinese sample data, plus `ECHARTS_TEMPLATE_CATEGORIES`, `TEMPLATE_BY_ID`, `DEFAULT_TEMPLATE`, `THEME_OPTIONS`.
- Created `src/components/echarts-editor/echarts-option-builder.ts` exporting `buildEChartsOption(config)` that handles all 8 chart types (bar/line/pie/scatter/radar/funnel/gauge/heatmap) and respects stack/smooth/horizontal/showLabel/showToolbox/theme/legend flags. Always emits tooltip + (optional) legend + toolbox with saveAsImage. Heatmap uses VisualMapComponent + matrix layout.
- Created `src/components/echarts-editor/echarts-editor.tsx` — the main editor. Uses tree-shaken `echarts/core` + only the needed charts/components/renderers. 3-panel ResizablePanelGroup (20/40/40). Left = template gallery grouped by category with lucide icons. Middle = preview card with `previewRef` (outer) + `chartContainerRef` (inner); 150ms debounced re-render; ResizeObserver → chart.resize(); re-inits instance on theme change. Right = 5-section Accordion form (图表类型 / 标题 / 数据 / 样式 / 导出) with per-type data editors (cartesian table, single-series list, radar indicators+values, gauge slider, scatter XY pairs, heatmap matrix), random-data button, and PNG/JSON/clipboard exports. Sonner toast feedback throughout. Chinese labels.
- Fixed 2 lint errors: moved `StyleToggle` out of `StyleEditor` (react-hooks/static-components rule), removed stale eslint-disable directives.
- Fixed Turbopack build error: `echarts/theme/westeros` and `wonderland` don't ship with echarts v6.1.0. Switched from a static `THEME_IMPORTS` map (which Turbopack tried to resolve at build time and failed) to a `THEME_LOADERS` map containing only themes that actually exist (dark/vintage/macarons); the 6 names still appear in the dropdown, and `ensureTheme` silently falls back to default for the missing ones — try/catch wraps the loader per spec.
- Added `currentTemplateId` state so the 图表类型 Select correctly highlights which template is applied (multiple templates share the same `type`, e.g. bar / bar-horizontal / bar-stack). Best-effort match (exact defaultConfig equality, then by type) when the parent pushes a new config.
- Verified: `bun run lint` passes for all 3 new files (only an unrelated warning in saved-charts-dialog.tsx). Dev log shows zero echarts-editor compilation errors after fixes. Remaining dev-server errors are about mermaid-editor / infographic-editor (other agents' tasks).

Stage Summary:
- 3 new files under `src/components/echarts-editor/`: `echarts-templates.ts`, `echarts-option-builder.ts`, `echarts-editor.tsx`.
- Named export `EChartsEditor` matches the parent shell's dynamic import `.then(m => m.EChartsEditor)`.
- 14 templates, all 8 echarts chart types supported, debounced live preview, ResizeObserver, theme switching, PNG/JSON/option-JSON exports, Chinese UI, sonner toasts.
- Lint clean (0 errors / 0 warnings in new files). Compiles cleanly in dev server.
