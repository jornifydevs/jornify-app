import type { Document } from "../../entities";

export interface DocumentRepository {
  findByWorkerId(workerId: string): Promise<Document[]>;
  findAvatarUrlByWorkerId(workerId: string): Promise<string | undefined>;
  upsertAvatar(workerId: string, filePath: string): Promise<void>;
  deleteAllByWorkerId(workerId: string): Promise<void>;
}
