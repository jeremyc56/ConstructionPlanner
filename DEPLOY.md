# Put Construction Planner online (free, shared for everyone)

This makes one URL everyone can open, with the plan saved centrally so it's shared
(not stuck in each person's browser). All free on a Vercel Hobby account.

You'll do this in the browser — no software to install.

The two files that matter:
- `index.html`  (the app)
- `api/plan.js` (the little server that saves/loads the shared plan)
- `cycon-logo.png` (the logo)

---

## Step 1 — Put the files in a GitHub repo (≈5 min)

1. Make a free account at https://github.com if you don't have one.
2. Click the **+** (top right) → **New repository**. Name it e.g. `construction-planner`,
   keep it **Private**, click **Create repository**.
3. On the new repo page click **uploading an existing file**.
4. Drag in `index.html`, `cycon-logo.png`, **and the `api` folder** (with `plan.js` inside).
   - Tip: if it won't take the folder, create the file manually: click **Add file → Create new file**,
     type `api/plan.js` as the name (the `api/` makes the folder), paste the contents, commit.
5. Click **Commit changes**.

## Step 2 — Connect it to Vercel (≈3 min)

1. Sign in at https://vercel.com with your GitHub account.
2. **Add New… → Project** → **Import** your `construction-planner` repo.
3. Leave everything default (Framework Preset: **Other**, no build command) → **Deploy**.
4. You'll get a URL like `https://construction-planner-xxxx.vercel.app`.

## Step 3 — Turn on the shared memory (≈3 min)

1. In the Vercel project, open the **Storage** tab → **Create Database** → choose **KV** (Upstash Redis).
2. Accept the defaults, create it, and **Connect** it to this project when prompted.
   (This automatically adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` settings.)
3. Go to the **Deployments** tab → on the latest deployment click the **⋯** menu → **Redeploy**
   (so it picks up the new storage).

## Done

Open the URL. In the sidebar's **Shared Calendar** panel it should say **🟢 Live**.
Send the URL to your team — everyone sees and edits the same plan, and changes sync within ~20 seconds.
Put your name in the "Your name" box so saves are tagged with who made them.

---

### Notes
- The app still works offline / opened as a local file — it just falls back to browser-only storage
  (no "Live" badge) and the manual Open/Save file buttons.
- Anyone with the link can edit. If you want it locked down (login or a passcode), tell me and I'll add it.
- It's "last save wins" — fine for a task calendar; the panel still tells you who saved last.
- Vercel's free **Hobby** plan is officially for non-commercial use. For a company tool, the equivalent
  free tiers on **Cloudflare Pages** or **Azure Static Web Apps** (Microsoft, fits Cycon) allow commercial
  use — the same files deploy there too. Ask me for steps if you'd prefer one of those.
