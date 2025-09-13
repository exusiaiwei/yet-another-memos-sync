import { Memo, APIClient } from '../types';
import { t } from '../i18n/translationManager';

/**
 * Simple HTTP client for Memos API with version support
 */
export class MemosAPIClient implements APIClient {
  private baseURL: string;
  private token: string;
  private apiVersion: string;

  constructor(baseURL: string, token: string, apiVersion: string = 'v0.25.1') {
    // 确保baseURL不以斜杠结尾
    this.baseURL = baseURL.replace(/\/$/, '');
    this.token = token;
    this.apiVersion = apiVersion;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
    };
  }

  /**
   * Make HTTP request with error handling
   */
  private async request(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        },
        // 添加网络配置
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error:', error);
        throw new Error(`${t.t('NETWORK_ERROR')} ${url}. ${error.message}`);
      }
      console.error('Request error:', error);
      throw error;
    }
  }

  /**
   * List memos with pagination support for different API versions
   */
  async listMemos(limit: number = 50, offset: number = 0): Promise<Memo[]> {
    try {
      let endpoint: string;
      let params = new URLSearchParams();

      // 根据API版本构建不同的端点和参数
      if (this.apiVersion.startsWith('v0.2') && parseFloat(this.apiVersion.substring(1)) >= 0.22) {
        // v0.22+ 使用新的API格式
        endpoint = 'api/v1/memos';
        params.set('pageSize', limit.toString());
        if (offset > 0) {
          params.set('pageToken', offset.toString());
        }
      } else {
        // 旧版本API
        endpoint = 'api/memo';
        params.set('limit', limit.toString());
        params.set('offset', offset.toString());
      }

      const url = `${this.baseURL}/${endpoint}?${params}`;
      const data = await this.request(url);

      // 根据API版本处理响应格式
      if (this.apiVersion.startsWith('v0.2') && parseFloat(this.apiVersion.substring(1)) >= 0.22) {
        return data.memos || [];
      } else {
        return data.data || data || [];
      }
    } catch (error) {
      console.error('Failed to fetch memos:', error);
      throw new Error(`${t.t('FETCH_MEMOS_ERROR')}: ${error.message}`);
    }
  }

  /**
   * Download resource (simplified version - just logs for now)
   */
  async downloadResource(resource: any): Promise<void> {
    console.log(`Would download resource: ${resource.name}`);
    // TODO: Implement actual resource downloading if needed
  }
}
