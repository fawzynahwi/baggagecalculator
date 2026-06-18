// ─── State ────────────────────────────────────────────
const DEFAULTS = {
  checkedLimit: 25,
  cabinLimit: 7,
  theme: 'light',
  accent: '#b80909',
  bags: [],
  checkedTotal: 0,
  cabinTotal: 0,
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

  // Update --accent CSS var & dim
  const r = parseInt(state.accent.slice(1,3), 16);
  const g = parseInt(state.accent.slice(3,5), 16);
  const b = parseInt(state.accent.slice(5,7), 16);
  html.style.setProperty('--accent', state.accent);
  html.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);

  // Sun/moon icon
  const iconLight = document.getElementById('iconLight');
  const iconDark  = document.getElementById('iconDark');
  if (iconLight && iconDark) {
    if (state.theme === 'light') {
      iconLight.style.display = 'none';
      iconDark.style.display  = 'block';
    } else {
      iconLight.style.display = 'block';
      iconDark.style.display  = 'none';
    }
  }
}

// Cycle: light → dark-grey → amoled → light
function cycleTheme() {
  const order = ['light', 'dark-grey', 'amoled'];
  const idx = order.indexOf(state.theme);
  state.theme = order[(idx + 1) % order.length];
  saveState();
  applyTheme();

  const labels = { light: 'Light mode', 'dark-grey': 'Dark grey', amoled: 'AMOLED black' };
  showToast(labels[state.theme]);
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
  
  // FIXED: The running total on the scale is the combined grand total of all bags
  const total = state.checkedTotal + state.cabinTotal;

  if (state.bags.length > 0) {
    hint.style.display = 'flex';
    document.getElementById('hintType').textContent = 'all bags';
    document.getElementById('hintTotal').textContent = total.toFixed(1);
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

  // FIXED: Subtract from the grand total of all bags currently on the scale
  const prevTotal = state.checkedTotal + state.cabinTotal;
  const bagWeight = reading - prevTotal;

  if (bagWeight <= 0) {
    showToast('Reading must be greater than ' + prevTotal.toFixed(1) + ' kg');
    input.focus();
    return;
  }

  // Determine overall bag number
  const bagNumber = state.bags.length + 1;

  const bag = {
    id: Date.now(),
    number: bagNumber,
    type: selectedType,
    weight: Math.round(bagWeight * 10) / 10,
    reading: reading,
  };

  state.bags.push(bag);

  // FIXED: Increment the specific category by the individual bag's weight 
  // instead of directly overwriting it with the raw cumulative scale reading
  if (selectedType === 'checked') {
    state.checkedTotal = Math.round((state.checkedTotal + bagWeight) * 10) / 10;
  } else {
    state.cabinTotal = Math.round((state.cabinTotal + bagWeight) * 10) / 10;
  }

  saveState();
  input.value = '';
  renderBags();
  renderLimits();
  updateHint();

  const limit = selectedType === 'checked' ? state.checkedLimit : state.cabinLimit;
  const used  = selectedType === 'checked' ? state.checkedTotal : state.cabinTotal;
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

  const bag = state.bags[idx];

  // Recalculate running totals from scratch after removal
  state.bags.splice(idx, 1);

  // Re-number
  state.bags.forEach((b, i) => { b.number = i + 1; });

  // Recalculate totals per type
  state.checkedTotal = 0;
  state.cabinTotal   = 0;
  state.bags.filter(b => b.type === 'checked').forEach(b => { state.checkedTotal += b.weight; });
  state.bags.filter(b => b.type === 'cabin').forEach(b => { state.cabinTotal += b.weight; });
  state.checkedTotal = Math.round(state.checkedTotal * 10) / 10;
  state.cabinTotal   = Math.round(state.cabinTotal * 10) / 10;

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
  state.cabinTotal   = 0;
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

  document.getElementById('checkedUsed').textContent   = `${ct.toFixed(1)} kg used`;
  document.getElementById('checkedRemain').textContent = ct > cl
    ? `${(ct - cl).toFixed(1)} kg over!`
    : `${(cl - ct).toFixed(1)} kg left`;

  document.getElementById('cabinUsed').textContent   = `${qt.toFixed(1)} kg used`;
  document.getElementById('cabinRemain').textContent = qt > ql
    ? `${(qt - ql).toFixed(1)} kg over!`
    : `${(ql - qt).toFixed(1)} kg left`;

  const checkedPct = Math.min((ct / cl) * 100, 100);
  const cabinPct   = Math.min((qt / ql) * 100, 100);

  const checkedBar = document.getElementById('checkedBar');
  const cabinBar   = document.getElementById('cabinBar');

  checkedBar.style.width = checkedPct + '%';
  cabinBar.style.width   = cabinPct + '%';

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

  document.getElementById('themeToggleBtn').addEventListener('click', cycleTheme);

  // Inline limit editing on main page
  ['checked', 'cabin'].forEach(type => {
    const id = type === 'checked' ? 'checkedLimitDisplay' : 'cabinLimitDisplay';
    const input = document.getElementById(id);
    input.addEventListener('change', () => updateLimit(type));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { updateLimit(type); input.blur(); } });
  });

  // Enter key to add bag
  document.getElementById('scaleInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addBag();
  });
});
