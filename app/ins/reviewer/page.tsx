import { Suspense } from "react";

import { ReviewerDashboardClient } from "./ReviewerDashboardClient";

/**
 * RBM Reviewer Dashboard — wraps client in `Suspense` for `useSearchParams`.
 */
export default function InsReviewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
          Loading reviewer dashboard…
        </div>
      }
    >
      <ReviewerDashboardClient />
    </Suspense>
  );
}
