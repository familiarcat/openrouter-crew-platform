import { MaintenanceService } from './maintenance-service';

const service = new MaintenanceService();

console.log("🛠️  Starting OpenRouter Crew Platform Maintenance...");
service.runMaintenance().catch(err => {
    console.error("❌ Maintenance failed:", err);
    process.exit(1);
});