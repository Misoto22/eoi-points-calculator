# Deployment

The app deploys to Vercel **through the GitHub Actions pipeline** (`.github/workflows/ci.yml`),
not through Vercel's native Git integration. This keeps deployment reproducible and version-controlled,
and avoids the situation where the native Git integration silently stops triggering builds.

## Pipeline behaviour

The `CI` workflow has two jobs:

1. **verify** — type-check (`tsc --noEmit`), unit tests (`vitest`), and a full `next build`.
2. **deploy** — runs only after `verify` passes:
   - **push to `main`** → production deployment (`vercel deploy --prebuilt --prod`)
   - **pull request** → preview deployment (`vercel deploy --prebuilt`)
   - The deploy URL is written to the job summary.

If the Vercel secrets are not configured, the deploy job **skips cleanly** (green) with a note in the
job summary — it never fails the pipeline.

## One-time setup

### 1. Add repository secrets

In **GitHub → repo → Settings → Secrets and variables → Actions**, add:

| Secret              | Where to get it                                                                 |
|---------------------|---------------------------------------------------------------------------------|
| `VERCEL_TOKEN`      | Vercel → Account Settings → Tokens → **Create Token**                            |
| `VERCEL_ORG_ID`     | Run `vercel link` locally, then read `.vercel/project.json` → `orgId`            |
| `VERCEL_PROJECT_ID` | Same file → `projectId` (or Vercel → Project → Settings → **Project ID**)        |

Quick way to get the IDs:

```bash
npm i -g vercel
vercel link            # links this repo to the existing Vercel project
cat .vercel/project.json   # copy orgId + projectId
```

> `.vercel/` is git-ignored — do not commit it.

### 2. Disable Vercel's native Git auto-deploy (avoid double deploys)

Because the pipeline now deploys, turn off Vercel's own Git deploys so a single push doesn't deploy twice:

- **Vercel → Project → Settings → Git → Ignored Build Step** → set to `exit 0` (skips Vercel-native builds), **or**
- **Vercel → Project → Settings → Git** → disconnect the repository.

The Actions pipeline remains the single source of truth for deploys.

## Node version

Next.js 16 requires **Node ≥ 20.9**. This is pinned in `package.json` (`engines.node`) and the workflow
uses Node 22, so Vercel's build container will use a compatible runtime. If you ever deploy via the Vercel
dashboard instead, set **Project → Settings → Node.js Version** to **20.x or 22.x** (an old default of 18.x
will fail the Next 16 build).

## Troubleshooting

- **Pipeline green but nothing deployed** → secrets missing; check the deploy job summary.
- **`Error: The specified token is not valid`** → regenerate `VERCEL_TOKEN`.
- **`Project not found`** → `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` mismatch; re-run `vercel link`.
- **Build fails only on Vercel** → confirm the project's Node.js version is 20.x/22.x.
