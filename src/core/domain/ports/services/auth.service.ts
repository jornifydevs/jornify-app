export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthService {
  getUser(): Promise<AuthUser | null>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
