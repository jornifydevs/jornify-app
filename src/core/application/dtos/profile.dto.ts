export interface UpdateProfileDTO {
  name?: string;
  lastName?: string;
  phone?: string;
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
