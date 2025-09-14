// Global type definitions
declare global {
  interface Window {
    moment: any;
    app?: {
      vault?: {
        adapter?: any;
        getConfig?: (key: string) => any;
      };
    };
  }
}

// Core types for Memos API
export interface Memo {
  id?: number | string;
  name?: string;
  uid?: string;
  content: string;
  timestamp?: number;
  createdTs?: number;
  createdAt?: string;
  createTime?: string;
  resourceList?: Resource[];
  resources?: Resource[];
}

export interface Resource {
  id?: string;
  name?: string;
  filename?: string;
  type?: string;
  size?: number;
  externalLink?: string;
  uid?: string;
}

export interface DailyMemo {
  date: string;
  timestamp: string;
  content: string;
}

export interface MemosSettings {
  // API Configuration
  apiUrl: string;
  apiToken: string;
  apiVersion: string;

  // Sync Settings
  dailyMemoHeader: string;
  attachmentFolderPath: string;
  createMissingDailyNotes: boolean;
  useCalloutFormat: boolean;
  useListCalloutFormat: boolean; // 新的 List Callout 格式
  syncDaysLimit: number; // 限制同步多少天内的备忘录，0表示无限制

  // Auto Sync Settings
  enableAutoSyncOnStartup: boolean;
  startupSyncDelay: number;
  skipIfSyncedToday: boolean;
  periodicSyncInterval: number; // 0 means disabled
}

export interface APIClient {
  listMemos(limit?: number, offset?: number): Promise<Memo[]>;
  downloadResource(resource: Resource): Promise<void>;
}

export interface MemosPaginator {
  foreach(handler: (dayData: [string, Record<string, string>]) => Promise<void>): Promise<string>;
}
