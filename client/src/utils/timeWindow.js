// Utility to compute the time window for "today" according to the rules:
// - Start = start of the current course if one is ongoing now
// - Otherwise start = now minus 10 minutes
// - End = end of the last course of the day
// If no events for today, returns null.

export function isSameLocalDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function computeTodayWindow(events, now = new Date()) {
  if (!Array.isArray(events) || events.length === 0) return null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Keep only today's events
  const todays = events.filter((e) => isSameLocalDay(e.start, today));
  if (todays.length === 0) return null;

  // Find last end
  const lastEnd = new Date(
    Math.max.apply(
      null,
      todays.map((e) => new Date(e.end).getTime())
    )
  );

  // Find current event (if any)
  const current = todays.find((e) => new Date(e.start) <= now && new Date(e.end) >= now);

  const startWindow = current
    ? new Date(current.start)
    : new Date(now.getTime() - 10 * 60 * 1000);

  return { startWindow, endWindow: lastEnd };
}

// Generic helper: does an event overlap a window [start,end]?
export function eventOverlapsWindow(event, start, end) {
  const evStart = new Date(event.start);
  const evEnd = new Date(event.end);
  return evEnd >= start && evStart <= end;
}
