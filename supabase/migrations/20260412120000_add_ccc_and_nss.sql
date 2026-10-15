-- Migration: add_ccc_and_nss
-- Adds Código de Cuenta de Cotización (CCC) to company and
-- Número de Seguridad Social (NSS) to worker for the registro de jornada PDF
-- required by Spanish labor law (Real Decreto-ley 8/2019).

ALTER TABLE company
  ADD COLUMN IF NOT EXISTS codigo_cuenta_cotizacion TEXT;

ALTER TABLE worker
  ADD COLUMN IF NOT EXISTS nss TEXT;
