// ─── State ────────────────────────────────────────────
const DEFAULTS = {
  checkedLimit: 25,
  cabinLimit: 7,
  theme: 'light',
  accent: '#b80909',
  bags: [],
  checkedTotal: 0,
  cabinTotal: 0,
  paxMode: 'single',
};

let state = {};

function loadState() {
  const raw = localStorage.getItem('baggagecheck_state');
  state = raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : { ...DEFAULTS };
}

function saveState() {
  localStorage.setItem('baggagecheck_state', JSON.stringify(state));
}

// ─── Theme ────────────────────────────────────────────
function applyTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', state.theme);

  const r = parseInt(state.accent.slice(1, 3), 16);
  const g = parseInt(state.accent.slice(3, 5), 16);
  const b = parseInt(state.accent.slice(5, 7), 16);
  html.style.setProperty('--accent', state.accent);
  html.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);

  const iconLight = document.getElementById('iconLight');
  const iconDark = document.getElementById('iconDark');
  if (iconLight && iconDark) {
    if (state.theme === 'light') {
      iconLight.style.display = 'none';
      iconDark.style.display = 'block';
    } else {
      iconLight.style.display = 'block';
      iconDark.style.display = 'none';
    }
  }
}

function cycleTheme() {
  const order = ['light', 'dark-grey', 'amoled'];
  const idx = order.indexOf(state.theme);
  state.theme = order[(idx + 1) % order.length];
  saveState();
  applyTheme();
  const labels = { light: 'Light mode', 'dark-grey': 'Dark grey', amoled: 'AMOLED black' };
  showToast(labels[state.theme]);
}

// ─── Passenger Mode ──────────────────────────────────
function setPaxMode(mode) {
  state.paxMode = mode;

  document.getElementById('singlePaxBtn').classList.toggle('active', mode === 'single');
  document.getElementById('poolPaxBtn').classList.toggle('active', mode === 'pool');

  if (mode === 'single') {
    state.checkedLimit = 25;
    state.cabinLimit = 7;
  } else {
    state.checkedLimit = 50;
    state.cabinLimit = 14;
  }

  saveState();
  renderLimits();
  showToast(mode === 'single' ? 'Single Pax: 25kg checked, 7kg cabin' : 'Pool Pax: 50kg checked, 14kg cabin');
}

// ─── Current selected bag type ────────────────────────
let selectedType = 'checked';

function selectType(type) {
  selectedType = type;
  document.getElementById('tabChecked').classList.toggle('active', type === 'checked');
  document.getElementById('tabCabin').classList.toggle('active', type === 'cabin');
  document.getElementById('scaleInput').value = '';
  document.getElementById('scaleInput').focus();
  updateHint();
}

function updateHint() {
  const hint = document.getElementById('runningHint');
  const allTotal = state.checkedTotal + state.cabinTotal;

  if (state.bags.length > 0) {
    hint.style.display = 'flex';
    document.getElementById('hintType').textContent = 'All bags';
    document.getElementById('hintTotal').textContent = allTotal.toFixed(1);
  } else {
    hint.style.display = 'none';
  }
}

// ─── Add Bag ──────────────────────────────────────────
function addBag() {
  const input = document.getElementById('scaleInput');
  const reading = parseFloat(input.value);

  if (isNaN(reading) || reading < 0) {
    showToast('Enter a valid scale reading');
    input.focus();
    return;
  }

  const prevTotalAll = state.checkedTotal + state.cabinTotal;

  if (reading <= prevTotalAll) {
    showToast('Reading must be greater than ' + prevTotalAll.toFixed(1) + ' kg');
    input.focus();
    return;
  }

  const bagWeight = Math.round((reading - prevTotalAll) * 10) / 10;
  const bagNumber = state.bags.length + 1;

  const bag = {
    id: Date.now(),
    number: bagNumber,
    type: selectedType,
    weight: bagWeight,
    reading: reading,
  };

  state.bags.push(bag);

  if (selectedType === 'checked') {
    state.checkedTotal += bagWeight;
  } else {
    state.cabinTotal += bagWeight;
  }

  saveState();
  input.value = '';
  renderBags();
  renderLimits();
  updateHint();

  const limit = selectedType === 'checked' ? state.checkedLimit : state.cabinLimit;
  const used = selectedType === 'checked' ? state.checkedTotal : state.cabinTotal;
  if (used > limit) {
    showToast(`Over ${selectedType} limit by ${(used - limit).toFixed(1)} kg!`);
  } else {
    showToast(`Bag ${bagNumber} added — ${bagWeight.toFixed(1)} kg`);
  }

  input.focus();
}

// ─── Delete Bag ───────────────────────────────────────
function deleteBag(id) {
  const idx = state.bags.findIndex(b => b.id === id);
  if (idx === -1) return;

  state.bags.splice(idx, 1);
  state.bags.forEach((b, i) => { b.number = i + 1; });

  state.checkedTotal = 0;
  state.cabinTotal = 0;
  state.bags.filter(b => b.type === 'checked').forEach(b => { state.checkedTotal += b.weight; });
  state.bags.filter(b => b.type === 'cabin').forEach(b => { state.cabinTotal += b.weight; });
  state.checkedTotal = Math.round(state.checkedTotal * 10) / 10;
  state.cabinTotal = Math.round(state.cabinTotal * 10) / 10;

  saveState();
  renderBags();
  renderLimits();
  updateHint();
  showToast('Bag removed');
}

// ─── Clear All ────────────────────────────────────────
function clearAll() {
  if (state.bags.length === 0) return;
  if (!confirm('Clear all bags? This cannot be undone.')) return;
  state.bags = [];
  state.checkedTotal = 0;
  state.cabinTotal = 0;
  saveState();
  renderBags();
  renderLimits();
  updateHint();
  showToast('All bags cleared');
}

// ─── Render Bag List ──────────────────────────────────
function renderBags() {
  const list = document.getElementById('bagList');
  document.getElementById('bagCountLabel').textContent = `Bags (${state.bags.length})`;

  if (state.bags.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        <p>No bags added yet.<br>Enter a scale reading above.</p>
      </div>`;
    return;
  }

  list.innerHTML = state.bags.map(bag => `
    <div class="bag-item">
      <div class="bag-num">${bag.number}</div>
      <div class="bag-info">
        <div class="bag-name">Bag ${bag.number}</div>
        <span class="bag-type-tag ${bag.type}">${bag.type}</span>
      </div>
      <div style="text-align:right">
        <div class="bag-weight">${bag.weight.toFixed(1)}<span class="bag-weight-unit"> kg</span></div>
      </div>
      <button class="bag-delete" onclick="deleteBag(${bag.id})" title="Remove bag">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  `).join('');
}

// ─── Render Limit Cards ───────────────────────────────
function renderLimits() {
  const cl = state.checkedLimit;
  const ql = state.cabinLimit;
  const ct = state.checkedTotal;
  const qt = state.cabinTotal;

  document.getElementById('checkedLimitDisplay').value = cl;
  document.getElementById('cabinLimitDisplay').value = ql;

  document.getElementById('checkedUsed').textContent = `${ct.toFixed(1)} kg used`;
  document.getElementById('checkedRemain').textContent = ct > cl ?
    `${(ct - cl).toFixed(1)} kg over!` :
    `${(cl - ct).toFixed(1)} kg left`;

  document.getElementById('cabinUsed').textContent = `${qt.toFixed(1)} kg used`;
  document.getElementById('cabinRemain').textContent = qt > ql ?
    `${(qt - ql).toFixed(1)} kg over!` :
    `${(ql - qt).toFixed(1)} kg left`;

  const checkedPct = Math.min((ct / cl) * 100, 100);
  const cabinPct = Math.min((qt / ql) * 100, 100);

  const checkedBar = document.getElementById('checkedBar');
  const cabinBar = document.getElementById('cabinBar');

  checkedBar.style.width = checkedPct + '%';
  cabinBar.style.width = cabinPct + '%';

  checkedBar.classList.toggle('over', ct > cl);
  cabinBar.classList.toggle('over', qt > ql);
}

// ─── Toast ─────────────────────────────────────────────
let toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ─── Update Limit from main page ─────────────────────
function updateLimit(type) {
  const id = type === 'checked' ? 'checkedLimitDisplay' : 'cabinLimitDisplay';
  const val = parseFloat(document.getElementById(id).value);
  if (isNaN(val) || val <= 0) {
    document.getElementById(id).value = type === 'checked' ? state.checkedLimit : state.cabinLimit;
    return;
  }
  if (type === 'checked') state.checkedLimit = val;
  else state.cabinLimit = val;

  state.paxMode = null;
  document.getElementById('singlePaxBtn').classList.remove('active');
  document.getElementById('poolPaxBtn').classList.remove('active');

  saveState();
  renderLimits();
  showToast(`${type === 'checked' ? 'Checked' : 'Cabin'} limit set to ${val} kg`);
}

// ─── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme();
  renderBags();
  renderLimits();
  updateHint();

  if (state.paxMode === 'single' || state.paxMode === 'pool') {
    document.getElementById(state.paxMode + 'PaxBtn').classList.add('active');
  }

  document.getElementById('themeToggleBtn').addEventListener('click', cycleTheme);

  ['checked', 'cabin'].forEach(type => {
    const id = type === 'checked' ? 'checkedLimitDisplay' : 'cabinLimitDisplay';
    const input = document.getElementById(id);
    input.addEventListener('change', () => updateLimit(type));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { updateLimit(type); input.blur(); } });
  });

  document.getElementById('scaleInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addBag();
  });
});
