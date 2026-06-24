# Task I18N-DESCRIPTIONS — agent: main

## Goal
Translate template `description` strings the same way `name` strings are translated via `getEChartsTemplateName` / `getMermaidTemplateName` / `getInfographicTemplateName`. Descriptions were still rendered in English even after the user switched to Chinese.

## Changes

### `src/lib/i18n/template-names.ts` (408 → 1091 lines)
Added three new description maps and three new helper functions next to the existing name maps.

- `ECHARTS_DESCRIPTIONS` — covers **all 41 ECharts templates** across **9 locales** (en, zh, ja, ko, es, fr, de, pt, ru). The English section mirrors the source descriptions in `echarts-templates.ts`.
- `MERMAID_DESCRIPTIONS` — covers **all 11 Mermaid templates** across the same **9 locales**.
- `INFOGRAPHIC_DESCRIPTIONS` — covers **all 137 infographic templates** with **zh** translations only. For other locales, the helper falls back to the source English description (passed as `fallback`). This keeps the file size manageable while ensuring Chinese users (the primary non-English audience) see native descriptions. Each Chinese description is ≤15 chars per the task guideline.
- New helpers (added right after `getInfographicCategoryLabel`):
  - `getEChartsTemplateDescription(locale, id, fallback)`
  - `getMermaidTemplateDescription(locale, id, fallback)`
  - `getInfographicTemplateDescription(locale, id, fallback)` — uses optional chaining for the en fallback (`INFOGRAPHIC_DESCRIPTIONS.en?.[id]`) because the en section is intentionally omitted.

All helpers reuse the existing `resolveLocale()` function (which already maps e.g. `zh-CN` → `zh`, `pt-BR` → `pt`, and any unknown locale → `en`).

### `src/components/echarts-editor/echarts-editor.tsx`
- Added `getEChartsTemplateDescription` to the import block from `@/lib/i18n/template-names`.
- Template gallery card: `title={tpl.description}` → `title={getEChartsTemplateDescription(locale, tpl.id, tpl.description)}` and the visible description text now uses the same helper.

### `src/components/mermaid-editor/mermaid-editor.tsx`
- Added `getMermaidTemplateDescription` to the import.
- Template button tooltip: `title={tpl.description}` → `title={getMermaidTemplateDescription(locale, tpl.id, tpl.description)}`.

### `src/components/infographic-editor/infographic-editor.tsx`
- Added `getInfographicTemplateDescription` to the import block.
- Template card tooltip: `title={tpl.description}` → `title={getInfographicTemplateDescription(locale, tpl.id, tpl.description)}`.
- Template detail header: `<p>{template.description}</p>` → `<p>{getInfographicTemplateDescription(locale, template.id, template.description)}</p>`.

### `src/components/chart-tool/template-picker-dialog.tsx`
- Extended the existing import to also bring in `getEChartsTemplateDescription`, `getMermaidTemplateDescription`, `getInfographicTemplateDescription`.
- Added a new `getUnifiedTplDescription(locale, tpl)` helper that mirrors the existing `getUnifiedTplName` — dispatches to the right engine-specific helper based on `tpl.engine`.
- Search filter now also matches the translated description (alongside the source English one), so a Chinese user typing Chinese keywords will find templates whose translated description contains those keywords:
  ```ts
  tpl.name.toLowerCase().includes(kw) ||
  getUnifiedTplName(locale, tpl).toLowerCase().includes(kw) ||
  tpl.description.toLowerCase().includes(kw) ||
  getUnifiedTplDescription(locale, tpl).toLowerCase().includes(kw) ||
  tpl.tags.some((tag) => tag.toLowerCase().includes(kw))
  ```
- `TemplateCard` now renders `{getUnifiedTplDescription(locale, tpl)}` instead of `{tpl.description}`.

### Step 4 verification (other hardcoded strings)
The previous `I18N-COMPLETE` task already converted all hardcoded English strings in:
- echarts-editor (toolbar aria-labels, placeholders, hints, data editor labels, toast errors)
- mermaid-editor (toolbar aria-labels, code placeholder, templates count, fullscreen labels)
- infographic-editor (toolbar aria-labels, mode toggle, palette labels, compare editor placeholders, fullscreen labels)

I grep-confirmed there are no remaining hardcoded English strings in `placeholder=`, `title=`, `aria-label=`, or `label=` attributes for these editors. The only `tpl.description` / `template.description` references (which were the focus of this task) are now wrapped in the appropriate helper.

## Validation
- `bun run lint` → 0 errors, 0 warnings.
- Dev server stable on port 3000; recent requests for all three engines (echarts/mermaid/infographic) return HTTP 200.

## Summary
Template descriptions are now fully translatable using the same pattern as template names. Chinese users will see concise Chinese descriptions for all 41 ECharts templates, all 11 Mermaid templates, and all 137 infographic templates. Users in ja/ko/es/fr/de/pt/ru will see translated ECharts and Mermaid descriptions, while infographic descriptions fall back to English (acceptable per task spec). The unified template picker dialog uses a new `getUnifiedTplDescription` dispatcher and includes the translated description in keyword search.
