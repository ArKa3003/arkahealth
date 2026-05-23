/**
 * Static ROI metrics used when `DEMO_MODE=true` and Supabase admin is unavailable.
 */

import type {
  DateRangeBounds,
  ValidationMetricsApiResponse,
} from "@/lib/validation/metrics";

/**
 * Builds a plausible dashboard payload for offline investor demos (no PHI).
 *
 * @param range - Reporting window (echoed from the API route).
 * @param filters - Echoed filter chips.
 */
export function buildOfflineDemoMetricsResponse(
  range: DateRangeBounds,
  filters: ValidationMetricsApiResponse["filters"],
): ValidationMetricsApiResponse {
  const daily = Array.from({ length: Math.min(range.days, 30) }, (_, i) => {
    const d = new Date(range.endIso);
    d.setUTCDate(d.getUTCDate() - (range.days - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      minutesSaved: 18 + (i % 5) * 3,
      savingsUsd: 220 + i * 12,
      pasAvoided: 2 + (i % 3),
      eventsCount: 6 + (i % 4),
    };
  });

  const monthlyRoi = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(range.endIso);
    d.setUTCMonth(d.getUTCMonth() - (5 - i));
    return {
      monthStart: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString(),
      totalSavingsUsd: 12000 + i * 1800,
      totalMinutesSaved: 900 + i * 120,
      pasAvoidedCount: 40 + i * 6,
    };
  });

  const weeklyMinutesLast12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(range.endIso);
    d.setUTCDate(d.getUTCDate() - (11 - i) * 7);
    return { weekStart: d.toISOString(), minutesSaved: 140 + i * 9 };
  });

  return {
    range: { startIso: range.startIso, endIso: range.endIso, days: range.days },
    filters,
    administrativeBurdenReduction: {
      totalMinutesSaved: 1840,
      fteEquivalent: 0.0147,
      benchmarkComparisonPercent: 112,
    },
    costAvoidance: {
      paDenialsPrevented: 42,
      appealCostsAvoided: 1050,
      oopSavingsRealized: 18600,
      inappropriateImagingAvoided: 18,
    },
    payerROI: {
      autoApprovalRate: 0.78,
      avgTimeToDecisionHours: 18.5,
      cms0057fComplianceRate: 0.96,
      denialSpecificityScore: 100,
    },
    clinicalQuality: {
      appealOverturnRate: 0.38,
      providerSatisfactionProxy: { radiology: 0.86, cardiology: 0.81 },
      patientFinancialToxicityProxy: 12,
    },
    timeSeries: {
      daily,
      monthlyRoi,
      weeklyMinutesLast12,
      mnaiGreenRate: daily.map((d) => ({
        date: d.date,
        rate: 62 + (d.date.charCodeAt(8) % 12),
        sampleSize: 8 + (d.eventsCount % 5),
      })),
    },
    costAvoidanceStackUsd: {
      appealCostsAvoided: 1050,
      inappropriateImagingAvoidedUsd: 15300,
      adminLaborAvoidedUsd: 2240,
    },
    payerBreakdown: [
      {
        payerId: "uhc",
        pasProcessed: 210,
        autoApprovalRate: 0.79,
        avgDecisionTimeHours: 17.2,
        appealOverturnRate: 0.36,
        estAnnualSavingsUsd: 420000,
      },
      {
        payerId: "bcbs-tx",
        pasProcessed: 164,
        autoApprovalRate: 0.76,
        avgDecisionTimeHours: 19.1,
        appealOverturnRate: 0.41,
        estAnnualSavingsUsd: 318000,
      },
      {
        payerId: "aetna",
        pasProcessed: 128,
        autoApprovalRate: 0.74,
        avgDecisionTimeHours: 20.4,
        appealOverturnRate: 0.39,
        estAnnualSavingsUsd: 265000,
      },
    ],
    oopTransparency: {
      cheaperSiteRerouteCount: 86,
      totalOopSavingsUsd: 18600,
      histogram: [
        { label: "$0–250", minUsd: 0, maxUsd: 250, count: 42 },
        { label: "$250–500", minUsd: 250, maxUsd: 500, count: 58 },
        { label: "$500–1000", minUsd: 500, maxUsd: 1000, count: 31 },
        { label: "$1000+", minUsd: 1000, maxUsd: null, count: 12 },
      ],
    },
    kpis: {
      totalPaAutoApproved: 312,
      totalMinutesSaved: 1840,
      oopSavingsRealizedUsd: 18600,
      cms0057fComplianceRate: 0.96,
    },
  };
}
