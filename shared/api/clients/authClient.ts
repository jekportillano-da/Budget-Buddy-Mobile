/**
 * Auth API Client
 * Typed client for authentication endpoints using httpClient + Zod schemas
 */

import { httpClient } from '../httpClient';
import {
  TokenResponseSchema,
  TokenValidationResponseSchema,
  HealthResponseSchema,
  type LoginRequest,
  type RegisterRequest,
  type TokenResponse,
  type TokenValidationResponse,
  type HealthResponse,
} from '../schemas/auth';

export class AuthClient {
  constructor(private client = httpClient) {}

  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await this.client.post('/auth/login', credentials);
    return TokenResponseSchema.parse(response);
  }

  async register(userData: RegisterRequest): Promise<TokenResponse> {
    const response = await this.client.post('/auth/register', userData);
    return TokenResponseSchema.parse(response);
  }

  async validateToken(token: string): Promise<TokenValidationResponse> {
    // Set auth header for this request
    const originalHeaders = { ...this.client['defaultHeaders'] };
    this.client.setAuthHeader(token);
    
    try {
      const response = await this.client.get('/auth/validate');
      const validated = TokenValidationResponseSchema.parse(response);
      return validated;
    } finally {
      // Restore original headers
      this.client['defaultHeaders'] = originalHeaders;
    }
  }

  async health(): Promise<HealthResponse> {
    const response = await this.client.get('/health');
    return HealthResponseSchema.parse(response);
  }

  // Utility method to transform backend response to current service format
  transformToCurrentFormat(tokenResponse: TokenResponse): {
    user: {
      id: string;
      email: string;
      name: string;
      tier: string;
      createdAt: string;
      emailVerified: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    };
  } {
    return {
      user: {
        id: tokenResponse.user.id.toString(),
        email: tokenResponse.user.email,
        name: tokenResponse.user.full_name,
        tier: tokenResponse.user.tier,
        createdAt: tokenResponse.user.created_at,
        emailVerified: tokenResponse.user.email_verified,
      },
      tokens: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      },
    };
  }
}

// Default export for general use
export const authClient = new AuthClient();