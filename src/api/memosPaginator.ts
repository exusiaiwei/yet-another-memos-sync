import { Memo, MemosPaginator, APIClient } from '../types';
import { transformMemoToMarkdown } from '../utils/memoTransformer';

/**
 * Memos Paginator for handling memo fetching and processing
 */
export class SimpleMemosPaginator implements MemosPaginator {
  private client: APIClient;
  private lastTime: string;
  private useCalloutFormat: boolean;
  private useListCalloutFormat: boolean;
  private syncDaysLimit: number;

  constructor(client: APIClient, lastTime: string = '', useCalloutFormat: boolean = false, useListCalloutFormat: boolean = false, syncDaysLimit: number = 30) {
    this.client = client;
    this.lastTime = lastTime;
    this.useCalloutFormat = useCalloutFormat;
    this.useListCalloutFormat = useListCalloutFormat;
    this.syncDaysLimit = syncDaysLimit;
  }

  /**
   * Process all memos and group by date
   */
  async foreach(handler: (dayData: [string, Record<string, string>]) => Promise<void>): Promise<string> {
    const dailyMemosByDay: Record<string, Record<string, string>> = {};
    let latestTimestamp = '';

    // Calculate time limit if enabled
    let cutoffTimestamp = 0;
    if (this.syncDaysLimit > 0) {
      const cutoffDate = window.moment().subtract(this.syncDaysLimit, 'days').startOf('day');
      cutoffTimestamp = cutoffDate.unix();
    }

    try {
      // Fetch all memos (complete sync for deletion detection)
      const memos = await this.client.listMemos(1000, 0);

      for (const memo of memos) {
        try {
          // Extract timestamp from different API versions
          let timestamp: number;
          if (memo.timestamp) {
            timestamp = memo.timestamp;
          } else if (memo.createdTs) {
            timestamp = memo.createdTs;
          } else if (memo.createTime) {
            const momentTime = window.moment(memo.createTime);
            if (!momentTime.isValid()) {
              console.warn(`Invalid createTime format:`, memo.createTime, memo);
              continue;
            }
            timestamp = momentTime.unix();
          } else if (memo.createdAt) {
            const momentTime = window.moment(memo.createdAt);
            if (!momentTime.isValid()) {
              console.warn(`Invalid createdAt format:`, memo.createdAt, memo);
              continue;
            }
            timestamp = momentTime.unix();
          } else {
            console.warn(`Memo missing time fields:`, memo);
            continue;
          }

          // Skip memos outside the time limit
          if (cutoffTimestamp > 0 && timestamp < cutoffTimestamp) {
            continue;
          }

          // Transform memo to markdown with emoji
          const dailyMemo = transformMemoToMarkdown({
            timestamp,
            content: memo.content,
            resources: memo.resourceList || memo.resources || []
          }, this.useCalloutFormat, this.useListCalloutFormat);

          // Group by date
          if (!dailyMemosByDay[dailyMemo.date]) {
            dailyMemosByDay[dailyMemo.date] = {};
          }
          dailyMemosByDay[dailyMemo.date][dailyMemo.timestamp] = dailyMemo.content;

          // Track latest timestamp
          if (!latestTimestamp || timestamp > parseInt(latestTimestamp)) {
            latestTimestamp = timestamp.toString();
          }

        } catch (error) {
          console.warn(`Failed to process memo:`, memo, error);
          continue;
        }
      }

      // Process each day's memos
      for (const [date, dayMemos] of Object.entries(dailyMemosByDay)) {
        await handler([date, dayMemos]);
      }

      return latestTimestamp || this.lastTime;

    } catch (error) {
      console.error('Failed to fetch memos:', error);
      throw error;
    }
  }
}
