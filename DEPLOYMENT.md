# Deploying CalibiAI Community to MilesWeb

This guide covers everything: what to build, GitHub vs local upload, and step-by-step
setup for each type of MilesWeb plan.

---

## 0. Understand what you're deploying (read this first)

| Fact | Consequence |
|---|---|
| This is a **full-stack Next.js 16 app** — 25+ API routes (`app/api/**/route.ts`), Server Actions, server-rendered pages | It **cannot** be deployed as static HTML to normal (PHP/cPanel-only) shared hosting. It needs a running **Node.js server** (`next start`). |
| Next.js 16.2 requires **Node.js ≥ 20.9** | The MilesWeb plan must offer Node 20 or 22. PHP-only shared hosting will **not work**. |
| The build (`npm run build`) needs ~1–2 GB RAM | Tiny shared Node.js plans may kill the build. Workaround in §4 step 5. |
| Database/auth is **Supabase (hosted, external)** | Nothing database-related to install on MilesWeb. MilesWeb's MySQL is not used. |
| Lessons are read from the **`phases/` and `content/` folders** at runtime, uploads go to **`public/uploads/`** | Those folders must exist next to the running app (a Git clone gets them automatically; an FTP upload must include them). |

**Which MilesWeb plan?**

1. ✅ **MilesWeb VPS** — best fit. Full control, no memory surprises, recommended for this app.
2. ✅ **MilesWeb Cloud Node.js hosting** — Git push-to-deploy with PM2 built in.
3. ⚠️ **MilesWeb Node.js shared hosting (cPanel "Setup Node.js App")** — works, but confirm the plan offers **Node v20+** and enough memory before buying. Use `server.js` (included in this repo) as the startup file.
4. ❌ **Plain shared hosting (PHP only)** — cannot run this site.

---

## 1. GitHub vs uploading from local — which one?

**Answer: use GitHub as the source of truth.** The workflow is:

```
Your laptop  ──(git push)──▶  GitHub  ──(server pulls)──▶  MilesWeb server
```

- **Never upload `node_modules/` or `.env` via FTP.** The server runs `npm install` itself; secrets are set on the server only.
- Uploading from local via FTP/File Manager is only a *fallback* — mainly to upload the **build output** when the server is too weak to build (see §4 step 5), or if your plan has no Git feature.
- The server pulls code *from GitHub*; you don't deploy straight from the GitHub website. Three ways MilesWeb can get the code:
  - **cPanel → "Git™ Version Control"** (clone + "Update from Remote" button) — shared hosting.
  - **SSH + `git clone` / `git pull`** — VPS.
  - **Auto-deploy on push** — MilesWeb Cloud Node.js dashboard, or a GitHub Action that SSHes into your server (§5).

> If your repo is **private**, the server needs read access: generate an SSH key on the server (`ssh-keygen -t ed25519`) and add the *public* key in GitHub → repo → Settings → **Deploy keys**.

---

## 2. What to build — the exact npm commands

On the server (after it has the code), there are exactly **three** commands:

```bash
npm ci          # 1. Install dependencies exactly as pinned in package-lock.json
npm run build   # 2. THE BUILD — runs "next build", output goes to the .next/ folder
npm start       # 3. Start the production server ("next start"), listens on $PORT (default 3000)
```

Notes:

- `.next/` **is** the build output — there is nothing else to "compile". No Docker, no webpack config, no extra bundling.
- `npm ci` (not `npm install`) guarantees the same dependency tree as your laptop/CI.
- On cPanel shared hosting, replace step 3 with the panel's **Restart** button (it boots `server.js`).
- These **must exist next to the running app**: `.next/` (build output), `public/`, `phases/`, `content/`, `package.json`, `next.config.mjs`, `server.js`, `node_modules/`, and your `.env`.

---

## 3. BEFORE deploying — one-time fixes (already done in this repo)

1. 🔐 **Secrets were committed to GitHub.** This repo previously tracked `.env` (with the
   Supabase service-role key and DeepSeek key). It is now removed from tracking and
   gitignored — but the old values are still in the Git history. **Rotate both keys now**
   and treat any key that was ever committed as compromised (same for admin creds if you set them):
   - Supabase → Project Settings → API → **Regenerate service_role key**
   - DeepSeek → platform.deepseek.com → API keys → delete + create new
2. 🌐 **Server Actions origin.** Edit `next.config.mjs` and add your real domain:
   `allowedOrigins: ["localhost:3000", "yourdomain.com", "www.yourdomain.com"]`
   (Server Actions — used by admin, onboarding, etc. — are rejected from unlisted origins.)
3. 🔑 Prepare your production values for `.env` (see §6) — the file stays **only on the server**, never in Git.

---

## 4. Option A — MilesWeb shared **Node.js hosting (cPanel)**

> Ask MilesWeb support first: *"Does my plan's Setup Node.js App offer Node.js v20 or v22?"*
> Next.js 16 needs ≥ 20.9. If not available, use the VPS option.

### First deploy

1. **Point the domain**: your domain's DNS → A record → server IP (or assign the domain to the cPanel account; MilesWeb's welcome email has the details).
2. **Get the code** — cPanel → **Git™ Version Control** → **Create**:
   - Clone URL: `https://github.com/Prajwalen100/CalibiAi_Community.git` (public) or `git@github.com:Prajwalen100/CalibiAi_Community.git` (private + deploy key)
   - Repository Path: `calibiai` → **Create**. Files land in `/home/CPANELUSER/calibiai`.
3. **Create the Node app** — cPanel → **Setup Node.js App** → **Create Application**:
   - Node.js version: **22.x** (or the highest ≥ 20)
   - Application mode: **Production**
   - Application root: `calibiai`
   - Application URL: your domain
   - **Application startup file: `server.js`** ← included in this repo
4. **Install + build** — open cPanel → **Terminal** (or SSH), then copy-paste the
   `source /home/CPANELUSER/nodevenv/calibiai/XX/bin/activate && cd calibiai`
   command shown at the top of the "Setup Node.js App" edit screen, then:
   ```bash
   npm ci
   npm run build
   ```
5. **If the build gets killed (out of memory)** — build on your laptop instead:
   ```bash
   npm ci && npm run build        # on YOUR computer
   ```
   Then upload **only these** via File Manager/FTP into `~/calibiai`, overwriting:
   `.next/`, `public/`, `phases/`, `content/`, `package.json`, `package-lock.json`,
   `next.config.mjs`, `server.js` — and on the server run `npm ci --omit=dev`
   (installs runtime deps only; no build needed).
6. **Environment variables** — in **Setup Node.js App → (your app) → Environment Variables**,
   or create `~/calibiai/.env` with the values from §6.
7. **Restart** the app from the Setup Node.js App screen. Visit your domain. 🎉

### Deploying updates later

```text
laptop:  git push origin main
cPanel:  Git™ Version Control → row "calibiai" → Manage → "Update from Remote"
cPanel Terminal:  source .../activate && cd calibiai && npm ci && npm run build
cPanel:  Setup Node.js App → Restart
```

---

## 5. Option B — MilesWeb **VPS** (recommended)

Assumes an Ubuntu VPS with root SSH access.

### One-time server setup

```bash
# 1. Point DNS: A record  yourdomain.com → VPS IP (and www → same IP)

# 2. Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git
node -v    # must print v20.9+ / v22.x

# 3. Install PM2 (keeps the app alive + auto-starts on reboot)
sudo npm install -g pm2

# 4. Get the code
sudo mkdir -p /var/www/calibiai && sudo chown $USER /var/www/calibiai
cd /var/www/calibiai && git clone https://github.com/Prajwalen100/CalibiAi_Community.git .

# 5. Create the environment file (paste the §6 values)
nano .env

# 6. Build & start
npm ci
npm run build
pm2 start npm --name calibiai -- start
pm2 save && pm2 startup        # run the command it prints
```

### Nginx (web traffic → Node app) + free SSL

`/etc/nginx/sites-available/calibiai`:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    client_max_body_size 20m;   # community/blog image uploads
}
```

```bash
sudo ln -s /etc/nginx/sites-available/calibiai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com   # free HTTPS
```

### Every update = one script

Save as `/var/www/calibiai/deploy.sh`:

```bash
#!/bin/bash
set -e
cd /var/www/calibiai
git pull origin main
npm ci
npm run build
pm2 reload calibiai
echo "Deployed ✅"
```

After `git push` from your laptop: `ssh you@VPS_IP 'bash /var/www/calibiai/deploy.sh'`.

**Want true "push to GitHub and it deploys itself"?** Use a GitHub Action
(repo → Settings → Secrets → add `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`), then
commit `.github/workflows/deploy.yml`:

```yaml
name: Deploy to MilesWeb VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/calibiai
            git pull origin main
            npm ci
            npm run build
            pm2 reload calibiai
```

> MilesWeb **Cloud Node.js hosting** is similar but uses their dashboard instead of SSH:
> create a Node.js 20+ environment, attach the GitHub repo (it auto-deploys on push),
> choose **PM2** as process manager, set the §6 env vars, and make sure the start command
> runs Next on the provided `$PORT` (`npm start` already does this).

---

## 6. Environment variables (production)

Create `.env` on the server (or set them in the panel UI). Ask Supabase/DeepSeek dashboards for the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # rotated after it leaked into git, server-only
DEEPSEEK_API_KEY=...                   # server-only
DEEPSEEK_MODEL_ID=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
ADMIN_EMAIL=you@yourdomain.com         # change from the admin@calibiai.local default!
ADMIN_PASSWORD=<a strong password>
ADMIN_SESSION_SECRET=<long random string, e.g. openssl rand -hex 32>
```

`NODE_ENV=production` is set automatically by `next start` / the cPanel Production mode.

---

## 7. Go-live checklist (Supabase + config)

- [ ] `next.config.mjs` → `allowedOrigins` includes your domain (§3.2), rebuilt after the edit.
- [ ] **Supabase → Authentication → URL Configuration**: Site URL = `https://yourdomain.com`,
      add Redirect URL `https://yourdomain.com/api/auth/callback`.
- [ ] Google Cloud Console → OAuth client → the Supabase callback
      (`https://YOUR-PROJECT.supabase.co/auth/v1/callback`) stays as the authorized redirect — no domain change needed there.
- [ ] All Supabase migrations `001` … `024` applied to the project you'll point production at.
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` set (not the local defaults).
- [ ] HTTPS active (AutoSSL on cPanel / certbot on VPS).
- [ ] Directory `public/uploads/` exists on the server (it is gitignored — uploads live on the
      server's disk; on a single cPanel/VPS server that's fine and persistent).
- [ ] Test: sign in with Google, open Learning Hub, post an image in Community, log into `/admin/signin`.

## 8. Common problems

| Symptom | Fix |
|---|---|
| Build dies / exits silently | Out of memory → build locally and upload `.next/` (§4 step 5) or move to VPS |
| 502 Bad Gateway on VPS | `pm2 logs calibiai`; app not on port 3000 or crashed at boot (usually missing `.env`) |
| Learning Hub shows no modules | `phases/` folder wasn't uploaded to the server |
| "Invalid origin" on forms / admin actions | domain missing from `allowedOrigins` in `next.config.mjs` |
| Google sign-in loops or errors | production callback URL not added in Supabase (§7) |
| Uploaded images disappear after redeploy | your deploy wiped `public/uploads/` — exclude it from upload/clean steps |
| App won't start with "Node version" error | plan has Node < 20.9 — switch the Node version or change plan |
