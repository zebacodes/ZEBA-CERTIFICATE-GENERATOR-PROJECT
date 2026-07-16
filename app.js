/* ============================================================
   Certificate Generator — app.js
   Sections:
     1. State
     2. UI Helpers — loading, status
     3. Type selector
     4. AI Generation — prompt building & API call
     5. SVG Assets — corner ornament, background seal
     6. Certificate Renderer
     7. Utility — HTML escaping
     8. Actions — copy citation, print/PDF
     9. Init
   ============================================================ */


/* ── 1. State ─────────────────────────────────────────────── */

let currentType = 'achievement';  // active certificate type key
let certData    = null;           // last generated certificate data object


/* ── 2. UI Helpers ────────────────────────────────────────── */

/**
 * Toggle the generate button between loading and ready states.
 * Also shows/hides the pulsing status bar below the toolbar.
 * @param {boolean} loading
 */
function setLoading(loading) {
  const btn     = document.getElementById('generateBtn');
  const spinner = document.getElementById('btnSpinner');
  const icon    = document.getElementById('btnIcon');
  const bar     = document.getElementById('status-bar');

  btn.disabled           = loading;
  spinner.style.display  = loading ? 'block' : 'none';
  icon.style.display     = loading ? 'none'  : 'block';
  bar.style.display      = loading ? 'flex'  : 'none';
}

/**
 * Update the message shown inside the status bar.
 * @param {string} msg
 */
function setStatus(msg) {
  document.getElementById('status-msg').textContent = msg;
}

/**
 * Show the post-generation action buttons (copy, regenerate, print).
 * @param {string} titleText  — used to update the toolbar label
 */
function showActionButtons(titleText) {
  ['printBtn', 'copyBtn', 'regenerateBtn'].forEach(id => {
    document.getElementById(id).style.display = 'flex';
  });
  document.getElementById('previewLabel').textContent = titleText + ' — ready';
}


/* ── 3. Type Selector ─────────────────────────────────────── */

/**
 * Called by onclick on each .type-btn.
 * Removes .active from siblings and applies it to the clicked button.
 * @param {HTMLElement} btn
 */
function selectType(btn) {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentType = btn.dataset.type;
}


/* ── 4. AI Generation ─────────────────────────────────────── */

/** Human-readable labels for each certificate type key */
const TYPE_LABELS = {
  achievement:   'Certificate of Achievement',
  completion:    'Certificate of Completion',
  excellence:    'Certificate of Excellence',
  participation: 'Certificate of Participation',
};

/**
 * Read all form fields, validate, build the AI prompt,
 * call the Anthropic API, parse the JSON response,
 * then hand off to renderCertificate().
 */
async function generateCertificate() {
  /* — Read & validate inputs — */
  const recipient  = document.getElementById('recipientName').value.trim();
  const org        = document.getElementById('orgName').value.trim();
  const achievement= document.getElementById('achievement').value.trim();
  const signer     = document.getElementById('signerName').value.trim();
  const signerRole = document.getElementById('signerRole').value.trim();
  const extra      = document.getElementById('extraContext').value.trim();
  const date       = document.getElementById('certDate').value.trim()
                     || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (!recipient || !achievement) {
    alert('Please enter at least a recipient name and achievement / course title.');
    return;
  }

  setLoading(true);
  setStatus('Crafting your certificate…');

  /* — Build structured prompt — */
  const prompt = `You are producing content for a formal, elegant printed certificate.
Return ONLY a valid JSON object — no markdown fences, no preamble, no trailing text.

Certificate type : ${TYPE_LABELS[currentType]}
Recipient        : ${recipient}
Organisation     : ${org || 'The Issuing Organisation'}
Achievement      : ${achievement}
Signatory        : ${signer || 'The Director'}
Signatory role   : ${signerRole || 'Director'}
Date             : ${date}
Extra context    : ${extra || 'None'}

Return exactly this JSON shape:
{
  "certTitle"    : "formal certificate title (5–7 words max)",
  "certSubtitle" : "one short subtitle line, e.g. Awarded with Distinction",
  "ribbon"       : "3–5 word ribbon banner text, e.g. Excellence in Learning",
  "presentedText": "8–14 word formal phrase meaning 'this certificate is proudly presented to' — do NOT include the recipient name",
  "description"  : "2–3 sentence personalised formal citation, 40–65 words, starting with 'for' or 'having demonstrated'. Elevated, warm, specific language.",
  "badgeText"    : "short bottom footer text, e.g. Issued with Pride · ${date}"
}`;

  try {
    setStatus('Connecting to AI…');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    setStatus('Composing the citation…');

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'API returned an error.');
    }

    /* — Parse AI response — */
    const raw   = data.content.map(block => block.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();

    let aiJson;
    try {
      aiJson = JSON.parse(clean);
    } catch (_) {
      throw new Error('The AI returned an unexpected format. Please try again.');
    }

    /* — Assemble full certificate data object — */
    certData = {
      ...aiJson,
      recipient,
      org:        org || 'The Issuing Organisation',
      achievement,
      signer:     signer || 'The Director',
      signerRole: signerRole || 'Director',
      date,
      id: 'CERT-' + Date.now().toString(36).toUpperCase(),
    };

    setStatus('Rendering…');
    await new Promise(resolve => setTimeout(resolve, 200)); // brief pause feels natural
    renderCertificate(certData);
    setLoading(false);

  } catch (err) {
    setLoading(false);
    alert('Error: ' + err.message);
  }
}


/* ── 5. SVG Assets ────────────────────────────────────────── */

/**
 * Gold corner ornament SVG (placed at each corner via CSS transforms).
 * Consists of two L-shaped paths, a circle accent, and tick marks.
 */
const CORNER_SVG = `<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 4 L48 4 L48 11 L11 11 L11 48 L4 48 Z"
        fill="none" stroke="#C9A84C" stroke-width="1.5"/>
  <path d="M8 8 L44 8 L44 13 L13 13 L13 44 L8 44 Z"
        fill="none" stroke="#E8CC80" stroke-width="0.75"/>
  <circle cx="8" cy="8" r="2.5" fill="#C9A84C"/>
  <line x1="16" y1="4"  x2="16" y2="11" stroke="#C9A84C" stroke-width="0.75"/>
  <line x1="4"  y1="16" x2="11" y2="16" stroke="#C9A84C" stroke-width="0.75"/>
</svg>`;

/**
 * Circular official seal SVG used as a faint background watermark
 * (opacity 0.04 — visible on screen, prints subtly).
 */
const SEAL_SVG = `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="56" stroke="#C9A84C" stroke-width="2.5"/>
  <circle cx="60" cy="60" r="48" stroke="#C9A84C" stroke-width="1"/>
  <circle cx="60" cy="60" r="40" stroke="#C9A84C" stroke-width="0.5"/>
  <text x="60" y="52" text-anchor="middle" font-size="9"
        fill="#C9A84C" font-family="serif" font-weight="bold" letter-spacing="3">OFFICIAL</text>
  <text x="60" y="68" text-anchor="middle" font-size="18"
        fill="#C9A84C" font-family="serif">★</text>
  <text x="60" y="82" text-anchor="middle" font-size="8"
        fill="#C9A84C" font-family="serif" letter-spacing="2">CERTIFICATE</text>
</svg>`;


/* ── 6. Certificate Renderer ──────────────────────────────── */

/**
 * Build and inject the certificate DOM into #previewArea.
 * All user-supplied strings are escaped before insertion.
 * @param {Object} d  — certData object
 */
function renderCertificate(d) {
  const area = document.getElementById('previewArea');
  area.innerHTML  = '';
  area.style.padding    = '28px';
  area.style.background = '#ccccd8';

  /* Wrapper div (hidden initially in CSS, shown here) */
  const wrap = document.createElement('div');
  wrap.id = 'cert-wrap';
  wrap.style.display = 'block';

  wrap.innerHTML = `
  <div class="certificate" id="theCertificate">

    <!-- Frame borders -->
    <div class="cert-outer-border"></div>
    <div class="cert-inner-border"></div>

    <!-- Corner ornaments (CSS transforms handle TL/TR/BL/BR) -->
    <div class="cert-corner tl">${CORNER_SVG}</div>
    <div class="cert-corner tr">${CORNER_SVG}</div>
    <div class="cert-corner bl">${CORNER_SVG}</div>
    <div class="cert-corner br">${CORNER_SVG}</div>

    <!-- Background seal watermark -->
    <div class="cert-bg-seal">${SEAL_SVG}</div>

    <!-- Top ribbon text -->
    <div class="cert-ribbon">${escHtml(d.ribbon || 'Certificate of Recognition')}</div>

    <!-- Main body content -->
    <div class="cert-body">

      <div class="cert-org">${escHtml(d.org)}</div>
      <div class="cert-title">${escHtml(d.certTitle)}</div>
      <div class="cert-subtitle">${escHtml(d.certSubtitle || '')}</div>

      <div class="cert-divider">
        <div class="cert-divider-line"></div>
        <div class="cert-divider-diamond"></div>
        <div class="cert-divider-line"></div>
      </div>

      <div class="cert-presented">${escHtml(d.presentedText)}</div>
      <div class="cert-name">${escHtml(d.recipient)}</div>
      <div class="cert-desc">${escHtml(d.description)}</div>

      <!-- Footer: two signature blocks + cert ID -->
      <div class="cert-footer">

        <div class="cert-sig-block">
          <div class="cert-sig-line"></div>
          <div class="cert-sig-name">${escHtml(d.signer)}</div>
          <div class="cert-sig-role">${escHtml(d.signerRole)}</div>
        </div>

        <div class="cert-id-block">
          <div class="cert-id">${escHtml(d.id)}</div>
          <div class="cert-id">${escHtml(d.date)}</div>
        </div>

        <div class="cert-sig-block">
          <div class="cert-sig-line"></div>
          <div class="cert-sig-name">${escHtml(d.recipient.split(' ')[0])}</div>
          <div class="cert-sig-role">Recipient</div>
        </div>

      </div>
    </div>

    <!-- Bottom footer badge -->
    <div class="cert-bottom-text">${escHtml(d.badgeText || d.date)}</div>

  </div>`;

  area.appendChild(wrap);
  showActionButtons(d.certTitle);
}


/* ── 7. Utility ───────────────────────────────────────────── */

/**
 * Escape a string for safe insertion into innerHTML.
 * Prevents XSS from user-supplied values.
 * @param  {*}      s
 * @returns {string}
 */
function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}


/* ── 8. Actions ───────────────────────────────────────────── */

/**
 * Copy the certificate citation as plain text to the clipboard.
 * Briefly changes the button label to confirm success.
 */
function copyCitation() {
  if (!certData) return;

  const lines = [
    certData.certTitle,
    '',
    certData.presentedText,
    certData.recipient,
    '',
    certData.description,
    '',
    'Issued by : ' + certData.org,
    'Date      : ' + certData.date,
    'Cert ID   : ' + certData.id,
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.innerHTML = '📋 Copy citation'; }, 2200);
  });
}

/**
 * Open a new print window containing only the certificate,
 * with embedded A4-landscape print CSS and all Google Fonts loaded.
 * The window auto-triggers window.print() after fonts load.
 */
function printCert() {
  const cert = document.getElementById('theCertificate');
  if (!cert) return;

  const title = certData ? 'Certificate — ' + certData.recipient : 'Certificate';
  const w = window.open('', '_blank');

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${escHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=Great+Vibes&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page { size: A4 landscape; margin: 0.6cm; }

    body {
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 0.4cm;
    }

    :root {
      --gold:       #C9A84C;
      --gold-light: #E8CC80;
      --gold-dark:  #8B6914;
      --navy:       #1a2744;
      --cream:      #FDFBF5;
      --text-mid:   #4a4a6a;
      --text-muted: #8a8aaa;
    }

    /* ── Certificate ── */
    .certificate {
      width: 100%;
      background: var(--cream);
      position: relative;
      font-family: 'Playfair Display', serif;
      aspect-ratio: 1.414 / 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow: hidden;
    }

    .cert-outer-border { position:absolute; inset:10px; border:2.5px solid var(--gold); }
    .cert-inner-border { position:absolute; inset:16px; border:1px solid var(--gold-light); }

    .cert-corner     { position:absolute; width:52px; height:52px; }
    .cert-corner svg { width:100%; height:100%; }
    .cert-corner.tl  { top:5px; left:5px; }
    .cert-corner.tr  { top:5px; right:5px; transform:scaleX(-1); }
    .cert-corner.bl  { bottom:5px; left:5px; transform:scaleY(-1); }
    .cert-corner.br  { bottom:5px; right:5px; transform:scale(-1); }

    .cert-bg-seal {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      opacity:0.04; width:240px; height:240px;
      pointer-events:none; z-index:1;
    }

    .cert-body    { position:relative; z-index:2; padding:26px 52px; width:100%; }

    .cert-org      { font-family:'Inter',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold-dark); margin-bottom:5px; }
    .cert-title    { font-size:26px; font-weight:700; color:var(--navy); letter-spacing:0.04em; margin-bottom:3px; line-height:1.15; }
    .cert-subtitle { font-family:'Inter',sans-serif; font-size:9px; letter-spacing:0.14em; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px; }

    .cert-divider         { display:flex; align-items:center; justify-content:center; gap:10px; margin:4px auto 12px; }
    .cert-divider-line    { height:1px; background:var(--gold); flex:1; max-width:90px; }
    .cert-divider-diamond { width:7px; height:7px; background:var(--gold); transform:rotate(45deg); }

    .cert-presented { font-family:'Inter',sans-serif; font-size:9px; color:var(--text-mid); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:4px; }
    .cert-name      { font-family:'Great Vibes',cursive; font-size:42px; color:var(--navy); margin:2px 0 8px; line-height:1.1; }
    .cert-desc      { font-family:'Inter',sans-serif; font-size:10.5px; color:var(--text-mid); line-height:1.7; max-width:72%; margin:0 auto 14px; font-style:italic; }

    .cert-footer    { display:flex; justify-content:space-around; align-items:flex-end; margin-top:8px; padding-top:10px; border-top:1px solid var(--gold-light); gap:12px; }
    .cert-sig-block { text-align:center; flex:1; max-width:160px; }
    .cert-sig-line  { border-top:1px solid var(--navy); margin-bottom:4px; width:100%; }
    .cert-sig-name  { font-family:'Inter',sans-serif; font-size:8.5px; font-weight:600; color:var(--navy); text-transform:uppercase; letter-spacing:0.06em; }
    .cert-sig-role  { font-family:'Inter',sans-serif; font-size:7.5px; color:var(--text-muted); }
    .cert-id-block  { text-align:center; flex:0 0 auto; }
    .cert-id        { font-family:'Inter',sans-serif; font-size:7.5px; color:var(--text-muted); letter-spacing:0.04em; line-height:1.6; }

    .cert-ribbon {
      position:absolute; top:20px; left:50%; transform:translateX(-50%);
      display:flex; align-items:center; gap:8px;
      font-family:'Inter',sans-serif; font-size:8.5px; font-weight:700;
      letter-spacing:0.16em; text-transform:uppercase; color:var(--gold-dark); white-space:nowrap;
    }
    .cert-ribbon::before, .cert-ribbon::after {
      content:''; display:block; height:1px; width:28px; background:var(--gold);
    }
    .cert-bottom-text {
      position:absolute; bottom:20px; left:50%; transform:translateX(-50%);
      font-family:'Inter',sans-serif; font-size:7.5px; color:var(--gold-dark);
      letter-spacing:0.1em; white-space:nowrap;
    }
  </style>
</head>
<body>
  ${cert.outerHTML}
  <script>
    // Wait for Google Fonts to load before printing
    document.fonts.ready.then(function () {
      setTimeout(function () { window.print(); }, 400);
    });
  <\/script>
</body>
</html>`);

  w.document.close();
}


/* ── 9. Init ──────────────────────────────────────────────── */

/**
 * On DOM ready: set today's date as the default date field value.
 */
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const dateField = document.getElementById('certDate');
  if (dateField && !dateField.value) {
    dateField.placeholder = today;
  }
});
