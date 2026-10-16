"use client";

import Image from "next/image";
import { useRef } from "react";
import { User, Lock, Loader2, Check, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
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
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
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
                  className="relative group cursor-pointer"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`${initialName} ${initialLastName}`}
                      width={96}
                      height={96}
                      className="rounded-full object-cover border-2 border-slate-600 group-hover:border-blue-500 transition-colors"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center border-2 border-slate-600 group-hover:border-blue-500 transition-colors">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="bg-slate-200 text-slate-700 border-slate-300 hover:bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-transparent dark:hover:text-slate-300"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("uploading")}
                    </>
                  ) : (
                    t("changeAvatar")
                  )}
                </Button>
                {avatarError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full text-center">
                    {avatarError}
                  </div>
                )}
                {avatarSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center justify-center gap-2 w-full">
                    <Check className="w-4 h-4" />
                    {t("avatarUpdated")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <User className="w-5 h-5" />
                {t("personalData")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      {t("name")}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      placeholder={t("namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      {t("lastName")}
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      placeholder={t("lastNamePlaceholder")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={initialEmail}
                    disabled
                    className="bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed dark:bg-slate-700/50 dark:border-slate-600"
                  />
                  <p className="text-xs text-slate-500">{t("emailReadOnly")}</p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                    placeholder={t("phonePlaceholder")}
                  />
                </div>

                {profileError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t("profileUpdated")}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Lock className="w-5 h-5" />
                {t("changePassword")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("currentPassword")}
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                    placeholder={t("currentPasswordPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="newPassword"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("newPassword")}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                    placeholder={t("newPasswordPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                    placeholder={t("confirmPasswordPlaceholder")}
                  />
                </div>

                {passwordError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t("passwordUpdated")}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    isUpdatingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
