import axios, { AxiosInstance } from 'axios';

/**
 * MCP Client - Wrapper around the MCP server API
 * This is the gravitational center that coordinates with the distributed MCP infrastructure
 */
export class MCPClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.MCP_URL || 'http://localhost:3000/api/mcp';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Check your MCP credentials');
        }
        if (error.response?.status === 404) {
          throw new Error('Not found: MCP service unavailable');
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error(`Cannot connect to MCP server at ${this.baseURL}`);
        }
        throw error;
      }
    );
  }

  /**
   * Get crew roster with status and availability
   */
  async getCrewRoster(): Promise<any[]> {
    const response = await this.client.get('/crew/roster');
    return response.data;
  }

  /**
   * Consult a crew member for assistance
   */
  async consultCrew(
    member: string,
    task: string,
    options?: {
      async?: boolean;
      timeout?: number;
    }
  ): Promise<any> {
    const response = await this.client.post('/crew/consult', {
      member,
      task,
      async: options?.async ?? false,
      timeout: options?.timeout ?? 30000,
    });
    return response.data;
  }

  /**
   * Activate a crew member for a task
   */
  async activateCrew(member: string, options?: { duration?: number }): Promise<any> {
    const response = await this.client.post('/crew/activate', {
      member,
      duration: options?.duration ?? 1,
    });
    return response.data;
  }

  /**
   * Coordinate crew for multi-agent task
   */
  async coordinateCrew(
    task: string,
    options?: {
      members?: string[];
      async?: boolean;
    }
  ): Promise<any> {
    const response = await this.client.post('/crew/coordinate', {
      task,
      members: options?.members,
      async: options?.async ?? false,
    });
    return response.data;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<any[]> {
    const response = await this.client.get('/projects');
    return response.data;
  }

  /**
   * Create a feature
   */
  async createFeature(feature: {
    name: string;
    description?: string;
    budget?: number;
  }): Promise<any> {
    const response = await this.client.post('/projects/features', feature);
    return response.data;
  }

  /**
   * Create a story
   */
  async createStory(story: {
    name: string;
    featureId?: string;
    description?: string;
    acceptanceCriteria?: string;
  }): Promise<any> {
    const response = await this.client.post('/projects/stories', story);
    return response.data;
  }

  /**
   * Create a sprint
   */
  async createSprint(sprint: {
    name: string;
    duration?: number;
    goal?: string;
  }): Promise<any> {
    const response = await this.client.post('/projects/sprints', sprint);
    return response.data;
  }

  /**
   * Get cost report for a period
   */
  async getCostReport(days: number = 30): Promise<any> {
    const response = await this.client.get('/costs/report', {
      params: { days },
    });
    return response.data;
  }

  /**
   * Get real-time cost metrics
   */
  async getCostMetrics(): Promise<any> {
    const response = await this.client.get('/costs/metrics');
    return response.data;
  }

  /**
   * Check MCP system status
   */
  async getStatus(): Promise<any> {
    const response = await this.client.get('/status');
    return response.data;
  }

  /**
   * Get full system diagnostics
   */
  async getDiagnostics(): Promise<any> {
    const response = await this.client.get('/status/admin');
    return response.data;
  }
}
