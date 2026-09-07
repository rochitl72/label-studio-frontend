# RBG Annotation Studio — Frontend

React/Vite single-page app for the RBG Annotation Studio image-annotation
platform. This is the **no-Docker, physical-server deployment** of this
service — nginx serves the pre-built static files in `build/` and forwards
API calls to the backend. The API is a separate repository — see
**label-studio-backend**.

This repo ships its build output already committed (`build/`) — there is no
build step in the deploy pipeline. When the source changes, rebuild locally
and commit the new `build/` before pushing.

---

## Requirements

- Node.js 18+ (for local builds only — not needed on the server itself)
- nginx, using the template in `nginx/rbg-annotation-studio.conf`

---

## One-time server setup

### 1. Deploy the nginx config

```bash
sudo cp nginx/rbg-annotation-studio.conf /etc/nginx/conf.d/
$EDITOR /etc/nginx/conf.d/rbg-annotation-studio.conf
```

Fill in the two values marked `CHANGE ME`:

- `server_name` — the real hostname once known
- The `upstream rbg_backend` port, if the backend doesn't listen on
  `127.0.0.1:8000`

Also confirm the `root` directive matches the `TARGET` path in
`.github/workflows/deploy.yml` in **this** repo — they must point at the same
directory, or a deploy will succeed while nginx keeps serving stale files.

**Before first use:** confirm this `TARGET` path with the deployment team.
The org's other frontend (`tcga-frontend`) already uses `/var/www/` directly
— this app needs its own subdirectory (the workflow currently uses
`/var/www/rbg-annotation-studio/`) or the two deploys will overwrite each
other's files.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 2. First deploy

Push to `main` — the deploy workflow copies `build/` to the server. Then
verify:

```bash
curl -i http://<server>/           # the app's index.html
curl -i http://<server>/api/health # proxied through to the backend
```

---

## Making a change and redeploying

There is no build step on the server, so every push must already contain a
fresh `build/`:

```bash
npm install        # first time only
npm run build       # regenerates build/ from src/, public/, index.html
git add -A
git commit -m "..."
git push
```

`npm run build` fails loudly if `index.html` references an asset that
doesn't exist on disk — that's deliberate, so a broken reference is caught
here rather than as a blank page in production.

---

## Repointing the API without a rebuild

`public/config.js` (served as `/config.js`, copied into `build/` verbatim by
the build) sets `window.API_BASE_PATH`, and is loaded before the rest of the
app. It's the one file meant to be **edited directly on the server** — it is
plain JavaScript and nginx is configured to never cache it, so a change takes
effect on the next page load, no rebuild or redeploy needed.

| Value | Meaning |
|---|---|
| `""` (default) | Same origin — requests go to `/api/...` unchanged. Correct when nginx serves this build and forwards `/api/` to the backend, as configured in `nginx/rbg-annotation-studio.conf`. No CORS needed anywhere. |
| `"/bkd"` | The edge routes by path instead — the browser calls `/bkd/api/...` and the proxy strips the prefix. |
| `"http://host:8000"` | A backend on a completely different origin. Requires `CORS_ORIGINS` in the backend's `config.py` to include this frontend's real origin, or every request fails. |

Edit it in place on the server:

```bash
$EDITOR /var/www/rbg-annotation-studio/config.js
```

(No restart needed — it's a static file nginx serves directly.)

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Page loads, but every API call fails | Check `window.API_BASE_PATH` in the deployed `config.js`, and that nginx's `/api/` location block points at the right backend port |
| Blank page after a deploy | Hard-refresh to clear cached assets, or check the browser console for a 404 on `/assets/...` — usually a stale nginx `root` path |
| Logo or another asset 403s | A file was committed with restrictive permissions (e.g. `0600` from a `zip`/checkout). Re-run `npm run build` — Vite writes fresh, world-readable files each time |
| Uploads rejected above a certain size | `client_max_body_size` in `nginx/rbg-annotation-studio.conf` must be at least as large as the backend's `MAX_UPLOAD_MB` (in the backend repo's `config.py`) |
| Deep link or refresh on a non-root path 404s | Confirm the nginx config's `location /` block has `try_files $uri $uri/ /index.html;` — this is a single-page app, all routes are client-side |
