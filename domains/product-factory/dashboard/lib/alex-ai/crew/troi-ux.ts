import { wrapCrewCall } from './client';

export const troiUX = {
  empathize: async (message: string, context?: any) => {
    return wrapCrewCall('counselor_troi', message, context);
  }
};