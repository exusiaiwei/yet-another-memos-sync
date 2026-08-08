import { moment } from 'obsidian';
import { Memo, MemosPaginator, APIClient, ListMemosPage } from '../types';
import { transformMemoToMarkdown } from '../utils/memoTransformer';

const PAGE_SIZE = 200;
const MAX_PAGES = 200;

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
    const m = moment(memo.createTime);
    return m.isValid() ? m.unix() : null;
  }
  if (memo.createdAt) {
    const m = moment(memo.createdAt);
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
      ? moment().subtract(this.syncDaysLimit, 'days').startOf('day').unix()
      : 0;
    const lastTimestamp = this.lastTime ? parseInt(this.lastTime) : 0;
    let filter = buildFilter(lastTimestamp, cutoffTimestamp);

    let pageToken = '';
    let pages = 0;
    let exhausted = false;
    let filterDropped = false;

    while (!exhausted) {
      let page: ListMemosPage;
      try {
        page = await this.client.listMemos({ pageSize: PAGE_SIZE, pageToken, filter });
      } catch (error) {
        // memos v0.30.0 (2026-07) changed CEL time-filter semantics: `created_ts`
        // is now a CEL timestamp and comparing it against a bare epoch int fails
        // with HTTP 400 ("no matching overload for '_>_' applied to '(timestamp, int)'").
        // Fall back to fetching without a server-side filter; the local time-window
        // checks below still enforce syncDaysLimit / lastTime, so this stays correct
        // on both old and new memos versions.
        if (!filterDropped && filter && error instanceof Error && /HTTP 400/.test(error.message)) {
          filterDropped = true;
          filter = '';
          console.warn('Memos rejected the CEL filter (HTTP 400); retrying without a server-side filter.');
          continue;
        }
        throw error;
      }
      pages += 1;

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

      if (!page.nextPageToken) {
        exhausted = true;
      } else if (pages > MAX_PAGES) {
        console.warn(`Stopping after ${pages} pages to avoid runaway pagination`);
        exhausted = true;
      } else {
        pageToken = page.nextPageToken;
      }
    }

    for (const [date, dayMemos] of Object.entries(dailyMemosByDay)) {
      await handler([date, dayMemos]);
    }

    return latestTimestamp || this.lastTime;
  }
}
