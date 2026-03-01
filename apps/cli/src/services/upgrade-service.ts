export class UpgradeService { async checkUpgrade(): Promise<boolean> { return false; } } export const upgradeService = new UpgradeService();
