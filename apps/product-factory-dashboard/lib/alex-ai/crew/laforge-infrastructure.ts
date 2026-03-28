import { wrapCrewCall } from './client';

export const laforgeInfrastructure = {
  engineer: async (message: string, context?: any) => {
    return wrapCrewCall('geordi_la_forge', message, context);
  }
};