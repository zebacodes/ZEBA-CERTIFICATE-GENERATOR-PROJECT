# Certificate Generator

A lightweight, AI-powered certificate generator that runs entirely in the browser. Fill in a few details, click Generate, and receive a print-ready, personalised certificate in seconds.

---

## Features

- **AI-written citations** — every certificate gets a unique, formal citation written by an LLM based on your inputs
- **Four certificate types** — Achievement, Completion, Excellence, Participation
- **Elegant print-ready design** — gold filigree borders, calligraphy name, dual signature blocks, official seal watermark, unique certificate ID
- **Print / Save as PDF** — one click opens a clean A4 landscape print window; save to PDF via your browser's print dialog
- **Copy citation** — copies the full plain-text certificate text to the clipboard
- **Regenerate** — re-runs the AI with the same inputs for a fresh variation
- **No build step** — plain HTML, CSS, and vanilla JS; open `index.html` in any browser

---

## Project Structure

```
cert-generator/
├── index.html      # App shell — markup only, no inline styles or scripts
├── styles.css      # All styling, organised into 17 labelled sections
├── app.js          # All logic, organised into 9 labelled sections
└── README.md       # This file
```

---

## Quick Start

### Option A — Open directly (recommended for local use)

1. Download or clone this folder.
2. Open `index.html` in Chrome, Edge, Firefox, or Safari.
3. Fill in the form and click **Generate Certificate**.

> No server, no npm install, no build step required.

### Option B — Serve over HTTP (required if you hit CORS issues)

```bash
# Python 3
cd cert-generator
python -m http.server 8080
# Then open http://localhost:8080
```

Or use any static server: VS Code Live Server, `npx serve`, Caddy, Nginx, etc.

---

## How It Works

```
User fills form
      │
      ▼
app.js reads inputs & validates
      │
      ▼
Builds a structured JSON prompt
      │
      ▼
POST → https://api.anthropic.com/v1/messages
      │
      ▼
AI returns JSON with 6 fields:
  certTitle, certSubtitle, ribbon,
  presentedText, description, badgeText
      │
      ▼
renderCertificate() builds certificate DOM
      │
      ▼
User clicks Print / PDF → printCert()
opens a new window with embedded CSS
and triggers window.print()
```

---

## API Configuration

The app calls the Anthropic Messages API directly from the browser. The endpoint and model are set in `app.js`:

```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model:      'claude-sonnet-4-6',
    max_tokens: 1000,
    messages:   [{ role: 'user', content: prompt }],
  }),
});
```

| Setting | Value | Notes |
|---|---|---|
| Model | `claude-sonnet-4-6` | Fast and cost-effective; swap for `claude-opus-4-6` for richer language |
| max_tokens | `1000` | Sufficient for all 6 JSON fields |
| Auth | Handled by the hosting environment | In production, proxy through your own backend to keep keys server-side |

> **Security note:** Do not embed an API key directly in client-side code for production deployments. Route requests through a backend proxy that injects the `x-api-key` header server-side.

---

## Certificate Fields (AI Output)

The AI is asked to return a JSON object with exactly these fields:

| Field | Description | Example |
|---|---|---|
| `certTitle` | Formal certificate title, 5–7 words | `Certificate of Achievement` |
| `certSubtitle` | Short subtitle line | `Awarded with Distinction` |
| `ribbon` | 3–5 word top ribbon banner | `Excellence in Learning` |
| `presentedText` | 8–14 word presentation phrase (no recipient name) | `This certificate is proudly presented to` |
| `description` | 2–3 sentence personalised citation, 40–65 words | `For having demonstrated outstanding…` |
| `badgeText` | Short bottom footer | `Issued with Pride · July 2026` |

These are combined with the user's inputs (`recipient`, `org`, `signer`, `signerRole`, `date`, `id`) to produce the final certificate.

---

## Fonts

Three Google Fonts are loaded from `fonts.googleapis.com`:

| Font | Usage | Style |
|---|---|---|
| Playfair Display | Certificate title, body | Serif — formal, classical |
| Inter | Organisation name, labels, footer, UI | Sans-serif — clean, readable |
| Great Vibes | Recipient name | Calligraphy — elegant script |

The print window (`printCert()` in `app.js`) loads these fonts again via a `<link>` tag and waits for `document.fonts.ready` before calling `window.print()`, ensuring the calligraphy name always renders correctly.

---

## Customisation

### Change the colour palette

Edit the CSS custom properties at the top of `styles.css`:

```css
:root {
  --gold:       #C9A84C;   /* main gold */
  --gold-light: #E8CC80;   /* inner border, divider */
  --gold-dark:  #8B6914;   /* text, ribbon */
  --navy:       #1a2744;   /* title, signature lines */
  --cream:      #FDFBF5;   /* certificate background */
  --accent:     #4f6ef7;   /* UI accent (indigo) */
}
```

### Change the AI model

In `app.js`, find the `generateCertificate()` function and change the `model` field:

```js
model: 'claude-opus-4-6',   // richer, slower
// or
model: 'claude-haiku-4-5-20251001',  // fastest, most economical
```

### Add a new certificate type

1. Add a button to the `type-grid` in `index.html`:

```html
<button class="type-btn" data-type="appreciation" onclick="selectType(this)">
  <span class="icon">💐</span>Appreciation
</button>
```

2. Add its label to `TYPE_LABELS` in `app.js`:

```js
const TYPE_LABELS = {
  // ...existing types...
  appreciation: 'Certificate of Appreciation',
};
```

### Change the certificate aspect ratio

The certificate uses `aspect-ratio: 1.414 / 1` (A4 landscape proportions). To change to letter landscape (`1.294 / 1`) or a square (`1 / 1`), update `.certificate` in `styles.css` and the matching rule inside `printCert()` in `app.js`.

---

## Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Mobile Chrome / Safari | ✅ Responsive layout |

The app uses `fetch`, `async/await`, `navigator.clipboard`, `document.fonts.ready`, CSS `clamp()`, and CSS `aspect-ratio` — all widely supported in modern browsers.

---

## File Reference

### `index.html`
Pure markup. No inline `<style>` or `<script>` blocks. References `styles.css` in `<head>` and `app.js` before `</body>`. All interactive elements use `onclick` attributes that call functions defined in `app.js`.

### `styles.css`
Divided into 17 sections with block comments. Sections 1–10 cover the UI (form, buttons, toolbar, status bar). Sections 11–14 cover the certificate visual design. Section 15 is print media queries. Section 16 is scrollbar styling. Section 17 is responsive breakpoints.

### `app.js`
Divided into 9 sections with block comments.

| Section | Contents |
|---|---|
| 1 | State variables (`currentType`, `certData`) |
| 2 | UI helpers (`setLoading`, `setStatus`, `showActionButtons`) |
| 3 | Type selector (`selectType`) |
| 4 | AI generation (`generateCertificate`, `TYPE_LABELS`, prompt template) |
| 5 | SVG assets (`CORNER_SVG`, `SEAL_SVG`) |
| 6 | Certificate renderer (`renderCertificate`) |
| 7 | Utility (`escHtml` — XSS-safe HTML insertion) |
| 8 | Actions (`copyCitation`, `printCert`) |
| 9 | Init (`DOMContentLoaded` — sets default date placeholder) |

---

## Roadmap

Potential enhancements for future versions:

- [ ] Multiple visual themes (minimalist, academic, corporate, dark)
- [ ] Logo / organisation seal upload (rendered on the certificate)
- [ ] Batch generation from a CSV file
- [ ] QR code linking to a hosted verification page
- [ ] Signature image upload (draws over the signature line)
- [ ] Backend proxy for API key security
- [ ] Local storage to save and re-open past certificates

---

## Licence

MIT — free to use, modify, and distribute.
