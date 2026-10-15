import { describe, it, expect, vi, beforeEach } from "vitest";
import { EndBreakUseCase } from "@/core/application/use-cases/time-tracking/end-break.use-case";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import { ClockError } from "@/core/domain/errors/domain-errors";
import type { TimeRecord } from "@/core/domain/entities";

describe("EndBreakUseCase", () => {
  let timeRecordRepo: TimeRecordRepository;
  let useCase: EndBreakUseCase;

  beforeEach(() => {
    timeRecordRepo = {
      findActiveByWorkdayId: vi.fn(),
      findCompletedByWorkdayIds: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    useCase = new EndBreakUseCase(timeRecordRepo);
  });

  it("calculates break duration correctly and updates record", async () => {
    const breakStartHour = new Date(Date.now() - 1800000).toISOString(); // 30m ago

    const updatedRecord: TimeRecord = {
      id: "record-1",
      workdayId: "workday-1",
      startHour: new Date(Date.now() - 7200000).toISOString(),
      breakStartHour,
      breakEndHour: new Date().toISOString(),
      breakTotalHour: "00:30:00",
    };

    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    const result = await useCase.execute("record-1", breakStartHour);

    expect(timeRecordRepo.update).toHaveBeenCalledWith(
      "record-1",
      expect.objectContaining({
        breakEndHour: expect.any(String),
        breakTotalHour: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
      })
    );
    expect(result.breakEndHour).toBeDefined();
    expect(result.breakTotalHour).toBeDefined();
  });

  it("produces correctly formatted breakTotalHour", async () => {
    const breakStartHour = new Date(Date.now() - 3661000).toISOString(); // 1h 1m 1s ago

    const updatedRecord: TimeRecord = {
      id: "record-2",
      workdayId: "workday-1",
      startHour: new Date(Date.now() - 7200000).toISOString(),
      breakStartHour,
      breakEndHour: new Date().toISOString(),
      breakTotalHour: "01:01:01",
    };

    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    await useCase.execute("record-2", breakStartHour);

    const updateCall = vi.mocked(timeRecordRepo.update).mock.calls[0];
    const breakTotal = (updateCall[1] as Partial<TimeRecord>).breakTotalHour!;

    // Should be approximately "01:01:XX" format
    expect(breakTotal).toMatch(/^01:01:\d{2}$/);
  });

  it("throws ClockError when breakStartHour is in the future", async () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();

    await expect(useCase.execute("record-1", futureDate)).rejects.toThrow(
      ClockError
    );
  });
});
