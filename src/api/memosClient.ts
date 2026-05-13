import { requestUrl, RequestUrlResponse } from 'obsidian';
import { APIClient, ListMemosOptions, ListMemosPage, Memo } from '../types';
import { t } from '../i18n/translationManager';

interface ListMemosResponse {
  memos?: Memo[];
  nextPageToken?: string;
}

/**
 * HTTP client for the memos /api/v1/memos endpoint.
 * Supports CEL filter and proper page-token pagination.
 * Uses Obsidian's requestUrl so it works on both desktop and mobile.
 */
export class MemosAPIClient implements APIClient {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.token = token;
  }

  async listMemos(opts: ListMemosOptions = {}): Promise<ListMemosPage> {
    const params = new URLSearchParams();
    params.set('pageSize', String(opts.pageSize ?? 100));
    if (opts.pageToken) params.set('pageToken', opts.pageToken);
    if (opts.filter) params.set('filter', opts.filter);

    const url = `${this.baseURL}/api/v1/memos?${params.toString()}`;

    let response: RequestUrlResponse;
    try {
      response = await requestUrl({
        url,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        },
        throw: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${t.t('NETWORK_ERROR')} ${url}. ${message}`);
    }

    if (response.status < 200 || response.status >= 300) {
      const body = response.text || '';
      console.error(`API request failed: ${response.status}`, body);
      throw new Error(`${t.t('FETCH_MEMOS_ERROR')}: HTTP ${response.status} ${body}`);
    }

    const data = response.json as ListMemosResponse;
    return {
      memos: data.memos ?? [],
      nextPageToken: data.nextPageToken ?? '',
    };
  }
}
