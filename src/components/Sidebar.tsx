import React, { useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { useSync } from '../context/SyncContext';
import {
  X,
  ShoppingCart,
  Calendar,
  Package,
  Users,
  Wallet,
  FileText,
  Zap,
  BarChart3,
  Shield,
  Store,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Wifi,
  WifiOff,
  Cloud,
  UserCheck,
} from 'lucide-react';
import { formatTsh } from '../utils/translations';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenRoleModal?: () => void;
}

interface NavGroup {
  label: string;
  items: {
    id: string;
    label: string;
    labelSw?: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    description?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, onClose, onNavigate, onOpenRoleModal }) => {
  const { t, currentRole, currentUser, settings, products, customers, sales, auditLogs } = useShop();
  const { isOnline, pendingCount } = useSync();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = React.useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = sales
    .filter(s => !s.voided_at && s.sold_at.startsWith(todayStr))
    .reduce((sum, s) => sum + s.total, 0);
  const todayProfit = sales
    .filter(s => !s.voided_at && s.sold_at.startsWith(todayStr))
    .reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.line_profit, 0), 0);

  const lowStockCount  = products.filter(p => p.stock_qty <= p.reorder_level).length;
  const debtorsCount   = customers.filter(c => c.current_balance > 0).length;
  const alertCount     = auditLogs.filter(l => l.severity === 'alert').length;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 220);
  };

  const handleNavigate = (tab: string) => {
    onNavigate(tab);
    handleClose();
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen && !closing) return null;

  const navGroups: NavGroup[] = [
    {
      label: 'Mauzo & Fedha',
      items: [
        { id: 'pos',      label: 'Mauzo ya Haraka',   icon: ShoppingCart, description: '10-Second POS Sale' },
        { id: 'calendar', label: 'Dashibodi / Kalenda', icon: Calendar,    description: 'Daily Revenue & Calendar' },
        { id: 'analytics',label: 'Takwimu & Faida',    icon: BarChart3,   description: 'Profit Analytics' },
      ],
    },
    {
      label: 'Stoo & Ununuzi',
      items: [
        { id: 'stock',    label: 'Stoo & Bidhaa',     icon: Package,  badge: lowStockCount, badgeColor: 'bg-red-500',   description: 'Inventory & Pricing' },
        { id: 'purchases',label: 'Ununuzi wa Mzigo',  icon: FileText,                                                   description: 'Purchases & Suppliers' },
      ],
    },
    {
      label: 'Madeni & Matumizi',
      items: [
        { id: 'debtors',  label: 'Madeni & Wasambazaji', icon: Users, badge: debtorsCount, badgeColor: 'bg-amber-500', description: 'Customer & Supplier Ledger' },
        { id: 'expenses', label: 'Matumizi & Mwenyewe',  icon: Wallet,                                                 description: 'Expenses & Owner Drawings' },
      ],
    },
    {
      label: 'Umeme & Usimamizi',
      items: [
        { id: 'power', label: 'Bili ya Umeme (LUKU)', icon: Zap, description: 'Sub-Meter Power Billing' },
        { id: 'admin', label: 'Ukaguzi & Usimamizi',  icon: Shield, badge: alertCount, badgeColor: 'bg-purple-600', description: 'Audit Log & Roles' },
      ],
    },
  ];

  const roleColor = currentRole === 'admin' ? 'from-purple-600 to-purple-800' :
                    currentRole === 'manager' ? 'from-orange-500 to-amber-600' :
                    'from-blue-500 to-blue-700';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 modal-backdrop z-40 ${closing ? 'overlay-out' : 'overlay-in'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 flex flex-col shadow-2xl overflow-hidden ${
          closing ? 'sidebar-close' : 'sidebar-open'
        }`}
        role="navigation"
        aria-label="Main Navigation"
      >
        {/* ── Sidebar Header ── */}
        <div className={`bg-gradient-to-br ${roleColor} p-4 pt-10 pb-5 flex-shrink-0`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-extrabold text-white text-lg leading-tight">
                  Duka<span className="text-white/80">Smart</span>
                </div>
                <div className="text-white/70 text-[11px] font-medium truncate max-w-[190px]">
                  {settings.storeName} · {settings.storeLocation}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* User Role Card - Clickable to switch role */}
          <button
            type="button"
            onClick={() => {
              handleClose();
              onOpenRoleModal?.();
            }}
            className="w-full text-left bg-white/15 hover:bg-white/25 rounded-2xl p-3 backdrop-blur-sm transition-all border border-white/10 btn-press group cursor-pointer"
            title="Bofya kubadili nafasi (Admin / Meneja / Umeme)"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white/80 text-[10px] font-semibold uppercase tracking-wider">Mtumiaji & Nafasi</span>
              </div>
              <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full group-hover:bg-white/30 transition-colors">
                Badili
              </span>
            </div>
            <div className="text-white font-bold text-sm">{currentUser.name}</div>
            <div className="text-white/90 text-xs mt-0.5 font-medium">
              {currentRole === 'admin' ? '🔐 Admin — Mamlaka Kamili' :
               currentRole === 'manager' ? '👤 Meneja — Uuzaji & Stoo' :
               '⚡ Msimamizi wa Umeme'}
            </div>
          </button>
        </div>

        {/* ── Quick Stats Strip ── */}
        <div className="flex items-stretch bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 p-2.5 text-center border-r border-gray-100">
            <div className="text-[10px] text-gray-500 font-medium">Leo</div>
            <div className="text-orange-700 font-bold text-sm font-mono">{formatTsh(todayRevenue)}</div>
          </div>
          {currentRole === 'admin' && (
            <div className="flex-1 p-2.5 text-center border-r border-gray-100">
              <div className="text-[10px] text-gray-500 font-medium">Faida</div>
              <div className="text-emerald-700 font-bold text-sm font-mono">{formatTsh(todayProfit)}</div>
            </div>
          )}
          <div className="flex-1 p-2.5 text-center">
            <div className="text-[10px] text-gray-500 font-medium">Mtandao</div>
            <div className={`font-bold text-xs flex items-center justify-center gap-1 mt-0.5 ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
              {pendingCount > 0 && (
                <span className="bg-orange-500 text-white text-[9px] px-1 rounded-full font-mono">{pendingCount}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Navigation Groups ── */}
        <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-1">
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {group.label}
              </div>
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 relative group btn-press ${
                      isActive
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {/* Active left border */}
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-orange-500 rounded-r-full" />
                    )}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-orange-500 shadow-md shadow-orange-500/30' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold leading-tight ${isActive ? 'text-orange-700' : ''}`}>
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate">{item.description}</div>
                      )}
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-gray-400'} animate-badge-bounce`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Sidebar Footer ── */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4">
          {/* Low stock alert */}
          {lowStockCount > 0 && (
            <button
              onClick={() => handleNavigate('stock')}
              className="w-full flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs font-semibold mb-3 hover:bg-red-100 transition-colors btn-press"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              {lowStockCount} bidhaa zina stoo ndogo! Agiza sasa.
              <ChevronRight className="w-3 h-3 ml-auto" />
            </button>
          )}
          <div className="text-[10px] text-gray-400 text-center">
            DukaSmart v1.0 · Arusha, Tanzania 🇹🇿
          </div>
        </div>
      </aside>
    </>
  );
};
