/**
 * Auth Feature Module
 * Feature-sliced authentication with typed use cases
 */

// Use cases
export { LoginUseCase, loginUseCase } from './useCases/login';
export { RegisterUseCase, registerUseCase } from './useCases/register';
export type { LoginResult } from './useCases/login';

// Re-export types for convenience
export type { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  UserResponse 
} from '../../shared/api/schemas/auth';