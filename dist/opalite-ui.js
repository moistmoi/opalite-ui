/*!
 * Opalite UI — A free web component library
 * MIT License
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/gh/moistmoi/opalite-ui@main/dist/opalite-ui.js"></script>
 *   <opalite-button variant="primary">Click me</opalite-button>
 *
 * Styles live in dist/opalite-ui.css and are loaded automatically into each
 * component's shadow root via <link>. End users only need this one script tag.
 */
(function () {
  'use strict';

  // ---------- Resolve the stylesheet URL relative to wherever this script was loaded from ----------
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  const CSS_HREF = SCRIPT_SRC
    ? SCRIPT_SRC.replace(/opalite-ui\.js(\?.*)?$/, 'opalite-ui.css')
    : './opalite-ui.css';
  const STYLESHEET = `<link rel="stylesheet" href="${CSS_HREF}">`;

  // ============================================================
  // <opalite-button>
  // ============================================================
  class OpaliteButton extends HTMLElement {
    static get observedAttributes() { return ['variant', 'loading', 'disabled', 'icon-only']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
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
        ${STYLESHEET}
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
        ${STYLESHEET}
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
        ${STYLESHEET}
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
      this.shadowRoot.innerHTML = `${STYLESHEET}<slot></slot>`;
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
      this.shadowRoot.innerHTML = `${STYLESHEET}<slot></slot>`;
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
        ${STYLESHEET}
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
      this.shadowRoot.innerHTML = `${STYLESHEET}`;
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
      customElements.whenDefined('opalite-toaster').then(() => host.push(message, type, duration));
    },
  };

  window.addEventListener('opalite:toast', (e) => {
    const { message, type, duration } = e.detail || {};
    api.toast(message, type, duration);
  });

  // ============================================================
  // <opalite-alert>
  // ============================================================
  class OpaliteAlert extends HTMLElement {
    static get observedAttributes() { return ['type', 'title', 'dismissible']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <div class="alert" part="alert">
          <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg>
          <div class="content">
            <div class="title"></div>
            <div class="body"><slot></slot></div>
          </div>
          <button class="close" aria-label="Dismiss">&times;</button>
        </div>
      `;
      this._titleEl = this.shadowRoot.querySelector('.title');
      this._iconEl = this.shadowRoot.querySelector('.icon');
      this.shadowRoot.querySelector('.close').addEventListener('click', () => this.remove());
    }
    connectedCallback() { this._update(); }
    attributeChangedCallback() { this._update(); }
    _update() {
      const title = this.getAttribute('title');
      this._titleEl.textContent = title || '';
      this._titleEl.style.display = title ? '' : 'none';
      const type = this.getAttribute('type') || 'info';
      const icons = {
        success: '<polyline points="20 6 9 17 4 12"></polyline>',
        warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      };
      this._iconEl.innerHTML = icons[type] || icons.info;
    }
  }
  customElements.define('opalite-alert', OpaliteAlert);

  // ============================================================
  // <opalite-badge>
  // ============================================================
  class OpaliteBadge extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `${STYLESHEET}<span class="badge" part="badge"><slot></slot></span>`;
    }
  }
  customElements.define('opalite-badge', OpaliteBadge);

  // ============================================================
  // <opalite-card>
  // ============================================================
  class OpaliteCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <div class="card" part="card">
          <div class="header" part="header"><slot name="header"></slot></div>
          <div class="body" part="body"><slot></slot></div>
          <div class="footer" part="footer"><slot name="footer"></slot></div>
        </div>
      `;
    }
  }
  customElements.define('opalite-card', OpaliteCard);

  // ============================================================
  // <opalite-tooltip>
  // ============================================================
  class OpaliteTooltip extends HTMLElement {
    static get observedAttributes() { return ['text']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <slot></slot>
        <div class="tip" part="tip" role="tooltip"></div>
      `;
      this._tip = this.shadowRoot.querySelector('.tip');
    }
    connectedCallback() {
      this._tip.textContent = this.getAttribute('text') || '';
      const show = () => this.setAttribute('visible', '');
      const hide = () => this.removeAttribute('visible');
      this.addEventListener('mouseenter', show);
      this.addEventListener('mouseleave', hide);
      this.addEventListener('focusin', show);
      this.addEventListener('focusout', hide);
    }
    attributeChangedCallback() {
      if (this._tip) this._tip.textContent = this.getAttribute('text') || '';
    }
  }
  customElements.define('opalite-tooltip', OpaliteTooltip);

  // ============================================================
  // <opalite-popover>
  // ============================================================
  class OpalitePopover extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <slot name="trigger"></slot>
        <div class="pop" part="pop"><slot></slot></div>
      `;
      this._triggerSlot = this.shadowRoot.querySelector('slot[name="trigger"]');
    }
    connectedCallback() {
      this._triggerSlot.addEventListener('slotchange', () => this._wireTrigger());
      this._wireTrigger();
      this._onDocClick = (e) => {
        if (!e.composedPath().includes(this)) this.close();
      };
      document.addEventListener('click', this._onDocClick);
      this._onKey = (e) => { if (e.key === 'Escape') this.close(); };
      window.addEventListener('keydown', this._onKey);
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
  customElements.define('opalite-popover', OpalitePopover);

  // ============================================================
  // <opalite-command> + <opalite-command-item>
  // ============================================================
  class OpaliteCommand extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <div class="overlay" part="overlay">
          <div class="panel" part="panel" role="dialog" aria-modal="true">
            <div class="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Type a command or search..." aria-label="Search">
            </div>
            <div class="list"><slot></slot><div class="empty" hidden>No results</div></div>
          </div>
        </div>
      `;
      this._input = this.shadowRoot.querySelector('input');
      this._overlay = this.shadowRoot.querySelector('.overlay');
      this._empty = this.shadowRoot.querySelector('.empty');
    }
    connectedCallback() {
      this._onKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.open();
        } else if (e.key === 'Escape' && this.hasAttribute('open')) {
          this.close();
        } else if (this.hasAttribute('open')) {
          if (e.key === 'ArrowDown') { e.preventDefault(); this._move(1); }
          if (e.key === 'ArrowUp') { e.preventDefault(); this._move(-1); }
          if (e.key === 'Enter') { e.preventDefault(); this._select(); }
        }
      };
      window.addEventListener('keydown', this._onKey);
      this._input.addEventListener('input', () => this._filter());
      this._overlay.addEventListener('click', (e) => {
        if (e.target === this._overlay) this.close();
      });
      this.addEventListener('click', (e) => {
        const item = e.target.closest('opalite-command-item');
        if (item) this._fire(item);
      });
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
    }
    _items() {
      return [...this.querySelectorAll('opalite-command-item')].filter(i => !i.hidden);
    }
    _filter() {
      const q = this._input.value.toLowerCase().trim();
      const items = [...this.querySelectorAll('opalite-command-item')];
      let visible = 0;
      items.forEach((item) => {
        const text = (item.textContent + ' ' + (item.getAttribute('keywords') || '')).toLowerCase();
        const match = !q || text.includes(q);
        item.hidden = !match;
        if (match) visible++;
      });
      this._empty.hidden = visible > 0;
      this._setActive(0);
    }
    _setActive(index) {
      const items = this._items();
      items.forEach((i) => i.classList.remove('opalite-active'));
      if (items[index]) items[index].classList.add('opalite-active');
      this._activeIndex = index;
    }
    _move(delta) {
      const items = this._items();
      if (!items.length) return;
      let i = (this._activeIndex ?? 0) + delta;
      if (i < 0) i = items.length - 1;
      if (i >= items.length) i = 0;
      this._setActive(i);
      items[i].scrollIntoView({ block: 'nearest' });
    }
    _select() {
      const items = this._items();
      const item = items[this._activeIndex ?? 0];
      if (item) this._fire(item);
    }
    _fire(item) {
      item.dispatchEvent(new CustomEvent('opalite-command-select', {
        bubbles: true,
        detail: { value: item.getAttribute('value') || item.textContent.trim() },
      }));
      this.close();
    }
    open() {
      this.setAttribute('open', '');
      this._input.value = '';
      this._filter();
      setTimeout(() => this._input.focus(), 0);
    }
    close() { this.removeAttribute('open'); }
  }
  customElements.define('opalite-command', OpaliteCommand);

  class OpaliteCommandItem extends HTMLElement {}
  customElements.define('opalite-command-item', OpaliteCommandItem);

  // ============================================================
  // <opalite-input>
  // ============================================================
  class OpaliteInput extends HTMLElement {
    static get observedAttributes() { return ['label', 'placeholder', 'type', 'value', 'error', 'disabled', 'required']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <label class="field">
          <span class="label-text"></span>
          <div class="wrap">
            <slot name="prefix"></slot>
            <input>
            <slot name="suffix"></slot>
          </div>
          <div class="error-msg"></div>
        </label>
      `;
      this._input = this.shadowRoot.querySelector('input');
      this._label = this.shadowRoot.querySelector('.label-text');
      this._error = this.shadowRoot.querySelector('.error-msg');
      this._input.addEventListener('input', () => {
        this.dispatchEvent(new Event('input', { bubbles: true }));
      });
      this._input.addEventListener('change', () => {
        this.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    connectedCallback() { this._update(); }
    attributeChangedCallback() { this._update(); }
    _update() {
      const label = this.getAttribute('label') || '';
      this._label.textContent = label;
      this._label.style.display = label ? '' : 'none';
      this._input.placeholder = this.getAttribute('placeholder') || '';
      this._input.type = this.getAttribute('type') || 'text';
      if (this.hasAttribute('value')) this._input.value = this.getAttribute('value');
      this._input.disabled = this.hasAttribute('disabled');
      this._input.required = this.hasAttribute('required');
      this._error.textContent = this.getAttribute('error') || '';
    }
    get value() { return this._input.value; }
    set value(v) { this._input.value = v; }
    focus() { this._input.focus(); }
  }
  customElements.define('opalite-input', OpaliteInput);

  // ============================================================
  // <opalite-select>
  // ============================================================
  class OpaliteSelect extends HTMLElement {
    static get observedAttributes() { return ['label', 'value', 'disabled']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <label class="field">
          <span class="label-text"></span>
          <div class="wrap">
            <select></select>
            <svg class="arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </label>
      `;
      this._select = this.shadowRoot.querySelector('select');
      this._label = this.shadowRoot.querySelector('.label-text');
      this._select.addEventListener('change', () => {
        this.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    connectedCallback() {
      this._syncOptions();
      this._observer = new MutationObserver(() => this._syncOptions());
      this._observer.observe(this, { childList: true, subtree: true, attributes: true });
      this._update();
    }
    disconnectedCallback() { this._observer && this._observer.disconnect(); }
    attributeChangedCallback() { this._update && this._update(); }
    _syncOptions() {
      const opts = [...this.querySelectorAll('option')];
      this._select.innerHTML = '';
      opts.forEach((o) => {
        const clone = o.cloneNode(true);
        this._select.appendChild(clone);
      });
      if (this.hasAttribute('value')) this._select.value = this.getAttribute('value');
    }
    _update() {
      const label = this.getAttribute('label') || '';
      this._label.textContent = label;
      this._label.style.display = label ? '' : 'none';
      this._select.disabled = this.hasAttribute('disabled');
      if (this.hasAttribute('value')) this._select.value = this.getAttribute('value');
    }
    get value() { return this._select.value; }
    set value(v) { this._select.value = v; }
  }
  customElements.define('opalite-select', OpaliteSelect);

  // ============================================================
  // <opalite-checkbox>
  // ============================================================
  class OpaliteCheckbox extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <label>
          <input type="checkbox">
          <span class="box">
            <svg class="check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </span>
          <span class="label-text"></span>
        </label>
      `;
      this._input = this.shadowRoot.querySelector('input');
      this._label = this.shadowRoot.querySelector('.label-text');
      this._input.addEventListener('change', () => {
        if (this._input.checked) this.setAttribute('checked', '');
        else this.removeAttribute('checked');
        this.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    connectedCallback() { this._update(); }
    attributeChangedCallback() { this._update(); }
    _update() {
      this._label.textContent = this.getAttribute('label') || '';
      this._input.checked = this.hasAttribute('checked');
      this._input.disabled = this.hasAttribute('disabled');
    }
    get checked() { return this._input.checked; }
    set checked(v) {
      if (v) this.setAttribute('checked', '');
      else this.removeAttribute('checked');
    }
  }
  customElements.define('opalite-checkbox', OpaliteCheckbox);

  // ============================================================
  // <opalite-switch>
  // ============================================================
  class OpaliteSwitch extends HTMLElement {
    static get observedAttributes() { return ['checked', 'disabled', 'label']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <label>
          <input type="checkbox" role="switch">
          <span class="track"><span class="thumb"></span></span>
          <span class="label-text"></span>
        </label>
      `;
      this._input = this.shadowRoot.querySelector('input');
      this._label = this.shadowRoot.querySelector('.label-text');
      this._input.addEventListener('change', () => {
        if (this._input.checked) this.setAttribute('checked', '');
        else this.removeAttribute('checked');
        this.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    connectedCallback() { this._update(); }
    attributeChangedCallback() { this._update(); }
    _update() {
      this._label.textContent = this.getAttribute('label') || '';
      this._input.checked = this.hasAttribute('checked');
      this._input.disabled = this.hasAttribute('disabled');
    }
    get checked() { return this._input.checked; }
    set checked(v) {
      if (v) this.setAttribute('checked', '');
      else this.removeAttribute('checked');
    }
  }
  customElements.define('opalite-switch', OpaliteSwitch);

  // ============================================================
  // <opalite-navbar>
  // ============================================================
  class OpaliteNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        ${STYLESHEET}
        <nav>
          <div class="brand"><slot name="brand"></slot></div>
          <div class="links"><slot></slot></div>
          <div class="actions">
            <slot name="actions"></slot>
            <button class="hamburger" aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </nav>
        <div class="mobile"><slot name="mobile-links"></slot></div>
      `;
      this.shadowRoot.querySelector('.hamburger').addEventListener('click', () => {
        this.toggleAttribute('open');
      });
    }
  }
  customElements.define('opalite-navbar', OpaliteNavbar);

  window.opalite = Object.assign(window.opalite || {}, api);
})();
