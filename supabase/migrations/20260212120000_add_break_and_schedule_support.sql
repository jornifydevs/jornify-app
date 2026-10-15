-- Migration: add_break_and_schedule_support
-- Adds center schedule configuration, workday break schedule snapshot,
-- and break tracking fields on time_record.

-- 1. Center: default schedule configuration
ALTER TABLE center
  ADD COLUMN default_start_workday text NOT NULL DEFAULT '09:00:00',
  ADD COLUMN default_end_workday   text NOT NULL DEFAULT '18:00:00',
  ADD COLUMN break_type            text NOT NULL DEFAULT 'none'
    CHECK (break_type IN ('none', 'free', 'scheduled')),
  ADD COLUMN default_start_break   text,
  ADD COLUMN default_end_break     text;

-- Constraint: scheduled break requires both start and end times
ALTER TABLE center
  ADD CONSTRAINT center_scheduled_break_check
    CHECK (
      break_type != 'scheduled'
      OR (default_start_break IS NOT NULL AND default_end_break IS NOT NULL)
    );

-- 2. Workday: snapshot of center schedule at clock-in time
ALTER TABLE workday
  ADD COLUMN break_type            text DEFAULT 'none',
  ADD COLUMN scheduled_start_break text,
  ADD COLUMN scheduled_end_break   text;

-- 3. TimeRecord: break tracking fields
ALTER TABLE time_record
  ADD COLUMN break_start_hour text,
  ADD COLUMN break_end_hour   text,
  ADD COLUMN break_total_hour text;
