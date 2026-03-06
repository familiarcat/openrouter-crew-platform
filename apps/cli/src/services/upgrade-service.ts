export class UpgradeService {
    async checkUpgrade(): Promise<boolean> {
        return false;
    }

    async getStatus(): Promise<{ tier: string; active: boolean; expiresAt: Date | null }> {
        return {
            tier: 'starter',
            active: true,
            expiresAt: null
        };
    }

    getLimits() {
        return {
            maxCrews: 1,
            maxMemories: 1000,
            historyDays: 30,
            features: {
                autoArchival: false,
                advancedAnalytics: false,
                multiBudget: false,
                smartScheduling: false
            }
        };
    }

    isFeatureEnabled(feature: string): boolean {
        const limits = this.getLimits();
        return (limits.features as any)[feature] === true;
    }

    async upgradeToProfessional(paymentMethodId: string): Promise<void> {
        // Mock upgrade
        console.log('Upgrading to professional with payment method:', paymentMethodId);
    }
}

export const upgradeService = new UpgradeService();
