import { moment } from 'obsidian';
import { Memo, APIClient, ListMemosPage } from '../types';
import { transformMemoToMarkdown } from '../utils/memoTransformer';

const PAGE_SIZE = 200;
const MAX_PAGES = 200;

/**
 * Ordered CEL filter candidates for the sync time window, tried in order
 * until one is accepted:
 *
 *  1. `timestamp(N)` - the currently documented syntax (memos' filter/README.md,
 *     filter/time_test.go): `created_ts` is a CEL `timestamp`, so a bare int
 *     fails to compile ("no matching overload for '_>_' applied to
 *     '(timestamp, int)'") as of the schema change in memos v0.30.0 (2026-07).
 *  2. a bare int - the pre-v0.30 schema, where `created_ts` was an int.
 *  3. '' (no server-side filter) - belt-and-suspenders for anything else;
 *     the local cutoff check in collect() still enforces syncDaysLimit.
 */
function buildFilterCandidates(cutoffTimestamp: number): string[] {
  if (cutoffTimestamp <= 0) return [''];
  return [
    `created_ts > timestamp(${cutoffTimestamp})`,
    `created_ts > ${cutoffTimestamp}`,
    '',
  ];
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

export interface MemosWindow {
  dailyMemosByDay: Record<string, Record<string, string>>;
  latestTimestamp: string;
  cutoffTimestamp: number;
}

/**
 * Fetches every memo within the sync window (bounded by syncDaysLimit, or
 * unlimited when syncDaysLimit is 0) and buckets it by local day.
 *
 * Deliberately NOT cursor-based. The previous implementation skipped any
 * memo with `created_ts <= lastSyncedTimestamp`, which meant a single
 * out-of-order memo (backdated, or future-dated via Memos' "edit time"
 * feature) permanently broke incremental sync: a future timestamp becomes
 * a cursor nothing can ever exceed, and a backdated memo looks like it was
 * already synced. Refetching and fully reconciling the whole window on
 * every sync costs more, but stays correct regardless of creation order,
 * and lets deletions be detected even for days where every memo on that
 * day was removed (the caller still has to be told about those days -
 * see DailyNoteManager.processMemos).
 */
export class SimpleMemosPaginator {
  constructor(
    private client: APIClient,
    private useCalloutFormat: boolean,
    private useListCalloutFormat: boolean,
    private skipImages: boolean,
    private syncDaysLimit: number,
  ) {}

  async collect(): Promise<MemosWindow> {
    const dailyMemosByDay: Record<string, Record<string, string>> = {};
    let latestTimestamp = '';

    const cutoffTimestamp = this.syncDaysLimit > 0
      ? moment().subtract(this.syncDaysLimit, 'days').startOf('day').unix()
      : 0;
    const filterCandidates = buildFilterCandidates(cutoffTimestamp);
    let filterCandidateIndex = 0;
    let filter = filterCandidates[filterCandidateIndex];

    let pageToken = '';
    let pages = 0;
    let exhausted = false;

    while (!exhausted) {
      let page: ListMemosPage;
      try {
        page = await this.client.listMemos({ pageSize: PAGE_SIZE, pageToken, filter });
      } catch (error) {
        // Try the next filter syntax candidate on a filter-compile rejection
        // (see buildFilterCandidates) rather than surfacing it - memos server
        // versions disagree on whether `created_ts` is a CEL timestamp or a
        // bare int, and there's no cheap way to ask which one we're talking to.
        const hasMoreCandidates = filterCandidateIndex < filterCandidates.length - 1;
        if (hasMoreCandidates && filter && error instanceof Error && /HTTP 400/.test(error.message)) {
          filterCandidateIndex += 1;
          filter = filterCandidates[filterCandidateIndex];
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

    return { dailyMemosByDay, latestTimestamp, cutoffTimestamp };
  }
}
