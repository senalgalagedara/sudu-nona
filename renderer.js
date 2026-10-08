const SERVICES = {
  claude:  { name: 'Claude',  color: '#d9774f', home: 'https://claude.ai/new', match: /claude\.ai\/chat\/[\w-]+/ },
  chatgpt: { name: 'ChatGPT', color: '#14a37f', home: 'https://chatgpt.com/',  match: /chatgpt\.com\/(?:g\/[^/]+\/)?c\/[\w-]+/ }
};
const ORDER = ['claude', 'chatgpt'];
const COLORS = ['#4f5fb0', '#c2603f', '#a14f86', '#3d7fa8', '#b08a2a', '#6366f1', '#ec4899'];
const KEY = 'sudunona.v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => 'p' + Date.now().toString(36);

const DEF = () => ({ profiles: [{ id: 'main', name: 'Main', color: COLORS[0] }], active: 'main', service: 'claude', mode: 'single', filter: 'all', hist: {} });
let S = Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY) || '{}'));
if (!S.profiles.length) S = DEF();
if (!S.profiles.some(p => p.id === S.active)) S.active = S.profiles[0].id;
if (!SERVICES[S.service]) S.service = ORDER[0];
S.profiles.forEach(p => { if (p.color === '#1f6f68') p.color = COLORS[0]; });
const save = () => localStorage.setItem(KEY, JSON.stringify(S));

const panes = {};      // "profileId:service" -> { el, wv }
let editing = null;    // profile id being renamed
let q = '';            // history search text

/* ---------- profiles ---------- */
function renderProfiles() {
  const box = $('#profiles');
  if (!box) return;
  box.innerHTML = '';
  const sideEl = $('#side');
  if (editing) sideEl?.classList.add('is-editing');
  else sideEl?.classList.remove('is-editing');

  S.profiles.forEach(p => {
    const isActive = p.id === S.active;
    const row = document.createElement('div');
    row.className = 'prof' + (isActive ? ' on' : '');
    row.title = p.name;

    const initial = (p.name.trim()[0] || '?').toUpperCase();
    const avContent = p.image
      ? `<img class="av-img" src="${esc(p.image)}" alt="${esc(p.name)}">`
      : esc(initial);

    const nameHtml = editing === p.id
      ? `<input class="ren" value="${esc(p.name)}" maxlength="24" aria-label="Profile name">`
      : `<span class="nm">${esc(p.name)}</span>`;

    row.innerHTML =
      `<div class="prof-indicator"></div>` +
      `<div class="av" style="background:${p.color}">${avContent}</div>` +
      `<div class="prof-meta">${nameHtml}</div>` +
      `<span class="acts"><button data-a="ren" title="Rename" aria-label="Rename">✎</button><button data-a="del" title="Delete" aria-label="Delete">✕</button></span>`;

    row.onclick = e => {
      if (e.target.closest('input')) return;
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'ren') { editing = p.id; renderProfiles(); return; }
      if (a === 'del') { delProfile(p); return; }
      if (S.active !== p.id) { S.active = p.id; save(); renderAll(); }
    };
    box.appendChild(row);
    if (editing === p.id) {
      const inp = $('.ren', row);
      setTimeout(() => { inp.focus(); inp.select(); });
      const commit = ok => {
        if (editing !== p.id) return;
        editing = null;
        if (ok && inp.value.trim()) p.name = inp.value.trim();
        save(); renderAll();
      };
      inp.onkeydown = e => { if (e.key === 'Enter') commit(true); if (e.key === 'Escape') commit(false); };
      inp.onblur = () => commit(true);
    }
  });
}

function addProfile() {
  const p = { id: newId(), name: 'Profile ' + (S.profiles.length + 1), color: COLORS[S.profiles.length % COLORS.length] };
  S.profiles.push(p);
  S.active = p.id;
  editing = p.id;
  save(); renderAll();
}

async function delProfile(p) {
  if (!confirm(`Delete "${p.name}"?\nThis signs out every account in it and removes its history here.`)) return;
  ORDER.forEach(s => { const k = p.id + ':' + s; panes[k]?.el.remove(); delete panes[k]; });
  await window.sudu.clearProfile(p.id);
  S.profiles = S.profiles.filter(x => x.id !== p.id);
  delete S.hist[p.id];
  if (!S.profiles.length) S.profiles.push({ id: newId(), name: 'Main', color: COLORS[0] });
  if (S.active === p.id) S.active = S.profiles[0].id;
  save(); renderAll();
}

/* ---------- chat windows ---------- */
const strip = t => (t || '').replace(/\s*[-|–]\s*(Claude|ChatGPT)\s*$/i, '').trim();
const GENERIC = /^(claude|chatgpt|new chat)?$/i;

function track(pid, svc, wv, title) {
  let url;
  try { url = wv.getURL(); } catch { return; }
  if (!SERVICES[svc].match.test(url)) return;
  const list = (S.hist[pid] ||= []);
  let h = list.find(x => x.url === url);
  if (!h) { h = { service: svc, url, title: '', ts: Date.now() }; list.push(h); }
  if (title !== undefined) { const t = strip(title); if (t && !GENERIC.test(t)) h.title = t; }
  else h.ts = Date.now();
  list.sort((a, b) => b.ts - a.ts);
  if (list.length > 300) list.length = 300;
  save();
  if (pid === S.active) renderHistory();
}

function ensurePane(pid, svc, url) {
  const k = pid + ':' + svc;
  if (panes[k]) return panes[k];
  const meta = SERVICES[svc];
  const el = document.createElement('section');
  el.className = 'pane';
  el.style.display = 'none';
  el.innerHTML = `<header><i style="background:${meta.color}"></i><b>${meta.name}</b><span class="sp"></span>` +
    `<button data-a="back" title="Back">‹ Back</button><button data-a="reload" title="Reload">Reload</button><button data-a="new" title="Start a new chat">+ New chat</button></header>`;
  const wv = document.createElement('webview');
  wv.setAttribute('partition', 'persist:sn-' + pid);
  wv.setAttribute('allowpopups', '');
  wv.src = url || meta.home;
  el.appendChild(wv);
  $('header', el).onclick = e => {
    const a = e.target.closest('button')?.dataset.a;
    try {
      if (a === 'back') wv.goBack();
      if (a === 'reload') wv.reload();
      if (a === 'new') wv.loadURL(meta.home);
    } catch {}
  };
  const nav = e => { if (e.isMainFrame !== false) track(pid, svc, wv); };
  wv.addEventListener('did-navigate', nav);
  wv.addEventListener('did-navigate-in-page', nav);
  wv.addEventListener('page-title-updated', e => track(pid, svc, wv, e.title));
  wv.addEventListener('focus', () => focusService(svc));
  $('#stage').appendChild(el);
  return (panes[k] = { el, wv });
}

function focusService(svc) {
  if (S.service === svc) return;
  S.service = svc; save(); renderTabs(); renderStage();
}

function renderStage() {
  const vis = S.mode === 'split' ? ORDER : [S.service];
  vis.forEach(s => ensurePane(S.active, s));
  for (const [k, p] of Object.entries(panes)) {
    const [pid, s] = k.split(':');
    if (!SERVICES[s]) { p.el.remove(); delete panes[k]; continue; }
    const show = pid === S.active && vis.includes(s);
    p.el.style.display = show ? 'flex' : 'none';
    p.el.style.order = ORDER.indexOf(s);
    p.el.classList.toggle('focus', show && S.mode === 'split' && s === S.service);
  }
}

function renderTabs() {
  $('#tabs').innerHTML = ORDER.map(s =>
    `<button class="tab${S.service === s ? ' on' : ''}" data-s="${s}"><i style="background:${SERVICES[s].color}"></i>${SERVICES[s].name}</button>`).join('');
  document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.m === S.mode));
}

/* ---------- history ---------- */
const ago = ts => {
  const m = (Date.now() - ts) / 6e4;
  if (m < 1) return 'now';
  if (m < 60) return Math.floor(m) + 'm';
  const h = m / 60;
  return h < 24 ? Math.floor(h) + 'h' : Math.floor(h / 24) + 'd';
};

function renderHistory() {
  const box = $('#hist');
  if (!box) return;
  const p = S.profiles.find(x => x.id === S.active);
  const who = $('#histWho');
  if (who && p) who.textContent = p.name;
  const pills = $('#pills');
  if (pills) {
    pills.innerHTML = ['all', ...ORDER].map(f =>
      `<button class="pill${S.filter === f ? ' on' : ''}" data-f="${f}">${f === 'all' ? 'All' : SERVICES[f].name}</button>`).join('');
  }
  const needle = q.toLowerCase();
  const items = (S.hist[S.active] || []).filter(h =>
    (S.filter === 'all' || h.service === S.filter) && (h.title || 'Untitled chat').toLowerCase().includes(needle));
  box.innerHTML = items.length
    ? items.map(h => `<div class="h" data-u="${esc(h.url)}"><i style="background:${SERVICES[h.service].color}"></i>` +
        `<span class="t">${esc(h.title || 'Untitled chat')}</span><small>${ago(h.ts)}</small>` +
        `<button class="x" title="Remove from this list" aria-label="Remove">✕</button></div>`).join('')
    : `<div class="empty">${needle ? 'No chats match your search.' : `No chats yet for ${esc(p ? p.name : '')}. Open a chat in any window and it appears here.`}</div>`;
}

function openChat(h) {
  S.service = h.service;
  const existed = !!panes[S.active + ':' + h.service];
  const p = ensurePane(S.active, h.service, h.url);
  if (existed) {
    try { if (p.wv.getURL() !== h.url) p.wv.loadURL(h.url); } catch { p.wv.src = h.url; }
  }
  save(); renderTabs(); renderStage(); renderHistory();
}

/* ---------- wiring ---------- */
function renderAll() {
  renderProfiles(); renderTabs(); renderStage(); renderHistory();
  const cur = S.profiles.find(p => p.id === S.active);
  document.title = 'Sudu Nona' + (cur ? ' · ' + cur.name : '');
}
const addPBtn = $('#addP');
if (addPBtn) addPBtn.onclick = addProfile;
$('#tabs').onclick = e => { const s = e.target.closest('.tab')?.dataset.s; if (s) { S.service = s; save(); renderTabs(); renderStage(); } };
$('#mode').onclick = e => { const m = e.target.closest('button')?.dataset.m; if (m) { S.mode = m; save(); renderTabs(); renderStage(); } };
const pillsEl = $('#pills');
if (pillsEl) pillsEl.onclick = e => { const f = e.target.closest('.pill')?.dataset.f; if (f) { S.filter = f; save(); renderHistory(); } };
const qEl = $('#q');
if (qEl) qEl.oninput = e => { q = e.target.value; renderHistory(); };
const histEl = $('#hist');
if (histEl) histEl.onclick = e => {
  const row = e.target.closest('.h');
  if (!row) return;
  const url = row.dataset.u, list = S.hist[S.active] || [];
  if (e.target.closest('.x')) { S.hist[S.active] = list.filter(x => x.url !== url); save(); renderHistory(); return; }
  const h = list.find(x => x.url === url);
  if (h) openChat(h);
};
renderAll();
