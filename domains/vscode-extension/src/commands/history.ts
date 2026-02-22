import { HistoryView } from '../ui/history-view';

export async function historyCommand(historyView: HistoryView): Promise<void> {
  await historyView.show();
}