"use client";

import * as React from "react";
import { Send, FileText, Copy, Download, Printer } from "lucide-react";
import { Button } from "@/components/demos/ins/ui/Button";
import { Progress } from "@/components/demos/ins/ui/Progress";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";

function formatDisplayDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Splits letter body text into paragraphs (blank-line separated). */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Extracts narrative body between subject line and signature block. */
function extractLetterBody(letterContent: string): string[] {
  const subjectMarker = "Subject: Formal Appeal of Prior Authorization Denial";
  const subjectIdx = letterContent.indexOf(subjectMarker);
  const bodyStart =
    subjectIdx >= 0
      ? letterContent.indexOf("\n\n", subjectIdx + subjectMarker.length) + 2
      : 0;

  let bodyText = bodyStart > 1 ? letterContent.slice(bodyStart) : letterContent;
  const sigIdx = bodyText.search(/\nRespectfully submitted,/i);
  if (sigIdx >= 0) {
    bodyText = bodyText.slice(0, sigIdx);
  }

  return splitParagraphs(bodyText.trim());
}

function extractSignature(letterContent: string): string[] {
  const match = letterContent.match(/\nRespectfully submitted,[\s\S]*$/i);
  if (!match) return [];
  return match[0]
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

interface AppealLetterProps {
  appeal: NonNullable<ReturnType<typeof useInsDemoStore.getState>["generatedAppeal"]>;
  patientName: string;
  memberId: string;
  payerName: string;
  serviceDate: string;
  cptCode: string;
  cptDescription: string;
  referenceNumber: string;
}

function AppealLetter({
  appeal,
  patientName,
  memberId,
  payerName,
  serviceDate,
  cptCode,
  cptDescription,
  referenceNumber,
}: AppealLetterProps) {
  const bodyParagraphs = extractLetterBody(appeal.letterContent);
  const signatureLines = extractSignature(appeal.letterContent);
  const letterDate = formatDisplayDate(appeal.generatedAt);

  return (
    <article
      id="appeal-letter-sheet"
      className="bg-white text-slate-900 rounded-xl border border-slate-200 shadow-card max-w-3xl mx-auto p-8 sm:p-10 print:shadow-none print:border-slate-300"
    >
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <p className="text-sm font-semibold tracking-wide text-arka-deep uppercase">
            ARKA-INS · Utilization Management
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Prior Authorization Appeals</p>
        </div>
        <p className="text-sm text-slate-600 sm:text-right">{letterDate}</p>
      </header>

      <div className="mt-6 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-medium text-slate-900">To:</span> {payerName} — Medical Director,
          Prior Authorization Appeals
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
        <div>
          <dt className="text-slate-500 text-xs uppercase tracking-wide">Member</dt>
          <dd className="font-mono text-slate-900 mt-0.5">{patientName}</dd>
        </div>
        <div>
          <dt className="text-slate-500 text-xs uppercase tracking-wide">Member ID</dt>
          <dd className="font-mono text-slate-900 mt-0.5">{memberId}</dd>
        </div>
        <div>
          <dt className="text-slate-500 text-xs uppercase tracking-wide">Payer</dt>
          <dd className="font-mono text-slate-900 mt-0.5">{payerName}</dd>
        </div>
        <div>
          <dt className="text-slate-500 text-xs uppercase tracking-wide">Date of Service</dt>
          <dd className="font-mono text-slate-900 mt-0.5">{serviceDate}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500 text-xs uppercase tracking-wide">Requested Study (CPT)</dt>
          <dd className="font-mono text-slate-900 mt-0.5">
            {cptCode} — {cptDescription}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500 text-xs uppercase tracking-wide">Reference #</dt>
          <dd className="font-mono text-slate-900 mt-0.5">{referenceNumber}</dd>
        </div>
        {appeal.denialReason && (
          <div className="sm:col-span-2 pt-2 border-t border-slate-200">
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Denial Reason</dt>
            <dd className="text-slate-800 mt-0.5 leading-relaxed">{appeal.denialReason}</dd>
          </div>
        )}
      </dl>

      <h3 className="mt-8 text-base font-bold text-slate-900 leading-snug">
        Subject: Formal Appeal of Prior Authorization Denial — Request for Reconsideration
      </h3>

      <div className="mt-6 space-y-4 text-slate-800 leading-relaxed text-[15px]">
        {bodyParagraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {appeal.citedGuidelines.length > 0 && (
        <section className="mt-8">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Cited guidelines
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
            {appeal.citedGuidelines.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      {appeal.supportingLiterature.length > 0 && (
        <section className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Supporting literature
          </h4>
          <ul className="space-y-3 text-sm text-slate-700">
            {appeal.supportingLiterature.map((lit) => (
              <li key={lit.title} className="leading-relaxed">
                <span className="font-medium text-slate-900">{lit.title}</span>
                <span className="text-slate-600">
                  {" "}
                  — {lit.authors}. <em>{lit.journal}</em> ({lit.year}).
                </span>
                <p className="text-slate-600 mt-0.5 text-xs">{lit.relevance}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {signatureLines.length > 0 && (
        <div className="mt-10 pt-6 border-t border-slate-200 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
          {signatureLines.join("\n")}
        </div>
      )}

      {appeal.peerToPeerRequested && (
        <p className="mt-4 text-sm text-slate-600 italic">
          Peer-to-peer review requested upon notice.
        </p>
      )}

      <footer className="mt-10 pt-4 border-t border-slate-100 text-slate-500 text-xs text-center">
        Generated by ARKA-INS · {formatDisplayDate(appeal.generatedAt)} · Demonstration only — not
        for clinical use.
      </footer>
    </article>
  );
}

export function SubmitAppealStep({ onGoBack, onReset }: { onGoBack?: () => void; onReset?: () => void }) {
  const {
    generatedAppeal,
    currentOrderId,
    currentOrder,
    selectedPatient,
    processing,
    simulateAppealGeneration,
  } = useInsDemoStore();

  const requestedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (
      currentOrderId &&
      requestedRef.current !== null &&
      requestedRef.current !== currentOrderId
    ) {
      requestedRef.current = null;
    }
  }, [currentOrderId]);

  React.useEffect(() => {
    const appealReady =
      generatedAppeal != null && generatedAppeal.orderId === currentOrderId;
    if (
      currentOrderId &&
      requestedRef.current !== currentOrderId &&
      !appealReady &&
      !processing.isGenerating
    ) {
      requestedRef.current = currentOrderId;
      void simulateAppealGeneration();
    }
  }, [generatedAppeal, currentOrderId, processing.isGenerating, simulateAppealGeneration]);

  const handleCopy = React.useCallback(async () => {
    if (!generatedAppeal?.letterContent) return;
    try {
      await navigator.clipboard.writeText(generatedAppeal.letterContent);
    } catch {
      /* clipboard unavailable */
    }
  }, [generatedAppeal]);

  const handleDownload = React.useCallback(() => {
    if (!generatedAppeal?.letterContent) return;
    const blob = new Blob([generatedAppeal.letterContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appeal-${generatedAppeal.originalAuthNumber ?? generatedAppeal.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedAppeal]);

  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  if (processing.isGenerating) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">Submit / Appeal Generator</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-8 max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-4">
            <FileText className="h-12 w-12 text-arka-deep animate-pulse" aria-hidden />
            <p className="text-slate-700 font-medium text-center">
              {processing.processingMessage ?? "Generating appeal letter…"}
            </p>
            <Progress value={processing.processingProgress} max={100} size="md" className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  const showAppeal = generatedAppeal && generatedAppeal.orderId === currentOrderId;
  const order = currentOrder;
  const patient = selectedPatient;
  const patientName =
    patient ? `${patient.firstName} ${patient.lastName}` : "Member";
  const payerName = patient?.insurancePlan.name ?? "Insurance Plan";
  const memberId = patient?.memberId ?? "—";
  const serviceDate = order?.createdAt ? formatDisplayDate(order.createdAt) : "—";
  const cptCode = order?.cptCode ?? "—";
  const cptDescription = order?.cptDescription ?? order?.imagingType ?? "Imaging study";
  const referenceNumber =
    generatedAppeal?.originalAuthNumber ?? `PA-${new Date().getFullYear()}-000000`;

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-900">Submit / Appeal Generator</h2>
          <p className="text-slate-600 text-sm">
            Prior authorization appeal letter generated from clinical documentation.
          </p>
        </div>
        {onGoBack && (
          <Button variant="ghost" size="sm" onClick={onGoBack}>
            Go Back
          </Button>
        )}
      </div>

      {showAppeal ? (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Copy className="h-4 w-4" />}
              onClick={() => void handleCopy()}
            >
              Copy letter
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Print
            </Button>
            {onReset && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="h-4 w-4" />}
                onClick={onReset}
              >
                Reset & Start Over
              </Button>
            )}
          </div>

          <AppealLetter
            appeal={generatedAppeal}
            patientName={patientName}
            memberId={memberId}
            payerName={payerName}
            serviceDate={serviceDate}
            cptCode={cptCode}
            cptDescription={cptDescription}
            referenceNumber={referenceNumber}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
          <Send className="h-12 w-12 text-arka-deep mx-auto mb-4" aria-hidden />
          <p className="text-slate-700 text-sm">
            Complete prior steps to generate an appeal letter for this case.
          </p>
        </div>
      )}

      {!showAppeal && (
        <div className="flex justify-end gap-3 print:hidden">
          {onGoBack && (
            <Button variant="secondary" size="md" onClick={onGoBack}>
              Back
            </Button>
          )}
          {onReset && (
            <Button variant="primary" size="md" onClick={onReset} leftIcon={<Send className="h-4 w-4" />}>
              Reset & Start Over
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
