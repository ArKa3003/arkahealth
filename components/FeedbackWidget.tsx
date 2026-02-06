"use client";

import { useState, useCallback } from "react";
import { MessageSquare, X, Star } from "lucide-react";
import { clsx } from "clsx";

const PANEL_TRANSITION_MS = 300;
const PHASE_OPTIONS = [
  { id: "arka-clin", value: "ARKA-CLIN", label: "ARKA-CLIN" },
  { id: "arka-ed", value: "ARKA-ED", label: "ARKA-ED" },
  { id: "arka-ins", value: "ARKA-INS", label: "ARKA-INS" },
  { id: "general", value: "General/Overall", label: "General/Overall" },
] as const;

type FieldErrors = {
  phases?: string;
  feedback?: string;
};

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [phases, setPhases] = useState<Record<string, boolean>>({
    "ARKA-CLIN": false,
    "ARKA-ED": false,
    "ARKA-INS": false,
    "General/Overall": false,
  });

  const openPanel = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => setPanelVisible(true));
  }, []);

  const closePanel = useCallback(() => {
    setPanelVisible(false);
    const t = setTimeout(() => {
      setIsOpen(false);
      if (submitted) {
        setName("");
        setEmail("");
        setRating(null);
        setFeedback("");
        setPhases({
          "ARKA-CLIN": false,
          "ARKA-ED": false,
          "ARKA-INS": false,
          "General/Overall": false,
        });
        setSubmitted(false);
      }
    }, PANEL_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [submitted]);

  const togglePhase = (value: string) => {
    setPhases((prev) => ({ ...prev, [value]: !prev[value] }));
    if (fieldErrors.phases) setFieldErrors((e) => ({ ...e, phases: undefined }));
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const atLeastOnePhase = Object.values(phases).some(Boolean);
    if (!atLeastOnePhase) errors.phases = "Please select at least one phase.";
    const trimmedFeedback = feedback.trim();
    if (!trimmedFeedback) errors.feedback = "Please enter your feedback.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const selectedPhases = Object.entries(phases)
      .filter(([, checked]) => checked)
      .map(([value]) => value);

    const payload = {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      rating: rating ?? undefined,
      phases: selectedPhases,
      feedback: feedback.trim(),
    };

    // eslint-disable-next-line no-console
    console.log("[FeedbackWidget] Submission:", payload);

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openPanel}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-arka-teal text-white shadow-glow transition-all duration-300 ease-out hover:scale-105 hover:shadow-glow-lg focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 active:scale-95 sm:h-16 sm:w-16"
        style={{
          bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
          right: "max(24px, env(safe-area-inset-right, 24px))",
        }}
        aria-label="Provide feedback about ARKA"
        title="Provide feedback"
      >
        <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-arka-navy/40 transition-opacity duration-300 ease-out"
        style={{
          opacity: panelVisible ? 1 : 0,
          transitionDuration: `${PANEL_TRANSITION_MS}ms`,
        }}
        onClick={closePanel}
        aria-hidden
      />

      {/* Slide-out panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-arka-bg-light sm:max-w-md"
        style={{
          transform: panelVisible ? "translateX(0)" : "translateX(100%)",
          transitionDuration: `${PANEL_TRANSITION_MS}ms`,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-arka-light bg-white px-4 py-3 dark:border-arka-deep dark:bg-arka-bg-light">
          <h2 id="feedback-title" className="text-lg font-semibold text-arka-text-dark">
            Share feedback
          </h2>
          <button
            type="button"
            onClick={closePanel}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-arka-text-dark-muted transition-colors hover:bg-arka-pale hover:text-arka-text-dark focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 touch-manipulation"
            aria-label="Close feedback"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-arka-teal/15">
                  <MessageSquare className="h-8 w-8 text-arka-teal" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-arka-text-dark">
                  Thank you for your feedback
                </h3>
                <p className="mb-6 text-arka-text-dark-muted">
                  We use your input to improve ARKA across all phases.
                </p>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-lg bg-arka-teal px-4 py-2.5 font-medium text-white transition-colors hover:bg-arka-teal/90 focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {Object.keys(fieldErrors).length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100"
                >
                    Please fix the errors below before submitting.
                  </div>
                )}

                {/* Name (optional) */}
                <div>
                  <label htmlFor="feedback-name" className="mb-1.5 block text-sm font-medium text-arka-text-dark">
                    Name <span className="text-arka-text-dark-soft">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="feedback-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="arka-input w-full rounded-lg border border-arka-light bg-white px-3 py-2.5 text-arka-text-dark placeholder-arka-text-dark-soft focus:border-arka-teal dark:border-arka-deep dark:bg-white"
                    placeholder="Your name"
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label htmlFor="feedback-email" className="mb-1.5 block text-sm font-medium text-arka-text-dark">
                    Email <span className="text-arka-text-dark-soft">(optional)</span>
                  </label>
                  <input
                    type="email"
                    id="feedback-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="arka-input w-full rounded-lg border border-arka-light bg-white px-3 py-2.5 text-arka-text-dark placeholder-arka-text-dark-soft focus:border-arka-teal dark:border-arka-deep dark:bg-white"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Phase selection (required, multi-select) */}
                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-arka-text-dark">
                    Which phase is this feedback for? <span className="text-red-600">*</span>
                  </legend>
                  <p className="mb-3 text-xs text-arka-text-dark-soft">
                    Select all that apply. At least one required.
                  </p>
                  <div className="space-y-2" role="group">
                    {PHASE_OPTIONS.map(({ id, value, label }) => (
                      <label
                        key={id}
                        className={clsx(
                          "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                          phases[value]
                            ? "border-arka-teal bg-arka-teal/10 dark:bg-arka-teal/15"
                            : "border-arka-light hover:bg-arka-pale dark:border-arka-deep dark:hover:bg-arka-pale/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          name="phases"
                          value={value}
                          checked={!!phases[value]}
                          onChange={() => togglePhase(value)}
                          className="h-4 w-4 rounded border-arka-light text-arka-teal focus:ring-2 focus:ring-arka-teal focus:ring-offset-0"
                          aria-invalid={!!fieldErrors.phases}
                        />
                        <span className="text-sm font-medium text-arka-text-dark">{label}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.phases && (
                    <p id="phases-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {fieldErrors.phases}
                    </p>
                  )}
                </fieldset>

                {/* Rating (1–5 stars) */}
                <div role="group" aria-labelledby="rating-legend">
                  <p id="rating-legend" className="mb-2 text-sm font-medium text-arka-text-dark">
                    Rating
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={clsx(
                          "rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2",
                          rating === star
                            ? "text-amber-500"
                            : "text-arka-text-dark-soft hover:text-amber-400"
                        )}
                        aria-label={`Rate ${star} out of 5`}
                        aria-pressed={rating === star}
                      >
                        <Star
                          className={clsx("h-8 w-8 sm:h-9 sm:w-9", rating !== null && rating >= star && "fill-current")}
                          aria-hidden
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback textarea (required) */}
                <div>
                  <label htmlFor="feedback-text" className="mb-1.5 block text-sm font-medium text-arka-text-dark">
                    Feedback <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="feedback-text"
                    value={feedback}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                      if (fieldErrors.feedback) setFieldErrors((e) => ({ ...e, feedback: undefined }));
                    }}
                    rows={4}
                    required
                    className={clsx(
                      "arka-input w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-arka-text-dark placeholder-arka-text-dark-soft focus:border-arka-teal dark:border-arka-deep dark:bg-white",
                      fieldErrors.feedback ? "border-red-500" : "border-arka-light"
                    )}
                    placeholder="Share your thoughts..."
                    aria-required
                    aria-invalid={!!fieldErrors.feedback}
                    aria-describedby={fieldErrors.feedback ? "feedback-error" : undefined}
                  />
                  {fieldErrors.feedback && (
                    <p id="feedback-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {fieldErrors.feedback}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="arka-button-primary w-full py-3 disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting…" : "Submit feedback"}
                </button>

                <p className="text-center text-xs text-arka-text-dark-soft">
                  Your feedback helps us improve ARKA. We do not share your contact information.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
