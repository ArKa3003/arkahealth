import type { BatchAuthorizationRequest, BatchOrderEntry, FacilityProfile } from "../types";
import { detectApplicableExemptions } from "./exemption-db";

/**
 * Simulate batch pre-authorization for a mobile unit visit.
 * Processes all orders at once, checking for exemptions and
 * preparing authorization requests.
 */
export function prepareBatchAuthorization(
  facilityProfile: FacilityProfile,
  orders: Omit<BatchOrderEntry, "status" | "exemptionApplied" | "estimatedReimbursement">[],
  mobileUnitVisitDate: string
): BatchAuthorizationRequest {
  const exemptions = detectApplicableExemptions(facilityProfile.designation);

  const processedOrders: BatchOrderEntry[] = orders.map((order) => {
    const applicableExemption = exemptions.find((ex) => ex.autoDetectable);

    const avgRate = facilityProfile.financials.payerMix.reduce(
      (sum, p) => sum + p.averageReimbursementRate * (p.percentVolume / 100),
      0
    );
    const estimatedReimbursement = Math.round(avgRate * 800);

    return {
      ...order,
      status: applicableExemption ? "approved" : "pending",
      exemptionApplied: applicableExemption?.exemptionType,
      estimatedReimbursement,
    } as BatchOrderEntry;
  });

  const approvedCount = processedOrders.filter((o) => o.status === "approved").length;

  return {
    id: `batch-${Date.now()}`,
    facilityId: facilityProfile.id,
    mobileUnitVisitDate,
    orders: processedOrders,
    status: "complete",
    submittedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    approvedCount,
    deniedCount: 0,
    pendingCount: processedOrders.length - approvedCount,
    totalEstimatedRevenue: processedOrders.reduce((sum, o) => sum + o.estimatedReimbursement, 0),
  };
}
