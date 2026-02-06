export const getEnvironmentConfig = () => ({
  isProduction: process.env.NODE_ENV === 'production',
  dashboardUrl: 'http://localhost:3000',
  liveServerUrl: 'http://localhost:3001',
  socketPath: '/socket.io',
});

export const getTargetServerUrl = () => 'http://localhost:3001';
export const getCurrentServerUrl = () => 'http://localhost:3000';
