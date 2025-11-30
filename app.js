// app.js
// Requires: data.js (exports PRODUCTS), styles.css, index.html with <main id="app">

import { PRODUCTS, CATEGORIES_FOR_TASK2 } from './data.js';

/* =========================================================================
   0) SUPABASE SETUP
   ======================================================================= */
const SUPABASE_URL = 'https://lmmddxshhvmylkkgrwwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWRkeHNoaHZteWxra2dyd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTQzMTUsImV4cCI6MjA3NDk3MDMxNX0.6TpxotYqAnIpsqcL8bz9xzwUXTDaizbLFPtDUHM9nTY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* =========================================================================
   1) UTILITIES & PERSISTENCE
   ======================================================================= */

// DOM helpers
const $ = (sel, node = document) => node.querySelector(sel);
const $$ = (sel, node = document) => [...node.querySelectorAll(sel)];

// UUID helper
const uuid = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c / 4)).toString(16)
  );

// LocalStorage helpers
function saveLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function loadLS(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

/* =========================================================================
   1.1) DEVELOPMENT FLAGS (URL PARAMS) & RESET
   ======================================================================= */

// DEV OVERRIDES via URL:
// ?load=high|low&interest=high|low&cat=Backpacks&cond=...&reset=1

// DEV parser for query params + reset flag
const DEV = (() => {
  const sp = new URLSearchParams(location.search);
  const normHL = v => (v && /^(high|low)$/i.test(v) ? v.toLowerCase() : null);

  return {
    load: normHL(sp.get('load')),                          // 'high' | 'low' | null
    interest: normHL(sp.get('interest')),                  // 'high' | 'low' | null
    code: sp.get('cond') || null,                          // condition code override (optional)
    cat: sp.get('cat') || null,                            // category override (optional)
    reset: /^(1|true|yes)$/i.test(sp.get('reset') || '')   // reset flag
  };
})();

// Clear all experiment-related local state
function nukeLocalState() {
  try {
    localStorage.removeItem('exp_state');
    localStorage.removeItem('session_saved');
    localStorage.removeItem('participant_id');
    localStorage.removeItem('participant_condition');
  } catch {}
}

// Reset state at bootstrap if ?reset=1 etc. is present
(function maybeReset() {
  if (DEV.reset) {
    nukeLocalState();

    // Remove ?reset parameter to avoid endless reload loops
    const url = new URL(location.href);
    url.searchParams.delete('reset');
    location.replace(url.toString());
  }
})();

/* =========================================================================
   2) GLOBAL STATE
   ======================================================================= */

let state = loadLS('exp_state', {
  session_id: uuid(),
  participant_id: null,
  started_at: new Date().toISOString(),
  pageIndex: 0,
  condition: {},                // { code, interest, load }
  assignedCategory: null,
  mouse_buffer: [],
  answers: {
    task1: {},
    task2: { selected_prod_id: null, selected_prod_name: null },
    paas: null,
    nrq: {},
    pies: {},
    demo: {
      age: null,
      gender: null,
      education_code: null,
      education_other: '',
      employment_code: null,
      employment_other: ''
    }
  }
});

// Ensure nested state structures exist (helps with migrations / older LS versions)
function ensureStateShape() {
  state.answers = state.answers || {};
  state.answers.task1 = state.answers.task1 || {};
  state.answers.task2 = state.answers.task2 || {
    selected_prod_id: null,
    selected_prod_name: null
  };
  state.answers.paas = state.answers.paas ?? null;
  state.answers.nrq = state.answers.nrq || {};
  state.answers.pies = state.answers.pies || {};
  state.answers.ecm = state.answers.ecm || {};
  state.answers.demo =
    state.answers.demo || {
      age: null,
      gender: null,
      education_code: null,
      education_other: '',
      employment_code: null,
      employment_other: ''
    };

  persist();
}

ensureStateShape();

function persist() {
  saveLS('exp_state', state);
}

/* =========================================================================
   3) SUPABASE: IDENTITY & PARTICIPANT ROW
   ======================================================================= */

const STORAGE_KEYS = {
  pid: 'participant_id',
  cond: 'participant_condition'
};

/**
 * Ensure we have a valid participant row.
 * Creates a participant via RPC once and caches the ID & condition.
 * Returns: { participant_id, condition }
 */
async function ensureParticipant() {
  let pid = localStorage.getItem(STORAGE_KEYS.pid);

  async function createOnServer(withPid) {
    const { data, error } = await supabase.rpc('create_participant', {
      p_participant_id: withPid
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;

    localStorage.setItem(STORAGE_KEYS.pid, withPid);
    localStorage.setItem(STORAGE_KEYS.cond, row.condition);

    state.participant_id = withPid;
    state.condition = {
      code: row.condition,
      interest: row.interest,
      load: row.load
    };
    saveLS('exp_state', state);

    return { participant_id: withPid, condition: row.condition };
  }

  // First run: create new participant row
  if (!pid) {
    pid = crypto.randomUUID();
    return createOnServer(pid);
  }

  // Existing pid: verify corresponding row exists
  const { data: partRow, error: selErr } = await supabase
    .from('participants')
    .select('condition, interest, load')
    .eq('participant_id', pid)
    .maybeSingle();

  // If the row is missing, recreate it while keeping the same pid
  if (!partRow || selErr?.code === 'PGRST116') {
    localStorage.removeItem('session_saved');
    return createOnServer(pid);
  }

  // Rehydrate state + cache
  state.participant_id = pid;
  state.condition = {
    code: partRow.condition,
    interest: partRow.interest,
    load: partRow.load
  };
  localStorage.setItem(STORAGE_KEYS.cond, partRow.condition);
  saveLS('exp_state', state);

  /* -----------------------------------------------------------------------
     DEV OVERRIDE BLOCK: override load / interest / condition / category
     using URL parameters (development only)
     ---------------------------------------------------------------------- */
  try {
    // Override condition (load/interest/code) if DEV flags are set
    if (DEV.load || DEV.interest || DEV.code) {
      const up = {
        load: DEV.load || partRow.load,
        interest: DEV.interest || partRow.interest,
        condition:
          DEV.code ||
          `dev:${(DEV.interest || partRow.interest) ?? '-'}-${
            (DEV.load || partRow.load) ?? '-'
          }`
      };

      const { data: updRow, error: updErr } = await supabase
        .from('participants')
        .update(up)
        .eq('participant_id', pid)
        .select('condition, interest, load')
        .maybeSingle();

      if (!updErr && updRow) {
        state.condition = {
          code: updRow.condition,
          interest: updRow.interest,
          load: updRow.load
        };
        localStorage.setItem(STORAGE_KEYS.cond, updRow.condition);
        saveLS('exp_state', state);
        console.log('[DEV] Forced condition:', state.condition);
      } else if (updErr) {
        console.warn('[DEV] Condition override failed:', updErr);
      }
    }

    // Optional: override assigned category for Task 2 (?cat=Backpacks etc.)
    if (DEV.cat) {
      // normalizeCategoryKey is assumed to exist globally or elsewhere
      state.assignedCategory = normalizeCategoryKey(DEV.cat);
      saveLS('exp_state', state);
      console.log('[DEV] Forced category:', state.assignedCategory);
    }
  } catch (e) {
    console.warn('[DEV] Override block error:', e);
  }

  return { participant_id: pid, condition: partRow.condition };
}

/* =========================================================================
   4) TASK 1: CATEGORIES & SAVE HELPERS
   ======================================================================= */

const TASK1_CATEGORIES = [
  'Detergents',
  'Smartwatches',
  'Speakers',
  'Water Bottles',
  'Electric Toothbrushes',
  'Backpacks'
];

const T1_COLS = {
  Detergent: 't1_detergent',
  Detergents: 't1_detergent',
  Smartwatch: 't1_smartwatch',
  Smartwatches: 't1_smartwatch',
  Speaker: 't1_speaker',
  Speakers: 't1_speaker',
  'Water Bottle': 't1_bottle',
  'Water Bottles': 't1_bottle',
  'Electric Toothbrush': 't1_toothbrush',
  'Electric Toothbrushes': 't1_toothbrush',
  Backpack: 't1_backpack',
  Backpacks: 't1_backpack'
};

function t1ColumnFromCategory(label) {
  const s = String(label).trim().toLowerCase();
  if (T1_COLS[label]) return T1_COLS[label];
  if (/detergent/.test(s)) return 't1_detergent';
  if (/smartwatch/.test(s)) return 't1_smartwatch';
  if (/speaker/.test(s)) return 't1_speaker';
  if (/water bottle/.test(s)) return 't1_bottle';
  if (/electric toothbrush/.test(s)) return 't1_toothbrush';
  if (/backpack/.test(s)) return 't1_backpack';
  throw new Error(`No Task1 column mapping for category: "${label}"`);
}

async function saveTask1Ratings(ratingsByColumn) {
  const { participant_id } = await ensureParticipant();
  const payload = { participant_id, ...ratingsByColumn };

  const { data, error, status, statusText } = await supabase
    .from('participants')
    .upsert(payload, { onConflict: 'participant_id' })
    .select(
      'participant_id, t1_detergent, t1_smartwatch, t1_speaker, t1_bottle, t1_toothbrush, t1_backpack'
    )
    .maybeSingle();

  console.log('[Task1 UPSERT] payload:', payload);
  console.log('[Task1 UPSERT] status:', status, statusText);

  if (error) {
    console.error('[Task1 UPSERT] error:', error);
    throw new Error(error.message || JSON.stringify(error));
  }

  console.log('[Task1 UPSERT] saved row:', data);
  return data;
}

/* --- Task 1 control handles (used in render/beforeNext) --- */

let T1_CTRL = null;
let T1_SAVE_TIMER = null;
let T1_CONTAINER = null;
let T1_LAST_SIG = null;

/**
 * Collect Task 1 ratings from the table-based container.
 * Expects rows like: <tr data-cat="Detergents">...</tr>
 */
function collectTask1RatingsFrom(container) {
  if (!container) throw new Error('collectTask1RatingsFrom: no container');

  const rows = [...container.querySelectorAll('tr[data-cat]')];
  const ratings = {};
  const missing = [];

  rows.forEach((tr, idx) => {
    const cat = tr.getAttribute('data-cat');
    const name = `t1_cat_${idx}`;
    const sel = tr.querySelector(`input[name="${name}"]:checked`);
    const val = sel ? Number(sel.value) : null;

    if (!val) {
      missing.push(cat);
    } else {
      const col = T1_COLS?.[cat] || t1ColumnFromCategory(cat);
      ratings[col] = val;
    }
  });

  return { ratings, missing };
}

/* =========================================================================
   5) RANDOMIZATION HELPERS (Task 2)
   ======================================================================= */

// Deterministic hash from string → integer
function hashStringToInt(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Pseudo-random generator (Mulberry32)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates shuffle with custom RNG
function shuffleWithRNG(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Task 2: persist selected product
async function saveTask2SelectionOrThrow() {
  const name = (state.answers?.task2?.selected_prod_name || '').trim();
  if (!name) throw new Error('NO_SELECTION');

  const { error: upErr } = await supabase
    .from('participants')
    .upsert(
      { participant_id: state.participant_id, selected_product: name },
      { onConflict: 'participant_id' }
    );

  if (upErr) throw upErr;

  try {
    await flushMouseEvents('task-2');
  } catch {}

  try {
    stopMouseTracking();
  } catch {}
}

/* =========================================================================
   6) QUESTIONNAIRE CONSTANTS & HELPERS
   ======================================================================= */

/* --- PAAS labels --- */

const PAAS_LABELS = {
  1: 'very, very low mental effort',
  2: 'very low mental effort',
  3: 'low mental effort',
  4: 'rather low mental effort',
  5: 'Neither high nor low mental effort',
  6: 'rather high mental effort',
  7: 'high mental effort',
  8: 'very high mental effort',
  9: 'very, very high mental effort'
};

/* --- NRQ items --- */

const NRQ_ITEMS = [
  {key: 'ICL1',text: 'For this task, many things needed to be kept in mind simultaneously.'},
  {key: 'ICL2', text: 'This task was very complex.' },
  {key: 'ECL1', text: 'During this task, it was exhausting to find the important information.'},
  {key: 'ECL2', text: 'The design of this task was very inconvenient for learning.'},
  {key: 'ECL3', text: 'During this task, it was difficult to recognize and link the crucial information.'}
];

// Simple in-place shuffle using Math.random
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* --- PIES items --- */

const PIES_ITEMS = [
  { key: 'PIES1', t: (pp, ps) => `I am very interested in ${pp}.` },
  { key: 'PIES2', t: (pp, ps) => `${capFirst(pp)} are not very important to me.` },
  { key: 'PIES3', t: (pp, ps) => `I never think about ${pp}.` },
  { key: 'PIES4', t: (pp, ps) => `In choosing a ${ps}, I would look for some specific features or options.`},
  { key: 'PIES5', t: (pp, ps) => `If I chose a new ${ps}, I would investigate the available choices in depth.`},
  { key: 'PIES6', t: (pp, ps) => `Some ${pp} are clearly better than others.` },
  { key: 'PIES7', t: (pp, ps) => `If I were choosing a ${ps}, I would wish to learn about the available options in detail.`},
  { key: 'PIES8', t: (pp, ps) => `When people see someone’s ${ps}, they form an opinion of that person.`},
  { key: 'PIES9', t: (pp, ps) => `A ${ps} expresses a lot about the person who owns it.` },
  { key: 'PIES10', t: (pp, ps) => `You can learn a lot about a person by seeing their ${ps}.` },
  { key: 'PIES11', t: (pp, ps) => `It is important to choose a ${ps} that matches one’s image.`},
  { key: 'PIES_AC', t: () => 'Please select "Strongly agree" (5).'} // attention check
];

function piesNounsForCategory(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'detergent': return { pp: 'detergents', ps: 'detergent' };
    case 'smartwatch': return { pp: 'smartwatches', ps: 'smartwatch' };
    case 'speaker': return { pp: 'speaker', ps: 'speaker' };
    case 'water bottle': return { pp: 'water bottles', ps: 'water bottle' };
    case 'electric toothbrush': return { pp: 'electric toothbrushes', ps: 'electric toothbrush' };
    case 'backpack': return { pp: 'backpacks', ps: 'backpack' };
    default: return { pp: 'products', ps: 'product' };
  }
}

/* --- ECM items & helpers --- */

// Scales:
// CI, PU, C = 7-pt Likert (1 = Strongly disagree … 7 = Strongly agree)
// Satisfaction = 7-pt semantic differentials
const ECM_HEADERS = [1, 2, 3, 4, 5, 6, 7];

const ECM_LIKERT_LABELS = [
  'Strongly\ndisagree',
  'Disagree',
  'Slightly\ndisagree',
  'Neutral',
  'Slightly\nagree',
  'Agree',
  'Strongly\nagree'
];

const ECM_CI_ITEMS = [
  {key: 'CI1', text: 'I intend to continue using the chosen product rather than discontinue its use.'},
  {key: 'CI2', text: 'My intentions are to continue using the chosen product rather than use any alternative means.'},
  {key: 'CI3', text: 'If I could, I would like to discontinue my use of the chosen product.'} // reverse in analysis
];

// Dynamic PU items based on category
function getECM_PU_ITEMS(cat) {
  const endings = {
    Detergent: 'doing laundry',
    Smartwatch: 'tracking my health and activities',
    Speaker: 'enhancing my environment with quality sound',
    'Water Bottle': 'staying hydrated',
    'Electric Toothbrush': 'maintaining oral hygiene',
    Backpack: 'carrying and organizing my essentials'
  };

  const end = endings[cat] || 'its daily use'; // fallback if category is unknown

  return [
    {key: 'PU1', text: `Using the chosen product improves my performance in ${end}.`},
    {key: 'PU2', text: `Using the chosen product increases my productivity in ${end}.`},
    {key: 'PU3', text: `Using the chosen product enhances my effectiveness in ${end}.`},
    {key: 'PU4', text: `Overall, the chosen product is useful in ${end}.`}
  ];
}

const ECM_SAT_ITEMS = [
  { key: 'S1', left: 'Very dissatisfied', right: 'Very satisfied' },
  { key: 'S2', left: 'Very displeased', right: 'Very pleased' },
  { key: 'S3', left: 'Very frustrated', right: 'Very contented' },
  { key: 'S4', left: 'Absolutely terrible', right: 'Absolutely delighted' }
];

const capFirst = s =>
  s && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/* =========================================================================
   7) DEMOGRAPHICS LABEL MAPS
   ======================================================================= */

const GENDER_LABEL = {
  1: 'Male',
  2: 'Female',
  3: 'Non-binary',
  4: 'Prefer not to say'
};

const EDUCATION_LABEL = {
  1: 'No schooling completed',
  2: 'Secondary School (Real- oder Hauptschulabschulabschluss)',
  3: 'A-Levels (Allgemeine Hochschulreife)',
  4: 'Vocational Training (Ausbildung/Berufskolleg)',
  5: "Bachelor's Degree",
  6: "Master's Degree",
  7: 'PhD',
  8: 'Other',
  9: 'Prefer not to say'
};

const EMPLOYMENT_LABEL = {
  1: 'Full-Time',
  2: 'Part-Time',
  3: 'Working-Student / Temporary',
  4: 'Retired',
  5: 'Unemployed',
  6: 'Unable to work',
  7: 'Other',
  8: 'Prefer not to say'
};

/* =========================================================================
   8) PAGE DEFINITIONS
   ======================================================================= */

const PAGES = [
  /* -----------------------------------------------------------------------
     Intro
     ---------------------------------------------------------------------- */
  {
    slug: 'instructions',
    title: 'Welcome',
    render: container => {
      container.innerHTML = `
        <div class="card">
          <h1>Welcome to the Study – Information & Consent</h1>
          <p>Thank you for participating in the study! I appreciate your time and involvement.</p>
          <p>I am a student from the University of Cologne, conducting this research as part of my master thesis in Business Analytics and Econometrics.</p>
          <p>The purpose of this experiment is to investigate individuals' behavior in online decision-making. The questions are straightforward and there are no right or wrong answers. I am interested in your honest opinion and thoughts. Your responses are completely anonymous and confidential. The data collected will be used only for research purposes, and no personally identifiable information will be linked to your responses. Your participation is entirely voluntary. You have the right to withdraw from the study at any point without any penalties or consequences.</p>
          <p>If you have any questions about the study or need further information, feel free to contact me (<a href="mailto:mruescho@smail.uni-koeln.de">mruescho@smail.uni-koeln.de</a>).</p>
          <p>The entire experiment will take about 10 minutes and the data collection starts from this page onwards. You must be 18 years or older to participate in this study.</p>
          <p> Important: This study can <strong>only</strong> be conducted using a <strong>laptop or desktop computer</strong>. Participation with mobile devices is not possible.</p>
          <p><strong>By continuing, you agree to participate in the study.</strong></p>
        </div>
      `;
    }, 
      beforeNext: async () => {
      try {
      // Hier wird beim ersten „Continue“-Klick alles initialisiert:
      // - ensureParticipant() (in ensureSessionRow)
      // - Session-Row
      await ensureSessionRow();
      return true;
    } catch (e) {
      console.error('Failed to init participant/session', e);
      alert('An error occurred when starting the study. Please reload the page and try again.');
      return false;
    }
  }
  },

  /* -----------------------------------------------------------------------
     Experimental Instructions (Overview page after consent)
     ---------------------------------------------------------------------- */
  {
    slug: 'experimental-instructions',
    title: 'Experimental Instructions',
    render: container => {
      container.innerHTML = `
        <div class="card">
          <h1>Experimental Instructions</h1>
          <p> Thank you very much for agreeing to participate in this study. The study is structured as follows: </p>
          <p> First, you will complete two tasks related to online product choice.</p>
          <p> This is followed by four short questionnaires about your experiences during the decision-making task and about the selected product. </p>
          <p> Finally, you will be asked to provide some demographic information.</p>
          <p>Please read the instructions carefully and answer all questions honestly. There are no right or wrong answers.</p>
        </div>
      `;
    },
    beforeNext: async () => true
  },


  /* -----------------------------------------------------------------------
     Task 1 — Product Rating
     ---------------------------------------------------------------------- */
  {
    slug: 'task-1',
    title: 'Task 1',
    render: async container => {
      // Abort previous listeners (if any) and keep references for cleanup
      T1_CTRL?.abort();
      T1_CTRL = new AbortController();
      const { signal } = T1_CTRL;
      T1_CONTAINER = container;
      T1_LAST_SIG = null;

      // Ensure participant + condition exist
      try {
        const { participant_id, condition } = await ensureParticipant();
        console.log('Participant:', participant_id, 'Condition:', condition);
      } catch (e) {
        container.innerHTML = `<div class="error">Could not create participant. Please reload.</div>`;
        console.error(e);
        return;
      }

      const DESCRIPTORS = {
        1: 'Not interesting at all',
        2: 'Less interesting',
        3: 'Neutral',
        4: 'Quite Interesting',
        5: 'Very Interesting'
      };

      const HEADERS_5 = [1, 2, 3, 4, 5];

      container.innerHTML = `
        <div class="card">
          <h1>Task 1: Product Rating</h1>
          <p>First, we would like to learn about your personal product preferences.</p>
          <p><strong>Please rate each product category on a five-point scale from
          <i>Not interesting at all (1)</i> to <i>Very Interesting (5)</i>.</strong></p>

          <div id="t1Error" class="error" style="display:none;"></div>

          <div class="likert-table-wrapper">
            <table class="likert-table t1-table">
              <thead>
                <tr>
                  <th>Product category</th>
                  ${HEADERS_5.map(h => `<th>${h}</th>`).join('')}
                </tr>
                <tr class="likert-help">
                  <th></th>
                  <td>Not<br>interesting</td>
                  <td>Less<br>interesting</td>
                  <td>Neutral</td>
                  <td>Quite<br>interesting</td>
                  <td>Very<br>interesting</td>
                </tr>
              </thead>
              <tbody>
                ${TASK1_CATEGORIES.map((cat, i) => {
                  const col = T1_COLS?.[cat] || t1ColumnFromCategory(cat);
                  const saved = state.answers?.task1?.[col] ?? null;
                  return `
                    <tr data-cat="${cat}">
                      <td class="stmt">${cat}</td>
                      ${HEADERS_5.map(v => `
                        <td class="center">
                          <input
                            type="radio"
                            name="t1_cat_${i}"
                            value="${v}"
                            ${saved === v ? 'checked' : ''}
                            aria-label="${cat} = ${v}"
                          >
                        </td>
                      `).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      const err = container.querySelector('#t1Error');
      let lastSavedSig = null;

      const collectRatings = () => collectTask1RatingsFrom(container);

      // Auto-save Task 1 ratings when all categories are filled
      const tryAutoSave = async () => {
        if ((PAGES[state.pageIndex]?.slug) !== 'task-1') return;

        const { ratings, missing } = collectRatings();
        console.log('[Task1] collected ratings:', ratings, 'missing:', missing);

        if (missing.length) return;

        const sig = JSON.stringify(ratings);
        if (sig === lastSavedSig) return;

        err.style.display = 'none';
        err.textContent = '';

        try {
          await saveTask1Ratings(ratings);
          lastSavedSig = sig;

          // Assign category based on ratings (best match chosen by DB function)
          const { data: catData, error: catErr } = await supabase.rpc(
            'choose_assigned_category',
            { p_participant_id: state.participant_id }
          );

          if (!catErr) {
            state.assignedCategory = catData || null;
            persist();
          } else {
            console.warn('choose_assigned_category RPC failed:', catErr);
          }
        } catch (e) {
          console.error('Task1 save error:', e);
          err.textContent = `Saving failed: ${e.message || 'Unknown error'}`;
          err.style.display = 'block';
        }
      };

      function onT1Change(e) {
        if (!e.target.matches('input[type="radio"][name^="t1_cat_"]')) return;

        const tr = e.target.closest('tr[data-cat]');
        const cat = tr?.getAttribute('data-cat');
        const col = T1_COLS?.[cat] || t1ColumnFromCategory(cat);
        const val = Number(e.target.value);

        state.answers.task1[col] = val;
        persist();

        clearTimeout(T1_SAVE_TIMER);
        T1_SAVE_TIMER = setTimeout(tryAutoSave, 200);
      }

      container.addEventListener('change', onT1Change, { signal });
    },

    beforeNext: async () => {
      try {
        T1_CTRL?.abort();
      } catch {}

      if (T1_SAVE_TIMER) {
        clearTimeout(T1_SAVE_TIMER);
        T1_SAVE_TIMER = null;
      }

      const err = document.getElementById('t1Error');
      if (err) {
        err.style.display = 'none';
        err.textContent = '';
      }

      const root = T1_CONTAINER || document.getElementById('pageMount');
      const { ratings, missing } = collectTask1RatingsFrom(root);

      if (missing.length) {
        if (err) {
          err.textContent = 'Please rate all categories before continuing.';
          err.style.display = 'block';
        }
        return false;
      }

      try {
        await saveTask1Ratings(ratings);

        const { data: catData, error: catErr } = await supabase.rpc(
          'choose_assigned_category',
          { p_participant_id: state.participant_id }
        );

        if (!catErr) {
          state.assignedCategory = catData || null;
          persist();
        }

        T1_LAST_SIG = JSON.stringify(ratings);
        return true;
      } catch (e) {
        console.error('Task1 final save error:', e);
        if (err) {
          err.textContent = `Saving failed: ${e.message || 'Unknown error'}`;
          err.style.display = 'block';
        }
        return false;
      }
    }
  },

  /* -----------------------------------------------------------------------
     Task 2 — Intro
     ---------------------------------------------------------------------- */
  {
    slug: 'task-2-intro',
    title: 'Task 2 — Online Decision-Making (Instructions)',
    render: async container => {
      const toggleGlobalNext = show => {
        const selectors = [
          '#btnContinue',
          '#nextBtn',
          '.btn-next',
          'button[data-next]',
          '[data-role="next"]'
        ];
        selectors.forEach(sel =>
          document.querySelectorAll(sel).forEach(el => {
            el.style.display = show ? '' : 'none';
          })
        );
      };

      // Hide global "Continue" during intro
      toggleGlobalNext(false);

      const loadRaw = (state.condition?.load || 'low').toLowerCase();

      container.innerHTML = `
        <div class="card">
          <h1>Task 2 — Instructions</h1>
          <p>In the following you are presented with a list of products. Additional information on the products can be seen when you hover over the product.</p>
          <p><strong>Task: Imagine you are buying for your <i>daily use</i>. Please select the product you would add to your cart. You may review as much information as you like before making your decision.</strong></p>
          <hr/>
          <div style="margin-top:20px;">
            <button id="startTask2" class="btn primary">Start Task 2</button>
          </div>
        </div>
      `;

      const btn = container.querySelector('#startTask2');
      if (btn) {
        btn.addEventListener('click', () => {
          if (!tracking) startMouseTracking();
          if (typeof window.__doNext === 'function') window.__doNext();
        });
      }
    },
    beforeNext: async () => true
  },

  /* -----------------------------------------------------------------------
     Task 2 — Product Selection
     ---------------------------------------------------------------------- */
  {
    slug: 'task-2',
    title: 'Task 2 — Online Decision-Making',
    render: async container => {
      const loadRaw = (state.condition?.load || 'low').toLowerCase();
      const nAttrs = loadRaw === 'high' ? 6 : 3;

      // Ensure assigned category is populated in case of reloads / deep links
      if (!state.assignedCategory) {
        try {
          const { data: row, error } = await supabase
            .from('participants')
            .select('assigned_category')
            .eq('participant_id', state.participant_id)
            .single();

          if (!error) {
            state.assignedCategory = row?.assigned_category || null;
            saveLS('exp_state', state);
          } else {
            console.warn('Could not load assigned_category from DB:', error);
          }
        } catch (e) {
          console.warn('assigned_category lookup failed:', e);
        }
      }

      const chosenCat = state.assignedCategory || 'Detergent';
      const baseItems = PRODUCTS[chosenCat] || [];

      // Use deterministic randomization based on session or participant ID
      const seedInt = hashStringToInt(
        String(state.session_id || state.participant_id || 'seed')
      );
      const rng = mulberry32(seedInt);
      const items = shuffleWithRNG(baseItems, rng);

      let html = `
        <div class="card">
          <h1>Task 2 - Online Decision Making</h1>
          <p><strong>Task: Imagine you are buying for your <i>daily use</i>. Please select the product you would add to your cart.</strong></p>
          <p>Additional information on the products can be seen when you hover over the product. You may review as much information as you like before making your decision.</p>
          <p>Click on the product to select it and finish the task using the “Finish Task 2” button at the bottom.</p>
      `;

      if (!items.length) {
        html += `
          <div class="card error" style="margin-top:12px;">
            No products found for the category <em>${chosenCat}</em>. Please go back and try again.
          </div>
        `;
      } else {
        html += `
          <div class="product-grid-wrap">
            <div class="product-grid" id="productGrid">
              ${items
                .map(p => {
                  const attrs =
                    p.attrs?.slice(0, Math.min(nAttrs, p.attrs.length)) || [];
                  return `
                    <article
                      class="product-card"
                      data-prod="${p.id}"
                      data-name="${p.name}"
                      tabindex="0"
                      aria-describedby="${p.id}-attrs"
                    >
                      <img class="product-thumb" alt="${p.name}" src="${p.image}" />
                      <div class="product-main">
                        <div class="row row-space">
                          <div class="product-title" title="${p.name}">${p.name}</div>
                          <div class="price">${p.price ?? ''}</div>
                        </div>
                      </div>
                      <ul id="${p.id}-attrs" class="attrs">
                        ${attrs.map(a => `<li title="${a}">${a}</li>`).join('')}
                      </ul>
                    </article>
                  `;
                })
                .join('')}
            </div>
          </div>
        `;
      }

      html += `
        <hr/>
        <div id="t2Error" class="error t2-error" style="display:none;"></div>
        <div style="margin-top:20px;">
          <button id="finishTask2" class="btn primary">Finish Task 2</button>
        </div>
      </div>
      `;

      container.innerHTML = html;

      // Rehydrate previously saved selection (if any)
      const savedId = state.answers?.task2?.selected_prod_id;
      if (savedId) {
        const esc =
          window.CSS && CSS.escape
            ? CSS.escape(savedId)
            : String(savedId).replace(/"/g, '\\"');
        const selCard = container.querySelector(
          `.product-card[data-prod="${esc}"]`
        );
        if (selCard) selCard.classList.add('selected');
      }

      // Start mouse tracking for Task 2
      startMouseTracking();

      // Hover tracking for each product card
      $$('.product-card', container).forEach(card => {
        const prodId = card.getAttribute('data-prod');
        card.addEventListener('pointerenter', () => startHover(prodId), {
          passive: true
        });
        card.addEventListener(
          'pointerleave',
          () => endHover('leave'),
          { passive: true }
        );
      });

      $('#productGrid', container)?.addEventListener(
        'pointerleave',
        () => endHover('leave'),
        { passive: true }
      );

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) endHover('leave');
      });

      // Selection click handler
      const grid = container.querySelector('#productGrid');
      if (grid) {
        grid.addEventListener('click', e => {
          const card = e.target.closest('.product-card');
          if (!card) return;

          const prodId = card.dataset.prod;
          const prodName =
            card.dataset.name ||
            card.querySelector('.product-title')?.textContent?.trim() ||
            '';

          // Redundant but kept for compatibility
          state.task2_selection = prodId;
          state.task2_selection_name = prodName;

          state.answers.task2.selected_prod_id = prodId;
          state.answers.task2.selected_prod_name = prodName;
          persist();

          grid
            .querySelectorAll('.product-card.selected')
            ?.forEach(el => el.classList.remove('selected'));
          card.classList.add('selected');
        });
      }

      // Finish Task 2 button
      const finishBtn = container.querySelector('#finishTask2');
      if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
          const errBox = document.getElementById('t2Error');
          const name = state.task2_selection_name?.trim();

          if (!name) {
            if (errBox) {
              errBox.textContent = 'Please select a product before finishing.';
              errBox.style.display = 'block';
            }
            return;
          }

          finishBtn.disabled = true;
          finishBtn.textContent = 'Saving...';

          try {
            const { error: upErr } = await supabase
              .from('participants')
              .upsert(
                { participant_id: state.participant_id, selected_product: name },
                { onConflict: 'participant_id' }
              );

            if (upErr) throw upErr;

            try {
              await flushMouseEvents('task-2');
            } catch (e) {
              console.error('Flush failed:', e);
            }

            try {
              stopMouseTracking();
            } catch {}

            if (typeof window.__doNext === 'function') window.__doNext();
          } catch (e) {
            console.error('Save selection failed:', e);
            if (errBox) {
              errBox.textContent = `Saving failed, please try again. ${
                e?.message || ''
              }`;
              errBox.style.display = 'block';
            }
            finishBtn.disabled = false;
            finishBtn.textContent = 'Finish Task 2';
          }
        });
      }
    },

    beforeNext: async () => {
      const errBox = document.getElementById('t2Error');
      if (errBox) {
        errBox.style.display = 'none';
        errBox.textContent = '';
      }

      try {
        // Throws 'NO_SELECTION' if nothing is selected
        await saveTask2SelectionOrThrow();

        if (hoverActive) endHover('end_task');
        await flushHoverEvents();
        return true;
      } catch (e) {
        if (e?.message === 'NO_SELECTION') {
          if (errBox) {
            errBox.textContent = 'Please select a product before continuing.';
            errBox.style.display = 'block';
            errBox.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }

          const grid = document.getElementById('productGrid');
          if (grid) {
            grid.classList.add('error-ring');
            setTimeout(() => grid.classList.remove('error-ring'), 800);
          }
          return false;
        }

        if (errBox) {
          errBox.textContent = `Saving failed, please try again. ${
            e?.message || ''
          }`;
          errBox.style.display = 'block';
        }
        return false;
      }
    }
  },

  /* -----------------------------------------------------------------------
     Task 3.1 — PAAS (Cognitive Load)
     ---------------------------------------------------------------------- */
  {
    slug: 'task-3-paas',
    title: 'Task 3 — PAAS (Cognitive Load)',
    render: async (container) => {
      const saved = state.answers?.paas ?? null;

      // Load chosen product from Supabase
      if (!state.selected_product && state.participant_id) {
      const { data, error } = await supabase
        .from('participants')
        .select('selected_product')
        .eq('participant_id', state.participant_id)
        .maybeSingle();

      if (!error && data?.selected_product) {
        state.selected_product = data.selected_product;
        saveLS('exp_state', state); // falls du LocalStorage nutzt
        console.log('[PAAS] Loaded selected_product from Supabase:', state.selected_product);
      } else {
        console.warn('[PAAS] Could not load selected_product', error);
      }
    }

      const productName = state.selected_product || 'the product you chose';

      container.innerHTML = `
        <div class="card">
          <h1>Questionnaire (1)</h1>
          <p>Thanks for choosing a final product. You have selected:<strong> ${productName}</strong></p>
          <p>Next, you will be asked to complete four short questionnaires about your decision-making and product choice.</p>
          <p>The first two questionnaires assess your cognitive load during the previous decision-making task.</p>
          <p><strong>Please rate your mental effort required to solve the previous decision-making task on a 9-point Likert scale, ranging from <i>very, very low mental effort</i> (1) to <i>very, very high mental effort</i> (9):</strong></p>
          <div id="paasError" class="error" style="display:none;"></div>

          <div class="paas-scale" role="radiogroup" aria-label="PAAS scale">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
              .map(
                v => `
              <label class="paas-option">
                <input type="radio" name="paas" value="${v}" ${
                  saved === v ? 'checked' : ''
                }>
                <span class="paas-label">
                  <strong>${v} </strong> - ${PAAS_LABELS[v]}
                </span>
              </label>
            `
              )
              .join('')}
          </div>
        </div>
      `;

      container.addEventListener('change', e => {
        if (e.target.name === 'paas') {
          state.answers.paas = Number(e.target.value);
          persist();
        }
      });
    },

    beforeNext: async () => {
      const sel = document.querySelector('input[name="paas"]:checked');
      const err = document.getElementById('paasError');

      if (!sel) {
        if (err) {
          err.textContent = 'Please select one option for the scale.';
          err.style.display = 'block';
        }
        return false;
      }

      const { error } = await supabase
        .from('questionnaires')
        .upsert(
          { participant_id: state.participant_id, paas: parseInt(sel.value, 10) },
          { onConflict: 'participant_id' }
        );

      if (error) {
        console.error('PAAS upsert error:', error);
        if (err) {
          err.textContent = `Save failed: ${
            error.message || 'Unknown error'
          }.`;
          err.style.display = 'block';
        }
        return false;
      }
      return true;
    }
  },

  /* -----------------------------------------------------------------------
     Task 3.2 — NRQ (Cognitive Load)
     ---------------------------------------------------------------------- */
  {
    slug: 'task-3-nrq',
    title: 'Task 3 — Cognitive Load (NRQ)',
    render: container => {
      const items = NRQ_ITEMS;
      const headers = [1, 2, 3, 4, 5, 6, 7];

      container.innerHTML = `
        <div class="card">
          <h1>Questionnaire (2)</h1>
          <p>The following statements refer to the previous decision-making task.</p>
          <p><strong>Please rate the following statements on a 7-point Likert scale from “completely wrong” (1) to “absolutely right” (7).</strong></p>
          <div id="nrqError" class="error" style="display:none;"></div>

          <div class="likert-table-wrapper">
            <table class="likert-table nrq-table">
              <thead>
                <tr>
                  <th>Statement</th>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
                <tr class="likert-help">
                  <th></th>
                  <td>Completely<br/>wrong</td>
                  <td>Mostly<br/>wrong</td>
                  <td>Slightly<br/>wrong</td>
                  <td>Neutral</td>
                  <td>Slightly<br/>right</td>
                  <td>Mostly<br/>right</td>
                  <td>Absolutely<br/>right</td>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(item => {
                    const saved = state.answers?.nrq?.[item.key] ?? null;
                    return `
                      <tr>
                        <td class="stmt">${item.text}</td>
                        ${headers
                          .map(
                            v => `
                          <td class="center">
                            <input
                              type="radio"
                              name="nrq_${item.key}"
                              value="${v}"
                              ${saved === v ? 'checked' : ''}
                              aria-label="${item.key} = ${v}"
                            >
                          </td>
                        `
                          )
                          .join('')}
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.addEventListener('change', e => {
        const m = e.target.name?.match(/^nrq_(.+)$/);
        if (m) {
          const key = m[1];
          state.answers.nrq[key] = Number(e.target.value);
          persist();
        }
      });
    },

    beforeNext: async () => {
      const err = document.getElementById('nrqError');
      const row = { participant_id: state.participant_id };

      for (const { key } of NRQ_ITEMS) {
        const sel = document.querySelector(`input[name="nrq_${key}"]:checked`);
        if (!sel) {
          if (err) {
            err.textContent = 'Please answer all statements before continuing.';
            err.style.display = 'block';
          }
          return false;
        }
        row[`NRQ_${key}`] = parseInt(sel.value, 10);
      }

      const { error } = await supabase
        .from('questionnaires')
        .upsert(row, { onConflict: 'participant_id' });

      if (error) {
        console.error('NRQ upsert error:', error);
        if (err) {
          err.textContent = `Save failed: ${
            error.message || 'Unknown error'
          }.`;
          err.style.display = 'block';
        }
        return false;
      }
      return true;
    }
  },

  /* -----------------------------------------------------------------------
     Task 3.3 — PIES (Product Interest)
     ---------------------------------------------------------------------- */
  {
    slug: 'task-3-pies',
    title: 'Task 3 — Product Interest (PIES)',
    render: container => {
      const headers = [1, 2, 3, 4, 5];

      // Normalize category (e.g. "Smartwatches" → "smartwatch")
      const normCat =
        (state.assignedCategory || '').toLowerCase() === 'smartwatches'
          ? 'smartwatch'
          : state.assignedCategory || '';

      const { pp, ps } = piesNounsForCategory(normCat);

      // Stable random order per participant:
      // If we already have a stored order, reuse it; otherwise create and store.
      if (!Array.isArray(state.piesOrder) || state.piesOrder.length !== PIES_ITEMS.length) {
        const keys = PIES_ITEMS.map(item => item.key); // ['PIES1', 'PIES2', ...]
        state.piesOrder = shuffleInPlace(keys);
        persist();
      }

      // Map stored order of keys back to full item objects
      const orderedItems = state.piesOrder.map(key =>
        PIES_ITEMS.find(item => item.key === key)
      );

      container.innerHTML = `
        <div class="card">
          <h1>Questionnaire (3)</h1>
          <p>The next questionnaire assesses your interest in the products you have just viewed in the decision-making task.</p>
          <p><strong>Please indicate how much you agree with each of the following statements using a 5-point scale, ranging from <i>strongly disagree (1)</i> to <i>strongly agree (5)</i>.</strong></p>
          <div id="piesError" class="error" style="display:none;"></div>

          <div class="likert-table-wrapper">
            <table class="likert-table pies-table">
              <thead>
                <tr>
                  <th>Statement</th>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
                <tr class="likert-help">
                  <th></th>
                  <td>Strongly<br/>disagree</td>
                  <td>Disagree</td>
                  <td>Neutral</td>
                  <td>Agree</td>
                  <td>Strongly<br/>agree</td>
                </tr>
              </thead>
              <tbody>
                ${orderedItems
                  .map(item => {
                    const saved = state.answers?.pies?.[item.key] ?? null;
                    return `
                      <tr>
                        <td class="stmt">${item.t(pp, ps)}</td>
                        ${headers
                          .map(
                            v => `
                          <td class="center">
                            <input
                              type="radio"
                              name="pies_${item.key}"
                              value="${v}"
                              ${saved === v ? 'checked' : ''}
                              aria-label="${item.key} = ${v}"
                            >
                          </td>
                        `
                          )
                          .join('')}
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.addEventListener('change', e => {
        const m = e.target.name?.match(/^pies_(.+)$/);
        if (m) {
          const key = m[1];
          state.answers.pies[key] = Number(e.target.value);
          persist();
        }
      });
    },

    beforeNext: async () => {
      const err = document.getElementById('piesError');
      const row = { participant_id: state.participant_id };

      for (const { key } of PIES_ITEMS) {
        const sel = document.querySelector(`input[name="pies_${key}"]:checked`);
        if (!sel) {
          if (err) {
            err.textContent = 'Please answer all statements before continuing.';
            err.style.display = 'block';
          }
          return false;
        }
        row[key] = parseInt(sel.value, 10);
      }

      const { error } = await supabase
        .from('questionnaires')
        .upsert(row, { onConflict: 'participant_id' });

      if (error) {
        console.error('PIES upsert error:', error);
        if (err) {
          err.textContent = `Save failed: ${
            error.message || 'Unknown error'
          }.`;
          err.style.display = 'block';
        }
        return false;
      }
      return true;
    }
  },

  /* -----------------------------------------------------------------------
   Task 3.4 (Part 1) — ECM: PU & CI
   ---------------------------------------------------------------------- */
{
  slug: 'task-3-ecm',
  title: 'Questionnaire (4)',
  render: async container => {
    // Ensure assigned category is loaded from DB if missing
    if (!state.assignedCategory && state.participant_id) {
      try {
        const { data, error } = await supabase
          .from('participants')
          .select('assigned_category')
          .eq('participant_id', state.participant_id)
          .maybeSingle();

        if (!error && data?.assigned_category) {
          state.assignedCategory = data.assigned_category;
          saveLS('exp_state', state);
          console.log(
            '[ECM] Loaded assignedCategory from Supabase:',
            state.assignedCategory
          );
        } else {
          console.warn(
            '[ECM] Could not load assigned_category:',
            error || 'No value returned'
          );
        }
      } catch (err) {
        console.error('[ECM] Supabase fetch failed:', err);
      }
    }

    // Ensure selected_product is loaded from DB if missing
    if (!state.selected_product && state.participant_id) {
      try {
        const { data, error } = await supabase
          .from('participants')
          .select('selected_product')
          .eq('participant_id', state.participant_id)
          .maybeSingle();

        if (!error && data?.selected_product) {
          state.selected_product = data.selected_product;
          saveLS('exp_state', state);
          console.log(
            '[ECM] Loaded selected_product from Supabase:',
            state.selected_product
          );
        } else {
          console.warn(
            '[ECM] Could not load selected_product:',
            error || 'No value returned'
          );
        }
      } catch (err) {
        console.error('[ECM] Supabase fetch for selected_product failed:', err);
      }
    }

    const productName = state.selected_product || 'the product you selected';

    const likertRow = (name, label) => `
      <tr>
        <td class="stmt">${label}</td>
        ${ECM_HEADERS.map(
          v => `
          <td class="center">
            <input
              type="radio"
              name="${name}"
              value="${v}"
              ${state.answers.ecm?.[name] === v ? 'checked' : ''}
              aria-label="${name} = ${v}"
            >
          </td>
        `
        ).join('')}
      </tr>
    `;

    const category = state.assignedCategory || 'Detergents';
    const PU_ITEMS = getECM_PU_ITEMS(category);

    const PU_CI_COMBINED = [
      ...PU_ITEMS.map(it => ({ type: 'item', item: it })),
      ...ECM_CI_ITEMS.map(it => ({ type: 'item', item: it }))
    ];

    container.innerHTML = `
      <div class="card">
        <h1>Questionnaire (4.1)</h1>
        <p>In the following, you will be asked about your thoughts on <strong>${productName}</strong>, the product you selected in the decision-making task.</p>
        <p>All statements, refer to this as "chosen product".</p>
        <p> For this questionnaire, imagine hypothetically that you are using the chosen product in your everyday life.</p>
        <p>Please answer the questions based on the product information and features that were presented to you and how you imagine using it.</p>
        <p><strong>Please indicate how much you agree with each statement using a 7-point scale, from <i>strongly disagree (1)</i> to <i>strongly agree (7)</i>.</strong></p>
        <div id="ecmError" class="error" style="display:none;"></div>

        <!-- Perceived Usefulness + Continuance Intention -->
        <section class="card" style="padding:16px;">
          <div class="likert-table-wrapper">
            <table class="likert-table ecm-pu-ci">
              <thead>
                <tr>
                  <th>Statement</th>
                  ${ECM_HEADERS.map(h => `<th>${h}</th>`).join('')}
                </tr>
                <tr class="likert-help">
                  <th></th>
                  ${ECM_LIKERT_LABELS.map(lbl => `<td>${lbl}</td>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${PU_CI_COMBINED
                  .map(({ item }) => likertRow(`ECM_${item.key}`, item.text))
                  .join('')}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `;

    container.addEventListener('change', e => {
      const name = e.target?.name;
      if (!name || !/^ECM_/.test(name)) return;
      state.answers.ecm[name] = Number(e.target.value);
      persist();
    });
  },

  beforeNext: async () => {
    const err = document.getElementById('ecmError');
    if (err) {
      err.style.display = 'none';
      err.textContent = '';
    }

    const category = state.assignedCategory || 'Detergents';
    const PU_ITEMS = getECM_PU_ITEMS(category);

    const requiredKeys = [
      ...PU_ITEMS.map(it => 'ECM_' + it.key),
      ...ECM_CI_ITEMS.map(it => 'ECM_' + it.key)
    ];

    for (const k of requiredKeys) {
      const sel = document.querySelector(`input[name="${k}"]:checked`);
      if (!sel) {
        if (err) {
          err.textContent = 'Please answer all statements before continuing.';
          err.style.display = 'block';
        }
        return false;
      }
    }

    const row = { participant_id: state.participant_id };
    requiredKeys.forEach(k => {
      const sel = document.querySelector(`input[name="${k}"]:checked`);
      row[k] = parseInt(sel.value, 10);
    });

    const { error } = await supabase
      .from('questionnaires')
      .upsert(row, {
        onConflict: 'participant_id',
        returning: 'minimal'
      });

    if (error) {
      console.error('ECM upsert error:', error);
      if (err) {
        err.textContent = `Save failed: ${
          error.message || 'Unknown error'
        }.`;
        err.style.display = 'block';
      }
      return false;
    }
    return true;
  }
},


  /* -----------------------------------------------------------------------
     Task 3.4 (Part 2) — ECM: Satisfaction
     ---------------------------------------------------------------------- */
  {
    slug: 'task-3-ecm-satisfaction',
    title: 'Questionnaire (4.2)',
    render: container => {
      const headers = ECM_HEADERS;

      const satRow = item => `
        <tr>
          <td class="anchor-left">${item.left}</td>
          ${headers
            .map(
              v => `
            <td class="center">
              <input
                type="radio"
                name="ECM_${item.key}"
                value="${v}"
                ${state.answers.ecm?.[`ECM_${item.key}`] === v ? 'checked' : ''}
                aria-label="${item.key} = ${v}"
              >
            </td>
          `
            )
            .join('')}
          <td class="anchor-right">${item.right}</td>
        </tr>
      `;

      container.innerHTML = `
        <div class="card">
          <h1>Questionnaire (4.2)</h1>
          <p>Next, think about the overall experience of your chosen product, based on the information and features presented.</p>
          <p>Imagine how you would feel using this product in your daily life.</p>
          <p>Please rate the following statement on the 7-point semantic differential scales.</p>
          <p><strong>How do you feel about your overall experience of the chosen product’s use?</strong></p>

          <div id="ecmSatError" class="error" style="display:none;"></div>

          <div class="likert-table-wrapper">
            <table class="likert-table ecm-s">
              <thead>
                <tr>
                  <th style="width:18ch;"></th>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                  <th style="width:18ch;"></th>
                </tr>
              </thead>
              <tbody>
                ${ECM_SAT_ITEMS.map(satRow).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.addEventListener('change', e => {
        const name = e.target?.name;
        if (!name || !/^ECM_S\d/.test(name)) return;
        state.answers.ecm[name] = Number(e.target.value);
        persist();
      });
    },

    beforeNext: async () => {
      const err = document.getElementById('ecmSatError');
      if (err) {
        err.style.display = 'none';
        err.textContent = '';
      }

      const requiredKeys = ECM_SAT_ITEMS.map(it => `ECM_${it.key}`);

      for (const k of requiredKeys) {
        const sel = document.querySelector(`input[name="${k}"]:checked`);
        if (!sel) {
          if (err) {
            err.textContent =
              'Please answer all satisfaction items before continuing.';
            err.style.display = 'block';
          }
          return false;
        }
      }

      const row = { participant_id: state.participant_id };
      requiredKeys.forEach(k => {
        row[k] = state.answers.ecm[k];
      });

      const { error } = await supabase
        .from('questionnaires')
        .upsert(row, {
          onConflict: 'participant_id',
          returning: 'minimal'
        });

      if (error) {
        console.error('ECM SAT upsert error:', error);
        if (err) {
          err.textContent = `Save failed: ${
            error.message || 'Unknown error'
          }.`;
          err.style.display = 'block';
        }
        return false;
      }

      return true;
    }
  },

  /* -----------------------------------------------------------------------
     Demographics
     ---------------------------------------------------------------------- */
  {
    slug: 'task-4-demo-intro',
    title: 'Demographics — Intro',
    render: container => {
      container.innerHTML = `
        <div class="card">
          <div id="demoError" class="error" style="display:none;"></div>
          <h1>Demographic Information</h1>
          <p>Thank you for completing the four questionnaires.</p>
          <p>Finally, I would ask you to provide some demographic information. This information will help me understand the characteristics of the study’s participants and is essential for accurately interpreting the results of the study.</p>
        </div>

        <section class="card" style="padding:16px;">
          <h3 style="font-size:1.1rem; margin:0 0 6px;">1. Age</h3>
          <p class="question">Please enter your age (years)</p>
          <input id="demo_age" type="number" min="18" max="110" step="1" placeholder="e.g., 24" style="width:160px;">
        </section>

        <section class="card" style="padding:16px;">
          <h3 style="font-size:1.1rem; margin:0 0 6px;">2. Gender</h3>
          <p class="question">What is your gender?</p>
          <div class="scale" role="radiogroup" aria-label="Gender"
               style="display:flex; flex-direction:column; gap:1px; align-items:flex-start;">
            <label><input type="radio" name="demo_gender" value="1"> <span>Male</span></label>
            <label><input type="radio" name="demo_gender" value="2"> <span>Female</span></label>
            <label><input type="radio" name="demo_gender" value="3"> <span>Non-binary</span></label>
            <label><input type="radio" name="demo_gender" value="4"> <span>Prefer not to say</span></label>
          </div>
        </section>

        <section class="card" style="padding:16px;">
          <h3 style="font-size:1.1rem; margin:0 0 6px;">3. Education</h3>
          <p class="question">What is your level of education?</p>
          <div class="scale" role="radiogroup" aria-label="Education" id="eduGroup"
               style="display:flex; flex-direction:column; gap:1px; align-items:flex-start;">
            <label><input type="radio" name="demo_education" value="1"> <span>No schooling completed</span></label>
            <label><input type="radio" name="demo_education" value="2"> <span>Secondary School (Real-/Hauptschulabschluss)</span></label>
            <label><input type="radio" name="demo_education" value="3"> <span>A-Levels (Allgemeine Hochschulreife)</span></label>
            <label><input type="radio" name="demo_education" value="4"> <span>Vocational Training (Ausbildung/Berufskolleg)</span></label>
            <label><input type="radio" name="demo_education" value="5"> <span>Bachelor's Degree</span></label>
            <label><input type="radio" name="demo_education" value="6"> <span>Master's Degree</span></label>
            <label><input type="radio" name="demo_education" value="7"> <span>PhD</span></label>
            <label class="row" style="gap:8px; align-items:center;">
              <input type="radio" name="demo_education" value="8">
              <span>Other:</span>
              <input id="demo_education_other" type="text" placeholder="Please specify" style="flex:1; min-width:220px;" disabled>
            </label>
            <label><input type="radio" name="demo_education" value="9"> <span>Prefer not to say</span></label>
          </div>
        </section>

        <section class="card" style="padding:16px;">
          <h3 style="font-size:1.1rem; margin:0 0 6px;">4. Employment</h3>
          <p class="question">What is your employment status?</p>
          <div class="scale" role="radiogroup" aria-label="Employment" id="empGroup"
               style="display:flex; flex-direction:column; gap:1px; align-items:flex-start;">
            <label><input type="radio" name="demo_employment" value="1"> <span>Full-Time</span></label>
            <label><input type="radio" name="demo_employment" value="2"> <span>Part-Time</span></label>
            <label><input type="radio" name="demo_employment" value="3"> <span>Working-Student / Temporary</span></label>
            <label><input type="radio" name="demo_employment" value="4"> <span>Retired</span></label>
            <label><input type="radio" name="demo_employment" value="5"> <span>Unemployed</span></label>
            <label><input type="radio" name="demo_employment" value="6"> <span>Unable to work</span></label>
            <label class="row" style="gap:8px; align-items:center;">
              <input type="radio" name="demo_employment" value="7">
              <span>Other:</span>
              <input id="demo_employment_other" type="text" placeholder="Please specify" style="flex:1; min-width:220px;" disabled>
            </label>
            <label><input type="radio" name="demo_employment" value="8"> <span>Prefer not to say</span></label>
          </div>
        </section>
      `;

      // Enable/disable "Other" inputs for education
      const eduOther = $('#demo_education_other');
      $$('#eduGroup input[name="demo_education"]').forEach(r => {
        r.addEventListener('change', () => {
          const isOther = r.value === '8' && r.checked;
          eduOther.disabled = !isOther;
          if (!isOther) eduOther.value = '';
        });
      });

      // Enable/disable "Other" inputs for employment
      const empOther = $('#demo_employment_other');
      $$('#empGroup input[name="demo_employment"]').forEach(r => {
        r.addEventListener('change', () => {
          const isOther = r.value === '7' && r.checked;
          empOther.disabled = !isOther;
          if (!isOther) empOther.value = '';
        });
      });

      // Prefill from saved answers
      if (state.answers.demo.age != null) {
        $('#demo_age').value = state.answers.demo.age;
      }

      if (state.answers.demo.gender != null) {
        const g = String(state.answers.demo.gender);
        const el = $(`input[name="demo_gender"][value="${g}"]`);
        if (el) el.checked = true;
      }

      if (state.answers.demo.education_code != null) {
        const ec = String(state.answers.demo.education_code);
        const el = $(`input[name="demo_education"][value="${ec}"]`);
        if (el) el.checked = true;

        const other = $('#demo_education_other');
        if (ec === '8') {
          other.disabled = false;
          other.value = state.answers.demo.education_other || '';
        }
      }

      if (state.answers.demo.employment_code != null) {
        const ec = String(state.answers.demo.employment_code);
        const el = $(`input[name="demo_employment"][value="${ec}"]`);
        if (el) el.checked = true;

        const other = $('#demo_employment_other');
        if (ec === '7') {
          other.disabled = false;
          other.value = state.answers.demo.employment_other || '';
        }
      }

      // Bind age → state
      $('#demo_age')?.addEventListener('input', e => {
        const v = e.target.value ? Number(e.target.value) : null;
        state.answers.demo.age = Number.isFinite(v) ? v : null;
        persist();
      });

      // Bind gender → state
      $$('input[name="demo_gender"]').forEach(r =>
        r.addEventListener('change', e => {
          state.answers.demo.gender = Number(e.target.value);
          persist();
        })
      );

      // Bind education → state
      $$('input[name="demo_education"]').forEach(r =>
        r.addEventListener('change', e => {
          const code = Number(e.target.value);
          state.answers.demo.education_code = code;
          if (code !== 8) state.answers.demo.education_other = '';
          persist();
        })
      );
      $('#demo_education_other')?.addEventListener('input', e => {
        state.answers.demo.education_other = e.target.value || '';
        persist();
      });

      // Bind employment → state
      $$('input[name="demo_employment"]').forEach(r =>
        r.addEventListener('change', e => {
          const code = Number(e.target.value);
          state.answers.demo.employment_code = code;
          if (code !== 7) state.answers.demo.employment_other = '';
          persist();
        })
      );
      $('#demo_employment_other')?.addEventListener('input', e => {
        state.answers.demo.employment_other = e.target.value || '';
        persist();
      });
    },

    beforeNext: async () => {
      const errBox = $('#demoError');
      if (errBox) {
        errBox.style.display = 'none';
        errBox.textContent = '';
      }

      const showErr = msg => {
        if (errBox) {
          errBox.textContent = msg;
          errBox.style.display = 'block';
        }
      };

      // Age
      const ageVal = $('#demo_age')?.value?.trim();
      const age = ageVal ? parseInt(ageVal, 10) : NaN;
      if (!Number.isInteger(age) || age < 18 || age > 110) {
        showErr('Please enter your age (between 18 and 110).');
        return false;
      }

      // Gender
      const genderSel = $('input[name="demo_gender"]:checked');
      if (!genderSel) {
        showErr('What is your gender?');
        return false;
      }
      const gender = GENDER_LABEL[parseInt(genderSel.value, 10)] ?? null;

      // Education (label or "Other")
      const eduSel = $('input[name="demo_education"]:checked');
      if (!eduSel) {
        showErr('What is your level of education?');
        return false;
      }
      const eduCode = parseInt(eduSel.value, 10);
      let education = EDUCATION_LABEL[eduCode] ?? null;
      if (eduCode === 8) {
        const otherText = $('#demo_education_other')?.value?.trim();
        if (!otherText) {
          showErr('Please specify your education (Other).');
          return false;
        }
        education = otherText;
      }

      // Employment (label or "Other")
      const empSel = $('input[name="demo_employment"]:checked');
      if (!empSel) {
        showErr('What is your employment status?');
        return false;
      }
      const empCode = parseInt(empSel.value, 10);
      let employment = EMPLOYMENT_LABEL[empCode] ?? null;
      if (empCode === 7) {
        const otherText = $('#demo_employment_other')?.value?.trim();
        if (!otherText) {
          showErr('Please specify your employment (Other).');
          return false;
        }
        employment = otherText;
      }

      // Save demographics to DB
      const row = {
        participant_id: state.participant_id,
        session_id: state.session_id || null,
        age,
        gender,
        education,
        employment
      };

      const { error } = await supabase
        .from('demographics')
        .upsert(row, { onConflict: 'participant_id' });

      if (error) {
        console.error('demographics upsert error:', error);
        showErr(`Save failed: ${error.message || 'Unknown error'}.`);
        return false;
      }
      return true;
    }
  },

  /* -----------------------------------------------------------------------
     Final Page
     ---------------------------------------------------------------------- */
  {
    slug: 'final-thanks',
    title: 'End of Study!',
    render: container => {
      container.innerHTML = `
        <div class="card" style="max-width:800px;">
          <h1>Thank you for participating!</h1>
          <p>Your time and responses are greatly appreciated.</p>
          <p>
            The goal of this study was to investigate how varying degrees of product interest and cognitive load
            influence mouse movements during online decision-making. By analyzing subtle differences in cursor dynamics,
            I aim to better understand how interest and cognitive load influence the way people explore and select products
            in digital environments.
          </p>
          <p>
            Your responses are completely anonymous and confidential. The data collected will be used only for research
            purposes, and no personally identifiable information will be linked to your responses.
          </p>
          <p>
            If you have any questions or would like more information about the study’s findings, please do not hesitate to contact me.
            I truly appreciate your participation. Your contribution is valuable to my research and helps advance my understanding of
            mouse behavior in online decision-making.
          </p>
          <p>You can now close this window. </p>
          <div class="card;">
            <strong>Contact</strong><br/>
            <p>Marlene Rüschoff: <a href="mailto:mruescho@smail.uni-koeln.de">mruescho@smail.uni-koeln.de</a></p>
          </div>

          <div style="margin-top:20px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn" onclick="window.print()">Print this page</button>
            <button class="btn" onclick="window.close()">Close</button>
          </div>
        </div>
      `;

      // Hide global print/close buttons if any others are present
      document.querySelectorAll('button, a').forEach(el => {
        const t = (el.innerText || '').toLowerCase();
        if (/(print|drucken|close|schließen|schliessen)/i.test(t)) {
          el.style.display = 'none';
          el.tabIndex = -1;
          el.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }
];

/* =========================================================================
   9) APP RENDERING & NAVIGATION
   ======================================================================= */

const app = document.getElementById('app');

/**
 * Ensure there is a session row on the server, created once per session.
 * Uses the participant row as a foreign key.
 */
async function ensureSessionRow() {
  if (loadLS('session_saved')) return;

  const { participant_id } = await ensureParticipant();
  state.participant_id = participant_id;
  saveLS('exp_state', state);

  const payload = {
    session_id: state.session_id,
    participant_id: state.participant_id,
    started_at: state.started_at,
    condition_load: state.condition?.load || null,
    user_agent: navigator.userAgent
  };

  let { error } = await supabase
    .from('sessions')
    .upsert(payload, { onConflict: 'session_id' });

  // In case of FK race, re-ensure participant and retry once
  if (error && /foreign key|violates foreign key/i.test(error.message || '')) {
    console.warn('FK error, recreate participant then retry…', error);
    await ensureParticipant();
    ({ error } = await supabase
      .from('sessions')
      .upsert(payload, { onConflict: 'session_id' }));
  }

  if (error) {
    console.error('Session upsert error:', error, payload);
    alert(
      `Error creating session in Supabase:\n${error.message || 'Unknown error'}\n\nDetails:\n${
        error.details || ''
      }`
    );
    return;
  }

  saveLS('session_saved', true);
  console.log('Session saved:', payload.session_id);
}

/**
 * Render the current page based on state.pageIndex.
 * Sets up "Continue" and "Back" navigation buttons.
 */
async function renderPage() {
  ensureStateShape();

  let page = PAGES[state.pageIndex];
  if (!page) {
    // Fallback: reset to first page if index is invalid
    state.pageIndex = 0;
    saveLS('exp_state', state);
    page = PAGES[0];
  }

  const isFirst = state.pageIndex === 0;
  const isLast = state.pageIndex === PAGES.length - 1;

  const hideBack =
    page.slug === 'task-2' ||
    page.slug === 'task-3-paas' ||
    isLast;

  const hideContinue =
    page.slug === 'task-2' ||
    page.slug === 'task-2-intro';

  app.innerHTML = `
    <div id="pageMount"></div>
    <div class="button-row">
      ${
        !hideBack
          ? `<button id="btnBack" ${isFirst ? 'disabled' : ''}>Go back</button>`
          : ``
      }
      ${
        !isLast && !hideContinue
          ? `<button id="btnContinue" class="primary">Continue</button>`
          : ``
      }
    </div>
  `;

  const mount = document.getElementById('pageMount');
  mount.setAttribute('data-slug', page.slug);
  page.render(mount);

  // Global "next" handler
  window.__doNext = async function () {
    if (typeof page.beforeNext === 'function') {
      const ok = await page.beforeNext();
      if (!ok) return;
    }
    state.pageIndex = Math.min(state.pageIndex + 1, PAGES.length - 1);
    saveLS('exp_state', state);
    renderPage();
  };

  // Global "back" handler (with cleanup for Task 2)
  window.__goBack = async function () {
    if (page.slug === 'task-2') {
      if (hoverActive) endHover('end_task');
      await flushHoverEvents();
      try {
        await flushMouseEvents('task-2');
      } catch {}
      try {
        stopMouseTracking();
      } catch {}
    }
    state.pageIndex = Math.max(state.pageIndex - 1, 0);
    saveLS('exp_state', state);
    renderPage();
  };

  $('#btnContinue')?.addEventListener('click', window.__doNext);
  $('#btnBack')?.addEventListener('click', window.__goBack);
}

/* =========================================================================
   10) MOUSE & HOVER TRACKING
   ======================================================================= */

// Mouse tracking state
let tracking = false;
let mouseStartEpoch = 0;
let mouseHandler = null;
let samplingTimerId = null;
let lastMouse = { x: null, y: null };

/**
 * Start sampling mouse positions at ~25 Hz and buffer them in state.mouse_buffer.
 */
function startMouseTracking() {
  if (tracking) return;

  tracking = true;
  state.task2_started_at = new Date().toISOString();
  mouseStartEpoch = performance.now();
  lastMouse.x = 0;
  lastMouse.y = 0; // log first point immediately
  state.mouse_buffer = [];
  saveLS('exp_state', state);

  const evtCountEl = $('#evtCount');

  mouseHandler = e => {
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
  };

  document.addEventListener('mousemove', mouseHandler, { passive: true });

  // Sample mouse positions at fixed interval
  samplingTimerId = setInterval(() => {
    if (lastMouse.x == null || lastMouse.y == null) return;

    const t = performance.now() - mouseStartEpoch;
    state.mouse_buffer.push({
      session_id: state.session_id,
      participant_id: state.participant_id,
      task: 'task-2',
      t_ms: Math.round(t),
      x: lastMouse.x,
      y: lastMouse.y,
      page_w: window.innerWidth,
      page_h: window.innerHeight,
      ts_utc: new Date().toISOString()
    });

    if (evtCountEl) evtCountEl.textContent = String(state.mouse_buffer.length);
  }, 40);

  const status = $('#trackStatus');
  if (status) status.textContent = 'ON';
}

/**
 * Stop mouse tracking and optionally record a last event.
 */
function stopMouseTracking() {
  if (!tracking) return;

  if (hoverActive) endHover('end_task');

  document.removeEventListener('mousemove', mouseHandler);
  mouseHandler = null;

  if (samplingTimerId) {
    if (lastMouse.x != null && lastMouse.y != null) {
      const t = performance.now() - mouseStartEpoch;
      state.mouse_buffer.push({
        session_id: state.session_id,
        participant_id: state.participant_id,
        task: 'task-2',
        t_ms: Math.round(t),
        x: lastMouse.x,
        y: lastMouse.y,
        page_w: window.innerWidth,
        page_h: window.innerHeight,
        ts_utc: new Date().toISOString()
      });
    }
    clearInterval(samplingTimerId);
    samplingTimerId = null;
  }

  tracking = false;
  const status = $('#trackStatus');
  if (status) status.textContent = 'OFF';
}

/**
 * Flush all buffered mouse events to the 'mouse_events' table in Supabase.
 * Uses chunked inserts to avoid large payloads.
 */
async function flushMouseEvents() {
  const buf = state.mouse_buffer || [];
  if (!buf.length) return;

  const CHUNK = 1000;

  for (let i = 0; i < buf.length; i += CHUNK) {
    const slice = buf.slice(i, i + CHUNK);
    const { error } = await supabase.from('mouse_events').insert(slice);
    if (error) {
      console.error('mouse_events insert error:', error);
      return;
    }
  }

  state.mouse_buffer = [];
  saveLS('exp_state', state);
}

/* --- Hover tracking --- */

let hoverActive = null; // { prodId, enterPerf, enterUTC }
state.hover_buffer = state.hover_buffer || [];

/**
 * Mark the start of a hover over a product.
 */
function startHover(prodId) {
  const nowPerf = performance.now();
  const nowUTC = new Date().toISOString();

  if (hoverActive && hoverActive.prodId !== prodId) {
    endHover('switch');
  }

  hoverActive = { prodId, enterPerf: nowPerf, enterUTC: nowUTC };
}

/**
 * Mark the end of a hover and push an event into hover_buffer.
 * reason: 'leave' | 'switch' | 'end_task'
 */
function endHover(reason = 'leave') {
  if (!hoverActive) return;

  const leavePerf = performance.now();
  const leaveUTC = new Date().toISOString();
  const tEnterMs = Math.round(hoverActive.enterPerf - mouseStartEpoch);
  const tLeaveMs = Math.round(leavePerf - mouseStartEpoch);
  const duration = Math.max(0, tLeaveMs - tEnterMs);

  state.hover_buffer.push({
    session_id: state.session_id,
    participant_id: state.participant_id,
    task: 'task-2',
    prod_id: hoverActive.prodId,
    reason, // 'leave' | 'switch' | 'end_task'
    t_enter_ms: tEnterMs,
    t_leave_ms: tLeaveMs,
    duration_ms: duration,
    ts_enter_utc: hoverActive.enterUTC,
    ts_leave_utc: leaveUTC,
    page_w: window.innerWidth,
    page_h: window.innerHeight
  });

  hoverActive = null;
  saveLS('exp_state', state);
}

/**
 * Flush hover events to the 'mouse_hovers' table in Supabase.
 */
async function flushHoverEvents() {
  const buf = state.hover_buffer || [];
  if (!buf.length) return;

  const CHUNK = 1000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    const slice = buf.slice(i, i + CHUNK);
    const { error } = await supabase.from('mouse_hovers').insert(slice);
    if (error) {
      console.error('mouse_hovers insert error:', error);
      return;
    }
  }

  state.hover_buffer = [];
  saveLS('exp_state', state);
}

/* =========================================================================
   11) BOOTSTRAP
   ======================================================================= */

(async function bootstrap() {
  try {
    // Quick connectivity probe
    const ping = await supabase.from('participants').select('participant_id').limit(1);
    if (ping.error) {
      throw new Error(
        `Supabase connectivity failed: ${ping.error.message || ping.error}`
      );
    }

    // WICHTIG: kein ensureParticipant(), kein ensureSessionRow() mehr hier
    renderPage();
  } catch (e) {
    console.error('Startup failed:', e);

    const msg = [
      e?.message || e,
      e?.details ? `Details: ${e.details}` : '',
      e?.hint ? `Hint: ${e.hint}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    alert(`Startup failed. Check Supabase setup.\n\n${msg}`);
    document.getElementById('app').innerHTML =
      `<div class="card error">Startup failed. Check console & Supabase setup.</div>`;
  }
})();

