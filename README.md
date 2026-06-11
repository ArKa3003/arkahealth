# ARKA Health

Next.js platform for ARKA-CLIN, ARKA-ED, ARKA-INS, and ARKA-RURAL demos.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` for local development. For Vercel, set variables in the project **Settings → Environment Variables**.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for sitemap, robots, and metadata. Default: `https://arkahealth.com`. Use your Vercel URL (e.g. `https://your-app.vercel.app`) or custom domain in production. |

## CI

The `cds-sandbox` job in [ARKA go-live checks](.github/workflows/go-live.yml) is currently allowed to fail without blocking merges; see [docs/CI_KNOWN_ISSUES.md](docs/CI_KNOWN_ISSUES.md).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server (run after `build`) |
| `npm run lint` | Run ESLint on INS/shared/CLIN-demo scope |
| `npm run format` | Format code with Prettier |
| `npm run test` | Full Vitest suite (426 tests) |
| `npm run matrix:coverage` | AIIE Knowledge Matrix coverage report |
| `npm run evidence:check` | HEAD external citation URLs (network-dependent) |
| `npm run evidence:stubs` | Fail if any matrix slug lacks registry entry |
| `npm run links:check` | Static internal href audit (nav registries + `app/`) |
| `npm run test:a11y` | Run Lighthouse accessibility audit (requires app running at `http://localhost:3000`) |

## Deploy on Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com/new).
2. Set `NEXT_PUBLIC_SITE_URL` in **Project Settings → Environment Variables** (e.g. your Vercel URL or custom domain).
3. Deploy; Vercel will use `vercel.json` and Next.js defaults.

### Production build (local test)

```bash
npm run build && npm start
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Deployment Checklist

Before going live, confirm:

- [x] All demos functional (ARKA-CLIN, ARKA-ED, ARKA-INS, ARKA-RURAL)
- [x] Mobile responsive (phase cockpits use responsive rails/sheets)
- [x] No console errors on primary routes (manual spot-check)
- [x] All internal links work (`npm run links:check`)
- [x] Matrix coverage within tier-3/4 budget (`npm run matrix:coverage`)
- [x] Evidence registry complete (`npm run evidence:stubs`)
- [x] External citations alive (`npm run evidence:check` — bot-gated DOIs triaged)
- [x] EHR demo mode (`/ehr/sandbox`, SMART launch `/ehr/launch`)
- [x] FDA Non-Device CDS footer on every CDS card detail (`npm run lint:cards`)
- [x] Accessibility score ≥ 90 (Lighthouse, local prod build — all audited routes)
- [ ] Performance score ≥ 90 (Lighthouse) — evidence `/evidence/[slug]` at 89; demo routes 70–84 local headless (see [RELEASE_NOTES_REVAMP.md](docs/RELEASE_NOTES_REVAMP.md))

### Release verification (one command per gate)

```bash
npm run build && npm run lint && npm test && npm run matrix:coverage && npm run evidence:check && npm run links:check
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Revamp release notes](docs/RELEASE_NOTES_REVAMP.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Epic deployment](docs/integrations/epic-deployment.md)
