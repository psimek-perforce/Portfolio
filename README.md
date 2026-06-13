# Portfolio Petr Simek

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

## Deploy to a web host (simekpetr.com)

The site is also published to a standalone web host by uploading the static
files into the host's web root. To make that easy we build a single
**deploy bundle** (`simekpetr-deploy.zip`) containing exactly the files the web
root needs — and nothing private.

### 1. (If content changed) re-encrypt first

If you edited the locked case study, regenerate the ciphertext **before**
bundling (see [Run the encryption](#run-the-encryption)):

```bash
cd /Users/petrsimek/Portfolio/portfolio-site
node encrypt-content.cjs "YOUR-SHARED-PASSWORD"
```

### 2. Build the deploy bundle

```bash
# from portfolio-site/
cd /Users/petrsimek/Portfolio/portfolio-site
rm -f ../simekpetr-deploy.zip
zip -r -X ../simekpetr-deploy.zip \
  index.html styles.css favicon.svg \
  protect-config.js protect-content.js protect.js \
  images \
  -x "*.DS_Store"
```

This writes `simekpetr-deploy.zip` to the repo root. The files sit at the **top
level** of the zip, so extracting it *at* the web root puts `index.html` directly
at the root. The zip (and any extracted `*-deploy/` folder) is gitignored.

**What goes in — and what must NOT:**

| Included ✅ | Excluded ❌ (and why) |
|---|---|
| `index.html`, `styles.css`, `favicon.svg` | `ai-test-studio.source.html` — **plaintext of the locked case study; must never ship** (only the encrypted `protect-content.js` does) |
| `protect-config.js`, `protect-content.js`, `protect.js` | `encrypt-content.cjs` — build tool, not needed live |
| `images/` | `text-reviews/`, `__probe.html`, `.DS_Store` — internal/junk |

> ⚠️ The exclusions are achieved simply by **not listing** those files in the
> `zip` command. If you add new top-level files to `portfolio-site/`, remember to
> add them to the command — and never add `ai-test-studio.source.html`.

Verify the bundle before uploading:

```bash
# plaintext source must NOT appear:
unzip -l ../simekpetr-deploy.zip | grep -E "ai-test-studio.source.html|encrypt-content.cjs" \
  && echo "STOP: remove the file above" || echo "OK — safe to upload"
```

### 3. Upload to the web root

1. Get the zip onto the upload device (e.g. **AirDrop** to an iPad/Mac).
2. In the host's **File Manager** (or an SFTP client), open the **web root**
   (`public_html` / `www` / `htdocs` — the folder that currently serves the site).
3. **Delete the existing `index.html`** placeholder, then upload and **extract the
   zip at the web root** (or upload the extracted files directly).
4. End state: `index.html`, `styles.css`, `favicon.svg`, the three `protect-*.js`,
   and `images/` all sit **at the root** (not in a sub-folder).

### 4. Requirements & checks

- The host **must serve over HTTPS** (it does) — the password unlock uses browser
  Web Crypto, which needs a secure context. It will not work over `file://`.
- After uploading, open `https://simekpetr.com/` — the title should read
  **“Petr Šimek — Portfolio”** and the AI Test Studio tab should show the lock card.
- This is a **manual deploy**: rebuild the zip and re-upload whenever the site
  changes. (GitHub Pages, by contrast, auto-deploys on push.)
