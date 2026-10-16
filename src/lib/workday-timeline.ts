export type WorkdayTimelineSegmentKind = "work" | "break";

export interface WorkdayTimelineSegment {
  kind: WorkdayTimelineSegmentKind;
  /** Percentage from the start of the scheduled shift. */
  start: number;
  /** Percentage of the scheduled shift covered by the segment. */
  width: number;
}

export interface WorkdayTimeline {
  segments: WorkdayTimelineSegment[];
  /** Percentage where "now" falls, or null when outside the shift. */
  now: number | null;
}

interface WorkdayTimelineInput {
  /** Scheduled shift start as "HH:MM" or "HH:MM:SS". */
  scheduleStart: string;
  /** Scheduled shift end as "HH:MM" or "HH:MM:SS". */
  scheduleEnd: string;
  /** ISO timestamps of the active time record. */
  clockIn?: string;
  breakStart?: string;
  breakEnd?: string;
  now: Date;
}

const roundPercent = (value: number) => Math.round(value * 100) / 100;

function timeOnDay(day: Date, time: string, dayOffset = 0): number {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate() + dayOffset,
    hours,
    minutes
  ).getTime();
}

function scheduledWindow(start: string, end: string, now: Date) {
  let from = timeOnDay(now, start);
  let to = timeOnDay(now, end);

  if (to <= from) {
    // Overnight shift: anchor it to the night it belongs to.
    if (now.getTime() < to) {
      from = timeOnDay(now, start, -1);
    } else {
      to = timeOnDay(now, end, 1);
    }
  }

  return { from, to };
}

export function buildWorkdayTimeline({
  scheduleStart,
  scheduleEnd,
  clockIn,
  breakStart,
  breakEnd,
  now,
}: WorkdayTimelineInput): WorkdayTimeline {
  const { from, to } = scheduledWindow(scheduleStart, scheduleEnd, now);
  const nowTime = now.getTime();
  const percent = (time: number) =>
    ((Math.min(Math.max(time, from), to) - from) / (to - from)) * 100;

  const intervals: [WorkdayTimelineSegmentKind, number, number][] = [];
  if (clockIn) {
    const clockInTime = new Date(clockIn).getTime();
    if (breakStart) {
      const breakStartTime = new Date(breakStart).getTime();
      const breakEndTime = breakEnd ? new Date(breakEnd).getTime() : nowTime;
      intervals.push(
        ["work", clockInTime, breakStartTime],
        ["break", breakStartTime, breakEndTime]
      );
      if (breakEnd) intervals.push(["work", breakEndTime, nowTime]);
    } else {
      intervals.push(["work", clockInTime, nowTime]);
    }
  }

  const segments = intervals
    .map(([kind, startTime, endTime]) => {
      const start = percent(startTime);
      return {
        kind,
        start: roundPercent(start),
        width: roundPercent(percent(endTime) - start),
      };
    })
    .filter((segment) => segment.width > 0);

  return {
    segments,
    now:
      nowTime >= from && nowTime <= to ? roundPercent(percent(nowTime)) : null,
  };
}
