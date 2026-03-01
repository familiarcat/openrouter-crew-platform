/**
 * Upgrade Service Stub
 * Handles CLI upgrade checks and operations.
 */
export class UpgradeService {
    async checkUpgrade(): Promise<boolean> {
        return false;
    }
}

export const upgradeService = new UpgradeService();