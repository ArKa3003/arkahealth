import type { HubSpokeNode } from "@/lib/demos/rural/types";

export const demoNetwork: HubSpokeNode[] = [
  { id: "hub-1", name: "Regional Imaging Hub", role: "hub", distanceMiles: 0 },
  { id: "spoke-1", name: "Riverbend CAH", role: "spoke", distanceMiles: 42 },
  { id: "spoke-2", name: "North Valley Clinic", role: "spoke", distanceMiles: 28 },
];
