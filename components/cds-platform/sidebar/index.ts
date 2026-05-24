/**
 * @file index.ts
 * @description Exports for the CDS non-modal sidebar interface (Phase 6) and Phase 8 information hierarchy.
 */

export { SidebarLayout } from './SidebarLayout';
export { SidebarHeader, type SidebarHeaderProps, type TrafficLightStatus } from './SidebarHeader';
export { AlertCard, type AlertCardProps } from './AlertCard';
export { ScoreIndicator, type ScoreIndicatorProps } from './ScoreIndicator';
export { QuickActions, type QuickActionsProps } from './QuickActions';
export { OverrideDialog, type OverrideDialogProps } from './OverrideDialog';
export { AlternativesPanel, type AlternativesPanelProps, type AlternativeOption } from './AlternativesPanel';
export { NudgeDisplay, type NudgeDisplayProps, type Nudge, type NudgeTrackEvent } from './NudgeDisplay';

// Phase 8 — Cognitive load-optimized information hierarchy
export { GlanceView, type GlanceViewProps } from './GlanceView';
export { ScanView, type ScanViewProps } from './ScanView';
export { DeepDiveView, type DeepDiveViewProps } from './DeepDiveView';
export { CopyableDocumentation, type CopyableDocumentationProps } from './CopyableDocumentation';
export { MiniWaterfallChart, type MiniWaterfallChartProps } from './MiniWaterfallChart';
export {
  InformationHierarchy,
  type InformationHierarchyProps,
  type HierarchyLayer,
  type HierarchyAnalyticsEvent,
} from './InformationHierarchy';
export { ProgressiveContainer, type ProgressiveContainerProps } from './ProgressiveContainer';
