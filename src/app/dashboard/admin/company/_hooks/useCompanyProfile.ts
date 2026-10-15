"use client";

import { useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { UpdateCompanyInfoUseCase } from "@/core/application/use-cases/admin/update-company-info.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UseCompanyProfileProps {
  companyId: string;
  initialName: string;
  initialBusinessName: string;
  initialAddress: string;
  initialEmail: string;
  initialNationality: string;
  initialLogoUrl?: string;
}

export function useCompanyProfile({
  companyId,
  initialName,
  initialBusinessName,
  initialAddress,
  initialEmail,
  initialNationality,
  initialLogoUrl,
}: UseCompanyProfileProps) {
  const [name, setName] = useState(initialName);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [address, setAddress] = useState(initialAddress);
  const [email, setEmail] = useState(initialEmail);
  const [nationality, setNationality] = useState(initialNationality);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialLogoUrl);

  const saveInfo = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const supabase = createClient();
      const companyRepo = new SupabaseCompanyRepository(supabase);
      const useCase = new UpdateCompanyInfoUseCase(companyRepo);
      await useCase.execute(companyId, {
        name,
        businessName,
        address,
        email,
        nationality,
      });
      setSaveSuccess(true);
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : "Error al guardar los datos";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setLogoError(null);
    setLogoSuccess(false);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLogoError("Solo se permiten imágenes JPG, PNG o WebP");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `company-${companyId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("Avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const companyRepo = new SupabaseCompanyRepository(supabase);
      const useCase = new UpdateCompanyInfoUseCase(companyRepo);
      await useCase.execute(companyId, { logo: filePath });

      const { data: urlData } = supabase.storage
        .from("Avatars")
        .getPublicUrl(filePath);
      setLogoUrl(`${urlData.publicUrl}?t=${Date.now()}`);
      setLogoSuccess(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al subir el logo";
      setLogoError(message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return {
    name,
    setName,
    businessName,
    setBusinessName,
    address,
    setAddress,
    email,
    setEmail,
    nationality,
    setNationality,
    isSaving,
    isUploadingLogo,
    saveError,
    logoError,
    saveSuccess,
    logoSuccess,
    logoUrl,
    saveInfo,
    uploadLogo,
  };
}
