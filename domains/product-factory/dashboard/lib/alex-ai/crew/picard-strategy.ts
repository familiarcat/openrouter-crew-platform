import { wrapCrewCall } from './client';

export const picardStrategy = {
  consult: async (message: string, context?: any) => {
    return wrapCrewCall('captain_picard', message, context);
  }
};