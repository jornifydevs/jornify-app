export const CENTER_FEATURES = {
  PROFILE: "profile",
  PAYROLL: "payroll",
  VACATION: "vacation",
  CALENDAR: "calendar",
  BREAK: "break",
  SCHEDULE: "schedule",
} as const;

export type CenterFeature =
  (typeof CENTER_FEATURES)[keyof typeof CENTER_FEATURES];

export const ALL_CENTER_FEATURES: CenterFeature[] = [
  CENTER_FEATURES.PROFILE,
  CENTER_FEATURES.PAYROLL,
  CENTER_FEATURES.VACATION,
  CENTER_FEATURES.CALENDAR,
  CENTER_FEATURES.BREAK,
  CENTER_FEATURES.SCHEDULE,
];
