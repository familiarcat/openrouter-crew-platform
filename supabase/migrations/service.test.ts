import { UnifiedAIRouter } from './service';

// Mock Supabase client to prevent actual network calls during tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({}),
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
});