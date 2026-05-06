import { APIClient, ListMemosOptions, ListMemosPage } from '../types';
import { t } from '../i18n/translationManager';

/**
 * HTTP client for the memos /api/v1/memos endpoint.
 * Supports CEL filter and proper page-token pagination.
 */
export class MemosAPIClient implements APIClient {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
    };
  }

  private async request(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`${t.t('NETWORK_ERROR')} ${url}. ${error.message}`);
      }
      throw error;
    }
  }

  async listMemos(opts: ListMemosOptions = {}): Promise<ListMemosPage> {
    const params = new URLSearchParams();
    params.set('pageSize', String(opts.pageSize ?? 100));
    if (opts.pageToken) params.set('pageToken', opts.pageToken);
    if (opts.filter) params.set('filter', opts.filter);

    try {
      const data = await this.request(`${this.baseURL}/api/v1/memos?${params}`);
      return {
        memos: data.memos || [],
        nextPageToken: data.nextPageToken || '',
      };
    } catch (error: any) {
      throw new Error(`${t.t('FETCH_MEMOS_ERROR')}: ${error.message}`);
    }
  }
}
