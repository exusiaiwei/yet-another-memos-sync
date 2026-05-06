import { Memo, MemosPaginator, APIClient } from '../types';
import { transformMemoToMarkdown } from '../utils/memoTransformer';

const PAGE_SIZE = 200;

/**
 * Build the CEL filter for incremental sync and time-window cap.
 * Uses memos v0.28 schema field `created_ts` (unix seconds).
 */
function buildFilter(lastTimestamp: number, cutoffTimestamp: number): string {
  const since = Math.max(lastTimestamp, cutoffTimestamp);
  return since > 0 ? `created_ts > ${since}` : '';
}

function extractTimestamp(memo: Memo): number | null {
  if (typeof memo.timestamp === 'number') return memo.timestamp;
  if (typeof memo.createdTs === 'number') return memo.createdTs;
  if (memo.createTime) {
    const m = window.moment(memo.createTime);
    return m.isValid() ? m.unix() : null;
  }
  if (memo.createdAt) {
    const m = window.moment(memo.createdAt);
    return m.isValid() ? m.unix() : null;
  }
  return null;
}

export class SimpleMemosPaginator implements MemosPaginator {
  constructor(
    private client: APIClient,
    private lastTime: string,
    private useCalloutFormat: boolean,
    private useListCalloutFormat: boolean,
    private skipImages: boolean,
    private syncDaysLimit: number,
  ) {}

  async foreach(handler: (dayData: [string, Record<string, string>]) => Promise<void>): Promise<string> {
    const dailyMemosByDay: Record<string, Record<string, string>> = {};
    let latestTimestamp = '';

    const cutoffTimestamp = this.syncDaysLimit > 0
      ? window.moment().subtract(this.syncDaysLimit, 'days').startOf('day').unix()
      : 0;
    const lastTimestamp = this.lastTime ? parseInt(this.lastTime) : 0;
    const filter = buildFilter(lastTimestamp, cutoffTimestamp);

    let pageToken = '';
    let totalFetched = 0;
    let pages = 0;

    while (true) {
      const page = await this.client.listMemos({ pageSize: PAGE_SIZE, pageToken, filter });
      pages += 1;
      totalFetched += page.memos.length;

      for (const memo of page.memos) {
        try {
          const timestamp = extractTimestamp(memo);
          if (timestamp === null) {
            console.warn('Memo missing time fields:', memo);
            continue;
          }

          if (cutoffTimestamp > 0 && timestamp < cutoffTimestamp) continue;
          if (lastTimestamp > 0 && timestamp <= lastTimestamp) continue;

          const dailyMemo = transformMemoToMarkdown(
            {
              timestamp,
              content: memo.content,
              resources: memo.attachments || memo.resourceList || memo.resources || [],
            },
            this.useCalloutFormat,
            this.useListCalloutFormat,
            this.skipImages,
          );

          if (!dailyMemosByDay[dailyMemo.date]) dailyMemosByDay[dailyMemo.date] = {};
          dailyMemosByDay[dailyMemo.date][dailyMemo.timestamp] = dailyMemo.content;

          if (!latestTimestamp || timestamp > parseInt(latestTimestamp)) {
            latestTimestamp = String(timestamp);
          }
        } catch (error) {
          console.warn('Failed to process memo:', memo, error);
        }
      }

      if (!page.nextPageToken) break;
      pageToken = page.nextPageToken;

      // Hard safety cap to avoid unbounded loops on a misbehaving server.
      if (pages > 200) {
        console.warn(`Stopping after ${pages} pages to avoid runaway pagination`);
        break;
      }
    }

    console.log(`Fetched ${totalFetched} memos in ${pages} page(s); filter="${filter}"`);

    for (const [date, dayMemos] of Object.entries(dailyMemosByDay)) {
      await handler([date, dayMemos]);
    }

    return latestTimestamp || this.lastTime;
  }
}
