export interface SlaHours {
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

export const DEFAULT_SLA_HOURS: SlaHours = {
  urgent: 4,
  high: 24,
  medium: 72,
  low: 72,
};

export function getSlaTargetHours(priority: string, slaHours: SlaHours = DEFAULT_SLA_HOURS): number {
  switch (priority.toLowerCase()) {
    case "urgent":
      return slaHours.urgent;
    case "high":
      return slaHours.high;
    case "medium":
      return slaHours.medium;
    case "low":
    default:
      return slaHours.low;
  }
}

export function calculateSlaStatus(ticket: {
  createdAt: Date;
  status: string;
  priority: string;
  resolvedAt?: Date | null;
  heldDurationMs?: number | null;
  holdStartedAt?: Date | null;
}, slaHours: SlaHours = DEFAULT_SLA_HOURS) {
  const targetHours = getSlaTargetHours(ticket.priority, slaHours);
  const targetMs = targetHours * 60 * 60 * 1000;

  const now = new Date();
  const endTime = ticket.resolvedAt ? new Date(ticket.resolvedAt) : now;
  const totalElapsedMs = endTime.getTime() - new Date(ticket.createdAt).getTime();

  let heldMs = ticket.heldDurationMs || 0;
  if (ticket.status === "OnHold" && ticket.holdStartedAt) {
    heldMs += now.getTime() - new Date(ticket.holdStartedAt).getTime();
  }

  const effectiveElapsedMs = Math.max(0, totalElapsedMs - heldMs);
  const remainingMs = targetMs - effectiveElapsedMs;
  const isOverdue = remainingMs < 0;
  const progressPercent = Math.min(100, Math.round((effectiveElapsedMs / targetMs) * 100));

  return {
    targetHours,
    effectiveElapsedHours: +(effectiveElapsedMs / (60 * 60 * 1000)).toFixed(1),
    remainingHours: +(remainingMs / (60 * 60 * 1000)).toFixed(1),
    isOverdue,
    progressPercent,
  };
}
