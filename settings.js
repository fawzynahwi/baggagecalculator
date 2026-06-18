// ─── Preset accent swatches ───────────────────────────
const ACCENT_SWATCHES = [
  '#b80909', // Default red
  '#e53e3e', // Bright red
  '#dd6b20', // Orange
  '#d69e2e', // Amber
  '#38a169', // Green
  '#3182ce', // Blue
  '#805ad5', // Purple
  '#d53f8c', // Pink
  '#2d3748', // Charcoal
];

// ─── State helpers ─────────────────────────────────────
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

function saveStateFull() {
  localStorage.setItem('baggagecheck_state', JSON.stringify(state));
}

// ─── Apply theme visuals (no page reload needed) ───────
function applyTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', state.theme);

  const r = parseInt(state.accent.slice(1,3), 16);
  const g = parseInt(state.accent.slice(3,5), 16);
  const b = parseInt(state.accent.slice(5,7), 16);
  html.style.setProperty('--accent', state.accent);
  html.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);

  const iconLight = document.getElementById('iconLight');
  const iconDark  = document.getElementById('iconDark');
  if (state.theme === 'light') {
    iconLight.style.display = 'none';
    iconDark.style.display  = 'block';
  } else {
    iconLight.style.display = 'block';
    iconDark.style.display  = 'none';
  }
}

// Cycle theme via top-right button
function cycleTheme() {
  const order = ['light', 'dark-grey', 'amoled'];
  const idx = order.indexOf(state.theme);
  state.theme = order[(idx + 1) % order.length];

  // Sync radio
  const radio = document.querySelector(`input[name="theme"][value="${state.theme}"]`);
  if (radio) radio.checked = true;

  applyTheme();
  saveStateFull();

  const labels = { light: 'Light mode', 'dark-grey': 'Dark grey', amoled: 'AMOLED black' };
  showToast(labels[state.theme]);
}

// ─── Accent swatch rendering ───────────────────────────
let selectedAccent = '#b80909';

function renderSwatches() {
  const grid = document.getElementById('accentGrid');
  grid.innerHTML = ACCENT_SWATCHES.map(hex => `
    <button
      class="accent-swatch ${hex === selectedAccent ? 'selected' : ''}"
      style="background:${hex}"
      onclick="pickAccent('${hex}')"
      title="${hex}"
    ></button>
  `).join('');
}

function pickAccent(hex) {
  selectedAccent = hex;
  document.getElementById('customAccentInput').value = hex;
  document.getElementById('customAccentHex').textContent = hex;

  // Live preview
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);

  renderSwatches();
}

// ─── Save ──────────────────────────────────────────────
function saveSettings() {
  const cl = parseFloat(document.getElementById('checkedLimitInput').value);
  const ql = parseFloat(document.getElementById('cabinLimitInput').value);

  if (isNaN(cl) || cl <= 0 || isNaN(ql) || ql <= 0) {
    showToast('Enter valid weight limits');
    return;
  }

  const themeRadio = document.querySelector('input[name="theme"]:checked');
  if (!themeRadio) {
    showToast('Select a display mode');
    return;
  }

  state.checkedLimit = cl;
  state.cabinLimit   = ql;
  state.theme        = themeRadio.value;
  state.accent       = selectedAccent;

  saveStateFull();
  applyTheme();
  showToast('Settings saved!');

  setTimeout(() => { location.href = 'index.html'; }, 800);
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

// ─── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  selectedAccent = state.accent;

  applyTheme();

  // Populate form values
  document.getElementById('checkedLimitInput').value = state.checkedLimit;
  document.getElementById('cabinLimitInput').value   = state.cabinLimit;

  // Set theme radio
  const radio = document.querySelector(`input[name="theme"][value="${state.theme}"]`);
  if (radio) radio.checked = true;

  // Render swatches
  renderSwatches();

  // Init custom colour picker
  const colorPicker = document.getElementById('customAccentInput');
  colorPicker.value = state.accent;
  document.getElementById('customAccentHex').textContent = state.accent;

  colorPicker.addEventListener('input', () => {
    const hex = colorPicker.value;
    selectedAccent = hex;
    document.getElementById('customAccentHex').textContent = hex;
    // Deselect preset swatches and live-preview
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    document.documentElement.style.setProperty('--accent', hex);
    document.documentElement.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);
    renderSwatches(); // re-render so preset "selected" clears if not matching
  });

  // Theme radio change (live preview)
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.theme = radio.value;
      applyTheme();
    });
  });

  // Top-right toggle
  document.getElementById('themeToggleBtn').addEventListener('click', cycleTheme);
});
