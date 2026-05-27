import { FDANonDeviceBanner } from '@/components/shared/compliance/FDANonDeviceBanner';
import { CdsDemoClient } from '@/components/cds-platform/demo/CdsDemoClient';

/**
 * CDS Hooks live shareholder demo page.
 */
export default function CdsHooksDemoPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto mb-8 max-w-4xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Live CDS Hooks Integration
        </h1>
        <FDANonDeviceBanner
          product="CLIN"
          className="mt-4 flex-col items-center gap-3 rounded-lg text-center [&>div]:justify-center"
        />
        <p className="mt-4 text-base leading-relaxed text-arka-text-soft">
          Every recommendation card is anchored in a published guideline. Patient-specific ML refinement
          (XGBoost + SHAP) is shown as a transparent ancillary layer. Designed to meet the four criteria for
          Non-Device CDS under FD&amp;C Act §520(o)(1)(E).
        </p>
      </header>
      <CdsDemoClient />
    </div>
  );
}
