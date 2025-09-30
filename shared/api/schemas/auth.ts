/**
 * Auth API Schemas
 * Zod schemas for authentication-related API responses
 */

import { z } from 'zod';

// User schema matching the backend response
export const UserResponseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  full_name: z.string(),
  tier: z.string(),
  total_savings: z.number(),
  email_verified: z.boolean(),
  created_at: z.string(),
  last_login: z.string().nullable(),
});

// Token response schema matching the backend response
export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  user: UserResponseSchema,
});

// Login request schema
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register request schema
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
});

// Token validation response schema
export const TokenValidationResponseSchema = z.object({
  valid: z.boolean(),
  user: UserResponseSchema.optional(),
});

// Health check response schema
export const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string().optional(),
  version: z.string().optional(),
});

// Inferred types for TypeScript usage
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type TokenValidationResponse = z.infer<typeof TokenValidationResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;