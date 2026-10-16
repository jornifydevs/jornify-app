"use client";

import Image from "next/image";
import { useRef } from "react";
import { User, Loader2, Check, Camera } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useProfile } from "../_hooks/useProfile";
import { useTranslations } from "next-intl";

interface ProfileViewProps {
  userId: string;
  workerId?: string;
  initialName: string;
  initialLastName: string;
  initialEmail: string;
  initialPhone: string;
  userImg?: string;
}

export default function ProfileView({
  userId,
  workerId,
  initialName,
  initialLastName,
  initialEmail,
  initialPhone,
  userImg,
}: ProfileViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("dashboard.profile");

  const {
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
  } = useProfile({
    userId,
    workerId,
    userEmail: initialEmail,
    initialName,
    initialLastName,
    initialPhone,
    initialAvatarUrl: userImg,
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePassword();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
    e.target.value = "";
  };

  return (
    <div>
      <div className="mx-auto max-w-2xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("title")} />
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  aria-label={t("changeAvatar")}
                  className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`${initialName} ${initialLastName}`}
                      width={96}
                      height={96}
                      className="size-24 rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-full bg-secondary text-muted-foreground ring-1 ring-border">
                      <User className="size-10" aria-hidden="true" />
                    </div>
                  )}
                  {/* Photo overlay: white on a dark scrim, readable over any picture */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none",
                      isUploadingAvatar && "opacity-100"
                    )}
                  >
                    {isUploadingAvatar ? (
                      <Loader2
                        className="size-6 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Camera className="size-6" aria-hidden="true" />
                    )}
                  </div>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("uploading")}
                    </>
                  ) : (
                    t("changeAvatar")
                  )}
                </Button>
                {avatarError && (
                  <Alert
                    variant="error"
                    className="w-full justify-center text-center"
                  >
                    {avatarError}
                  </Alert>
                )}
                {avatarSuccess && (
                  <Alert variant="success" className="w-full justify-center">
                    <Check />
                    {t("avatarUpdated")}
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("personalData")}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("name")}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("lastName")}</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("lastNamePlaceholder")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={initialEmail}
                    disabled
                    aria-describedby="email-hint"
                    className="bg-secondary text-muted-foreground disabled:opacity-100"
                  />
                  <p id="email-hint" className="text-sm text-muted-foreground">
                    {t("emailReadOnly")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                  />
                </div>

                {profileError && <Alert variant="error">{profileError}</Alert>}

                {profileSuccess && (
                  <Alert variant="success">
                    <Check />
                    {t("profileUpdated")}
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full sm:w-auto"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    t("saveChanges")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Form */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("changePassword")}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    {t("currentPassword")}
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("currentPasswordPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("newPassword")}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("newPasswordPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t("confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("confirmPasswordPlaceholder")}
                  />
                </div>

                {passwordError && (
                  <Alert variant="error">{passwordError}</Alert>
                )}

                {passwordSuccess && (
                  <Alert variant="success">
                    <Check />
                    {t("passwordUpdated")}
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={
                    isUpdatingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full sm:w-auto"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("updatingPassword")}
                    </>
                  ) : (
                    t("changePwdBtn")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
