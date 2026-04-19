export function generatePreliminaryRead(modality: string, findingsSeed: string): string {
  return `[AI preliminary — ${modality}] ${findingsSeed}. Correlate clinically; final read by qualified radiologist.`;
}
