import { describe, it, expect } from "vitest";
import { buildWorkdayTimeline } from "@/lib/workday-timeline";

const at = (day: number, hours: number, minutes: number) =>
  new Date(2026, 9, day, hours, minutes);
const iso = (day: number, hours: number, minutes: number) =>
  at(day, hours, minutes).toISOString();

describe("buildWorkdayTimeline", () => {
  const schedule = { scheduleStart: "09:00:00", scheduleEnd: "17:00:00" };

  it("returns no segments nor now marker before the shift starts", () => {
    expect(buildWorkdayTimeline({ ...schedule, now: at(16, 8, 57) })).toEqual({
      segments: [],
      now: null,
    });
  });

  it("places the now marker relative to the scheduled window", () => {
    expect(buildWorkdayTimeline({ ...schedule, now: at(16, 13, 0) }).now).toBe(
      50
    );
  });

  it("hides the now marker once the shift is over", () => {
    expect(
      buildWorkdayTimeline({ ...schedule, now: at(16, 18, 0) }).now
    ).toBeNull();
  });

  it("draws a work segment from clock-in to now", () => {
    const timeline = buildWorkdayTimeline({
      ...schedule,
      clockIn: iso(16, 9, 30),
      now: at(16, 13, 0),
    });

    expect(timeline.segments).toEqual([
      { kind: "work", start: 6.25, width: 43.75 },
    ]);
  });

  it("clamps an early clock-in to the start of the shift", () => {
    const timeline = buildWorkdayTimeline({
      ...schedule,
      clockIn: iso(16, 8, 58),
      now: at(16, 12, 40),
    });

    expect(timeline.segments).toEqual([
      { kind: "work", start: 0, width: 45.83 },
    ]);
  });

  it("splits the work around a finished break", () => {
    const timeline = buildWorkdayTimeline({
      ...schedule,
      clockIn: iso(16, 8, 58),
      breakStart: iso(16, 11, 30),
      breakEnd: iso(16, 11, 45),
      now: at(16, 12, 40),
    });

    expect(timeline.segments).toEqual([
      { kind: "work", start: 0, width: 31.25 },
      { kind: "break", start: 31.25, width: 3.13 },
      { kind: "work", start: 34.38, width: 11.46 },
    ]);
  });

  it("keeps the break open until now while on break", () => {
    const timeline = buildWorkdayTimeline({
      ...schedule,
      clockIn: iso(16, 9, 0),
      breakStart: iso(16, 12, 0),
      now: at(16, 12, 30),
    });

    expect(timeline.segments).toEqual([
      { kind: "work", start: 0, width: 37.5 },
      { kind: "break", start: 37.5, width: 6.25 },
    ]);
  });

  it("drops work that falls outside the scheduled window", () => {
    const timeline = buildWorkdayTimeline({
      ...schedule,
      clockIn: iso(16, 17, 30),
      now: at(16, 18, 0),
    });

    expect(timeline.segments).toEqual([]);
  });

  it("supports shifts that cross midnight", () => {
    const timeline = buildWorkdayTimeline({
      scheduleStart: "22:00:00",
      scheduleEnd: "06:00:00",
      clockIn: iso(16, 21, 55),
      now: at(17, 2, 0),
    });

    expect(timeline).toEqual({
      segments: [{ kind: "work", start: 0, width: 50 }],
      now: 50,
    });
  });
});
