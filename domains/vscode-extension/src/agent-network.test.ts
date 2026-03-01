import * as assert from 'assert';
import { AgentNetworkService, CrewAgent } from './services/agent-network.js';
import { LLMRouter } from './services/llm-router.js';
import { CostTracker } from './services/cost-tracker.js';

suite('AgentNetworkService Test Suite', () => {
    let networkService: AgentNetworkService;
    let mockCostTracker: any;
    let mockLLMRouter: any;

    setup(() => {
        mockCostTracker = {
            recordUsage: async () => {},
            estimateCost: () => 0.01
        };

        mockLLMRouter = {
            route: async (request: any) => {
                // Default mock response
                return {
                    content: 'default response',
                    model: 'mock-model',
                    costUSD: 0.001,
                    executionTimeMs: 10,
                    cached: false
                };
            }
        };

        networkService = new AgentNetworkService(
            mockCostTracker as CostTracker,
            mockLLMRouter as LLMRouter
        );
    });

    test('getDepartment returns a CrewAgent', () => {
        const agent = networkService.getDepartment('engineering');
        assert.ok(agent instanceof CrewAgent);
        assert.strictEqual(agent.profile.name, 'Default Agent'); // Fallback in mock env
    });

    test('Agent delegates task when LLM suggests it', async () => {
        const agent = networkService.getDepartment('engineering');
        let routeCallCount = 0;
        let delegationPromptSeen = false;
        let subAgentProfileSeen = false;

        // Mock LLMRouter to simulate delegation flow
        mockLLMRouter.route = async (request: any) => {
            routeCallCount++;
            const prompt = request.prompt || '';

            // 1. Decision Phase: Should delegate?
            if (prompt.includes('do you need to delegate')) {
                delegationPromptSeen = true;
                return {
                    content: 'yes',
                    model: 'mock-model',
                    costUSD: 0.001
                };
            }

            // 2. Definition Phase: Define sub-agent
            if (prompt.includes('Define the ideal profile')) {
                subAgentProfileSeen = true;
                return {
                    content: JSON.stringify({
                        name: 'Specialist Agent',
                        role: 'Tester',
                        specialties: ['testing'],
                        model: 'gpt-4o'
                    }),
                    model: 'mock-model',
                    costUSD: 0.001
                };
            }

            // 3. Execution Phase (Sub-agent working)
            return {
                content: 'Task completed by sub-agent',
                model: 'mock-model',
                costUSD: 0.001
            };
        };

        const result = await agent.executeTask('Complex project task requiring delegation');

        assert.ok(delegationPromptSeen, 'Should have asked LLM about delegation');
        assert.ok(subAgentProfileSeen, 'Should have asked LLM for sub-agent profile');
        assert.ok(result.output.includes('Delegated to Specialist Agent'), 'Output should indicate delegation');
    });

    test('Agent performs work directly when delegation is not needed', async () => {
        const agent = networkService.getDepartment('engineering');

        mockLLMRouter.route = async (request: any) => {
            if (request.prompt.includes('do you need to delegate')) {
                return { content: 'no', model: 'mock', costUSD: 0 };
            }
            return { content: 'Direct work result', model: 'mock', costUSD: 0 };
        };

        const result = await agent.executeTask('Simple task');
        assert.strictEqual(result.output, 'Direct work result');
    });
});