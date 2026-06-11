/**
 * Standards badges shown under the hero — not customer logos.
 */
export function CredibilityStrip() {
  return (
    <div
      className="border-t border-white/10 bg-surface-dark px-4 py-10 sm:px-6 lg:px-8"
      aria-label="Built for healthcare interoperability standards"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-arka-slate-400">
          Built for
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          <li>
            <EpicCompatibleBadge />
          </li>
          <li>
            <FhirR4Badge />
          </li>
          <li>
            <CdsHooksBadge />
          </li>
          <li>
            <Cms0057Badge />
          </li>
        </ul>
      </div>
    </div>
  );
}

function EpicCompatibleBadge() {
  return (
    <svg
      width={148}
      height={28}
      viewBox="0 0 148 28"
      role="img"
      aria-label="Epic-compatible"
      className="text-arka-slate-400"
    >
      <text
        x="0"
        y="20"
        fill="currentColor"
        fontSize="14"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.04em"
      >
        Epic-compatible
      </text>
    </svg>
  );
}

function FhirR4Badge() {
  return (
    <svg
      width={88}
      height={28}
      viewBox="0 0 88 28"
      role="img"
      aria-label="FHIR R4"
      className="text-arka-slate-400"
    >
      <rect x="0" y="4" width="3" height="20" fill="currentColor" opacity="0.5" />
      <text
        x="10"
        y="20"
        fill="currentColor"
        fontSize="14"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.06em"
      >
        FHIR R4
      </text>
    </svg>
  );
}

function CdsHooksBadge() {
  return (
    <svg
      width={148}
      height={28}
      viewBox="0 0 148 28"
      role="img"
      aria-label="CDS Hooks 2.0"
      className="text-arka-slate-400"
    >
      <circle cx="10" cy="14" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="14" r="2" fill="currentColor" />
      <text
        x="22"
        y="20"
        fill="currentColor"
        fontSize="14"
        fontWeight="600"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.04em"
      >
        CDS Hooks 2.0
      </text>
    </svg>
  );
}

function Cms0057Badge() {
  return (
    <svg
      width={148}
      height={28}
      viewBox="0 0 148 28"
      role="img"
      aria-label="CMS-0057-F"
      className="text-arka-slate-400"
    >
      <rect
        x="0"
        y="6"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        x="3"
        y="18"
        fill="currentColor"
        fontSize="9"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
      >
        CMS
      </text>
      <text
        x="24"
        y="20"
        fill="currentColor"
        fontSize="14"
        fontWeight="600"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.04em"
      >
        CMS-0057-F
      </text>
    </svg>
  );
}
