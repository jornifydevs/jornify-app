import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClockOutUseCase } from "@/core/application/use-cases/time-tracking/clock-out.use-case";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import { ClockError } from "@/core/domain/errors/domain-errors";
import type { TimeRecord } from "@/core/domain/entities";

describe("ClockOutUseCase", () => {
  let timeRecordRepo: TimeRecordRepository;
  let useCase: ClockOutUseCase;

  beforeEach(() => {
    timeRecordRepo = {
      findActiveByWorkdayId: vi.fn(),
      findCompletedByWorkdayIds: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    useCase = new ClockOutUseCase(timeRecordRepo);
  });

  it("calculates total_hour correctly and updates the record", async () => {
    const startHour = new Date(Date.now() - 3661000).toISOString(); // 1h 1m 1s ago

    const updatedRecord: TimeRecord = {
      id: "record-1",
      workdayId: "workday-1",
      startHour,
      endHour: new Date().toISOString(),
      totalHour: "01:01:01",
    };

    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    const result = await useCase.execute("record-1", startHour);

    expect(timeRecordRepo.update).toHaveBeenCalledWith(
      "record-1",
      expect.objectContaining({
        endHour: expect.any(String),
        totalHour: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
      })
    );
    expect(result.id).toBe("record-1");
  });

  it("produces correctly formatted total hour for short sessions", async () => {
    const startHour = new Date(Date.now() - 65000).toISOString(); // 1m 5s ago

    const updatedRecord: TimeRecord = {
      id: "record-2",
      workdayId: "workday-1",
      startHour,
      endHour: new Date().toISOString(),
      totalHour: "00:01:05",
    };

    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    await useCase.execute("record-2", startHour);

    const updateCall = vi.mocked(timeRecordRepo.update).mock.calls[0];
    const totalHour = (updateCall[1] as Partial<TimeRecord>).totalHour!;

    expect(totalHour).toMatch(/^00:01:\d{2}$/);
  });

  it("throws ClockError when start hour is in the future", async () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();

    await expect(useCase.execute("record-1", futureDate)).rejects.toThrow(
      ClockError
    );
  });

  it("subtracts completed break time from total hours", async () => {
    const startHour = new Date(Date.now() - 7200000).toISOString(); // 2h ago
    const breakTotalHour = "00:30:00";

    const updatedRecord: TimeRecord = {
      id: "record-3",
      workdayId: "workday-1",
      startHour,
      endHour: new Date().toISOString(),
      totalHour: "01:30:00",
      breakTotalHour,
    };

    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    await useCase.execute("record-3", startHour, undefined, breakTotalHour);

    const updateCall = vi.mocked(timeRecordRepo.update).mock.calls[0];
    const totalHour = (updateCall[1] as Partial<TimeRecord>).totalHour!;

    // Should be approximately 1h30m (2h gross - 30m break)
    expect(totalHour).toMatch(/^01:3\d:\d{2}$/);
  });

  it("auto-ends active break and subtracts break time on clock out", async () => {
    const startHour = new Date(Date.now() - 7200000).toISOString(); // 2h ago
    const breakStartHour = new Date(Date.now() - 1800000).toISOString(); // 30m ago

    const updatedRecord: TimeRecord = {
      id: "record-4",
      workdayId: "workday-1",
      startHour,
      endHour: new Date().toISOString(),
      totalHour: "01:30:00",
      breakStartHour,
      breakEndHour: new Date().toISOString(),
      breakTotalHour: "00:30:00",
    };

    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    await useCase.execute("record-4", startHour, breakStartHour);

    const updateCall = vi.mocked(timeRecordRepo.update).mock.calls[0];
    const updateData = updateCall[1] as Partial<TimeRecord>;

    expect(updateData.breakEndHour).toBeDefined();
    expect(updateData.breakTotalHour).toMatch(/^00:3\d:\d{2}$/);
    expect(updateData.totalHour).toMatch(/^01:3\d:\d{2}$/);
  });

  it("works correctly with no break (backwards compatible)", async () => {
    const startHour = new Date(Date.now() - 3600000).toISOString(); // 1h ago

    const updatedRecord: TimeRecord = {
      id: "record-5",
      workdayId: "workday-1",
      startHour,
      endHour: new Date().toISOString(),
      totalHour: "01:00:00",
    };

    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    await useCase.execute("record-5", startHour);

    const updateCall = vi.mocked(timeRecordRepo.update).mock.calls[0];
    const updateData = updateCall[1] as Partial<TimeRecord>;

    expect(updateData.breakEndHour).toBeUndefined();
    expect(updateData.breakTotalHour).toBeUndefined();
    expect(updateData.totalHour).toMatch(/^01:00:\d{2}$/);
  });
});
