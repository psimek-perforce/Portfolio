# Portfolio

Personal UX/UI portfolio of Petr Šimek. The site is a static HTML/CSS/JS page
living in [`portfolio-site/`](portfolio-site/) and is deployed via GitHub Pages.

## Run locally

The site is fully static, so any local web server works. Using Python's built-in
server (no install needed on macOS). Serve from the **project root** so the local
URL matches the deployed path (`/portfolio-site/...`).

### Start

```bash
# from the repo root (/Users/petrsimek/Portfolio)
python3 -m http.server 8000
```

Then open <http://localhost:8000/portfolio-site/index.html> in your browser.

To run it in the background instead:

```bash
python3 -m http.server 8000 &
```

### Stop

- If it's running in the foreground, press **Ctrl + C** in that terminal.
- If it's running in the background (or in another terminal), stop whatever is
  on port 8000:

  ```bash
  # find the process listening on port 8000
  lsof -ti tcp:8000
  # stop it
  lsof -ti tcp:8000 | xargs kill
  ```

> Tip: if port 8000 is busy, use a different port (e.g. `python3 -m http.server 8001`)
> and adjust the URL and the `kill` command accordingly.

## Password-protected case study

The **AI Test Studio** case study is password-protected because the product
hasn't been released yet. Its content is encrypted with **AES-256-GCM** (key
derived from the password via PBKDF2) and decrypted **in the browser** only
after the correct password is entered — so the plaintext never ships.

How the pieces fit together (all in [`portfolio-site/`](portfolio-site/)):

| File | Role | Commit? |
|------|------|---------|
| `ai-test-studio.source.html` | Plaintext of the locked content | ❌ gitignored — keep private |
| `protect-content.js` | Generated AES-256-GCM ciphertext | ✅ |
| `protect-config.js` | Per-section toggle (`ai-test-studio: { enabled: true }`) | ✅ |
| `protect.js` | Browser-side unlock logic + password dialog | ✅ |
| `encrypt-content.cjs` | Build tool that produces `protect-content.js` | ✅ |

### Prerequisites

- **Node.js 16 or newer** — `encrypt-content.cjs` uses the built-in
  `crypto.webcrypto` (Web Crypto), available from Node 15+. Check with
  `node --version`; install from [nodejs.org](https://nodejs.org/) if needed.
- **No `npm install`** — the script uses only Node's built-in modules (`fs`,
  `path`, `crypto`), so there are no dependencies to install.
- For previewing, a local web server (e.g. **Python 3**, used in
  [Run locally](#run-locally)) — because the page must run over `http(s)` /
  `localhost`, not `file://`.

### Run the encryption

Whenever you edit `ai-test-studio.source.html` (or want to change the
password), regenerate the ciphertext:

```bash
# from portfolio-site/
cd /Users/petrsimek/Portfolio/portfolio-site
node encrypt-content.cjs "YOUR-SHARED-PASSWORD"
```

This scans every `*.source.html`, encrypts each with the given password (its own
random salt + IV), and overwrites `protect-content.js`. The password is **never
stored** — it *is* the key, so changing it is just a matter of re-running with a
new value.

### Preview it

The page **must be served over `http(s)` or `localhost`** (not `file://`) —
browser Web Crypto is disabled on `file://`. Use the local server from
[Run locally](#run-locally) above, then open the AI Test Studio tab: the hero
shows openly, and a password card covers the rest until unlocked.

> ⚠️ Never commit `ai-test-studio.source.html`. It's listed in `.gitignore`; do
> not force-add it, or the protected content would be public in the repo history.

### Protect another section

The section **id** is the thread that ties everything together — it must be
identical in every place below. Example using `blazemeter-test-data-pro`:

**1. Split the article in `index.html`.** Decide what stays open (a teaser,
typically the `case-hero`) and what gets locked. Remove the locked `.case-body`
blocks from the article and replace them with a protected-region wrapper:

```html
<article class="case" id="blazemeter-test-data-pro">
  <div class="case-hero"> … </div>   <!-- stays OPEN -->

  <!-- LOCKED part -->
  <div class="protected-region" data-protected
       data-section="blazemeter-test-data-pro"
       data-open-src="blazemeter-test-data-pro.source.html">
    <div class="locked-content">
      <div class="protected-mount"></div>
      <div class="lock-skeleton" aria-hidden="true">
        <div class="sk sk-line" style="width:38%"></div>
        <div class="sk sk-line" style="width:72%"></div>
        <div class="sk sk-line" style="width:64%"></div>
        <div class="sk sk-block"></div>
        <div class="sk sk-line" style="width:46%"></div>
        <div class="sk sk-line" style="width:68%"></div>
      </div>
    </div>
  </div>
</article>
```

**2. Create the source file.** Put the removed `.case-body` HTML into
`blazemeter-test-data-pro.source.html` (filename = `<id>.source.html`). This is
exactly what gets decrypted and injected into `.protected-mount`.

**3. Register it in `protect-config.js`:**

```js
window.ProtectConfig = {
  sections: {
    "ai-test-studio":           { enabled: true },
    "blazemeter-test-data-pro": { enabled: true }   // true = locked
  }
};
```

**4. Keep the plaintext private.** Add the new source file to `.gitignore`
(next to the AI Test Studio line) so it's never committed:

```
portfolio-site/blazemeter-test-data-pro.source.html
```

**5. (Re)encrypt.** This scans **all** `*.source.html` files and regenerates
`protect-content.js` with one entry per section:

```bash
cd portfolio-site
node encrypt-content.cjs "YOUR-SHARED-PASSWORD"
```

Use the **same password** as the other sections — all sections share one
password, but each unlocks independently.

#### Things to keep in mind

- **Same id everywhere:** `data-section`, the `<id>.source.html` filename, the
  `protect-config.js` key, and the resulting `ProtectedPayloads` key must all
  match.
- **Self-contained anchors:** if the locked content has internal links (e.g. the
  `#section-research` process links), make sure both the links *and* their target
  ids live inside the source file — they won't resolve against `index.html`.
- **`enabled: false`** instead shows that section openly by fetching its
  `*.source.html` at runtime — in that mode the source file is public and **must**
  be committed/deployed (do **not** gitignore it).
- After encrypting, preview over `localhost` / `https` (not `file://`).
