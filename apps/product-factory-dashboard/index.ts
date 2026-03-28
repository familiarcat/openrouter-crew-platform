/**
 * Base Gateway Agent
 * 
 * This agent serves as the primary entry point for external requests into a project's crew.
 * It implements the Recursive DDD pattern by providing a shared kernel that specific
 * projects (like dj-booking) can extend or configure.
 */

export interface GatewayRequest {
  path: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  requestId?: string;
}

export interface GatewayResponse {
  statusCode: number;
  body: any;
  headers?: Record<string, string>;
}

export class BaseGatewayAgent {
  protected name: string;

  constructor(name: string = 'SharedGateway') {
    this.name = name;
  }

  /**
   * Main entry point for processing requests.
   * Handles error catching and standard logging.
   */
  public async handleRequest(request: GatewayRequest): Promise<GatewayResponse> {
    console.log(`[${this.name}] 📨 Received request: ${request.method} ${request.path}`);
    
    try {
      return await this.process(request);
    } catch (error: any) {
      console.error(`[${this.name}] ❌ Error processing request:`, error);
      return {
        statusCode: 500,
        body: { error: error.message || 'Internal Server Error' }
      };
    }
  }

  /**
   * Core logic to be overridden by specific project implementations.
   */
  protected async process(request: GatewayRequest): Promise<GatewayResponse> {
    return {
      statusCode: 200,
      body: {
        message: "Hello from Base Gateway Agent (Shared)",
        timestamp: new Date().toISOString(),
        received: request
      }
    };
  }
}