export type ContributionKind = 'TASK_CONFIRMED' | 'ACTIVITY_CHECK_IN' | 'WORK_PUBLISHED';

export interface ContributionEvent {
  eventId: string;
  kind: ContributionKind;
}

const points: Record<ContributionKind, number> = {
  TASK_CONFIRMED: 5,
  ACTIVITY_CHECK_IN: 3,
  WORK_PUBLISHED: 10,
};

export function calculateContribution(events: ContributionEvent[]): { points: number; eventCount: number } {
  const unique = new Map(events.map((event) => [`${event.kind}:${event.eventId}`, event]));
  return {
    points: [...unique.values()].reduce((sum, event) => sum + points[event.kind], 0),
    eventCount: unique.size,
  };
}

