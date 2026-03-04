---
name: visual-development-skill
description: "Use when developing or modifying visual elements (components, pages, layouts, styling). Covers Playwright screenshots, Compodium component preview, responsive/dark-mode verification, and the iteration loop."
---

# Visual Development Workflow

When developing or modifying any visual element (components, pages, layouts, styling), you **must** visually verify your work using Playwright screenshots and Compodium. Do not rely on code alone for UI changes.

## Setup

1. Start the dev server in the background: `bun run dev`
2. Wait for the server to be ready (listen on `localhost:3000` or the next available port)

## Verifying Pages and Layouts

Use Playwright to screenshot full pages after making changes:

```bash
npx playwright screenshot --wait-for-timeout=3000 http://localhost:3000/your-page /tmp/screenshot.png
```

Then read the screenshot with the `Read` tool to visually inspect the result.

- Always screenshot the page **after each meaningful visual change** (layout shifts, new sections, styling updates)
- For dark mode, append `?dark=true` or toggle via the app and take a second screenshot
- For responsive design, use `--viewport-size=375,812` (mobile) and `--viewport-size=1280,720` (desktop)

## Verifying Individual Components

Use **Compodium** to preview components in isolation at `http://localhost:3000/__compodium__/devtools`.

Screenshot the Compodium renderer to inspect a specific component:

```bash
npx playwright screenshot --wait-for-timeout=3000 "http://localhost:3000/__compodium__/devtools" /tmp/compodium.png
```

Compodium auto-discovers all components in `app/components/` — no stories needed.

## Iteration Loop

1. Make a visual change (template, styles, component props)
2. Screenshot the affected page or component
3. Read the screenshot to verify the result
4. If it doesn't look right, adjust and repeat
5. Only move on when the visual output matches the intent

## Key Flags

| Flag | Purpose |
|------|---------|
| `--wait-for-timeout=3000` | Wait for hydration/rendering |
| `--viewport-size=375,812` | Mobile viewport |
| `--viewport-size=1280,720` | Desktop viewport |
| `--full-page` | Capture entire scrollable page |
| `--color-scheme dark` | Force dark color scheme |
