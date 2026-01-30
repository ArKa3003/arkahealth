# ARKA Health

Next.js platform for ARKA-CLIN, ARKA-ED, and ARKA-INS demos.

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

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server (run after `build`) |
| `npm run lint` | Run Next.js ESLint |
| `npm run format` | Format code with Prettier |
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

- [ ] All demos functional (ARKA-CLIN, ARKA-ED, ARKA-INS)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] All links work
- [ ] Forms functional (if any)
- [ ] Performance score > 90 (Lighthouse)
- [ ] Accessibility score > 90 (Lighthouse)

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
