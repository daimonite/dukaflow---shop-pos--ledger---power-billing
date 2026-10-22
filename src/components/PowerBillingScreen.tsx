import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Zap,
  Edit2,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Share2,
  Lock,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  RotateCcw,
  Printer,
  X
} from 'lucide-react';
import { formatTsh } from '../utils/translations';
import { PowerMember, PowerPeriod, MeterReading, PowerPayment } from '../types';

export const PowerBillingScreen: React.FC = () => {
  const {
    t,
    powerMembers,
    powerPeriods,
    meterReadings,
    powerPayments,
    addPowerMember,
    recordPowerReading,
    recordPowerPayment,
    updatePowerRate,
    closePowerPeriodAndRollOver,
    currentRole
  } = useShop();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const openP = powerPeriods.find(p => p.status === 'open');
    return openP ? openP.id : powerPeriods[0]?.id || '';
  });

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberMeterNo, setNewMemberMeterNo] = useState('');
  const [newMemberRoom, setNewMemberRoom] = useState('');
  const [newMemberInitialReading, setNewMemberInitialReading] = useState('0');

  const [readingModalData, setReadingModalData] = useState<{
    member: PowerMember;
    reading: MeterReading;
  } | null>(null);
  const [readingInput, setReadingInput] = useState('');

  const [paymentModalData, setPaymentModalData] = useState<{
    member: PowerMember;
    reading: MeterReading;
  } | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PowerPayment['payment_method']>('mpesa');
  const [paymentReference, setPaymentReference] = useState('');

  const [showRateModal, setShowRateModal] = useState(false);
  const [rateMode, setRateMode] = useState<'fixed' | 'derived'>('fixed');
  const [rateInput, setRateInput] = useState('413.45');
  const [mainMeterUnitsInput, setMainMeterUnitsInput] = useState('320');
  const [totalLukuBillInput, setTotalLukuBillInput] = useState('150000');

  const activePeriod = powerPeriods.find(p => p.id === selectedPeriodId) || powerPeriods[0];
  const isPeriodClosed = activePeriod?.status === 'closed';

  // Readings for current period
  const currentPeriodReadings = useMemo(() => {
    return meterReadings.filter(r => r.period_id === activePeriod?.id);
  }, [meterReadings, activePeriod]);

  // Aggregate metrics
  const totalUnitsUsed = currentPeriodReadings.reduce((sum, r) => sum + r.units_used, 0);
  const totalBilled = currentPeriodReadings.reduce((sum, r) => sum + r.total_due, 0);
  const totalPaid = currentPeriodReadings.reduce((sum, r) => sum + r.paid_amount, 0);
  const totalOutstanding = currentPeriodReadings.reduce(
    (sum, r) => sum + Math.max(0, r.closing_balance),
    0
  );

  // Unpaid members ("Who Owes Right Now")
  const unpaidMembers = useMemo(() => {
    return currentPeriodReadings.filter(r => r.closing_balance > 0);
  }, [currentPeriodReadings]);

  // Save new reading
  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingModalData) return;
    const currentVal = parseFloat(readingInput);
    if (isNaN(currentVal) || currentVal < readingModalData.reading.previous_reading) {
      alert(`Kipimo cha mwezi huu hakipaswi kuwa chini ya kipimo kilichopita (${readingModalData.reading.previous_reading}).`);
      return;
    }

    recordPowerReading(activePeriod.id, readingModalData.member.id, currentVal);
    setReadingModalData(null);
    setReadingInput('');
  };

  // Save payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalData) return;
    const amt = parseFloat(paymentAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert('Weka kiasi sahihi cha malipo.');
      return;
    }

    recordPowerPayment(
      activePeriod.id,
      paymentModalData.member.id,
      amt,
      paymentMethod,
      paymentReference.trim() || undefined
    );
    setPaymentModalData(null);
    setPaymentAmountInput('');
    setPaymentReference('');
  };

  // Update rate submit
  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(rateInput) || 413.45;
    const mainUnits = parseFloat(mainMeterUnitsInput);
    const totalBill = parseFloat(totalLukuBillInput);

    updatePowerRate(activePeriod.id, rateNum, rateMode, mainUnits, totalBill);
    setShowRateModal(false);
  };

  // Add member submit
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    addPowerMember({
      name: newMemberName.trim(),
      phone: newMemberPhone.trim(),
      meter_no: newMemberMeterNo.trim() || `MTR-${Math.floor(100 + Math.random() * 900)}`,
      room_or_house: newMemberRoom.trim() || 'Chumba',
      initial_reading: parseFloat(newMemberInitialReading) || 0,
    });

    setShowMemberModal(false);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberMeterNo('');
    setNewMemberRoom('');
    setNewMemberInitialReading('0');
  };

  // Close month and roll over
  const handleCloseMonth = () => {
    if (currentRole !== 'admin') {
      alert('Kufunga mwezi na kubeba madeni mbele ni mamlaka ya Admin pekee.');
      return;
    }
    const confirm = window.confirm(
      `Una uhakika unataka kufunga mwezi wa ${activePeriod.month_label}? Madeni na masalio ya kila jirani yatabebwa moja kwa moja kuingia mwezi unaofuata.`
    );
    if (confirm) {
      closePowerPeriodAndRollOver(activePeriod.id);
    }
  };

  // WhatsApp individual statement text
  const getWhatsAppPowerBill = (member: PowerMember, reading: MeterReading) => {
    const text = `*ANKARA YA UMEME WA PAMOJA - ${activePeriod.month_label.toUpperCase()}*%0A------------------------------------%0AJirani: *${member.name}* (${member.room_or_house})%0AMita No: *${member.meter_no}*%0A------------------------------------%0A• Kipimo cha Nyuma: *${reading.previous_reading}*%0A• Kipimo cha Sasa: *${reading.current_reading}*%0A• Uniti Ulizotumia: *${reading.units_used} uniti*%0A• Bei kwa Uniti: *${formatTsh(reading.rate_charged)}*%0A------------------------------------%0A• Gharama ya Mwezi Huu: *${formatTsh(reading.current_charge)}*%0A• Deni Lililobaki Nyuma: *${formatTsh(reading.carried_forward_debt)}*%0A*JUMLA YA KULIPA: ${formatTsh(reading.total_due)}*%0A• Ulicholipa: *${formatTsh(reading.paid_amount)}*%0A*BAKI YA DENI: ${formatTsh(reading.closing_balance)}*%0A------------------------------------%0A${reading.closing_balance <= 0 ? '✅ Umelipa kikamilifu! Asante sana.' : '⚠️ Tafadhali kamilisha malipo ili kununua LUKU ya mwezi.'}`;
    return `https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${text}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">
              {t.powerTitle}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gawana bili ya umeme wa LUKU / TANESCO kwa sub-meters. Madeni yanabebwa mbele kiotomatiki bila kupoteza historia.
          </p>
        </div>

        {/* Period Selector & Admin Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            className="px-3 py-2 bg-orange-50/60 border border-orange-200 rounded-xl text-xs font-bold text-orange-950 focus:outline-hidden"
          >
            {powerPeriods.map(p => (
              <option key={p.id} value={p.id}>
                {p.month_label} {p.status === 'closed' ? '(Imefungwa)' : '(Inaendelea)'}
              </option>
            ))}
          </select>

          {/* Rate setting button */}
          {!isPeriodClosed && (
            <button
              onClick={() => {
                setRateInput(activePeriod.rate_per_unit.toString());
                setShowRateModal(true);
              }}
              className="px-3 py-2 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Kiwango: {formatTsh(activePeriod.rate_per_unit)}/uniti</span>
            </button>
          )}

          {/* Add member button */}
          <button
            onClick={() => setShowMemberModal(true)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ongeza Jirani</span>
          </button>

          {/* Close Month Button (Admin only) */}
          {!isPeriodClosed && (
            <button
              onClick={handleCloseMonth}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs shadow-orange-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Funga Mwezi & Beba Madeni</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Uniti Zote Zilizotumika
          </span>
          <div className="text-2xl font-black text-gray-900 mt-1 font-mono">
            {totalUnitsUsed.toFixed(1)} kWh
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            Kutoka sub-meters zote {currentPeriodReadings.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Jumla ya Ankara ya Mwezi
          </span>
          <div className="text-2xl font-black text-blue-900 mt-1 font-mono">
            {formatTsh(totalBilled)}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">
            Pamoja na madeni ya nyuma
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Kiasi Kilichokusanywa
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {formatTsh(totalPaid)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            Asilimia: {totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100}%
          </span>
        </div>

        <div className={`p-4 rounded-3xl border shadow-xs ${
          totalOutstanding > 0 ? 'bg-red-50/60 border-red-200' : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <span className="text-xs font-semibold uppercase tracking-wider block text-gray-600">
            {t.whoOwesNow} (Madeni)
          </span>
          <div className={`text-2xl font-black mt-1 font-mono ${
            totalOutstanding > 0 ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {formatTsh(totalOutstanding)}
          </div>
          <span className="text-[11px] text-gray-600 mt-0.5 block">
            Majirani {unpaidMembers.length} bado hawajamaliza
          </span>
        </div>
      </div>

      {/* "Who Owes Right Now" Notice Bar */}
      {unpaidMembers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-950">
                Orodha ya Wanaodaiwa Umeme Hivi Sasa ({activePeriod.month_label}):
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {unpaidMembers.map(r => {
                  const m = powerMembers.find(mem => mem.id === r.member_id);
                  return (
                    <span
                      key={r.id}
                      className="bg-white px-2 py-0.5 rounded-lg border border-amber-300 text-xs font-semibold text-amber-900"
                    >
                      {m?.name}: <span className="font-bold font-mono text-red-600">{formatTsh(r.closing_balance)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table: Members & Meter Readings */}
      <div className="bg-white rounded-3xl border border-orange-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-extrabold text-sm text-gray-800">
            Jedwali la Bili na Vipimo vya Mita ({activePeriod.month_label})
          </span>
          {isPeriodClosed && (
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Mwezi Huu Umefungwa
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-orange-50/40 text-gray-500 font-semibold border-b border-orange-100">
              <tr>
                <th className="py-3 px-4">Jirani / Mwanachama</th>
                <th className="py-3 px-3">Mita No / Chumba</th>
                <th className="py-3 px-3 text-right">Kipimo cha Nyuma</th>
                <th className="py-3 px-3 text-right">Kipimo cha Sasa</th>
                <th className="py-3 px-3 text-right">Uniti (kWh)</th>
                <th className="py-3 px-3 text-right">Bili ya Sasa</th>
                <th className="py-3 px-3 text-right">Deni Nyuma</th>
                <th className="py-3 px-3 text-right">Jumla ya Kulipa</th>
                <th className="py-3 px-3 text-right">Kilicholipwa</th>
                <th className="py-3 px-3 text-right">Baki / Salio</th>
                <th className="py-3 px-3 text-center">Hali</th>
                <th className="py-3 px-4 text-center">Vitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentPeriodReadings.map(reading => {
                const member = powerMembers.find(m => m.id === reading.member_id);
                if (!member) return null;

                const isPaid = reading.closing_balance <= 0;
                const isPartial = reading.paid_amount > 0 && reading.closing_balance > 0;
                const hasCredit = reading.closing_balance < 0;

                return (
                  <tr key={reading.id} className="hover:bg-orange-50/20 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{member.name}</div>
                      <div className="text-[10px] text-gray-400">{member.phone}</div>
                    </td>

                    {/* Meter / Room */}
                    <td className="py-3 px-3 text-gray-600">
                      <div className="font-mono font-semibold">{member.meter_no}</div>
                      <div className="text-[10px] text-gray-400">{member.room_or_house}</div>
                    </td>

                    {/* Previous reading */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-gray-500">
                      {reading.previous_reading}
                    </td>

                    {/* Current reading */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                      {reading.current_reading > 0 ? reading.current_reading : '-'}
                    </td>

                    {/* Units used */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-900">
                      {reading.units_used}
                    </td>

                    {/* Current charge */}
                    <td className="py-3 px-3 text-right font-mono text-gray-700">
                      {formatTsh(reading.current_charge)}
                    </td>

                    {/* Carried debt */}
                    <td className="py-3 px-3 text-right font-mono">
                      {reading.carried_forward_debt === 0 ? (
                        <span className="text-gray-400">0</span>
                      ) : reading.carried_forward_debt > 0 ? (
                        <span className="text-red-600 font-bold">+{formatTsh(reading.carried_forward_debt)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Ziada ({formatTsh(Math.abs(reading.carried_forward_debt))})</span>
                      )}
                    </td>

                    {/* Total due */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-gray-900">
                      {formatTsh(reading.total_due)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatTsh(reading.paid_amount)}
                    </td>

                    {/* Closing Balance */}
                    <td className="py-3 px-3 text-right font-mono font-black">
                      {isPaid ? (
                        hasCredit ? (
                          <span className="text-blue-700">Ziada: {formatTsh(Math.abs(reading.closing_balance))}</span>
                        ) : (
                          <span className="text-emerald-700">0 TSh</span>
                        )
                      ) : (
                        <span className="text-red-600">{formatTsh(reading.closing_balance)}</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPartial
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isPaid ? (hasCredit ? 'Ziada' : 'Imelipwa') : isPartial ? 'Nusu' : 'Haijalipwa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* Enter reading button */}
                        {!isPeriodClosed && (
                          <button
                            onClick={() => {
                              setReadingModalData({ member, reading });
                              setReadingInput(reading.current_reading > 0 ? reading.current_reading.toString() : '');
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Weka Kipimo cha Mita"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Record payment button */}
                        {!isPeriodClosed && (
                          <button
                            onClick={() => {
                              setPaymentModalData({ member, reading });
                              setPaymentAmountInput(reading.closing_balance > 0 ? reading.closing_balance.toString() : '');
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Rekodi Malipo ya Umeme"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* WhatsApp share bill */}
                        {member.phone && (
                          <a
                            href={getWhatsAppPowerBill(member, reading)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Tuma Ankara kwa WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Enter Reading */}
      {readingModalData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-1">
              Weka Kipimo cha Mita (Current Reading)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Jirani: <span className="font-bold text-gray-800">{readingModalData.member.name}</span> ({readingModalData.member.meter_no})
            </p>

            <form onSubmit={handleSaveReading} className="space-y-3">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-500 block">Kipimo cha Mwezi Uliopita (Last Reading):</span>
                <span className="font-mono font-bold text-sm text-gray-800">
                  {readingModalData.reading.previous_reading} kWh
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Kipimo cha Mwezi Huu Kwenye Mita:
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={readingInput}
                  onChange={e => setReadingInput(e.target.value)}
                  placeholder="Mf. 1475.0"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 text-sm font-mono font-bold focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {parseFloat(readingInput) > readingModalData.reading.previous_reading && (
                <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                  <div className="flex justify-between">
                    <span>Uniti zilizotumika:</span>
                    <span className="font-mono font-bold">
                      {(parseFloat(readingInput) - readingModalData.reading.previous_reading).toFixed(1)} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gharama ya mwezi huu:</span>
                    <span className="font-mono font-bold">
                      {formatTsh((parseFloat(readingInput) - readingModalData.reading.previous_reading) * activePeriod.rate_per_unit)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReadingModalData(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  Hifadhi Kipimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Power Payment */}
      {paymentModalData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-1">
              Rekodi Malipo ya Umeme
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Jirani: <span className="font-bold text-gray-800">{paymentModalData.member.name}</span>
            </p>

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100 text-xs">
                <span className="text-gray-500 block">Jumla Anayodaiwa Mwezi Huu:</span>
                <span className="font-mono font-black text-sm text-orange-700">
                  {formatTsh(paymentModalData.reading.closing_balance)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kiasi Kilicholipwa (TSh):</label>
                <input
                  type="number"
                  required
                  value={paymentAmountInput}
                  onChange={e => setPaymentAmountInput(e.target.value)}
                  placeholder="20000"
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-sm font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Njia ya Malipo:</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="cash">Taslimu (Cash)</option>
                  <option value="tigopesa">Tigo Pesa</option>
                  <option value="airtel">Airtel Money</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Kumbukumbu / Reference (Hiari):</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="Mf. M-Pesa Code QK8819"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalData(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Thibitisha Malipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Power Rate (Fixed or Derived Line Loss Mode) */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-1">
              Rekebisha Kiwango cha Bei ya Umeme (Tariff Rate)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Mwezi wa <span className="font-bold text-gray-800">{activePeriod.month_label}</span>
            </p>

            <form onSubmit={handleSaveRate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mfumo wa Ukokotoaji:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRateMode('fixed')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      rateMode === 'fixed'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Kiwango Kisichobadilika (Fixed Rate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateMode('derived')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      rateMode === 'derived'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Kiwango cha Upotevu (Line Loss Share)
                  </button>
                </div>
              </div>

              {rateMode === 'fixed' ? (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Bei kwa kila uniti ya umeme (TSh):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rateInput}
                    onChange={e => setRateInput(e.target.value)}
                    placeholder="413.45"
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 text-sm font-mono font-bold focus:border-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">
                    Bei ya kawaida ya LUKU Tanzania ni takriban 413.45 TSh kwa uniti moja.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Jumla ya Pesa Zilizotumika Kununua Tokeni za LUKU (TSh):
                    </label>
                    <input
                      type="number"
                      required
                      value={totalLukuBillInput}
                      onChange={e => setTotalLukuBillInput(e.target.value)}
                      placeholder="150000"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Uniti Zilizohesabiwa kwenye Mita Kuu (Main Meter):
                    </label>
                    <input
                      type="number"
                      required
                      value={mainMeterUnitsInput}
                      onChange={e => setMainMeterUnitsInput(e.target.value)}
                      placeholder="320"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold"
                    />
                  </div>

                  {parseFloat(mainMeterUnitsInput) > 0 && (
                    <div className="p-2.5 bg-blue-50 rounded-xl text-xs text-blue-900 font-semibold">
                      Bei itakayotumika: {(parseFloat(totalLukuBillInput) / parseFloat(mainMeterUnitsInput)).toFixed(2)} TSh / uniti (inagawa upotevu wa nyaya kwa usawa).
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  Hifadhi Kiwango
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Power Member */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-900 mb-3">Ongeza Jirani / Chumba cha Umeme</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Jina Kamili:</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="Mf. Juma Mwangi au Asha"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Simu (Kwa ajili ya SMS/WhatsApp):</label>
                <input
                  type="text"
                  value={newMemberPhone}
                  onChange={e => setNewMemberPhone(e.target.value)}
                  placeholder="0754 991 122"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Namba ya Sub-Meter:</label>
                <input
                  type="text"
                  value={newMemberMeterNo}
                  onChange={e => setNewMemberMeterNo(e.target.value)}
                  placeholder="SUB-MTR-06"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Chumba / Fremu:</label>
                <input
                  type="text"
                  value={newMemberRoom}
                  onChange={e => setNewMemberRoom(e.target.value)}
                  placeholder="Mf. Chumba C2 (Mbele)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kipimo cha Kuanzia (kWh):</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMemberInitialReading}
                  onChange={e => setNewMemberInitialReading(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  Hifadhi Jirani
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
