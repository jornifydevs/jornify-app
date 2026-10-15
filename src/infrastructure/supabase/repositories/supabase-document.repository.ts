import type { SupabaseClient } from "@supabase/supabase-js";
import type { Document, DocumentType } from "@/core/domain/entities";
import type { DocumentRepository } from "@/core/domain/ports/repositories/document.repository";

interface DocumentRow {
  id: string;
  user_id: string | null;
  worker_id: string | null;
  name: string;
  timestamp: string | null;
  document: string;
  document_type: DocumentType;
  created_at: string | null;
  updated_at: string | null;
}

export class SupabaseDocumentRepository implements DocumentRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByWorkerId(workerId: string): Promise<Document[]> {
    const { data } = await this.supabase
      .from("document")
      .select("*")
      .eq("worker_id", workerId)
      .eq("document_type", "document")
      .order("timestamp", { ascending: false });

    if (!data) return [];

    return Promise.all(data.map((row: DocumentRow) => this.toDomainAsync(row)));
  }

  async findAvatarUrlByWorkerId(workerId: string): Promise<string | undefined> {
    const { data } = await this.supabase
      .from("document")
      .select("document")
      .eq("worker_id", workerId)
      .eq("document_type", "logo")
      .single();

    const filename = data?.document ?? "default.png";

    const { data: urlData } = this.supabase.storage
      .from("Avatars")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }

  async upsertAvatar(workerId: string, filePath: string): Promise<void> {
    const { data: existing } = await this.supabase
      .from("document")
      .select("id")
      .eq("worker_id", workerId)
      .eq("document_type", "logo")
      .single();

    if (existing) {
      await this.supabase
        .from("document")
        .update({
          document: filePath,
          timestamp: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await this.supabase.from("document").insert({
        worker_id: workerId,
        name: "logo",
        document: filePath,
        document_type: "logo" as DocumentType,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async deleteAllByWorkerId(workerId: string): Promise<void> {
    const { data } = await this.supabase
      .from("document")
      .select("document, document_type")
      .eq("worker_id", workerId);

    if (data && data.length > 0) {
      const avatarPaths = data
        .filter(
          (d: { document: string; document_type: string }) =>
            d.document_type === "logo"
        )
        .map((d: { document: string }) => d.document);
      if (avatarPaths.length > 0) {
        await this.supabase.storage.from("Avatars").remove(avatarPaths);
      }

      const nominasPaths = data
        .filter(
          (d: { document: string; document_type: string }) =>
            d.document_type === "document"
        )
        .map((d: { document: string }) => d.document);
      if (nominasPaths.length > 0) {
        await this.supabase.storage.from("Nominas").remove(nominasPaths);
      }

      await this.supabase.from("document").delete().eq("worker_id", workerId);
    }
  }

  private async toDomainAsync(row: DocumentRow): Promise<Document> {
    const signedUrl = await this.getSignedUrl(row.document);

    return {
      id: row.id,
      userId: row.user_id ?? undefined,
      workerId: row.worker_id ?? undefined,
      name: row.name,
      timestamp: row.timestamp ?? undefined,
      document: signedUrl,
      documentType: row.document_type,
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
    };
  }

  private async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from("Nominas")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      return filePath;
    }

    return data.signedUrl;
  }
}
