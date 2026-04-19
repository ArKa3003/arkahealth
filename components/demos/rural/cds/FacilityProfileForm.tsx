"use client";

import { mockFacilities } from "@/lib/demos/rural/facility-profiles";
import { useRuralStore } from "@/lib/demos/rural/rural-store";
import { Select } from "@/components/demos/rural/shared/ui/Select";

export function FacilityProfileForm() {
  const selectedId = useRuralStore((s) => s.selectedFacility?.id ?? "");
  const setSelectedFacility = useRuralStore((s) => s.setSelectedFacility);

  return (
    <Select
      id="facility-select"
      label="Active facility profile"
      value={selectedId}
      onChange={(e) => {
        const f = mockFacilities.find((x) => x.id === e.target.value);
        if (f) setSelectedFacility(f);
      }}
    >
      {mockFacilities.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </Select>
  );
}
