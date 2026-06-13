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
