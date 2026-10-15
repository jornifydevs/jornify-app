import type { CenterFeature } from "./center-feature";
import { ALL_CENTER_FEATURES } from "./center-feature";

export type PlanId = "free";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number; // in cents; 0 = free
  enabledFeatures: CenterFeature[];
  allowedDayTypes: string[];
}

export const ALL_DAY_TYPES: string[] = [
  "normal",
  "holiday",
  "vacation",
  "sick_leave",
];

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratuito",
    description: "Acceso completo a todas las funcionalidades sin coste",
    priceMonthly: 0,
    enabledFeatures: ALL_CENTER_FEATURES,
    allowedDayTypes: ALL_DAY_TYPES,
  },
};

export const ALL_PLANS: Plan[] = Object.values(PLANS);
