import Dexie, { type Table } from 'dexie';

export type OutboxType =
  | 'sale'
  | 'stock_adjustment'
  | 'price_update'
  | 'purchase'
  | 'expense'
  | 'owner_drawing'
  | 'power_payment'
  | 'power_reading';

export type OutboxStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OutboxItem {
  id?: number;
  client_tx_id: string;
  type: OutboxType;
  title: string;
  amount?: number;
  currency?: string;
  target_table: string;
  payload: Record<string, any>;
  created_at: string;
  status: OutboxStatus;
  synced_at?: string;
  error_message?: string;
  retry_count: number;
}

export class DukaFlowDexieDB extends Dexie {
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super('DukaFlowDexieDB');
    this.version(1).stores({
      outbox: '++id, client_tx_id, type, status, created_at, target_table'
    });
  }
}

export const dexieDb = new DukaFlowDexieDB();
