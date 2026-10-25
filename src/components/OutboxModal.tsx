import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSync } from '../context/SyncContext';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Database,
  ArrowRight,
  ShoppingCart,
  Scale,
  Truck,
  Wallet,
  ShoppingBag,
  Zap,
  Edit3,
  Wifi,
  WifiOff,
  Code2
} from 'lucide-react';
import { formatTsh } from '../utils/translations';
import { OutboxItem, OutboxType } from '../db/dexieDb';

export const OutboxModal: React.FC = () => {
  const {
    isOnline,
    isSimulatedOffline,
    setSimulatedOffline,
    isSyncing,
    pendingCount,
    outboxItems,
    syncNow,
    retryItem,
    clearSynced,
    deleteItem,
    isOutboxOpen,
    closeOutbox
  } = useSync();

  const [filter, setFilter] = useState<'all' | 'pending' | 'synced'>('all');
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOutboxOpen) return null;

  const filteredItems = outboxItems.filter(item => {
    if (filter === 'pending') return item.status === 'pending' || item.status === 'failed' || item.status === 'syncing';
    if (filter === 'synced') return item.status === 'synced';
    return true;
  });

  const syncedCount = outboxItems.filter(i => i.status === 'synced').length;
  const failedCount = outboxItems.filter(i => i.status === 'failed').length;

  const handleSyncAll = async () => {
    setSyncFeedback('Inapakia miamala kwenye Supabase...');
    const res = await syncNow();
    if (res.synced > 0) {
      setSyncFeedback(`Miamala ${res.synced} imepakiwa kikamilifu kwenye Supabase!`);
    } else if (res.failed > 0) {
      setSyncFeedback(`Miamala ${res.failed} imeshindwa kupakiwa. Angalia intaneti.`);
    } else {
      setSyncFeedback('Hakuna miamala mipya inayosubiri kupakiwa.');
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const getItemIcon = (type: OutboxType) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4 text-orange-600" />;
      case 'stock_adjustment':
        return <Scale className="w-4 h-4 text-blue-600" />;
      case 'price_update':
        return <Edit3 className="w-4 h-4 text-purple-600" />;
      case 'purchase':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'expense':
        return <Wallet className="w-4 h-4 text-red-600" />;
      case 'owner_drawing':
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'power_payment':
      case 'power_reading':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-orange-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-orange-50/80 via-white to-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-base sm:text-lg text-gray-900">
                  Sanduku la Kupakia (Dexie Outbox)
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  IndexedDB
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Inahifadhi miamala nje ya mtandao na kupakia Supabase kiotomatiki
              </p>
            </div>
          </div>

          <button
            onClick={closeOutbox}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Connectivity Status & Simulation Strip */}
        <div className="px-4 sm:px-5 py-3 bg-[#fffbf7] border-b border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div className="text-xs">
              <span className="font-bold text-gray-800 block">
                {isOnline ? 'Mtandaoni (Online)' : 'Nje ya Mtandao (Offline Mode)'}
              </span>
              <span className="text-[11px] text-gray-500">
                {isOnline
                  ? 'Miamala inapakiwa mara moja kwenye seva ya Supabase'
                  : 'Miamala inabaki kwenye Dexie hadi mtandao utakapopatikana'}
              </span>
            </div>
          </div>

          {/* Offline Simulator Switch & Sync Button */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setSimulatedOffline(!isSimulatedOffline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSimulatedOffline
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title="Jaribu kufanya mauzo bila mtandao"
            >
              {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-gray-400" />}
              <span>{isSimulatedOffline ? 'Offline (Imeigwa)' : 'Jaribu Offline'}</span>
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing || !isOnline}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                isSyncing || !isOnline
                  ? 'bg-gray-400 cursor-not-allowed opacity-75'
                  : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Inapakia...' : 'Pakia Sasa'}</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className="px-5 py-2 bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Counts & Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 flex items-center justify-between border-b border-gray-100 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                filter === 'all'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Zote ({outboxItems.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Inayosubiri ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('synced')}
              className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                filter === 'synced'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Zilizopakiwa ({syncedCount})
            </button>
          </div>

          {syncedCount > 0 && (
            <button
              onClick={clearSynced}
              className="text-[11px] font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Safisha Zilizopakiwa
            </button>
          )}
        </div>

        {/* Outbox Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">Hakuna miamala kwenye sanduku hili</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Kila unapoingiza mauzo, kurekebisha stoo, au kurekodi matumizi, huhifadhiwa hapa kwenye Dexie na kupakiwa Supabase.
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isExpanded = expandedItemId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border text-xs transition-all ${
                    item.status === 'pending'
                      ? 'bg-amber-50/50 border-amber-200 shadow-2xs'
                      : item.status === 'syncing'
                      ? 'bg-blue-50/50 border-blue-200 animate-pulse'
                      : item.status === 'failed'
                      ? 'bg-red-50/50 border-red-200'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getItemIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-display font-bold text-gray-900 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">
                            {item.target_table}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                          {item.amount !== undefined && (
                            <span className="font-bold text-gray-900">
                              {formatTsh(item.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Inasubiri
                        </span>
                      )}
                      {item.status === 'syncing' && (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Inapakia
                        </span>
                      )}
                      {item.status === 'synced' && (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Imepakiwa
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Hitilafu
                        </span>
                      )}

                      {/* Retry button if pending or failed */}
                      {(item.status === 'pending' || item.status === 'failed') && item.id && (
                        <button
                          onClick={() => retryItem(item.id!)}
                          disabled={!isOnline}
                          className="p-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors disabled:opacity-50"
                          title="Jaribu kupakia sasa"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete button */}
                      {item.id && (
                        <button
                          onClick={() => deleteItem(item.id!)}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Futa kwenye Outbox"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {item.error_message && (
                    <div className="mt-2 text-[11px] text-red-600 bg-red-100/60 p-1.5 rounded-lg font-medium">
                      Hitilafu: {item.error_message}
                    </div>
                  )}

                  {/* Expand JSON payload button */}
                  <div className="mt-2 pt-1 border-t border-gray-100/60 flex items-center justify-between text-[11px] text-gray-500">
                    <button
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id!)}
                      className="flex items-center gap-1 hover:text-orange-600 font-medium"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>{isExpanded ? 'Ficha Data' : 'Tazama Data (Payload)'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <span className="font-mono text-[10px] text-gray-400">ID: {item.client_tx_id}</span>
                  </div>

                  {/* Expanded JSON viewer */}
                  {isExpanded && (
                    <div className="mt-2 p-2.5 bg-gray-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto max-h-40">
                      <pre>{JSON.stringify(item.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-orange-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-gray-500 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-orange-500" />
            <span>
              Target: <b>Supabase PostgreSQL</b> (Auto-synced with Row-Level Security)
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={closeOutbox}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors"
            >
              Funga
            </button>
            <button
              onClick={handleSyncAll}
              disabled={isSyncing || !isOnline}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sawazisha Zote ({pendingCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
