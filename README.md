# Opalite UI

A free, drop-in web component library. **One script tag, ready-to-use HTML components.** No framework, no build step, no dependencies.

```html
<script src="https://cdn.jsdelivr.net/gh/moistmoi/opalite-ui@main/dist/opalite-ui.js"></script>

<opalite-button variant="primary">Click me</opalite-button>
<opalite-modal title="Hello">
  <opalite-button slot="trigger">Open</opalite-button>
  Content goes here.
</opalite-modal>
```

## Components

| Component | Description |
|---|---|
| `<opalite-button>` | Variants, loading state, icon-only |
| `<opalite-modal>` | Dialog with backdrop, Esc-to-close, slot-based trigger |
| `<opalite-dropdown>` | Menu with click-outside dismiss |
| `<opalite-tabs>` + `<opalite-tab>` | Pill-style switching tabs |
| `<opalite-accordion>` + `<opalite-accordion-item>` | Expand/collapse panels |
| `<opalite-toaster>` + `window.opalite.toast()` | Stacking notifications |

See the docs site (`index.html`) for live previews and full attribute reference.

## Theming

Every component reads from CSS custom properties. Override globally or per-element:

```css
:root {
  --opalite-bg: #4f46e5;        /* primary button bg */
  --opalite-radius: 0.75rem;     /* border radius across all components */
  --opalite-danger: #ef4444;
}
```

```html
<opalite-button style="--opalite-bg: #10b981">Custom green</opalite-button>
```

Available tokens (set in `dist/opalite-ui.js`):
- `--opalite-bg`, `--opalite-bg-hover`, `--opalite-fg` — primary button colors
- `--opalite-surface`, `--opalite-surface-2` — backgrounds
- `--opalite-border`, `--opalite-text`, `--opalite-text-muted`
- `--opalite-danger`, `--opalite-danger-hover`
- `--opalite-radius`, `--opalite-shadow`, `--opalite-ring`, `--opalite-font`

## Publishing to GitHub (one-time setup)

1. Create a new GitHub repo. Name it `opalite-ui` (or whatever you like).
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/moistmoi/opalite-ui.git
   git push -u origin main
   ```
3. **Settings → Pages → Source: Deploy from a branch → main / root → Save.** Docs site goes live at `https://moistmoi.github.io/opalite-ui/`.
4. The library itself is served automatically by [jsDelivr](https://www.jsdelivr.com/) from your repo:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/moistmoi/opalite-ui@main/dist/opalite-ui.js"></script>
   ```
   Replace `@main` with `@v1.0.0` once you tag a release for cache-stable URLs.

## Adding a new component

1. Open `dist/opalite-ui.js` and add a new class extending `HTMLElement`:
   ```js
   class OpaliteBadge extends HTMLElement {
     constructor() {
       super();
       this.attachShadow({ mode: 'open' });
       this.shadowRoot.innerHTML = `
         <style>
           ${tokens}
           :host { display: inline-block; }
           .badge { padding: 0.125rem 0.5rem; border-radius: 999px;
                    background: var(--opalite-surface-2); font-size: 0.75rem; }
         </style>
         <span class="badge"><slot></slot></span>
       `;
     }
   }
   customElements.define('opalite-badge', OpaliteBadge);
   ```
2. Copy any file in `components/` and rename (e.g. `badge.html`). Update the title, h1, and demo block.
3. Add a card on the landing page (`index.html`, inside `#components` grid).

## Project structure

```
.
├── index.html              ← landing + component grid
├── components/             ← one docs page per component
│   ├── button.html
│   ├── modal.html
│   ├── dropdown.html
│   ├── tabs.html
│   ├── accordion.html
│   └── toast.html
├── dist/
│   └── opalite-ui.js         ← the entire library, single file
├── assets/
│   └── preview.js          ← docs-site-only: preview + copy-code system
└── README.md
```

## How it works

Every component is a [Custom Element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) with a Shadow DOM. Styles are encapsulated inside each component, so they never collide with your page's CSS. Interactivity is plain DOM events — no framework involved.

End-users get ONE script tag because everything (components, styles, JS) is bundled into `dist/opalite-ui.js`.

## License

MIT.
