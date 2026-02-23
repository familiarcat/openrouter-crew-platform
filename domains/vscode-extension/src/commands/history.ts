import { HistoryView } from '../ui/history-view.js';

export async function historyCommand(historyView: HistoryView): Promise<void> {
    await historyView.show();
}