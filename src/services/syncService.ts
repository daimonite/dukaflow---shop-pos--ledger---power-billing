import { dexieDb, OutboxItem, OutboxType } from '../db/dexieDb';

type SyncListener = () => void;

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private simulatedOffline: boolean = false;
  private isSyncingNow: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineEvent);
      window.addEventListener('offline', this.handleOfflineEvent);
    }
  }

  private handleOnlineEvent = () => {
    this.notify();
    // Auto-upload when online
    this.autoUploadPending();
  };

  private handleOfflineEvent = () => {
    this.notify();
  };

  public isOnline(): boolean {
    if (this.simulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  public setSimulatedOffline(val: boolean) {
    this.simulatedOffline = val;
    this.notify();
    if (!val && this.isOnline()) {
      // Returned online -> auto upload pending
      this.autoUploadPending();
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // Queue transaction into Dexie outbox
  public async queueTransaction(params: {
    type: OutboxType;
    title: string;
    amount?: number;
    target_table: string;
    payload: Record<string, any>;
  }): Promise<OutboxItem> {
    const item: OutboxItem = {
      client_tx_id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      title: params.title,
      amount: params.amount,
      currency: 'TSh',
      target_table: params.target_table,
      payload: params.payload,
      created_at: new Date().toISOString(),
      status: 'pending',
      retry_count: 0
    };

    const id = await dexieDb.outbox.add(item);
    item.id = id;
    this.notify();

    // If currently online, trigger immediate auto-upload!
    if (this.isOnline()) {
      this.autoUploadPending();
    }

    return item;
  }

  // Get all items in outbox
  public async getOutboxItems(): Promise<OutboxItem[]> {
    return await dexieDb.outbox.orderBy('id').reverse().toArray();
  }

  // Get pending count
  public async getPendingCount(): Promise<number> {
    return await dexieDb.outbox
      .where('status')
      .anyOf(['pending', 'failed'])
      .count();
  }

  // Auto-upload pending transactions to Supabase
  public async autoUploadPending(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline() || this.isSyncingNow) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncingNow = true;
    this.notify();

    let synced = 0;
    let failed = 0;

    try {
      const pendingItems = await dexieDb.outbox
        .where('status')
        .anyOf(['pending', 'failed'])
        .toArray();

      for (const item of pendingItems) {
        if (!item.id) continue;

        // Mark as syncing in Dexie
        await dexieDb.outbox.update(item.id, {
          status: 'syncing'
        });
        this.notify();

        try {
          await this.uploadItemToSupabase(item);

          // Mark as synced
          await dexieDb.outbox.update(item.id, {
            status: 'synced',
            synced_at: new Date().toISOString(),
            error_message: undefined
          });
          synced++;
        } catch (err: any) {
          failed++;
          await dexieDb.outbox.update(item.id, {
            status: 'failed',
            error_message: err?.message || 'Hitilafu ya kuunganishwa na seva',
            retry_count: item.retry_count + 1
          });
        }
        this.notify();
      }
    } finally {
      this.isSyncingNow = false;
      this.notify();
    }

    return { synced, failed };
  }

  // Upload a single outbox item
  private async uploadItemToSupabase(item: OutboxItem): Promise<void> {
    // Check if real Supabase environment variables are available
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Special case: price update modifies an existing product record
      if (item.type === 'price_update' && item.payload?.product_id) {
        const patchEndpoint = `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(item.payload.product_id)}`;
        const response = await fetch(patchEndpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sell_price: item.payload.new_price })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Supabase HTTP ${response.status}: ${errorText}`);
        }
        return;
      }

      // Real Supabase REST API upload (Idempotent Upsert)
      const endpoint = `${supabaseUrl}/rest/v1/${item.target_table}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(item.payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase HTTP ${response.status}: ${errorText}`);
      }
    } else {
      // Simulated Supabase REST Gateway: simulates cloud latency and atomic commit
      await new Promise(resolve => setTimeout(resolve, 450));
      // Randomly verify payload shape
      if (!item.payload || typeof item.payload !== 'object') {
        throw new Error('Data payload si sahihi');
      }
    }
  }

  // Retry an individual failed item
  public async retryItem(id: number): Promise<boolean> {
    const item = await dexieDb.outbox.get(id);
    if (!item) return false;

    if (!this.isOnline()) {
      await dexieDb.outbox.update(id, {
        status: 'pending',
        error_message: 'Nje ya mtandao - itapakiwa mtandao ukirudi'
      });
      this.notify();
      return false;
    }

    await dexieDb.outbox.update(id, { status: 'syncing' });
    this.notify();

    try {
      await this.uploadItemToSupabase(item);
      await dexieDb.outbox.update(id, {
        status: 'synced',
        synced_at: new Date().toISOString(),
        error_message: undefined
      });
      this.notify();
      return true;
    } catch (err: any) {
      await dexieDb.outbox.update(id, {
        status: 'failed',
        error_message: err?.message || 'Hitilafu ya kupakia',
        retry_count: item.retry_count + 1
      });
      this.notify();
      return false;
    }
  }

  // Clear all synced items to save space
  public async clearSynced(): Promise<void> {
    await dexieDb.outbox.where('status').equals('synced').delete();
    this.notify();
  }

  // Delete a specific outbox item
  public async deleteItem(id: number): Promise<void> {
    await dexieDb.outbox.delete(id);
    this.notify();
  }

  // Check if currently syncing
  public getIsSyncing(): boolean {
    return this.isSyncingNow;
  }
}

export const syncService = new SyncService();
