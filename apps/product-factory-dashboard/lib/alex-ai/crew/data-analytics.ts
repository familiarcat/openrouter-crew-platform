import { wrapCrewCall } from './client';

export const dataAnalytics = {
  analyze: async (message: string, context?: any) => {
    return wrapCrewCall('commander_data', message, context);
  }
};