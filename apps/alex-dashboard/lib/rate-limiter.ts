export function createNextJsRateLimiter(options: any) {
  return {
    checkLimit: (request: any, endpoint: string) => {
      return {
        allowed: true,
        response: {
          body: { error: 'Rate limit exceeded' },
          status: 429,
          headers: {}
        }
      };
    }
  };
}
