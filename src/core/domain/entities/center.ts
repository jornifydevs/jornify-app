import type { CenterFeature } from "./center-feature";

export type BreakType = "none" | "free" | "scheduled";

export interface Center {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  address: string;
  location?: string;
  nationality?: string;
  email?: string;
  totalWorker?: number;
  enabledFeatures: CenterFeature[];
  allowedDayTypes: string[];
  defaultStartWorkday: string;
  defaultEndWorkday: string;
  breakType: BreakType;
  defaultStartBreak?: string;
  defaultEndBreak?: string;
  createdAt?: string;
  updatedAt?: string;
}
