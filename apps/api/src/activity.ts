import type { ActivityStatus } from '@guild/contracts';

const nextStatus: Record<ActivityStatus, ActivityStatus | null> = {
  PREPARING: 'REGISTRATION',
  REGISTRATION: 'IN_PROGRESS',
  IN_PROGRESS: 'ENDED',
  ENDED: 'ARCHIVED',
  ARCHIVED: null,
};

export function canTransitionActivity(from: ActivityStatus, to: ActivityStatus): boolean {
  return nextStatus[from] === to;
}

