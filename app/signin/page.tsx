import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/SignInForm";
import { SignInValuePanel } from "@/components/auth/SignInValuePanel";

export const metadata: Metadata = {
  title: { absolute: "Sign in — ARKA" },
  description:
    "Sign in to save ROI action plans, resume ARKA demos, and access validation dashboards. Evidence and docs remain open.",
};

/**
 * Split-screen sign-in for the demo account.
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface lg:flex-row">
      <SignInValuePanel />
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <SignInForm />
      </div>
    </div>
  );
}
