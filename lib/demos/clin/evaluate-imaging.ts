// src/lib/evaluate-imaging.ts
// Core evaluation engine – uses AIIE scoring (RAND/UCLA, peer‑reviewed evidence)
// Supports standalone demo and Epic CDS Hooks integration

import {
  ClinicalScenario,
  EvaluationResult,
  AppropriatenessScore,
  Alternative,
  Warning,
  EvidenceLink,
  ImagingModality,
  ImagingCriteria,
  CDSHooksRequest,
  CDSHooksResponse,
  CDSHooksCard,
} from "./types";
import { calculateAIIEScore, AIIEInput } from "./aiie/scoring-engine";

// ============================================================================
// DEMO PATH: Standalone Evaluation
// ============================================================================

/**
 * Main evaluation function. Uses AIIE proprietary scoring.
 */
export function evaluateImaging(scenario: ClinicalScenario): EvaluationResult {
  const input = scenarioToAIIEInput(scenario);
  const aii = calculateAIIEScore(input);

  const appropriatenessScore: AppropriatenessScore = {
    value: aii.score,
    category: aii.category === 'appropriate' ? 'usually-appropriate' : aii.category === 'inappropriate' ? 'usually-not-appropriate' : 'may-be-appropriate',
    description: aii.recommendation,
  };

  const trafficLight = aii.category === 'appropriate' ? 'green' : aii.category === 'inappropriate' ? 'red' : 'yellow';

  const matchedCriteria = buildMatchedCriteria(scenario, aii);
  const reasoning = buildReasoning(scenario, aii);
  const alternatives = aiiToAlternatives(aii.alternatives, scenario.proposedImaging.modality);
  const warnings = generateWarnings(scenario);
  const evidenceLinks = aiiToEvidenceLinks(aii.evidenceSources);

  const confidenceLevel = aii.confidence === 'high' ? 'High' : aii.confidence === 'moderate' ? 'Medium' : 'Low';
  const coverageStatus = aii.factors.length > 0 ? 'DIRECT_MATCH' : 'GENERAL_GUIDANCE';

  return {
    appropriatenessScore,
    trafficLight,
    matchedCriteria,
    reasoning,
    alternatives,
    warnings,
    evidenceLinks,
    confidenceLevel,
    coverageStatus,
    evaluatedAt: new Date().toISOString(),
    shap: {
      factors: aii.factors,
      baselineScore: aii.baselineScore,
      finalScore: aii.finalScore,
    },
  };
}

function scenarioToAIIEInput(s: ClinicalScenario): AIIEInput {
  const reds = s.redFlags || [];
  const f = (key: string) => reds.some(r => r.present && r.flag.toLowerCase().includes(key));

  return {
    age: s.age,
    sex: s.sex === 'other' ? 'male' : s.sex,
    pregnant: s.pregnancyStatus === 'pregnant',
    chiefComplaint: s.chiefComplaint,
    duration: s.duration,
    symptoms: s.symptoms || [],
    redFlags: {
      cancerHistory: f('cancer'),
      neurologicalDeficit: f('neuro'),
      fever: f('fever'),
      weightLoss: f('weight loss'),
      trauma: f('trauma'),
      immunocompromised: f('immuno'),
      ivDrugUse: f('iv drug'),
      osteoporosis: f('osteoporosis'),
      ageOver50: f('age') && (f('50') || f('>50')) || s.age > 50,
      ageUnder18: f('pediatric') || f('under 18') || s.age < 18,
      progressiveSymptoms: f('progressive'),
      bladderBowelDysfunction: f('bladder') || f('bowel'),
      suddenOnset: f('sudden'),
    },
    priorImaging: !!(s.priorImaging && s.priorImaging.length > 0),
    priorImagingTimeframe: s.priorImaging?.[0] ? `${s.priorImaging[0].daysAgo} days ago` : undefined,
    conservativeManagementTried: false,
    requestedModality: s.proposedImaging.modality,
    requestedProcedure: `${s.proposedImaging.modality} ${s.proposedImaging.bodyPart}`.trim(),
  };
}

function buildMatchedCriteria(s: ClinicalScenario, aii: { score: number }): ImagingCriteria {
  const topic = identifyTopic(s);
  const variant = determineVariant(s);
  const procedure = `${s.proposedImaging.modality} ${s.proposedImaging.bodyPart}`.trim();
  const mod = s.proposedImaging.modality.toLowerCase();
  let rrl = '☢☢☢';
  if (mod.includes('mri') || mod.includes('ultrasound') || mod.includes('us')) rrl = 'O';
  else if (mod.includes('x-ray')) rrl = '☢☢';
  else if (mod.includes('ct')) rrl = '☢☢☢';
  else if (mod.includes('pet') || mod.includes('nuclear')) rrl = '☢☢☢☢';

  return {
    id: `aiie-${topic.toLowerCase().replace(/\s+/g, '-')}`,
    topic,
    variant,
    procedure,
    rating: aii.score,
    rrl,
    source: 'AIIE evidence-based methodology',
    lastReviewed: '2026',
  };
}

function identifyTopic(s: ClinicalScenario): string {
  const c = s.chiefComplaint.toLowerCase();
  const b = s.proposedImaging.bodyPart.toLowerCase();
  if (c.includes('back') || c.includes('lumbar') || b.includes('lumbar')) return 'Low Back Pain';
  if (c.includes('headache') || c.includes('head') || c.includes('migraine') || b.includes('head')) return 'Headache';
  if (c.includes('chest') || c.includes('pe') || c.includes('embolism') || c.includes('dyspnea') || c.includes('shortness')) return 'Suspected Pulmonary Embolism';
  if (c.includes('abdominal') || c.includes('rlq') || c.includes('appendicitis') || b.includes('abdomen')) return 'Right Lower Quadrant Pain - Suspected Appendicitis';
  if (c.includes('knee') || b.includes('knee')) return 'Acute Knee Injury';
  return s.chiefComplaint;
}

function determineVariant(s: ClinicalScenario): string {
  const parts: string[] = [];
  const hasRed = (s.redFlags || []).some(r => r.present);
  parts.push(hasRed ? 'with red flags' : 'no red flags');
  if (s.age < 18) parts.push('pediatric');
  if (s.pregnancyStatus === 'pregnant') parts.push('pregnancy');
  return parts.length ? parts.join(', ') : 'routine';
}

function buildReasoning(s: ClinicalScenario, aii: { factors: { explanation: string }[]; recommendation: string }): string[] {
  const out: string[] = [];
  out.push(`Patient presents with ${s.chiefComplaint} for ${s.duration}.`);
  const present = (s.redFlags || []).filter(r => r.present);
  if (present.length) out.push(`Red flags identified: ${present.map(r => r.flag).join(', ')}.`);
  else if ((s.redFlags || []).length) out.push('No red flags identified based on clinical presentation.');
  aii.factors.slice(0, 4).forEach(f => out.push(f.explanation));
  if (s.priorImaging?.length) {
    const r = s.priorImaging.find(p => p.daysAgo < 30);
    if (r) out.push(`Recent ${r.modality} of ${r.bodyPart} performed ${r.daysAgo} days ago may reduce need for additional imaging.`);
  }
  out.push(aii.recommendation);
  return out;
}

function aiiToAlternatives(
  alts: { procedure: string; score: number; rationale: string; radiation: string; costComparison: string }[],
  origModality: string
): Alternative[] {
  const costMap = (cc: string): 'lower' | 'similar' | 'higher' => {
    const l = (cc || '').toLowerCase();
    if (l.includes('lowest') || l.includes('lower') || l.includes('slightly lower')) return 'lower';
    if (l.includes('similar') || l.includes('same')) return 'similar';
    return 'higher';
  };
  const radMap = (r: string): 'lower' | 'similar' | 'higher' | 'none' => {
    const l = (r || '').toLowerCase();
    if (l.includes('none')) return 'none';
    if (l.includes('minimal') || l.includes('low')) return 'lower';
    if (l.includes('medium') || l.includes('high') || l.includes('very')) return 'higher';
    return 'similar';
  };
  const orig = origModality.toLowerCase();
  return alts.slice(0, 4).map(a => ({
    procedure: a.procedure,
    rating: a.score,
    reasoning: a.rationale,
    costComparison: costMap(a.costComparison),
    radiationComparison: radMap(a.radiation),
  }));
}

function aiiToEvidenceLinks(
  sources: { title: string; citation: string; type: 'peer-reviewed' | 'guideline' | 'systematic-review' }[]
): EvidenceLink[] {
  const t = (x: string): EvidenceLink['type'] => x === 'peer-reviewed' ? 'study' : x === 'systematic-review' ? 'recommendation' : 'guideline';
  const links: EvidenceLink[] = sources.map(s => ({
    title: `${s.title} — ${s.citation}`,
    url: '/methodology',
    type: t(s.type),
  }));
  if (links.length === 0) links.push({ title: 'AIIE Methodology', url: '/methodology', type: 'guideline' });
  return links;
}

function generateWarnings(scenario: ClinicalScenario): Warning[] {
  const w: Warning[] = [];
  if (scenario.priorImaging) {
    const very = scenario.priorImaging.find(p => p.daysAgo < 14);
    const recent = scenario.priorImaging.find(p => p.daysAgo >= 14 && p.daysAgo < 30);
    if (very) w.push({ type: 'prior-imaging', message: `${very.modality} of ${very.bodyPart} performed ${very.daysAgo} days ago. Consider reviewing prior study before ordering new imaging.`, severity: 'warning' });
    else if (recent) w.push({ type: 'prior-imaging', message: `${recent.modality} of ${recent.bodyPart} performed ${recent.daysAgo} days ago is available for review.`, severity: 'info' });
  }
  const critical = (scenario.redFlags || []).filter(r => r.present && /cancer|neuro|trauma|fever/i.test(r.flag));
  if (critical.length) w.push({ type: 'red-flag', message: `Critical red flags present: ${critical.map(r => r.flag).join(', ')}. Urgent evaluation recommended.`, severity: 'critical' });

  const hasRad = /CT|X-ray|Nuclear|PET/i.test(scenario.proposedImaging.modality);
  if (scenario.pregnancyStatus === 'pregnant' && hasRad) {
    w.push({ type: 'pregnancy', message: '🚨 CRITICAL: Patient is pregnant. Radiation exposure should be avoided. Consider MRI or Ultrasound alternatives.', severity: 'critical' });
  } else if (scenario.pregnancyStatus === 'unknown' && scenario.sex !== 'male' && scenario.age >= 12 && scenario.age <= 50 && hasRad) {
    w.push({ type: 'pregnancy', message: '⚠️ Pregnancy status unknown. Please verify before ordering radiation-based imaging.', severity: 'warning' });
  }

  if (scenario.contrastAllergy?.hasAllergy) {
    const needs = /contrast/i.test(scenario.proposedImaging.modality);
    if (needs) {
      const t = scenario.contrastAllergy.allergyType || 'unknown';
      w.push({ type: 'contrast-allergy', message: `🚨 CRITICAL: Patient has ${t === 'both' ? 'iodinated and gadolinium' : t} contrast allergy. Avoid contrast-enhanced studies.`, severity: 'critical' });
    }
  }

  const needsContrast = /contrast/i.test(scenario.proposedImaging.modality);
  if (needsContrast && scenario.renalFunction) {
    const { egfr, hasImpairment } = scenario.renalFunction;
    if ((egfr != null && egfr < 30) || hasImpairment) w.push({ type: 'renal-function', message: '⚠️ WARNING: eGFR < 30 or known renal impairment. Risk of contrast-induced nephropathy. Consider non-contrast alternatives or consult nephrology.', severity: 'warning' });
    else if (egfr != null && egfr >= 30 && egfr < 60) w.push({ type: 'renal-function', message: 'ℹ️ Moderate renal impairment (eGFR 30-59). Monitor renal function after contrast.', severity: 'info' });
  }
  if (needsContrast && scenario.medications?.onMetformin) w.push({ type: 'medication', message: 'ℹ️ Patient on metformin. Consider holding 48h before/after contrast to reduce lactic acidosis risk.', severity: 'info' });
  if (scenario.medications?.onAnticoagulation) {
    const ind = (scenario.proposedImaging.indication || '').toLowerCase();
    if (['biopsy', 'drainage', 'aspiration'].some(p => ind.includes(p))) w.push({ type: 'medication', message: '⚠️ Patient on anticoagulation. May affect procedure timing and bleeding risk.', severity: 'warning' });
  }
  return w;
}

// ============================================================================
// EPIC CDS HOOKS PATH
// ============================================================================

export function extractScenarioFromCDSHooks(request: CDSHooksRequest): ClinicalScenario {
  const patientId = request.context.patientId.replace('Patient/', '');
  const draftOrder = request.context.draftOrders?.[0] || {};
  const modality = (draftOrder.modality || 'CT') as ImagingModality;
  const bodyPart = draftOrder.bodyPart || 'Unknown';
  const indication = draftOrder.indication || draftOrder.reason || 'Not specified';
  const urgency = draftOrder.urgency || 'routine';
  return {
    patientId,
    age: draftOrder.patientAge || 50,
    sex: (draftOrder.patientSex || 'other') as 'male' | 'female' | 'other',
    chiefComplaint: indication,
    clinicalHistory: draftOrder.clinicalHistory || 'Not available',
    symptoms: draftOrder.symptoms || [],
    duration: draftOrder.duration || 'Unknown',
    redFlags: draftOrder.redFlags || [],
    proposedImaging: { modality, bodyPart, indication, urgency: urgency as 'stat' | 'urgent' | 'routine' },
    priorImaging: draftOrder.priorImaging || [],
  };
}

export function convertResultToCDSCards(result: EvaluationResult): CDSHooksCard[] {
  const cards: CDSHooksCard[] = [];
  const indicator: 'info' | 'warning' | 'critical' = result.trafficLight === 'green' ? 'info' : result.trafficLight === 'yellow' ? 'warning' : 'critical';
  cards.push({ summary: `Appropriateness Score: ${result.appropriatenessScore.value}/9 (${result.appropriatenessScore.category})`, indicator, source: { label: 'ARKA Imaging Advisor' }, detail: result.reasoning.join('\n\n') });
  result.warnings.forEach(w => { if (w.severity === 'critical' || w.severity === 'warning') cards.push({ summary: w.message, indicator: w.severity === 'critical' ? 'critical' : 'warning', source: { label: 'ARKA Imaging Advisor' }, detail: w.message }); });
  if (result.alternatives.length) cards.push({ summary: 'Alternative imaging options available', indicator: 'info', source: { label: 'ARKA Imaging Advisor' }, detail: result.alternatives.map(a => `${a.procedure} (${a.rating}/9) — ${a.reasoning}`).join('\n'), suggestions: result.alternatives.map(a => ({ label: a.procedure, uuid: `alt-${a.procedure.replace(/\s+/g, '-').toLowerCase() }` })) });
  return cards;
}

export function evaluateImagingCDSHooks(request: CDSHooksRequest): CDSHooksResponse {
  const scenario = extractScenarioFromCDSHooks(request);
  const result = evaluateImaging(scenario);
  return { cards: convertResultToCDSCards(result) };
}
