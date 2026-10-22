import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
import { OutboxItem } from '../db/dexieDb';

interface SyncContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  isSyncing: boolean;
  pendingCount: number;
  outboxItems: OutboxItem[];
  lastSyncedAt: Date | null;
  syncNow: () => Promise<{ synced: number; failed: number }>;
  retryItem: (id: number) => Promise<boolean>;
  clearSynced: () => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  isOutboxOpen: boolean;
  setIsOutboxOpen: (open: boolean) => void;
  openOutbox: () => void;
  closeOutbox: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(syncService.isOnline());
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(syncService.isSimulatedOffline());
  const [isSyncing, setIsSyncing] = useState<boolean>(syncService.getIsSyncing());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isOutboxOpen, setIsOutboxOpen] = useState<boolean>(false);

  const refreshState = useCallback(async () => {
    setIsOnline(syncService.isOnline());
    setIsSimulatedOfflineState(syncService.isSimulatedOffline());
    setIsSyncing(syncService.getIsSyncing());
    const count = await syncService.getPendingCount();
    setPendingCount(count);
    const items = await syncService.getOutboxItems();
    setOutboxItems(items);
  }, []);

  useEffect(() => {
    refreshState();
    const unsubscribe = syncService.subscribe(() => {
      refreshState();
    });
    return () => {
      unsubscribe();
    };
  }, [refreshState]);

  const setSimulatedOffline = (val: boolean) => {
    syncService.setSimulatedOffline(val);
    refreshState();
  };

  const syncNow = async () => {
    const res = await syncService.autoUploadPending();
    if (res.synced > 0) {
      setLastSyncedAt(new Date());
    }
    await refreshState();
    return res;
  };

  const retryItem = async (id: number) => {
    const res = await syncService.retryItem(id);
    await refreshState();
    return res;
  };

  const clearSynced = async () => {
    await syncService.clearSynced();
    await refreshState();
  };

  const deleteItem = async (id: number) => {
    await syncService.deleteItem(id);
    await refreshState();
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSimulatedOffline,
        setSimulatedOffline,
        isSyncing,
        pendingCount,
        outboxItems,
        lastSyncedAt,
        syncNow,
        retryItem,
        clearSynced,
        deleteItem,
        isOutboxOpen,
        setIsOutboxOpen,
        openOutbox: () => setIsOutboxOpen(true),
        closeOutbox: () => setIsOutboxOpen(false)
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
