"use client";

import Link from "next/link";
import { navLinks } from "@/lib/constants";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed right-0 top-0 z-50 flex h-full w-64 flex-col gap-6 border-l border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 md:hidden"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="p-2"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <ul className="flex flex-col gap-4">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="block text-lg font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
