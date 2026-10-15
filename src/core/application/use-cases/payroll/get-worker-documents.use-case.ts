import type { Document } from "@/core/domain/entities";
import type { DocumentRepository } from "@/core/domain/ports/repositories/document.repository";

export class GetWorkerDocumentsUseCase {
  constructor(private documentRepo: DocumentRepository) {}

  async execute(workerId: string): Promise<Document[]> {
    return this.documentRepo.findByWorkerId(workerId);
  }
}
