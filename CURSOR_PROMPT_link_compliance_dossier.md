# Cursor Prompt — Wire the "Download full compliance dossier" link to the real PDF

Paste the block below into Cursor (Composer / agent mode) with the ARKA repo open.

---

**TASK: Replace the placeholder compliance-dossier download link with the real PDF.**

Context: The homepage has an "Evidence & Compliance" modal. Its **"For Regulators"** tab contains a link that currently reads **"Download full compliance dossier (PDF) — placeholder"** and points at a dead placeholder (`https://www.getarka.health/#` or `#`). A demo handler currently calls `preventDefault()` so the link does nothing. A real, production-ready PDF now exists at:

```
public/ARKA-Compliance-Dossier.pdf
```

This means it is served at the site root URL **`/ARKA-Compliance-Dossier.pdf`** (and at `https://www.getarka.health/ARKA-Compliance-Dossier.pdf` in production).

Do the following:

1. **Confirm the asset exists.** Verify `public/ARKA-Compliance-Dossier.pdf` is present and committed (it is a ~210 KB PDF). If it is missing, stop and tell me.

2. **Find the link.** Search the codebase (likely under `components/` — e.g. the Evidence/Compliance modal component that renders the tabs `FDA Compliance`, `Medical-Necessity Alignment`, `AIIE Methodology`, `Data Sources`, `CMS-0057-F`, `Privacy`, `For Regulators`) for the string:
   - `Download full compliance dossier`
   - and the nearby copy `signed artifact in production` / `this demo prevents navigation`.

3. **Rewire the anchor.** Replace the placeholder anchor/handler so it actually downloads/opens the PDF. The final element should be:

   ```tsx
   <a
     href="/ARKA-Compliance-Dossier.pdf"
     target="_blank"
     rel="noopener noreferrer"
     download
     className={/* keep the existing link styles */}
   >
     Download full compliance dossier (PDF)
   </a>
   ```

   - Remove the demo `onClick` that calls `e.preventDefault()` (or any logic that blocks navigation).
   - Delete the placeholder `href="#"` / `href="https://www.getarka.health/#"`.
   - Update the visible text from `Download full compliance dossier (PDF) — placeholder` to `Download full compliance dossier (PDF)`.
   - Remove the now-inaccurate helper line `Link will resolve to a signed artifact in production; this demo prevents navigation.` (or replace it with: `Opens the current compliance dossier (PDF).`).

4. **Keep styling intact.** Reuse the existing Tailwind classes on the link so it still looks the same (blue/teal link). Do not change layout.

5. **Verify.** Run the dev server, open the homepage → "Evidence & Compliance" → "For Regulators" tab, and confirm clicking the link opens/downloads `/ARKA-Compliance-Dossier.pdf` in a new tab. Confirm no TypeScript/lint errors.

Show me the diff before applying.
