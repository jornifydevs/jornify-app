import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { DocumentRepository } from "@/core/domain/ports/repositories/document.repository";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import { NotFoundError } from "@/core/domain/errors/domain-errors";

export class FullDeleteWorkerUseCase {
  constructor(
    private workerRepo: WorkerRepository,
    private documentRepo: DocumentRepository,
    private workdayRepo: WorkdayRepository,
    private timeRecordRepo: TimeRecordRepository,
    private userRepo: UserRepository
  ) {}

  /**
   * Fully deletes a worker and all associated data:
   * storage files (Avatars + Nominas), document rows, time_record rows,
   * workday rows, the worker row, and the custom users row.
   *
   * Returns the auth userId so the caller can delete the auth.users entry
   * using a service-role client (not possible from domain layer).
   */
  async execute(workerId: string): Promise<string> {
    const worker = await this.workerRepo.findById(workerId);
    if (!worker) {
      throw new NotFoundError("Trabajador");
    }

    // 1. Delete storage files + document rows
    await this.documentRepo.deleteAllByWorkerId(workerId);

    // 2. Collect workday IDs to delete their time records
    const workdayIds = await this.workdayRepo.findIdsByWorkerId(workerId);

    // 3. Delete time_record rows (explicit — do not rely on DB cascade)
    await this.timeRecordRepo.deleteAllByWorkdayIds(workdayIds);

    // 4. Delete workday rows
    await this.workdayRepo.deleteAllByWorkerId(workerId);

    // 5. Delete worker row
    await this.workerRepo.delete(workerId);

    // 6. Delete custom users row
    await this.userRepo.delete(worker.userId);

    return worker.userId;
  }
}
