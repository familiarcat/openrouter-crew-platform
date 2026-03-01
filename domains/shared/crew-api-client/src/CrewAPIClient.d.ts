import { ClientConfig, RequestOptions, CreateMemoryParams, CreateMemoryResponse, RetrieveMemoriesParams, RetrieveMemoriesResponse, UpdateMemoryParams, UpdateMemoryResponse, DeleteMemoryParams, DeleteMemoryResponse, RestoreMemoryParams, RestoreMemoryResponse, CreateCrewParams, CreateCrewResponse, ExecuteCrewParams, ExecuteCrewResponse, ListCrewsParams, ListCrewsResponse, GetCrewStatusParams, GetCrewStatusResponse, SearchMemoriesParams, SearchMemoriesResponse, ExportCrewDataParams, ExportCrewDataResponse, PruneExpiredMemoriesParams, PruneExpiredMemiesResponse } from './types';
/**
 * Unified CrewAPIClient
 * Single source of truth for all surfaces (CLI, Web, VSCode, n8n)
 */
export declare class CrewAPIClient {
    private config;
    constructor(config: ClientConfig);
    create_memory(params: CreateMemoryParams, options?: RequestOptions): Promise<CreateMemoryResponse>;
    retrieve_memories(params: RetrieveMemoriesParams, options?: RequestOptions): Promise<RetrieveMemoriesResponse>;
    update_memory(params: UpdateMemoryParams, options?: RequestOptions): Promise<UpdateMemoryResponse>;
    delete_memory(params: DeleteMemoryParams, options?: RequestOptions): Promise<DeleteMemoryResponse>;
    restore_memory(params: RestoreMemoryParams, options?: RequestOptions): Promise<RestoreMemoryResponse>;
    create_crew(params: CreateCrewParams, options?: RequestOptions): Promise<CreateCrewResponse>;
    execute_crew(params: ExecuteCrewParams, options?: RequestOptions): Promise<ExecuteCrewResponse>;
    list_crews(params: ListCrewsParams, options?: RequestOptions): Promise<ListCrewsResponse>;
    get_crew_status(params: GetCrewStatusParams, options?: RequestOptions): Promise<GetCrewStatusResponse>;
    search_memories(params: SearchMemoriesParams, options?: RequestOptions): Promise<SearchMemoriesResponse>;
    export_crew_data(params: ExportCrewDataParams, options?: RequestOptions): Promise<ExportCrewDataResponse>;
    prune_expired_memories(params: PruneExpiredMemoriesParams, options?: RequestOptions): Promise<PruneExpiredMemiesResponse>;
    /**
     * Internal request handler with standardized error handling
     */
    private request;
    /**
     * Map HTTP errors to typed CrewAPI errors
     */
    private handleError;
}
//# sourceMappingURL=CrewAPIClient.d.ts.map