import { CostReportView } from '../ui/cost-report-view.js';

export async function showCostReportCommand(costReportView: CostReportView): Promise<void> {
  await costReportView.show();
}