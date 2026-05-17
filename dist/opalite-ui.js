/*!
 * Opalite UI — A free web component library
 * MIT License
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/gh/YOU/opalite-ui@main/dist/opalite-ui.js"></script>
 *   <opalite-button variant="primary">Click me</opalite-button>
 */
(function () {
  'use strict';

  // ---------- Shared design tokens (overridable via CSS variables on the host) ----------
  const tokens = `
    :host {
      --opalite-font: 'Inter', system-ui, -apple-system, sans-serif;
      --opalite-radius: 0.5rem;
      --opalite-bg: #18181b;
      --opalite-bg-hover: #27272a;
      --opalite-fg: #ffffff;
      --opalite-surface: #ffffff;
      --opalite-surface-2: #fafafa;
      --opalite-border: #e4e4e7;
      --opalite-text: #18181b;
      --opalite-text-muted: #71717a;
      --opalite-danger: #dc2626;
      --opalite-danger-hover: #b91c1c;
      --opalite-ring: rgba(24, 24, 27, 0.15);
      --opalite-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      font-family: var(--opalite-font);
      box-sizing: border-box;
    }
    *, *::before, *::after { box-sizing: border-box; }
  `;

  function styled(tag, styles, render) {
    return class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }
      connectedCallback() { this._render(); this._mount && this._mount(); }
      attributeChangedCallback() { if (this.shadowRoot.firstChild) this._update && this._update(); }
      _render() {
        this.shadowRoot.innerHTML = `<style>${tokens}${styles}</style>${render(this)}`;
      }
    };
  }

  // ============================================================
  // <opalite-button>
  // ============================================================
  class OpaliteButton extends HTMLElement {
    static get observedAttributes() { return ['variant', 'loading', 'disabled', 'icon-only']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ${tokens}
          button {
            font: inherit;
            font-weight: 500;
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
            border-radius: var(--opalite-radius);
            border: 1px solid transparent;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: background 120ms, transform 80ms, opacity 120ms;
            user-select: none;
          }
          button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px var(--opalite-ring);
          }
          button:active:not(:disabled) { transform: scale(0.97); }
          button:disabled { opacity: 0.6; cursor: not-allowed; }

          :host([variant="primary"]) button,
          :host(:not([variant])) button {
            background: var(--opalite-bg);
            color: var(--opalite-fg);
          }
          :host([variant="primary"]) button:hover:not(:disabled),
          :host(:not([variant])) button:hover:not(:disabled) {
            background: var(--opalite-bg-hover);
          }

          :host([variant="secondary"]) button {
            background: var(--opalite-surface);
            color: var(--opalite-text);
            border-color: var(--opalite-border);
          }
          :host([variant="secondary"]) button:hover:not(:disabled) {
            background: var(--opalite-surface-2);
          }

          :host([variant="ghost"]) button {
            background: transparent;
            color: var(--opalite-text);
          }
          :host([variant="ghost"]) button:hover:not(:disabled) {
            background: var(--opalite-surface-2);
          }

          :host([variant="danger"]) button {
            background: var(--opalite-danger);
            color: #fff;
          }
          :host([variant="danger"]) button:hover:not(:disabled) {
            background: var(--opalite-danger-hover);
          }

          :host([icon-only]) button {
            padding: 0.5rem;
            width: 2.5rem;
            height: 2.5rem;
          }

          .spinner {
            width: 1em; height: 1em;
            border: 2px solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          :host { display: inline-block; }
        </style>
        <button part="button">
          <span class="spinner" hidden></span>
          <slot></slot>
        </button>
      `;
      this._btn = this.shadowRoot.querySelector('button');
      this._spinner = this.shadowRoot.querySelector('.spinner');
    }
    connectedCallback() { this._update(); }
    attributeChangedCallback() { this._update(); }
    _update() {
      const disabled = this.hasAttribute('disabled') || this.hasAttribute('loading');
      this._btn.disabled = disabled;
      this._spinner.hidden = !this.hasAttribute('loading');
    }
  }
  customElements.define('opalite-button', OpaliteButton);

  // ============================================================
  // <opalite-modal>
  // ============================================================
  class OpaliteModal extends HTMLElement {
    static get observedAttributes() { return ['open', 'title']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ${tokens}
          :host { display: contents; }
          .backdrop {
            position: fixed; inset: 0;
            background: rgba(24, 24, 27, 0.5);
            backdrop-filter: blur(4px);
            display: grid;
            place-items: center;
            padding: 1rem;
            z-index: 50;
            opacity: 0;
            pointer-events: none;
            transition: opacity 180ms ease;
          }
          :host([open]) .backdrop {
            opacity: 1;
            pointer-events: auto;
          }
          .panel {
            background: var(--opalite-surface);
            color: var(--opalite-text);
            border-radius: calc(var(--opalite-radius) * 2);
            box-shadow: var(--opalite-shadow);
            width: 100%;
            max-width: 28rem;
            padding: 1.5rem;
            transform: scale(0.96);
            transition: transform 180ms ease;
          }
          :host([open]) .panel { transform: scale(1); }
          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          .title {
            font-size: 1.125rem;
            font-weight: 600;
            margin: 0;
          }
          .close {
            background: none;
            border: 0;
            cursor: pointer;
            color: var(--opalite-text-muted);
            padding: 0;
            line-height: 1;
            font-size: 1.25rem;
          }
          .close:hover { color: var(--opalite-text); }
          .footer { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem; }
          .footer:empty { display: none; }
        </style>
        <slot name="trigger"></slot>
        <div class="backdrop" part="backdrop">
          <div class="panel" part="panel" role="dialog" aria-modal="true">
            <div class="header">
              <h3 class="title" id="title"></h3>
              <button class="close" aria-label="Close">&times;</button>
            </div>
            <div class="body"><slot></slot></div>
            <div class="footer"><slot name="footer"></slot></div>
          </div>
        </div>
      `;
      this._backdrop = this.shadowRoot.querySelector('.backdrop');
      this._panel = this.shadowRoot.querySelector('.panel');
      this._titleEl = this.shadowRoot.querySelector('#title');
      this._closeBtn = this.shadowRoot.querySelector('.close');
      this._triggerSlot = this.shadowRoot.querySelector('slot[name="trigger"]');
    }
    connectedCallback() {
      this._updateTitle();
      this._closeBtn.addEventListener('click', () => this.hide());
      this._backdrop.addEventListener('click', (e) => {
        if (e.target === this._backdrop) this.hide();
      });
      this._onKey = (e) => { if (e.key === 'Escape' && this.hasAttribute('open')) this.hide(); };
      window.addEventListener('keydown', this._onKey);
      this._triggerSlot.addEventListener('slotchange', () => this._wireTrigger());
      this._wireTrigger();
      // Close from any descendant with [data-close]
      this.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) this.hide();
      });
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
    }
    attributeChangedCallback(name) {
      if (name === 'title') this._updateTitle();
      if (name === 'open') document.body.style.overflow = this.hasAttribute('open') ? 'hidden' : '';
    }
    _updateTitle() { this._titleEl.textContent = this.getAttribute('title') || ''; }
    _wireTrigger() {
      const nodes = this._triggerSlot.assignedElements();
      nodes.forEach((n) => {
        if (!n._opaliteWired) {
          n.addEventListener('click', () => this.show());
          n._opaliteWired = true;
        }
      });
    }
    show() { this.setAttribute('open', ''); }
    hide() { this.removeAttribute('open'); }
  }
  customElements.define('opalite-modal', OpaliteModal);

  // ============================================================
  // <opalite-dropdown>
  // ============================================================
  class OpaliteDropdown extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ${tokens}
          :host { display: inline-block; position: relative; }
          .menu {
            position: absolute;
            top: calc(100% + 0.5rem);
            left: 0;
            min-width: 12rem;
            background: var(--opalite-surface);
            border: 1px solid var(--opalite-border);
            border-radius: var(--opalite-radius);
            box-shadow: var(--opalite-shadow);
            padding: 0.25rem;
            display: none;
            z-index: 20;
            opacity: 0;
            transform: translateY(-4px);
            transition: opacity 120ms, transform 120ms;
          }
          :host([open]) .menu {
            display: block;
            opacity: 1;
            transform: translateY(0);
          }
          ::slotted(a), ::slotted(button) {
            display: block;
            padding: 0.5rem 0.75rem;
            font: inherit;
            font-size: 0.875rem;
            color: var(--opalite-text);
            background: transparent;
            border: 0;
            text-align: left;
            width: 100%;
            text-decoration: none;
            border-radius: calc(var(--opalite-radius) - 2px);
            cursor: pointer;
          }
          ::slotted(a:hover), ::slotted(button:hover) {
            background: var(--opalite-surface-2);
          }
          ::slotted(hr) {
            border: 0;
            border-top: 1px solid var(--opalite-border);
            margin: 0.25rem 0;
          }
        </style>
        <slot name="trigger"></slot>
        <div class="menu" part="menu"><slot></slot></div>
      `;
      this._triggerSlot = this.shadowRoot.querySelector('slot[name="trigger"]');
    }
    connectedCallback() {
      this._triggerSlot.addEventListener('slotchange', () => this._wireTrigger());
      this._wireTrigger();
      this._onDocClick = (e) => {
        if (!this.contains(e.target) && !e.composedPath().includes(this)) this.close();
      };
      document.addEventListener('click', this._onDocClick);
      this._onKey = (e) => { if (e.key === 'Escape') this.close(); };
      window.addEventListener('keydown', this._onKey);
      // Close when an item is clicked
      this.addEventListener('click', (e) => {
        if (e.target.closest('a, button') && e.target.slot !== 'trigger') this.close();
      });
    }
    disconnectedCallback() {
      document.removeEventListener('click', this._onDocClick);
      window.removeEventListener('keydown', this._onKey);
    }
    _wireTrigger() {
      const [el] = this._triggerSlot.assignedElements();
      if (el && !el._opaliteWired) {
        el.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
        el._opaliteWired = true;
      }
    }
    toggle() { this.hasAttribute('open') ? this.close() : this.open(); }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }
  }
  customElements.define('opalite-dropdown', OpaliteDropdown);

  // ============================================================
  // <opalite-tabs> + <opalite-tab>
  // ============================================================
  class OpaliteTabs extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ${tokens}
          :host { display: block; }
          .bar {
            display: inline-flex;
            gap: 0.25rem;
            padding: 0.25rem;
            background: var(--opalite-surface-2);
            border-radius: var(--opalite-radius);
          }
          .tab {
            font: inherit;
            font-size: 0.875rem;
            font-weight: 500;
            padding: 0.375rem 0.875rem;
            border-radius: calc(var(--opalite-radius) - 2px);
            border: 0;
            cursor: pointer;
            background: transparent;
            color: var(--opalite-text-muted);
            transition: background 120ms, color 120ms;
          }
          .tab:hover { color: var(--opalite-text); }
          .tab.active {
            background: var(--opalite-surface);
            color: var(--opalite-text);
            box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          }
          .panels {
            margin-top: 1rem;
            padding: 1.25rem;
            border: 1px solid var(--opalite-border);
            border-radius: var(--opalite-radius);
            background: var(--opalite-surface);
          }
        </style>
        <div class="bar" part="bar"></div>
        <div class="panels" part="panels"><slot></slot></div>
      `;
      this._bar = this.shadowRoot.querySelector('.bar');
    }
    connectedCallback() {
      this._render();
      this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._render());
    }
    _render() {
      const tabs = [...this.querySelectorAll('opalite-tab')];
      if (!tabs.length) return;
      const activeIndex = Math.max(0, tabs.findIndex(t => t.hasAttribute('active')));
      this._bar.innerHTML = '';
      tabs.forEach((tab, i) => {
        const label = tab.getAttribute('label') || `Tab ${i + 1}`;
        const btn = document.createElement('button');
        btn.className = 'tab' + (i === activeIndex ? ' active' : '');
        btn.textContent = label;
        btn.addEventListener('click', () => this._select(i));
        this._bar.appendChild(btn);
        tab.style.display = i === activeIndex ? '' : 'none';
      });
    }
    _select(index) {
      const tabs = [...this.querySelectorAll('opalite-tab')];
      tabs.forEach((tab, i) => {
        tab.style.display = i === index ? '' : 'none';
        if (i === index) tab.setAttribute('active', '');
        else tab.removeAttribute('active');
      });
      [...this._bar.children].forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
      });
    }
  }
  customElements.define('opalite-tabs', OpaliteTabs);

  class OpaliteTab extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>:host { display: block; }</style><slot></slot>`;
    }
  }
  customElements.define('opalite-tab', OpaliteTab);

  // ============================================================
  // <opalite-accordion> + <opalite-accordion-item>
  // ============================================================
  class OpaliteAccordion extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ${tokens}
          :host {
            display: block;
            border: 1px solid var(--opalite-border);
            border-radius: var(--opalite-radius);
            background: var(--opalite-surface);
            overflow: hidden;
          }
          ::slotted(opalite-accordion-item:not(:last-child)) {
            border-bottom: 1px solid var(--opalite-border);
          }
        </style>
        <slot></slot>
      `;
    }
    connectedCallback() {
      this.addEventListener('opalite-accordion-open', (e) => {
        if (this.hasAttribute('single')) {
          this.querySelectorAll('opalite-accordion-item').forEach((item) => {
            if (item !== e.target) item.removeAttribute('open');
          });
        }
      });
    }
  }
  customElements.define('opalite-accordion', OpaliteAccordion);

  class OpaliteAccordionItem extends HTMLElement {
    static get observedAttributes() { return ['open', 'header']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ${tokens}
          :host { display: block; }
          .header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            background: transparent;
            border: 0;
            cursor: pointer;
            font: inherit;
            font-weight: 500;
            font-size: 0.95rem;
            color: var(--opalite-text);
            text-align: left;
          }
          .header:hover { background: var(--opalite-surface-2); }
          .chevron {
            transition: transform 200ms;
            color: var(--opalite-text-muted);
          }
          :host([open]) .chevron { transform: rotate(180deg); }
          .body {
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows 200ms ease;
          }
          :host([open]) .body { grid-template-rows: 1fr; }
          .body-inner {
            overflow: hidden;
            padding: 0 1.25rem;
            color: var(--opalite-text-muted);
            font-size: 0.9rem;
          }
          :host([open]) .body-inner {
            padding-bottom: 1rem;
          }
        </style>
        <button class="header" part="header">
          <span class="label"></span>
          <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="body"><div class="body-inner"><slot></slot></div></div>
      `;
      this._label = this.shadowRoot.querySelector('.label');
      this._header = this.shadowRoot.querySelector('.header');
    }
    connectedCallback() {
      this._update();
      this._header.addEventListener('click', () => {
        if (this.hasAttribute('open')) this.removeAttribute('open');
        else {
          this.setAttribute('open', '');
          this.dispatchEvent(new CustomEvent('opalite-accordion-open', { bubbles: true }));
        }
      });
    }
    attributeChangedCallback() { this._update(); }
    _update() {
      this._label.textContent = this.getAttribute('header') || '';
    }
  }
  customElements.define('opalite-accordion-item', OpaliteAccordionItem);

  // ============================================================
  // <opalite-toaster> + window.opalite.toast()
  // ============================================================
  class OpaliteToaster extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ${tokens}
          :host {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            pointer-events: none;
          }
          .toast {
            pointer-events: auto;
            background: var(--opalite-bg);
            color: var(--opalite-fg);
            padding: 0.75rem 1rem;
            border-radius: var(--opalite-radius);
            box-shadow: var(--opalite-shadow);
            font-size: 0.875rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 18rem;
            max-width: 24rem;
            animation: slideIn 180ms ease;
          }
          .toast.error { background: var(--opalite-danger); }
          .toast.success { background: var(--opalite-bg); }
          .toast.removing { animation: slideOut 150ms ease forwards; }
          .dot {
            width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          }
          .toast.success .dot { background: #4ade80; }
          .toast.error .dot { background: #fecaca; }
          .msg { flex: 1; }
          .close {
            background: none; border: 0; color: inherit;
            opacity: 0.6; cursor: pointer; font-size: 1.1rem;
            line-height: 1; padding: 0;
          }
          .close:hover { opacity: 1; }
          @keyframes slideIn {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            to { transform: translateX(20px); opacity: 0; }
          }
        </style>
      `;
    }
    push(message, type = 'success', duration = 3500) {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <span class="dot"></span>
        <span class="msg"></span>
        <button class="close" aria-label="Close">&times;</button>
      `;
      toast.querySelector('.msg').textContent = message;
      const remove = () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 150);
      };
      toast.querySelector('.close').addEventListener('click', remove);
      this.shadowRoot.appendChild(toast);
      if (duration > 0) setTimeout(remove, duration);
    }
  }
  customElements.define('opalite-toaster', OpaliteToaster);

  // Auto-mount a global toaster, expose API
  function ensureToaster() {
    let host = document.querySelector('opalite-toaster');
    if (!host) {
      host = document.createElement('opalite-toaster');
      document.body.appendChild(host);
    }
    return host;
  }

  const api = {
    toast(message, type = 'success', duration = 3500) {
      const host = ensureToaster();
      // Wait until the element is upgraded
      customElements.whenDefined('opalite-toaster').then(() => host.push(message, type, duration));
    },
  };

  // Listen for custom events too: window.dispatchEvent(new CustomEvent('opalite:toast', {detail: {...}}))
  window.addEventListener('opalite:toast', (e) => {
    const { message, type, duration } = e.detail || {};
    api.toast(message, type, duration);
  });

  window.opalite = Object.assign(window.opalite || {}, api);
})();
