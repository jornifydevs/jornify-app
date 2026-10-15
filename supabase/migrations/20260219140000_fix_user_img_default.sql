-- Migration: fix_user_img_default
-- The user_img column default was incorrectly storing the SQL expression
-- text literally (e.g. 'default.png'::character varying) as a string value
-- instead of evaluating it.
--
-- This migration:
--   1. Resets the column default to the plain string 'default.png'
--   2. Corrects any existing rows that have the bad literal value

-- Fix the column default expression
ALTER TABLE users
  ALTER COLUMN user_img SET DEFAULT 'default.png';

-- Update rows where the bad literal was stored as the actual field value
UPDATE users
SET user_img = 'default.png'
WHERE user_img = $fix$'default.png'::character varying$fix$;
