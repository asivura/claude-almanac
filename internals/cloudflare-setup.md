# Cloudflare Pages Setup — claude-almanac

- **Date**: 2026-04-04
- **Status**: Manual setup guide (pre-scaffolding deployment prep)
- **Prerequisite reading**: \[cloudflare-state.md\](_(deleted: historical snapshot)_), [site-architecture.md](../site/ARCHITECTURE.md)

Step-by-step walkthrough for creating the Cloudflare Pages project that serves `claude-almanac.sivura.com`. Do these steps **after** the site scaffolder has landed `site/package.json` and a successful `npm run build` has been verified locally.

## Target configuration at a glance

| Setting                | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| Project name           | `claude-almanac`                                       |
| GitHub repository      | `asivura/claude-almanac`                               |
| Production branch      | `main`                                                 |
| Framework preset       | `Next.js (Static HTML Export)` if available, else None |
| Build command          | `npm run build`                                        |
| Build output directory | `out`                                                  |
| Root directory         | `site`                                                 |
| Node version (env var) | `NODE_VERSION=20`                                      |
| Automatic deployments  | Enabled                                                |
| Build cache (Beta)     | Disabled (matches asivura-kb)                          |
| Cloudflare Access      | Disabled (public docs site)                            |
| Custom domain          | `claude-almanac.sivura.com`                            |
| Account                | Asivura@gmail.com (`be59d35938cfd487927ececf20967971`) |

This mirrors the working [`asivura-kb`](https://dash.cloudflare.com/be59d35938cfd487927ececf20967971/pages/view/asivura-kb/settings/production) project except:

- Output dir is `out` (Next.js static export) vs. `dist`
- `NODE_VERSION=20` is set explicitly in env vars

## Prerequisites

Before starting, confirm:

- `site/package.json` exists in the repo with a `build` script
- `cd site && npm install && npm run build` succeeds locally
- `site/out/` directory is produced by the build and contains `index.html`
- You are logged into the Cloudflare dashboard at <https://dash.cloudflare.com/> with `Asivura@gmail.com`
- GitHub repo `asivura/claude-almanac` exists and you can access it

## Step 1 — Create the Pages project

1. Navigate to <https://dash.cloudflare.com/be59d35938cfd487927ececf20967971/workers-and-pages>
1. Click **Create application** (top right)
1. Select the **Pages** tab
1. Click **Connect to Git**

## Step 2 — Connect to GitHub

1. On the "Connect to Git provider" screen, click **GitHub** if not already selected
1. If `asivura/claude-almanac` is not listed:
   - Click **+ Add account** or **Configure GitHub App**
   - Grant the Cloudflare Pages GitHub app access to `asivura/claude-almanac` (repository-specific access is fine)
   - Return to the Cloudflare tab
1. Select `asivura/claude-almanac` from the repository list
1. Click **Begin setup**

## Step 3 — Configure build settings

On the "Set up builds and deployments" screen:

| Field                     | Value                                       |
| ------------------------- | ------------------------------------------- |
| Project name              | `claude-almanac`                            |
| Production branch         | `main`                                      |
| Framework preset          | **Next.js (Static HTML Export)** — see note |
| Build command             | `npm run build`                             |
| Build output directory    | `out`                                       |
| Root directory (advanced) | `site`                                      |

1. **Project name** defaults to the repo name; confirm it says `claude-almanac`
1. **Production branch** should auto-populate to `main`
1. **Framework preset**: select **Next.js (Static HTML Export)** from the dropdown. This preset auto-fills build command and output directory correctly for our static export. **Do not** choose the plain "Next.js" preset — that one assumes SSR via `@cloudflare/next-on-pages` and will fail for a static-exported build. If the dropdown does not offer a Static HTML Export option, choose **None** and fill the fields manually.
1. **Build command**: `npm run build` (should be auto-populated by the preset)
1. **Build output directory**: `out` (should be auto-populated by the preset)
1. Expand **Advanced settings** and set **Root directory** to `site`
1. **Environment variables**: click **Add variable** and add:
   - Variable name: `NODE_VERSION`
   - Value: `20`
1. Click **Save and Deploy**

The first build will start immediately. It will likely take 1–3 minutes. You can watch the build logs in real time.

## Step 4 — Verify the first deployment

1. When the build finishes (green checkmark), click **Continue to project**
1. You should be on the project Deployments page
1. Click the `*.claude-almanac.pages.dev` preview link to open the live site
1. Verify the homepage loads, styles apply, navigation works

If the build fails, see **Troubleshooting** below.

## Step 5 — Add the custom domain

1. On the project page, click the **Custom domains** tab
1. Click **Set up a custom domain**
1. Enter: `claude-almanac.sivura.com`
1. Click **Continue**
1. Cloudflare will detect that `sivura.com` is in the same account and offer to create the DNS record automatically
1. Click **Activate domain**

CF will create a proxied CNAME: `claude-almanac` → `claude-almanac.pages.dev`. SSL certificate provisioning happens automatically (Universal SSL, typically under 60 seconds).

## Step 6 — Verify the custom domain

1. Wait 30–60 seconds after activating
1. Visit <https://claude-almanac.sivura.com/> in a browser
1. Confirm HTTPS padlock, no certificate warnings
1. Confirm the same content as the `*.pages.dev` URL
1. Check DNS: `dig claude-almanac.sivura.com CNAME +short` should return a Cloudflare IP (proxied)

## Step 7 — Verify PR preview deployments

1. Create a test branch in the repo and open a draft PR against `main`
1. Within 1–3 minutes, Cloudflare should post a preview URL comment on the PR (build comments are enabled)
1. Click the preview URL and confirm the branch's content
1. Close the test PR

## Reference: asivura-kb as a working analog

If anything behaves unexpectedly, compare against asivura-kb (same account, similar monorepo structure):

| Setting              | asivura-kb           | claude-almanac (target)  |
| -------------------- | -------------------- | ------------------------ |
| Git repo             | `Amberflows/asivura` | `asivura/claude-almanac` |
| Build command        | `npm run build`      | `npm run build`          |
| Output directory     | `dist`               | `out`                    |
| Root directory       | `site`               | `site`                   |
| Production branch    | `main`               | `main`                   |
| Automatic deploys    | Enabled              | Enabled                  |
| Build cache          | Disabled             | Disabled                 |
| Build system version | Version 3            | Version 3                |

Only the output directory differs — `out` is the standard Next.js static export destination, while `dist` is whatever asivura-kb's framework uses.

## Post-setup follow-ups

After the project is live, the scaffolder may want to:

- Add `.nvmrc` to `site/` containing `20` so local dev matches the CF build environment
- Add an `engines.node` field to `site/package.json` for documentation
- Enable the Build cache (Beta) once the baseline build time is known, if it exceeds ~2 min
- Add production environment variables if any are needed (none known at this time)

## Troubleshooting

### Build fails with "npm: command not found"

The root directory may not be set correctly. Verify in **Settings → Build → Build configuration** that **Root directory** is `site` (not empty or `/`).

### Build succeeds but `out/` is empty or wrong contents

- Confirm locally: `cd site && npm run build && ls out/` — there should be an `index.html`
- For Next.js static export, `next.config.js` must have `output: 'export'`
- Fumadocs template usually includes this by default; verify it's present

### 404 on custom domain after activation

- Wait up to 5 minutes for CF to propagate
- Check <https://dash.cloudflare.com/be59d35938cfd487927ececf20967971/sivura.com/dns/records> — search for `claude-almanac` — the CNAME should be present and Proxied
- If the record is missing, re-run Step 5 (Add custom domain)

### PR preview not appearing

- Check the project's **Settings → Build → Branch control** — Automatic deployments must be Enabled
- Confirm the PR targets `main` and the branch is pushed to `asivura/claude-almanac` (not a fork)
- Check the PR's Checks tab for Cloudflare Pages status

### Node version mismatch

If the build fails with "Unsupported Node version":

- Confirm `NODE_VERSION=20` is set in **Settings → Variables and Secrets**
- Alternative: add `.nvmrc` file to `site/` directory containing `20`

## Rollback

To revert a bad production deployment:

1. Go to **Deployments** tab
1. Find the last good deployment (green checkmark)
1. Click the `...` menu → **Rollback to this deployment**

No git revert needed — CF serves whichever deployment you designate as production.

## Analytics Engine binding

Content negotiation tracking uses Cloudflare Analytics Engine to count markdown vs HTML requests per path.

| Setting       | Value                 |
| ------------- | --------------------- |
| Binding type  | Analytics Engine      |
| Variable name | `ANALYTICS`           |
| Dataset       | `content_negotiation` |

Configure in: Pages > claude-almanac > Settings > Bindings > Add.

The binding is optional. When absent (local dev, misconfigured), tracking calls are a silent no-op.

### Pages Secrets for the analytics dashboard

The `/analytics` dashboard page queries the Analytics Engine GraphQL API server-side. It needs two Pages Secrets:

| Secret          | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| `CF_API_TOKEN`  | API token with **Account Analytics:Read** permission       |
| `CF_ACCOUNT_ID` | Cloudflare account ID (`be59d35938cfd487927ececf20967971`) |

Configure in: Pages > claude-almanac > Settings > Variables and Secrets.

### Cloudflare Access policy for /analytics

The analytics dashboard is protected by Cloudflare Access (Zero Trust, free for up to 50 users):

1. CF Dashboard > Zero Trust > Access > Applications > Add
1. Application type: Self-hosted
1. App domain: `claude-almanac.sivura.com`
1. Path: `/analytics`
1. Policy: Allow, email matches `alexander@amberflows.com`
1. Auth method: One-time PIN (email OTP) or Google SSO

## What we did NOT configure

- **Cloudflare Web Analytics** — leave off for now; Analytics Engine covers our needs
- **Custom build image / Docker** — defaults are fine
