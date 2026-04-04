# Cloudflare Account State

- **Inspection date**: 2026-04-04
- **Inspector**: cf-browser-ops teammate (Chrome dashboard inspection, read-only)
- **Account**: Asivura@gmail.com's Account
- **Account ID**: `be59d35938cfd487927ececf20967971`
- **Workers subdomain**: `asivura.workers.dev`

This document captures the current state of the Cloudflare account for the `claude-almanac` site launch. All findings are read-only observations from the CF dashboard.

## Summary

| Check                                      | Result                                             |
| ------------------------------------------ | -------------------------------------------------- |
| CF Pages project named `claude-almanac`    | **Does NOT exist** — needs to be created           |
| `sivura.com` zone in this CF account       | **Exists** on Free plan, DNS Setup: Full           |
| DNS record for `claude-almanac.sivura.com` | **Does NOT exist** — needs to be created           |
| Nameservers                                | `hope.ns.cloudflare.com`, `lars.ns.cloudflare.com` |

## Existing Workers & Pages projects

Three projects currently exist in the account:

| Project      | Type                        | Domains                                            | Git                                | Last activity |
| ------------ | --------------------------- | -------------------------------------------------- | ---------------------------------- | ------------- |
| art-and-play | Pages                       | `art-and-play.pages.dev` + `artandplay.sivura.com` | No Git connection (direct uploads) | 10h ago       |
| asivura-kb   | Pages                       | `asivura-kb.pages.dev` + `kb.sivura.com`           | `Amberflows/asivura`               | 12h ago       |
| astro-whoami | Worker (with static assets) | `astro-whoami.sivura.com` + 1 other route          | `asivura/astro-whoami`             | 12d ago       |

## sivura.com zone

- **Plan**: Free
- **DNS Setup**: Full (Cloudflare is authoritative)
- **Nameservers**: `hope.ns.cloudflare.com`, `lars.ns.cloudflare.com`
- **Advanced Certificate Manager**: Not active
- **Worker Routes**: `astro-whoami.sivura.com` → `astro-whoami`

### Existing DNS records (15 total)

| Type  | Name                          | Content                                          | Proxy    |
| ----- | ----------------------------- | ------------------------------------------------ | -------- |
| CNAME | artandplay                    | `art-and-play.pages.dev`                         | Proxied  |
| CNAME | console                       | `ghs.googlehosted.com`                           | Proxied  |
| CNAME | kb                            | `asivura-kb.pages.dev`                           | Proxied  |
| CNAME | sig1.\_domainkey              | `sig1.dkim.sivura.com.at.icloudmailadmin.com`    | DNS only |
| MX    | send.artandplay               | `feedback-smtp.us-east-1.amazonses.com` (pri 10) | DNS only |
| MX    | sivura.com                    | `mx01.mail.icloud.com` (pri 10)                  | DNS only |
| MX    | sivura.com                    | `mx02.mail.icloud.com` (pri 10)                  | DNS only |
| TXT   | \_dmarc.artandplay            | `v=DMARC1; p=none;`                              | DNS only |
| TXT   | resend.\_domainkey.artandplay | DKIM public key (p=MIGfMA0G...)                  | DNS only |
| TXT   | send.artandplay               | `v=spf1 include:amazonses.com ~all`              | DNS only |
| TXT   | sivura.com                    | `v=spf1 include:icloud.com ~all`                 | DNS only |
| TXT   | sivura.com                    | `google-site-verification=kKotJH_c8y...`         | DNS only |
| TXT   | sivura.com                    | `google-site-verification=C-XVfn1YZa...`         | DNS only |
| TXT   | sivura.com                    | `apple-domain=c7OocK7tcZxO4zn6`                  | DNS only |

**Pattern for subdomain → Pages project**: CNAME to `<project>.pages.dev`, proxied (see `artandplay` and `kb` records). CF Pages creates this record automatically when the custom domain is added in the project's Custom domains tab.

No `claude-almanac` CNAME exists yet.

## Reference build config — asivura-kb

The closest analog to what we'll build (static site, GitHub-integrated, `site/` subdirectory in monorepo):

| Setting                | Value                |
| ---------------------- | -------------------- |
| Git repository         | `Amberflows/asivura` |
| Build command          | `npm run build`      |
| Build output directory | `dist`               |
| Root directory         | `site`               |
| Build comments         | Enabled              |
| Build cache            | Disabled (Beta)      |
| Production branch      | `main`               |
| Automatic deployments  | Enabled              |
| Build watch paths      | `*` (all paths)      |
| Build system version   | Version 3            |
| Placement              | Default              |
| Compatibility date     | 2026-03-30           |
| Compatibility flags    | None                 |

Node version is not visible on the settings page — CF Pages uses the `NODE_VERSION` environment variable (set under Variables and Secrets) or a `.nvmrc` file in the project root. Build system v3 defaults to a recent Node LTS if unset.

## What needs to happen for claude-almanac

To deploy `claude-almanac.sivura.com`, a scaffolder will need to:

1. **Create a new CF Pages project** named `claude-almanac` connected to the `asivura/claude-almanac` (or wherever it ends up) GitHub repo
1. **Set build configuration**:
   - Build command: `npm run build`
   - Build output directory: `out` (Fumadocs/Next.js static export default)
   - Root directory: `site`
   - Production branch: `main`
1. **Set environment variables**:
   - `NODE_VERSION=20` (or 22) — Next.js 15 requires Node 18.17+
1. **Add custom domain** `claude-almanac.sivura.com` in the project's Custom domains tab (CF auto-creates the CNAME proxied record)
1. **Verify preview deployments** work on non-main branches

## Inspection methodology

- Chrome-in-browser tool used against `dash.cloudflare.com` (user was already logged in)
- Read-only: no settings were modified, no clicks on destructive actions
- Pages listed at `/workers-and-pages`
- Zone DNS at `/<account>/sivura.com/dns/records`
- Project build config at `/<account>/pages/view/<project>/settings/production`

## Open questions for team-lead

- Which GitHub org will host the site repo? (assuming `asivura/claude-almanac` based on existing public repos pattern, since claude-almanac is public)
- Should we enable the Build cache (Beta) on the new project? asivura-kb has it off.
- Do we want preview deployment access controls? (Cloudflare Access is currently not enabled on any sivura.com project)
