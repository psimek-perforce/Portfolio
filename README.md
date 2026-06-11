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
