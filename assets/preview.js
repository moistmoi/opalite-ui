// Shared logic for component demo pages.
// For each [data-demo] block:
//   - renders the inner HTML as a live preview
//   - shows the same HTML in a code block with a Copy button

function formatHTML(html) {
  // Trim shared leading indent so pasted snippets look clean.
  const lines = html.replace(/^\n+|\n+$/g, '').split('\n');
  const indents = lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map(l => l.slice(min)).join('\n');
}

function escapeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function copyButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className =
    'absolute top-3 right-3 px-3 py-1.5 text-xs font-medium rounded-md ' +
    'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 ' +
    'transition flex items-center gap-1.5';
  btn.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
    '<span>Copy</span>';
  return btn;
}

function buildDemo(block) {
  const source = block.innerHTML;
  const formatted = formatHTML(source);

  // Wrapper
  const wrap = document.createElement('div');
  wrap.className = 'rounded-xl border border-zinc-200 bg-white overflow-hidden mb-10';

  // Tab bar
  const tabs = document.createElement('div');
  tabs.className = 'flex items-center border-b border-zinc-200 px-4 bg-zinc-50';
  tabs.innerHTML = `
    <button data-tab="preview" class="px-3 py-3 text-sm font-medium text-zinc-900 border-b-2 border-zinc-900">Preview</button>
    <button data-tab="code" class="px-3 py-3 text-sm font-medium text-zinc-500 border-b-2 border-transparent hover:text-zinc-900">Code</button>
  `;

  // Preview pane
  const preview = document.createElement('div');
  preview.className = 'p-10 grid place-items-center min-h-[200px] bg-white';
  preview.innerHTML = formatted;

  // Code pane
  const code = document.createElement('div');
  code.className = 'hidden relative';
  code.innerHTML = `<pre class="bg-zinc-900 text-zinc-100 text-sm p-5 pr-24 overflow-x-auto leading-relaxed"><code>${escapeHTML(formatted)}</code></pre>`;
  const btn = copyButton();
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      btn.querySelector('span').textContent = 'Copied!';
      setTimeout(() => (btn.querySelector('span').textContent = 'Copy'), 1500);
    } catch (e) {
      btn.querySelector('span').textContent = 'Failed';
    }
  });
  code.appendChild(btn);

  // Tab switching
  tabs.addEventListener('click', (e) => {
    const which = e.target.dataset.tab;
    if (!which) return;
    const isPreview = which === 'preview';
    preview.classList.toggle('hidden', !isPreview);
    code.classList.toggle('hidden', isPreview);
    tabs.querySelectorAll('button').forEach((b) => {
      const active = b.dataset.tab === which;
      b.classList.toggle('text-zinc-900', active);
      b.classList.toggle('text-zinc-500', !active);
      b.classList.toggle('border-zinc-900', active);
      b.classList.toggle('border-transparent', !active);
    });
  });

  wrap.appendChild(tabs);
  wrap.appendChild(preview);
  wrap.appendChild(code);
  block.replaceWith(wrap);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-demo]').forEach(buildDemo);
});
