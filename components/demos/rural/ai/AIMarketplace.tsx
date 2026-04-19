"use client";

import { AI_ALGORITHMS } from "@/lib/demos/rural/ai/marketplace-data";
import { AIAlgorithmCard } from "@/components/demos/rural/ai/AIAlgorithmCard";

export function AIMarketplace() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {AI_ALGORITHMS.map((a) => (
        <AIAlgorithmCard key={a.id} algorithm={a} />
      ))}
    </div>
  );
}
