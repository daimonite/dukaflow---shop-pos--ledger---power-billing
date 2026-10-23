import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { UserRole } from '../types';
import { Modal } from './Modal';
import { Shield, UserCheck, Zap, Lock, X } from 'lucide-react';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({ isOpen, onClose }) => {
  const { currentRole, setCurrentRole, t } = useShop();
  const [targetRole, setTargetRole] = useState<UserRole>(currentRole);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Sync targetRole when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetRole(currentRole);
      setPinInput('');
      setPinError(false);
    }
  }, [isOpen, currentRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetRole === 'admin' && currentRole !== 'admin') {
      if (pinInput !== '1234') {
        setPinError(true);
        return;
      }
    }

    setCurrentRole(targetRole);
    onClose();
    setPinInput('');
    setPinError(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">{t.switchRole}</h3>
            <p className="text-xs text-gray-500">Chagua nafasi unayofanyia kazi dukani.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Cards */}
        <div className="space-y-2.5">
          {/* Manager Option */}
          <button
            type="button"
            onClick={() => {
              setTargetRole('manager');
              setPinError(false);
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              targetRole === 'manager'
                ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold shadow-xs'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  targetRole === 'manager' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                }`}
              >
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {t.manager}
                  {currentRole === 'manager' && (
                    <span className="text-[10px] font-semibold bg-orange-200 text-orange-800 px-1.5 py-0.2 rounded-full">
                      Inatumika sasa
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500">Kuuza, kuweka matumizi, kubadili bei</div>
              </div>
            </div>
          </button>

          {/* Admin Option */}
          <button
            type="button"
            onClick={() => {
              setTargetRole('admin');
              setPinError(false);
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              targetRole === 'admin'
                ? 'border-purple-500 bg-purple-50/70 text-purple-950 font-bold shadow-xs'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  targetRole === 'admin' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {t.admin}
                  {currentRole === 'admin' && (
                    <span className="text-[10px] font-semibold bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded-full">
                      Inatumika sasa
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500">Mamlaka kamili, kuona audit log, kufunga miezi</div>
              </div>
            </div>
            <Lock className="w-4 h-4 text-gray-400" />
          </button>

          {/* Umeme / Power Admin Option */}
          <button
            type="button"
            onClick={() => {
              setTargetRole('power_admin');
              setPinError(false);
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              targetRole === 'power_admin'
                ? 'border-blue-500 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  targetRole === 'power_admin' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {t.powerAdmin}
                  {currentRole === 'power_admin' && (
                    <span className="text-[10px] font-semibold bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded-full">
                      Inatumika sasa
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500">Kusimamia namba za mita na bili za majirani</div>
              </div>
            </div>
          </button>
        </div>

        {/* Admin PIN input if targetRole is admin and currentRole is not admin */}
        {targetRole === 'admin' && currentRole !== 'admin' && (
          <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 space-y-2 animate-in fade-in duration-150">
            <label className="block text-xs font-bold text-purple-950">
              Weka PIN ya Admin (1234):
            </label>
            <input
              type="password"
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="1234"
              className="w-full text-center tracking-widest text-2xl font-mono px-3 py-2 rounded-xl border border-purple-300 bg-white focus:outline-purple-500 text-purple-950 font-bold shadow-xs"
            />
            {pinError && (
              <p className="text-red-600 text-xs text-center font-bold">
                ❌ PIN sio sahihi! (Tumia PIN: 1234)
              </p>
            )}
            <p className="text-[11px] text-purple-800 text-center font-medium">
              Ingiza PIN <b>1234</b> kisha bofya kitufe cha kuthibitisha hapa chini.
            </p>
          </div>
        )}

        {/* Action Buttons with explicit confirmation */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
          >
            {t.cancel}
          </button>

          {targetRole === currentRole ? (
            <span className="px-4 py-2.5 text-xs font-bold text-gray-400 bg-gray-100 rounded-xl">
              Nafasi ya Sasa
            </span>
          ) : targetRole === 'admin' ? (
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer btn-press"
            >
              <Lock className="w-4 h-4" />
              <span>Thibitisha & Badili kuwa Admin</span>
            </button>
          ) : targetRole === 'manager' ? (
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition-all cursor-pointer btn-press"
            >
              <UserCheck className="w-4 h-4" />
              <span>Thibitisha & Badili kuwa Meneja</span>
            </button>
          ) : (
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all cursor-pointer btn-press"
            >
              <Zap className="w-4 h-4" />
              <span>Thibitisha & Badili kuwa Umeme</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
