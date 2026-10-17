import type { AuthenticatedUser } from "@/types/api";

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
}

export interface LoginResponse {
  tokenType: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface RefreshResponse {
  tokenType: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface AuthSessionDevice {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  current: boolean;
}

export interface PasswordValidationResponse {
  valid: boolean;
  rules: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialCharacter: boolean;
  };
}

export interface AuthSession {
  user: AuthenticatedUser;
  rememberMe?: boolean;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  status: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}
