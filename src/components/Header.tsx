import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useSync } from '../context/SyncContext';
import {
  Store,
  Shield,
  UserCheck,
  Zap,
  Globe,
  Bell,
  Lock,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  Cloud,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Menu,
} from 'lucide-react';
import { formatTsh } from '../utils/translations';

export const Header: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMenuClick: () => void;
}> = ({ activeTab, setActiveTab, onMenuClick }) => {
  const {
    language,
    setLanguage,
    t,
    currentRole,
    setCurrentRole,
    currentUser,
    sales,
    auditLogs,
    cashRegister,
    customers,
    suppliers,
    products
  } = useShop();

  const { isOnline, isSyncing, pendingCount, openOutbox, isSimulatedOffline } = useSync();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Compute today's metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesList = sales.filter(s => !s.voided_at && s.sold_at.startsWith(todayStr));
  const todayRevenue = todaySalesList.reduce((sum, s) => sum + s.total, 0);
  const todayProfit = todaySalesList.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.line_profit, 0), 0);

  // Debt totals
  const totalCustomerDebt = customers.reduce((sum, c) => sum + Math.max(0, c.current_balance), 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + Math.max(0, s.current_balance), 0);
  const lowStockCount = products.filter(p => p.stock_qty <= p.reorder_level).length;

  // Unread or high severity alerts
  const alertLogs = auditLogs.filter(l => l.severity === 'alert').slice(0, 5);

  const handleRoleSelect = (role: 'admin' | 'manager' | 'power_admin') => {
    if (role === 'admin' && currentRole !== 'admin') {
      if (pinInput !== '1234') {
        setPinError(true);
        return;
      }
    }
    setCurrentRole(role);
    setShowRoleModal(false);
    setPinInput('');
    setPinError(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
      {/* Top Banner with branding and quick stats */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Hamburger + Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            {/* Hamburger menu button (opens sidebar) */}
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 transition-all btn-press"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1WqfVNZWOzPRUIq-IOOGmS4dWIh3bgUArKpuvKcxbiupsXxZq7kl2bcdiTcGM59kBT14Wj0UYum6q4zSjWOAUbLQVifeeSGnMAZEK87ipqiT4nbsMKk9NcfRKUXF696hmS0X_-PjrDE_INa3qnPjC6477PIIH--Ggp2gXo-MlTm9q5CNkAItcbV7BZ9Uzx6PGnAD7tX04njAd_PVzKMD7HobdIJYg03Mf3CGhEkmvt9EQJ2ipUSyICEAHA"
              alt="DukaSmart Logo"
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-gray-900">
                  Duka<span className="text-orange-600">Smart</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full">
                  Neema Duka
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mtandaoni
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block truncate max-w-xs font-medium">
                Neema Super Duka · Arusha · {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Metrics Ticker (Hidden on very small screens, visible on tablet+) */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="bg-orange-50/80 border border-orange-100/80 px-3 py-1.5 rounded-xl">
              <div className="text-gray-500 font-medium">{t.todaySales}</div>
              <div className="text-orange-700 font-bold text-sm">{formatTsh(todayRevenue)}</div>
            </div>

            {currentRole === 'admin' && (
              <div className="bg-emerald-50/80 border border-emerald-100/80 px-3 py-1.5 rounded-xl">
                <div className="text-gray-500 font-medium">{t.todayProfit}</div>
                <div className="text-emerald-700 font-bold text-sm">{formatTsh(todayProfit)}</div>
              </div>
            )}

            <div className="bg-amber-50/80 border border-amber-100/80 px-3 py-1.5 rounded-xl">
              <div className="text-gray-500 font-medium">{t.debtOwedToUs}</div>
              <div className="text-amber-800 font-bold text-sm">{formatTsh(totalCustomerDebt)}</div>
            </div>

            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('stock')}
                className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-red-500" />
                <span className="font-bold">{lowStockCount} {t.lowStockNotice}</span>
              </button>
            )}
          </div>

          {/* Action buttons: Role, Language, Notifications, Sync/Outbox */}
          <div className="flex items-center gap-2">
            
            {/* Sync & Outbox Status Indicator */}
            <button
              onClick={openOutbox}
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                !isOnline
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs'
                  : isSyncing
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                  : pendingCount > 0
                  ? 'bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100 shadow-2xs'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Hali ya Mtandao & Sanduku la Miamala (Dexie Outbox)"
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Offline</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="hidden sm:inline text-blue-800">Inapakia...</span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  <Database className="w-3.5 h-3.5 text-orange-600" />
                  <span className="hidden sm:inline">Outbox</span>
                  <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold">
                    {pendingCount}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Mtandaoni</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-orange-50 hover:text-orange-600 transition-colors text-gray-700"
              title="Badili Lugha / Switch Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{language}</span>
            </button>

            {/* Audit Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 transition-colors"
                title="Arifa za Mabadiliko / Audit Alerts"
              >
                <Bell className="w-4 h-4" />
                {alertLogs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {alertLogs.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-bold text-xs text-gray-800">Arifa Muhimu za Mfumo (Audit)</span>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('admin');
                      }}
                      className="text-[11px] text-orange-600 hover:underline font-semibold"
                    >
                      Tazama Zote
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {alertLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">Hakuna arifa za dharura kwa sasa.</p>
                    ) : (
                      alertLogs.map(log => (
                        <div key={log.id} className="p-2 bg-orange-50/60 rounded-xl border border-orange-100 text-xs">
                          <div className="flex items-center justify-between font-semibold text-orange-950">
                            <span>{log.action}</span>
                            <span className="text-[10px] text-gray-500">{new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-700 mt-0.5 text-[11px]">{log.reason}</p>
                          <div className="text-[10px] text-gray-400 mt-1">na {log.user_name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <button
              onClick={() => setShowRoleModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                currentRole === 'admin'
                  ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  : currentRole === 'manager'
                  ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              {currentRole === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-purple-600" />
              ) : currentRole === 'manager' ? (
                <UserCheck className="w-3.5 h-3.5 text-orange-600" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span className="capitalize">{currentRole === 'admin' ? 'Admin' : currentRole === 'manager' ? 'Meneja' : 'Umeme'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Role Switch Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 mb-1">{t.switchRole}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Chagua nafasi unayofanyia kazi dukani.
            </p>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleRoleSelect('manager')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  currentRole === 'manager'
                    ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-semibold">{t.manager}</div>
                    <div className="text-[11px] text-gray-500">Kuuza, kuweka matumizi, kubadili bei (inalogiwa)</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('admin')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  currentRole === 'admin'
                    ? 'border-purple-500 bg-purple-50/50 text-purple-950 font-bold'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-semibold">{t.admin}</div>
                    <div className="text-[11px] text-gray-500">Mamlaka kamili, kuona audit log, kufunga miezi ya umeme</div>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => handleRoleSelect('power_admin')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  currentRole === 'power_admin'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-950 font-bold'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-semibold">{t.powerAdmin}</div>
                    <div className="text-[11px] text-gray-500">Kusimamia namba za mita na bili za majirani</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Admin PIN input if trying to switch to Admin */}
            {currentRole !== 'admin' && (
              <div className="mb-4 bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  {t.enterPin}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="PIN: 1234"
                  className="w-full text-center tracking-widest text-lg font-mono px-3 py-1.5 rounded-xl border border-purple-200 bg-white focus:outline-orange-500"
                />
                {pinError && (
                  <p className="text-red-600 text-xs mt-1 text-center font-medium">PIN sio sahihi (Tumia 1234)</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setPinInput('');
                  setPinError(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
