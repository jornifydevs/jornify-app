export type DocumentType = "logo" | "document";

export interface Document {
  id: string;
  userId?: string;
  workerId?: string;
  name: string;
  timestamp?: string;
  document: string; // URL del documento
  documentType: DocumentType;
  createdAt?: string;
  updatedAt?: string;
}
