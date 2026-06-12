"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DEMO_EMAIL_FALLBACK,
  DEMO_PASSWORD_FALLBACK,
} from "@/lib/auth/demo-session";
import { REQUEST_ACCESS_MAILTO } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";

const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof signInSchema>, string>>;

const inputClasses = cn(
  "w-full rounded-radius-md border border-border-subtle bg-surface px-3 py-2.5 text-base text-arka-slate-900",
  "placeholder:text-arka-slate-500",
  "transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
);

/**
 * Sign-in form with demo credential autofill, validation, and session redirect.
 */
export function SignInForm() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const errorSummaryId = `${formId}-error-summary`;
  const authErrorId = `${formId}-auth-error`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const validate = useCallback((): boolean => {
    const result = signInSchema.safeParse({ email, password });
    if (result.success) {
      setFieldErrors({});
      return true;
    }
    const errors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        errors[field] = issue.message;
      }
    }
    setFieldErrors(errors);
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
    return false;
  }, [email, password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/?signedin=1");
        router.refresh();
        return;
      }

      if (response.status === 401) {
        setAuthError("Invalid credentials — use the demo login or request access below.");
        setShouldShake(true);
        requestAnimationFrame(() => errorSummaryRef.current?.focus());
        return;
      }

      setAuthError("Something went wrong. Please try again.");
      setShouldShake(true);
    } catch {
      setAuthError("Network error. Check your connection and try again.");
      setShouldShake(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail(DEMO_EMAIL_FALLBACK);
    setPassword(DEMO_PASSWORD_FALLBACK);
    setFieldErrors({});
    setAuthError(null);
  };

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const showErrorSummary = hasFieldErrors || Boolean(authError);

  return (
    <motion.div
      animate={
        shouldShake && !prefersReducedMotion
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.45, ease: "easeInOut" }}
      onAnimationComplete={() => setShouldShake(false)}
      className="w-full max-w-md"
    >
      <Card className="border-border-subtle shadow-elevation-2">
        <CardHeader className="space-y-2 pb-2 text-center">
          <h1 className="text-h2 font-semibold tracking-tight text-arka-slate-900">Welcome back</h1>
          <p className="text-base text-arka-slate-600">
            Sign in to save action plans, resume demos, and access validation dashboards.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {showErrorSummary ? (
            <div
              ref={errorSummaryRef}
              id={errorSummaryId}
              role="alert"
              tabIndex={-1}
              className="rounded-radius-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
            >
              {authError ? <p id={authErrorId}>{authError}</p> : null}
              {hasFieldErrors ? (
                <ul className={cn(authError ? "mt-2 list-disc pl-4" : "list-disc pl-4")}>
                  {fieldErrors.email ? <li>{fieldErrors.email}</li> : null}
                  {fieldErrors.password ? <li>{fieldErrors.password}</li> : null}
                </ul>
              ) : null}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-describedby={authError ? authErrorId : undefined}>
            <div>
              <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-arka-slate-900">
                Email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
                className={cn(inputClasses, fieldErrors.email && "border-red-400")}
                placeholder="you@hospital.org"
                required
              />
              {fieldErrors.email ? (
                <p id={`${emailId}-error`} className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium text-arka-slate-900">
                Password
              </label>
              <input
                id={passwordId}
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
                className={cn(inputClasses, fieldErrors.password && "border-red-400")}
                placeholder="••••••••"
                required
              />
              {fieldErrors.password ? (
                <p id={`${passwordId}-error`} className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="premium"
              size="lg"
              loading={loading}
              className="min-h-[44px] w-full touch-manipulation"
            >
              Sign in
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleDemoFill}
              className="min-h-[44px] w-full touch-manipulation text-arka-slate-700"
            >
              Use demo credentials
            </Button>
          </form>

          <div className="relative py-1" aria-hidden>
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-surface px-2 text-arka-slate-500">New to ARKA?</span>
            </div>
          </div>

          <div className="rounded-radius-md border border-border-subtle bg-surface-sunken px-4 py-4 text-center">
            <p className="text-sm text-arka-slate-600">
              Evidence, docs, and demos stay open — accounts unlock saved state and early access.
            </p>
            <a
              href={REQUEST_ACCESS_MAILTO}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "mt-3 min-h-[44px] w-full touch-manipulation",
              )}
            >
              Request access
            </a>
            <p className="mt-3 text-xs text-arka-slate-500">
              Prefer to explore first?{" "}
              <Link
                href="/"
                className="font-medium text-arka-teal-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              >
                Return home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {loading ? "Signing in…" : authError ? authError : ""}
      </p>
    </motion.div>
  );
}
