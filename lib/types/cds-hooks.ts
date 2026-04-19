/**
 * Shared CDS Hooks 2.0 type definitions used by ARKA applications.
 */

/**
 * Supported CDS Hooks card indicators.
 */
export type CDSCardIndicator = "info" | "warning" | "critical";

/**
 * Supported link launch types.
 */
export type CDSLinkType = "absolute" | "smart";

/**
 * Supported selection behaviors for suggestion groups.
 */
export type CDSSelectionBehavior = "at-most-one" | "any";

/**
 * OAuth token details supplied by the EHR.
 */
export interface CDSFhirAuthorization {
  /** OAuth access token for the FHIR server. */
  accessToken: string;
  /** OAuth token type, typically `Bearer`. */
  tokenType: string;
  /** Seconds until token expiration. */
  expiresIn: number;
  /** OAuth scope string granted for the token. */
  scope?: string;
  /** Subject identity for the launch context. */
  subject?: string;
  /** Patient identifier if the token is patient-scoped. */
  patient?: string;
  /** Encounter identifier if supplied with the launch context. */
  encounter?: string;
}

/**
 * Template placeholder used in service prefetch definitions.
 */
export type CDSPrefetchTemplate = string;

/**
 * Generic CDS Hooks request payload.
 */
export interface CDSHookRequest<
  TContext extends Record<string, unknown> = Record<string, unknown>,
  TPrefetch extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Hook name that triggered this invocation. */
  hook: string;
  /** Unique identifier for this hook invocation. */
  hookInstance: string;
  /** Base URL of the calling FHIR server. */
  fhirServer?: string;
  /** OAuth details for calling back to the FHIR server. */
  fhirAuthorization?: CDSFhirAuthorization;
  /** Hook-specific context object supplied by the EHR. */
  context: TContext;
  /** Prefetched FHIR resources requested by the service. */
  prefetch?: TPrefetch;
}

/**
 * A source attribution displayed on a CDS card.
 */
export interface CDSCardSource {
  /** Human-readable source label. */
  label: string;
  /** Canonical source URL. */
  url?: string;
  /** Optional icon URL for display. */
  icon?: string;
}

/**
 * An action expressed in CDS Hooks system action format.
 */
export interface CDSAction<TResource = unknown> {
  /** Action type defined by CDS Hooks. */
  type: "create" | "update" | "delete";
  /** Optional description for the proposed action. */
  description?: string;
  /** Resource to create or update. */
  resource?: TResource;
  /** Resource identifier for delete actions. */
  resourceId?: string;
}

/**
 * Optional reason that can be selected when overriding guidance.
 */
export interface CDSOverrideReason {
  /** Stable code for the override reason. */
  code: string;
  /** Human-readable display label. */
  display: string;
  /** Optional system URI for the coded reason. */
  system?: string;
}

/**
 * A link associated with a CDS card.
 */
export interface CDSLink {
  /** Link label shown to the user. */
  label: string;
  /** Absolute URL or SMART launch URL template. */
  url: string;
  /** Declares whether the link is an ordinary URL or SMART app launch. */
  type: CDSLinkType;
  /** Opaque app context forwarded during SMART launches. */
  appContext?: string;
}

/**
 * A suggestion presented to the user.
 */
export interface CDSSuggestion<TResource = unknown> {
  /** Display label for the suggestion. */
  label: string;
  /** Stable UUID for the suggestion. */
  uuid: string;
  /** Indicates whether the suggestion is recommended by default. */
  isRecommended?: boolean;
  /** Actions executed if the user accepts the suggestion. */
  actions: CDSAction<TResource>[];
}

/**
 * A CDS Hooks response card.
 */
export interface CDSCard<TResource = unknown> {
  /** Optional stable UUID for the card. */
  uuid?: string;
  /** Short card headline shown in constrained UI. */
  summary: string;
  /** Longer card body text. */
  detail?: string;
  /** Visual severity indicator. */
  indicator: CDSCardIndicator;
  /** Source attribution shown on the card. */
  source: CDSCardSource;
  /** User-selectable suggestions associated with the card. */
  suggestions?: CDSSuggestion<TResource>[];
  /** Selection behavior for the suggestions list. */
  selectionBehavior?: CDSSelectionBehavior;
  /** Optional reasons that justify overriding the recommendation. */
  overrideReasons?: CDSOverrideReason[];
  /** External or SMART links related to the recommendation. */
  links?: CDSLink[];
}

/**
 * CDS Hooks discovery/service registration metadata.
 */
export interface CDSServiceInfo {
  /** Service hook this CDS service responds to. */
  hook: string;
  /** Human-readable service title. */
  title: string;
  /** Service description presented during discovery. */
  description: string;
  /** Stable service identifier used in the service URL. */
  id: string;
  /** Optional prefetch template map keyed by prefetch name. */
  prefetch?: Record<string, CDSPrefetchTemplate>;
}

/**
 * CDS Hooks response payload returned by the service.
 */
export interface CDSHookResponse<TResource = unknown> {
  /** Cards rendered by the EHR. */
  cards: CDSCard<TResource>[];
  /** Optional automatic actions applied by the EHR. */
  systemActions?: CDSAction<TResource>[];
}
