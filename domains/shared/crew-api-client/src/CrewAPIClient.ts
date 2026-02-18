import {
  ClientConfig, RequestOptions,
  CreateMemoryParams, CreateMemoryResponse,
  RetrieveMemoriesParams, RetrieveMemoriesResponse,
  UpdateMemoryParams, UpdateMemoryResponse,
  DeleteMemoryParams, DeleteMemoryResponse,
  RestoreMemoryParams, RestoreMemoryResponse,
  CreateCrewParams, CreateCrewResponse,
  ExecuteCrewParams, ExecuteCrewResponse,
  ListCrewsParams, ListCrewsResponse,
  GetCrewStatusParams, GetCrewStatusResponse,
  SearchMemoriesParams, SearchMemoriesResponse,
  ExportCrewDataParams, ExportCrewDataResponse,
  PruneExpiredMemoriesParams, PruneExpiredMemiesResponse,
} from './types';
import {
  CrewAPIError, AuthenticationError, AuthorizationError,
  NotFoundError, RateLimitError, NetworkError
} from './errors';

/**
 * Unified CrewAPIClient
 * Single source of truth for all surfaces (CLI, Web, VSCode, n8n)
 */
export class CrewAPIClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    };
  }

  // --- MEMORY OPERATIONS ---

  async create_memory(params: CreateMemoryParams, options?: RequestOptions): Promise<CreateMemoryResponse> {
    return this.request<CreateMemoryResponse>('/memories', { method: 'POST', body: JSON.stringify(params), ...options });
  }

  async retrieve_memories(params: RetrieveMemoriesParams, options?: RequestOptions): Promise<RetrieveMemoriesResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<RetrieveMemoriesResponse>(`/memories?${query}`, { method: 'GET', ...options });
  }

  async update_memory(params: UpdateMemoryParams, options?: RequestOptions): Promise<UpdateMemoryResponse> {
    const { id, ...body } = params;
    return this.request<UpdateMemoryResponse>(`/memories/${id}`, { method: 'PATCH', body: JSON.stringify(body), ...options });
  }

  async delete_memory(params: DeleteMemoryParams, options?: RequestOptions): Promise<DeleteMemoryResponse> {
    return this.request<DeleteMemoryResponse>(`/memories/${params.id}`, { method: 'DELETE', body: JSON.stringify({ soft: params.soft }), ...options });
  }

  async restore_memory(params: RestoreMemoryParams, options?: RequestOptions): Promise<RestoreMemoryResponse> {
    return this.request<RestoreMemoryResponse>(`/memories/${params.id}/restore`, { method: 'POST', ...options });
  }

  // --- CREW OPERATIONS ---

  async create_crew(params: CreateCrewParams, options?: RequestOptions): Promise<CreateCrewResponse> {
    return this.request<CreateCrewResponse>('/crews', { method: 'POST', body: JSON.stringify(params), ...options });
  }

  async execute_crew(params: ExecuteCrewParams, options?: RequestOptions): Promise<ExecuteCrewResponse> {
    const { crew_id, ...body } = params;
    return this.request<ExecuteCrewResponse>(`/crews/${crew_id}/execute`, { method: 'POST', body: JSON.stringify(body), ...options });
  }

  async list_crews(params: ListCrewsParams, options?: RequestOptions): Promise<ListCrewsResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ListCrewsResponse>(`/crews?${query}`, { method: 'GET', ...options });
  }

  async get_crew_status(params: GetCrewStatusParams, options?: RequestOptions): Promise<GetCrewStatusResponse> {
    return this.request<GetCrewStatusResponse>(`/crews/${params.crew_id}/status`, { method: 'GET', ...options });
  }

  // --- QUERY OPERATIONS ---

  async search_memories(params: SearchMemoriesParams, options?: RequestOptions): Promise<SearchMemoriesResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<SearchMemoriesResponse>(`/search/memories?${query}`, { method: 'GET', ...options });
  }

  // --- ADMIN OPERATIONS ---

  async export_crew_data(params: ExportCrewDataParams, options?: RequestOptions): Promise<ExportCrewDataResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ExportCrewDataResponse>(`/admin/export?${query}`, { method: 'GET', ...options });
  }

  async prune_expired_memories(params: PruneExpiredMemoriesParams, options?: RequestOptions): Promise<PruneExpiredMemiesResponse> {
    return this.request<PruneExpiredMemiesResponse>('/admin/prune', { method: 'POST', body: JSON.stringify(params), ...options });
  }

  /**
   * Internal request handler with standardized error handling
   */
  private async request<T>(endpoint: string, options: RequestInit & RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
      ...(this.config.projectId ? { 'X-Project-ID': this.config.projectId } : {}),
      ...this.config.headers,
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      if (response.status === 204) { // No Content
        return {} as T;
      }

      return await response.json() as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof CrewAPIError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new NetworkError('Request timed out', error);
      }

      throw new NetworkError(error.message || 'Network request failed', error);
    }
  }

  /**
   * Map HTTP errors to typed CrewAPI errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message = errorData.message || response.statusText;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message, errorData);
      case 403:
        throw new AuthorizationError(message, errorData);
      case 404:
        throw new NotFoundError('Resource', undefined);
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(message, retryAfter ? parseInt(retryAfter, 10) : undefined);
      default:
        throw new CrewAPIError(
          message,
          response.status,
          errorData.code || 'UNKNOWN_ERROR',
          errorData
        );
    }
  }
}