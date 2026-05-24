/**
 * @file testing-framework.ts
 * @description In-browser usability test session tracking (anonymous, localStorage).
 */

import type { ClinicalScenario } from '@/lib/cds-platform/types';

export type ParticipantRole = 'attending' | 'resident' | 'fellow' | 'np' | 'pa';

export type ExpectedAction = 'proceed' | 'override' | 'cancel' | 'change_order';

export interface UsabilityTestScenario {
  id: string;
  name: string;
  taskDescription: string;
  maxTimeSeconds: number;
  expectedAction: ExpectedAction;
  scenario: ClinicalScenario;
}

export interface TestSessionConfig {
  participantId: string;
  participantRole: ParticipantRole;
  specialty: string;
  experienceYears: number;
  scenarios: UsabilityTestScenario[];
  testType: 'task_completion';
}

export interface UsabilityEvent {
  timestamp: number;
  type: string;
  target?: string;
  data?: Record<string, unknown>;
  scenarioId?: string;
}

interface TestSession {
  id: string;
  config: TestSessionConfig;
  events: UsabilityEvent[];
  scenarioStartTimes: Record<string, number>;
  completedTasks: Record<string, ExpectedAction | 'modify' | 'abandon'>;
  susResponses?: number[];
  customResponses?: number[];
}

export interface SessionMetrics {
  taskCompletionRate: number;
  meanTaskTime: number;
  errorRate: number;
  satisfactionScore?: number;
  informationAccessPattern: {
    glanceOnlyRate: number;
    scanRate: number;
    deepDiveRate: number;
  };
  alertResponsePattern: {
    acceptRate: number;
    overrideRate: number;
    modifyRate: number;
    cancelRate: number;
  };
}

export interface AggregateMetrics {
  sessionCount: number;
  meanTaskCompletionRate: number;
}

const STORAGE_KEY = 'arka-cds-usability-sessions';

/**
 * Client-side framework for recording usability test sessions.
 */
export class UsabilityTestingFramework {
  private sessions = new Map<string, TestSession>();

  /** Creates a new test session and persists it locally. */
  createSession(config: TestSessionConfig): { id: string } {
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const session: TestSession = {
      id,
      config,
      events: [],
      scenarioStartTimes: {},
      completedTasks: {},
    };
    this.sessions.set(id, session);
    this.persist();
    return { id };
  }

  /** Records a UI interaction event for the session. */
  recordEvent(sessionId: string, event: UsabilityEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.events.push(event);
    this.persist();
  }

  /** Marks the start time for a scenario. */
  startScenario(sessionId: string, scenarioId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.scenarioStartTimes[scenarioId] = Date.now();
    this.persist();
  }

  /** Records task completion for a scenario. */
  completeTask(
    sessionId: string,
    scenarioId: string,
    action: ExpectedAction | 'modify' | 'abandon'
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.completedTasks[scenarioId] = action;
    this.persist();
  }

  /** Stores SUS and custom survey responses. */
  setSurveyResponses(sessionId: string, sus: number[], custom: number[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.susResponses = sus;
    session.customResponses = custom;
    this.persist();
  }

  /** Computes per-session usability metrics. */
  computeSessionMetrics(sessionId: string): SessionMetrics {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return emptyMetrics();
    }

    const scenarioIds = session.config.scenarios.map((s) => s.id);
    const completed = scenarioIds.filter((id) => session.completedTasks[id] !== undefined);
    const taskCompletionRate = scenarioIds.length > 0 ? completed.length / scenarioIds.length : 0;

    const taskTimes = scenarioIds
      .map((id) => {
        const start = session.scenarioStartTimes[id];
        const endEvent = session.events.find(
          (e) => e.scenarioId === id && e.type === 'task_complete'
        );
        if (!start || !endEvent) return null;
        return (endEvent.timestamp - start) / 1000;
      })
      .filter((t): t is number => t !== null);

    const meanTaskTime =
      taskTimes.length > 0 ? taskTimes.reduce((a, b) => a + b, 0) / taskTimes.length : 0;

    const expectedMismatches = scenarioIds.filter((id) => {
      const scenario = session.config.scenarios.find((s) => s.id === id);
      const actual = session.completedTasks[id];
      return scenario && actual && actual !== scenario.expectedAction && actual !== 'modify';
    });
    const errorRate = scenarioIds.length > 0 ? expectedMismatches.length / scenarioIds.length : 0;

    const expandEvents = session.events.filter((e) => e.type === 'expand_section').length;
    const readEvents = session.events.filter((e) => e.type === 'read_detail').length;
    const totalLayerEvents = expandEvents + readEvents + 1;

    const sus = session.susResponses;
    const satisfactionScore =
      sus && sus.length === 10
        ? computeSusFromResponses(sus)
        : undefined;

    const actions = Object.values(session.completedTasks);
    const actionCount = actions.length || 1;

    return {
      taskCompletionRate,
      meanTaskTime,
      errorRate,
      satisfactionScore,
      informationAccessPattern: {
        glanceOnlyRate: readEvents === 0 && expandEvents === 0 ? 1 : 0,
        scanRate: expandEvents / totalLayerEvents,
        deepDiveRate: readEvents / totalLayerEvents,
      },
      alertResponsePattern: {
        acceptRate: actions.filter((a) => a === 'proceed').length / actionCount,
        overrideRate: actions.filter((a) => a === 'override').length / actionCount,
        modifyRate: actions.filter((a) => a === 'change_order' || a === 'modify').length / actionCount,
        cancelRate: actions.filter((a) => a === 'cancel' || a === 'abandon').length / actionCount,
      },
    };
  }

  /** Aggregates metrics across all stored sessions. */
  computeAggregateMetrics(): AggregateMetrics {
    const sessions = [...this.sessions.values()];
    if (sessions.length === 0) {
      return { sessionCount: 0, meanTaskCompletionRate: 0 };
    }
    const rates = sessions.map((s) => this.computeSessionMetrics(s.id).taskCompletionRate);
    return {
      sessionCount: sessions.length,
      meanTaskCompletionRate: rates.reduce((a, b) => a + b, 0) / rates.length,
    };
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = [...this.sessions.entries()];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }
}

function emptyMetrics(): SessionMetrics {
  return {
    taskCompletionRate: 0,
    meanTaskTime: 0,
    errorRate: 0,
    informationAccessPattern: { glanceOnlyRate: 0, scanRate: 0, deepDiveRate: 0 },
    alertResponsePattern: { acceptRate: 0, overrideRate: 0, modifyRate: 0, cancelRate: 0 },
  };
}

/** Standard SUS scoring from 1–5 Likert responses. */
function computeSusFromResponses(responses: number[]): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const v = responses[i] ?? 3;
    sum += i % 2 === 0 ? v - 1 : 5 - v;
  }
  return sum * 2.5;
}
