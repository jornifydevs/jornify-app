"use client";

import { useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseDocumentRepository } from "@/infrastructure/supabase/repositories/supabase-document.repository";
import { UpdateProfileUseCase } from "@/core/application/use-cases/profile/update-profile.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UseProfileProps {
  userId: string;
  workerId?: string;
  userEmail: string;
  initialName: string;
  initialLastName: string;
  initialPhone: string;
  initialAvatarUrl?: string;
}

export function useProfile({
  userId,
  workerId,
  userEmail,
  initialName,
  initialLastName,
  initialPhone,
  initialAvatarUrl,
}: UseProfileProps) {
  const [name, setName] = useState(initialName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(initialPhone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    initialAvatarUrl
  );

  const updateProfile = async () => {
    setProfileError(null);
    setProfileSuccess(false);
    setIsUpdatingProfile(true);

    try {
      const supabase = createClient();
      const userRepo = new SupabaseUserRepository(supabase);
      const updateProfileUseCase = new UpdateProfileUseCase(userRepo);

      await updateProfileUseCase.execute(userId, {
        name,
        lastName,
        phone,
      });

      setProfileSuccess(true);
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : "Error al actualizar el perfil";
      setProfileError(message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updatePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Debes introducir tu contraseña actual");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const supabase = createClient();

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta");
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error al actualizar la contraseña";
      setPasswordError(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!workerId) return;

    setAvatarError(null);
    setAvatarSuccess(false);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Solo se permiten imágenes JPG, PNG o WebP");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${workerId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("Avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const documentRepo = new SupabaseDocumentRepository(supabase);
      await documentRepo.upsertAvatar(workerId, filePath);

      const newUrl = await documentRepo.findAvatarUrlByWorkerId(workerId);
      setAvatarUrl(newUrl ? `${newUrl}?t=${Date.now()}` : undefined);
      setAvatarSuccess(true);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error al subir la imagen";
      setAvatarError(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return {
    name,
    setName,
    lastName,
    setLastName,
    phone,
    setPhone,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isUpdatingProfile,
    isUpdatingPassword,
    isUploadingAvatar,
    profileError,
    passwordError,
    avatarError,
    profileSuccess,
    passwordSuccess,
    avatarSuccess,
    avatarUrl,
    updateProfile,
    updatePassword,
    uploadAvatar,
  };
}
