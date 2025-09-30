/**
 * Shared API exports
 * Entry point for all shared API infrastructure
 */

// HTTP Client
export { httpClient, HttpClient, AppHttpError } from './httpClient';

// Auth schemas and types
export * from './schemas/auth';

// Auth client
export { authClient, AuthClient } from './clients/authClient';