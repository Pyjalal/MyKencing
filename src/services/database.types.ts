export interface RunAsyncResult {
  changes: {
    affectedRows: number;
    insertId: number | null;
  };
}

export interface DatabaseAdapter {
  runAsync(sql: string, params?: any[]): Promise<RunAsyncResult>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execAsync(sql: string, params?: any[]): Promise<void>;
}
