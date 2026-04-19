export interface MobileSlot {
  id: string;
  day: string;
  location: string;
  booked: boolean;
}

export function nextAvailableSlots(): MobileSlot[] {
  return [
    { id: "ms-1", day: "Mon", location: "County Fairgrounds", booked: false },
    { id: "ms-2", day: "Wed", location: "Tribal Health Center", booked: true },
    { id: "ms-3", day: "Fri", location: "Riverbend CAH", booked: false },
  ];
}
