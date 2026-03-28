import { wrapCrewCall } from './client';

export const worfSecurity = {
  audit: async (message: string, context?: any) => {
    return wrapCrewCall('lt_worf', message, context);
  }
};