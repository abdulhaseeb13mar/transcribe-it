import { User as PrismaUser } from "@prisma/client";
import { z } from "zod";

// Environment variables interface
export interface EnvironmentVariables {
  NODE_ENV: "development" | "production" | "test";
  PORT: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  DATABASE_URL: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
}

// Export Prisma types with modifications
export type User = PrismaUser;

// Create user input type
export type CreateUserInput = {
  email: string;
  name: string;
  role: PrismaUser["role"];
  organizationId?: string | null;
};
export type UpdateUserInput = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt">
>;

// Re-export Zod schema types (these are now the primary types)
export type {
  RegisterInput,
  RegisterOrgInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  CreateSuperAdminInput,
} from "../schemas";

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationInfo;
}
