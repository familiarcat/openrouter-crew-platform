import { CrewAPIError, AuthenticationError, AuthorizationError, NotFoundError, RateLimitError, NetworkError } from './errors';
/**
 * Unified CrewAPIClient
 * Single source of truth for all surfaces (CLI, Web, VSCode, n8n)
 */
export class CrewAPIClient {
    config;
    constructor(config) {
        this.config = {
            timeout: 30000,
            ...config,
            baseUrl: config.baseUrl.replace(/\/$/, '') // Remove trailing slash
        };
    }
    // --- MEMORY OPERATIONS ---
    async create_memory(params, options) {
        return this.request('/memories', { method: 'POST', body: JSON.stringify(params), ...options });
    }
    async retrieve_memories(params, options) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/memories?${query}`, { method: 'GET', ...options });
    }
    async update_memory(params, options) {
        const { id, ...body } = params;
        return this.request(`/memories/${id}`, { method: 'PATCH', body: JSON.stringify(body), ...options });
    }
    async delete_memory(params, options) {
        return this.request(`/memories/${params.id}`, { method: 'DELETE', body: JSON.stringify({ soft: params.soft }), ...options });
    }
    async restore_memory(params, options) {
        return this.request(`/memories/${params.id}/restore`, { method: 'POST', ...options });
    }
    // --- CREW OPERATIONS ---
    async create_crew(params, options) {
        return this.request('/crews', { method: 'POST', body: JSON.stringify(params), ...options });
    }
    async execute_crew(params, options) {
        const { crew_id, ...body } = params;
        return this.request(`/crews/${crew_id}/execute`, { method: 'POST', body: JSON.stringify(body), ...options });
    }
    async list_crews(params, options) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/crews?${query}`, { method: 'GET', ...options });
    }
    async get_crew_status(params, options) {
        return this.request(`/crews/${params.crew_id}/status`, { method: 'GET', ...options });
    }
    // --- QUERY OPERATIONS ---
    async search_memories(params, options) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/search/memories?${query}`, { method: 'GET', ...options });
    }
    // --- ADMIN OPERATIONS ---
    async export_crew_data(params, options) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/export?${query}`, { method: 'GET', ...options });
    }
    async prune_expired_memories(params, options) {
        return this.request('/admin/prune', { method: 'POST', body: JSON.stringify(params), ...options });
    }
    /**
     * Internal request handler with standardized error handling
     */
    async request(endpoint, options = {}) {
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
                return {};
            }
            return await response.json();
        }
        catch (error) {
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
    async handleError(response) {
        let errorData;
        try {
            errorData = await response.json();
        }
        catch {
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
                throw new CrewAPIError(message, response.status, errorData.code || 'UNKNOWN_ERROR', errorData);
        }
    }
}
//# sourceMappingURL=CrewAPIClient.js.map