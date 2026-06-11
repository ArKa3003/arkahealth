import type { Metadata } from "next";

import { EhrEmbedClient } from "@/components/ehr/EhrEmbedClient";

export const metadata: Metadata = {
  title: "Simulated EHR — ARKA Embedded",
  robots: { index: false, follow: false },
};

const CHART_TABS = ["Chart Review", "Orders", "Notes", "Results", "Medications", "Imaging"] as const;

const MOCK_ORDER_ROWS = [
  { label: "MRI Lumbar Spine without contrast", meta: "Draft · CPT 72148 · Dr. Chen" },
  { label: "CT Head without contrast", meta: "Draft · CPT 70450 · Dr. Chen" },
  { label: "CT Abdomen/Pelvis with contrast", meta: "Draft · STAT · CPT 74177 · Dr. Chen" },
] as const;

/**
 * Mock Epic-style chrome around the embedded ARKA rail so the icon-mode
 * experience is demoable without a live EHR. Everything except the floating
 * ARKA surface is a static screenshot-style frame; the rail itself is the real
 * component running against sandbox fixtures.
 */
export default function EhrSandboxPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-[#e8ebef]">
      {/* EHR title bar */}
      <div className="flex items-center justify-between bg-[#34406b] px-4 py-2 text-white">
        <p className="text-[13px] font-semibold tracking-wide">
          Simulated EHR <span className="font-normal text-white/60">— training environment, no real patient data</span>
        </p>
        <p className="text-[11px] text-white/60">Logged in: CHEN, ALEX MD · Internal Medicine</p>
      </div>

      {/* Patient header strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-[#c6cdd8] bg-[#f4f6f9] px-4 py-2">
        <p className="text-[14px] font-bold text-[#1f2a4d]">RIVERA, MARIA ELENA</p>
        <p className="text-[12px] text-[#4a5573]">Female · 64 yrs · DOB 03/14/1962</p>
        <p className="text-[12px] text-[#4a5573]">MRN 4821937</p>
        <p className="text-[12px] text-[#4a5573]">Allergies: NKDA</p>
        <p className="ml-auto rounded bg-[#dce4f2] px-2 py-0.5 text-[11px] font-medium text-[#34406b]">
          Encounter: Office Visit 06/10/2026
        </p>
      </div>

      {/* Activity tabs */}
      <div className="flex gap-px overflow-x-auto border-b border-[#c6cdd8] bg-[#dde3ec] px-2 pt-1.5">
        {CHART_TABS.map((tab, i) => (
          <span
            key={tab}
            className={
              i === 1
                ? "rounded-t-md border border-b-0 border-[#c6cdd8] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#1f2a4d]"
                : "rounded-t-md px-3.5 py-1.5 text-[12px] text-[#4a5573]"
            }
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Orders workspace */}
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <div className="hidden w-48 shrink-0 flex-col gap-1 rounded border border-[#c6cdd8] bg-white p-2 md:flex">
          {["New Order", "Order Sets", "Preference List", "Pended Orders", "Cosign Queue"].map(
            (item, i) => (
              <span
                key={item}
                className={
                  i === 3
                    ? "rounded bg-[#eef2fa] px-2 py-1.5 text-[12px] font-semibold text-[#34406b]"
                    : "rounded px-2 py-1.5 text-[12px] text-[#4a5573]"
                }
              >
                {item}
              </span>
            ),
          )}
        </div>

        <div className="min-w-0 flex-1 rounded border border-[#c6cdd8] bg-white">
          <div className="border-b border-[#e0e5ee] px-4 py-2.5">
            <p className="text-[13px] font-semibold text-[#1f2a4d]">Pended Orders (3)</p>
          </div>
          <ul className="divide-y divide-[#eef1f6]">
            {MOCK_ORDER_ROWS.map((row) => (
              <li key={row.label} className="px-4 py-3">
                <p className="text-[13px] font-medium text-[#1f2a4d]">{row.label}</p>
                <p className="mt-0.5 text-[11px] text-[#7a839c]">{row.meta}</p>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 text-[11px] text-[#9aa3b8]">
            ARKA runs in the corner — it never blocks this workflow. Click the floating icon to
            open the intelligence rail.
          </div>
        </div>
      </div>

      {/* The real embedded ARKA surface, forced into demo mode */}
      <EhrEmbedClient demoMode />
    </main>
  );
}
