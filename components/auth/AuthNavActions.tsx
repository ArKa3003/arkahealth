"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LogOut } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/Button";
import { routes } from "@/lib/constants";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { cn } from "@/lib/utils";
import { navGhostButtonClasses, type NavAppearance } from "@/lib/navigation/nav-appearance";

type AuthNavActionsProps = {
  appearance: NavAppearance;
  motionDelay?: number;
  className?: string;
};

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "U";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

/**
 * Navbar sign-in link or signed-in avatar chip with sign-out.
 */
export function AuthNavActions({ appearance, motionDelay = 0.3, className }: AuthNavActionsProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user, loading, signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <span
        className={cn(
          "hidden min-h-[44px] min-w-[5rem] sm:inline-flex",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (user) {
    const initials = initialsFromEmail(user.email);
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { delay: motionDelay, duration: 0.35, ease: "easeOut" }
        }
        className={cn("hidden items-center gap-2 sm:flex", className)}
      >
        <span
          className="inline-flex min-h-[44px] items-center gap-2 rounded-radius-md border border-border-subtle bg-surface-raised px-2.5 py-1.5 text-sm font-medium text-arka-slate-900"
          title={user.email}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-arka-teal-600 text-xs font-semibold text-white"
            aria-hidden
          >
            {initials}
          </span>
          <span className="max-w-[8rem] truncate">{user.email}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="md"
          loading={signingOut}
          onClick={handleSignOut}
          className={cn(
            "min-h-[44px] touch-manipulation",
            navGhostButtonClasses(appearance),
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { delay: motionDelay, duration: 0.35, ease: "easeOut" }
      }
      className={className}
    >
      <Link
        href={routes.signin}
        prefetch
        className={cn(
          buttonVariants({ variant: "ghost", size: "md" }),
          "hidden min-h-[44px] touch-manipulation text-base sm:inline-flex",
          navGhostButtonClasses(appearance),
        )}
      >
        Sign in
      </Link>
    </motion.div>
  );
}
