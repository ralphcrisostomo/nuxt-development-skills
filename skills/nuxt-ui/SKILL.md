---
name: nuxt-ui
description: Build UIs with @nuxt/ui v4 — 125+ accessible Vue components with Tailwind CSS theming. Use when creating interfaces, customizing themes to match a brand, building forms, or composing layouts like dashboards, docs sites, and chat interfaces.
---

# Nuxt UI

Vue component library on [Reka UI](https://reka-ui.com/) + [Tailwind CSS](https://tailwindcss.com/) + [Tailwind Variants](https://www.tailwind-variants.org/).

## When to Use

- Building UI with Nuxt, Vue (Vite), Laravel (Inertia), or AdonisJS (Inertia)
- Theming or branding a component library
- Creating forms, overlays, dashboards, docs, or chat layouts

## Installation (Nuxt)

```bash
pnpm add @nuxt/ui tailwindcss
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
```

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
```

Wrap app in `<UApp>` — required for toasts, tooltips, overlays, i18n (`locale` prop).

> **Vue/Vite/Inertia:** See [Nuxt UI install docs](https://ui.nuxt.com/getting-started/installation) for framework-specific setup.

## Icons

Uses [Iconify](https://iconify.design/) — 200,000+ icons. Format: `i-{collection}-{name}`.

```vue
<UIcon name="i-lucide-sun" class="size-5" />
<UButton icon="i-lucide-plus" label="Add" />
```

- Install collections: `pnpm i @iconify-json/lucide`
- Browse at [icones.js.org](https://icones.js.org). Default collection: `lucide`.
- Custom collections (Nuxt): set `icon.customCollections` in `nuxt.config.ts`.

## Theming & Branding

**Always use semantic utilities** (`text-default`, `bg-elevated`, `border-muted`), never raw palette colors.

7 semantic colors: `primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`.

```ts
// app.config.ts
export default defineAppConfig({
  ui: { colors: { primary: 'indigo', neutral: 'zinc' } }
})
```

**Override priority** (highest wins): `ui` prop / `class` prop > global config > theme defaults.

```vue
<UButton :ui="{ base: 'rounded-none', trailingIcon: 'size-3 rotate-90' }" />
<UCard :ui="{ header: 'bg-muted', body: 'p-8' }" />
```

Read slot names in generated theme files: `.nuxt/ui/<component>.ts`

> Full theming guide: [references/theming.md](references/theming.md)

## Composables

```ts
const toast = useToast()
toast.add({ title: 'Saved', color: 'success', icon: 'i-lucide-check' })

const overlay = useOverlay()
const modal = overlay.create(MyModal)
await modal.open({ title: 'Confirm' }).result

defineShortcuts({ meta_k: () => openSearch(), escape: () => close() })
```

> Full reference: [references/composables.md](references/composables.md)

## Forms & Overlays

- **Forms:** `<UForm :schema :state @submit>` + `<UFormField>` with Standard Schema (Zod, Valibot, Yup, Joi)
- **Modals:** `<UModal v-model:open title description>` with `#body` and `#footer` slots
- **Slideovers:** `<USlideover v-model:open title side>`
- **Dropdowns:** `<UDropdownMenu :items>` — flat array or nested array for grouped separators

> Full component reference: [references/components.md](references/components.md)

## Layouts

| Layout | Use case | Reference |
|---|---|---|
| Page | Landing, blog, pricing | [layouts/page.md](references/layouts/page.md) |
| Dashboard | Admin UI, sidebar, panels | [layouts/dashboard.md](references/layouts/dashboard.md) |
| Docs | Documentation, sidebar nav, TOC | [layouts/docs.md](references/layouts/docs.md) |
| Chat | AI chat, messages, prompt | [layouts/chat.md](references/layouts/chat.md) |
| Editor | Rich text, toolbars | [layouts/editor.md](references/layouts/editor.md) |

## Templates

Official starters at [github.com/nuxt-ui-templates](https://github.com/nuxt-ui-templates): Starter, Dashboard, SaaS, Landing, Docs, Portfolio, Chat, Editor, Changelog (Nuxt + Vue variants).

## References

Load based on task — **do not load all at once**:

- [references/theming.md](references/theming.md) — CSS variables, custom colors, component overrides
- [references/components.md](references/components.md) — all 125+ components with props and usage
- [references/composables.md](references/composables.md) — useToast, useOverlay, defineShortcuts
- Generated theme files — `.nuxt/ui/<component>.ts`
