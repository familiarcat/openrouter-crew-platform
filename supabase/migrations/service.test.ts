import { UnifiedAIRouter } from './service';

// Mock Supabase client to prevent actual network calls during tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({}),
}));

jest.mock('@openrouter-crew/crew-api-client', () => ({
  AdminService: jest.fn().mockImplementation(() => ({
    pruneExpiredMemories: jest.fn().mockResolvedValue({ count: 5 }),
  })),
}));

describe('UnifiedAIRouter', () => {
  const router = new UnifiedAIRouter();

  it('should route free users to free models', () => {
    const model = router.selectModel({ complexity: 'high', userPlan: 'free' });
    expect(['meta-llama/llama-3-8b-instruct', 'mistralai/mistral-7b-instruct']).toContain(model);
  });

  it('should prioritize realtime requests with low latency models', () => {
    const model = router.selectModel({ complexity: 'high', realtime: true, userPlan: 'pro' });
    expect(model).toBe('google/gemini-flash-1.5');
  });

  it('should escalate high complexity tasks for pro users', () => {
    const model = router.selectModel({ complexity: 'high', userPlan: 'pro' });
    expect(['openai/gpt-4o', 'anthropic/claude-3.5-sonnet']).toContain(model);
  });

  it('should default to cheap models for standard tasks', () => {
    const model = router.selectModel({ complexity: 'medium', userPlan: 'pro' });
    expect(['openai/gpt-4o-mini', 'google/gemini-flash-1.5']).toContain(model);
  });

  // Additional check to ensure it doesn't break if no plan is provided (defaults to undefined/standard logic)
  it('should handle missing plan gracefully (treat as non-free)', () => {
    const model = router.selectModel({ complexity: 'low' });
    // Should fall through to cheap tier by default logic
    expect(['openai/gpt-4o-mini', 'google/gemini-flash-1.5']).toContain(model);
  });

  it('should use cheap models for "standard" tier on medium complexity tasks', () => {
    const model = router.selectModel({ complexity: 'medium', userPlan: 'standard' });
    expect(['openai/gpt-4o-mini', 'google/gemini-flash-1.5']).toContain(model);
  });

  it('should NOT escalate to premium for "budget" tier on high complexity tasks', () => {
    const model = router.selectModel({ complexity: 'high', userPlan: 'budget' });
    expect(['openai/gpt-4o-mini', 'google/gemini-flash-1.5']).toContain(model);
  });

  it('should use free models for "budget" tier on low complexity tasks', () => {
    const model = router.selectModel({ complexity: 'low', userPlan: 'budget' });
    expect(['meta-llama/llama-3-8b-instruct', 'mistralai/mistral-7b-instruct']).toContain(model);
  });

  it('should delegate memory pruning to AdminService', async () => {
    // @ts-ignore - Method expected to be implemented in UnifiedAIRouter
    const result = await (router as any).pruneExpiredMemories(30);
    expect(result).toEqual({ count: 5 });
  });

  it('should propagate errors from AdminService for graceful handling', async () => {
    const adminServiceMock = (router as any).adminService;
    adminServiceMock.pruneExpiredMemories.mockRejectedValueOnce(new Error('Database connection failed'));
    
    // @ts-ignore - Method expected to be implemented in UnifiedAIRouter
    await expect((router as any).pruneExpiredMemories(30)).rejects.toThrow('Database connection failed');
  });
});