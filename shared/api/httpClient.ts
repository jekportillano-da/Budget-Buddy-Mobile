/**
 * Shared HTTP Client
 * Provides typed fetch wrapper with timeout, JSON parsing, error normalization,
 * and integrated telemetry/error handling
 */

import { ErrorMappers, TelemetryPatterns } from '../lib';

// Keep legacy AppHttpError for backwards compatibility
export class AppHttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AppHttpError';
  }
}

interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

class HttpClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';
    this.timeout = config.timeout || 10000; // 10 seconds default
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  private async fetchWithTimeout(url: string, options: RequestOptions = {}): Promise<Response> {
    const { timeout = this.timeout, ...fetchOptions } = options;
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...this.defaultHeaders,
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);
      
      // Log API call telemetry
      const duration = Date.now() - startTime;
      TelemetryPatterns.apiCall(
        url,
        fetchOptions.method || 'GET',
        duration,
        response.status,
        { timeout }
      );

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if ((error as Error).name === 'AbortError') {
        const timeoutError = ErrorMappers.fromHttpResponse({ status: 408, statusText: 'Request Timeout' });
        TelemetryPatterns.apiCall(url, fetchOptions.method || 'GET', duration, 408, { 
          timeout, 
          error: 'timeout' 
        });
        throw timeoutError;
      }
      
      // Map other network errors
      const networkError = ErrorMappers.fromJavaScriptError(error as Error);
      TelemetryPatterns.apiCall(url, fetchOptions.method || 'GET', duration, undefined, { 
        error: (error as Error).message 
      });
      throw networkError;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: unknown;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (error) {
      const parseError = ErrorMappers.fromJavaScriptError(error as Error);
      throw parseError;
    }

    if (!response.ok) {
      // Use our new error mapping system
      const httpError = ErrorMappers.fromHttpResponse(response, data);
      throw httpError;
    }

    return data as T;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'GET',
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'DELETE',
    });
    return this.handleResponse<T>(response);
  }

  setAuthHeader(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthHeader(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// Default export for general use
export const httpClient = new HttpClient();

// Named export for custom instances
export { HttpClient };