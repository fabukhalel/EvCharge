import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard, ListOrdered, CalendarDays, Route, Settings, Plus, Download, BatteryCharging, ChevronDown,
} from 'lucide-react';
import Kpis from './components/Kpis.jsx';
import TypeCompare from './components/TypeCompare.jsx';
import Charts from './components/Charts.jsx';
import ChargeList from './components/ChargeList.jsx';
import ChargeForm from './components/ChargeForm.jsx';
import CalendarView from './components/CalendarView.jsx';
import TripEstimator from './components/TripEstimator.jsx';
import SettingsView from './components/SettingsView.jsx';
import { Empty, Toast, Segmented } from './components/ui.jsx';
import { useConfirm } from './components/ConfirmSheet.jsx';
import { loadState, saveState, makeBackup, parseBackup, DEFAULT_SETTINGS } from './lib/storage.js';
import { computeSegments, summarize, byMonth, byType, sortChrono } from './lib/calc.js';
import { chargesToCsv, saveFile } from './lib/csv.js';
import { makeDemoCharges } from './lib/demo.js';
import { monthLabel, todayStr, num } from './lib/format.js';

const TABS = [
  { id: 'home', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'list', label: 'الشحنات', icon: ListOrdered },
  { id: 'calendar', label: 'التقويم', icon: CalendarDays },
  { id: 'trip', label: 'الرحلات', icon: Route },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function App() {
  // أول فتح: نعرض بيانات تجريبية موسومة بوضوح حتى يرى المستخدم ما يفعله التطبيق
  const [state, setState] = useState(() => {
    const s = loadState();
    if (s.fresh) return { settings: s.settings, charges: makeDemoCharges(s.settings.capacity, s.settings), demo: true };
    return { settings: s.settings, charges: s.charges, demo: s.demo };
  });
  const { settings, charges } = state;
  const [ask, confirmNode] = useConfirm();
  const [tab, setTab] = useState('home');
  const [month, setMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [typeFilter, setTypeFilter] = useState('all'); // all | home | fast
  const [form, setForm] = useState({ open: false, charge: null });
  const [toast, setToast] = useState('');
  const [settingsKey, setSettingsKey] = useState(0);
  const toastTimer = useRef(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  // ---- البيانات المشتقة ----
  const allSegments = useMemo(() => computeSegments(charges, settings.capacity), [charges, settings.capacity]);

  const monthKeys = useMemo(() => {
    const set = new Set(charges.map((c) => c.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [charges]);

  // إن حُذفت كل شحنات الشهر المحدد نعود إلى "الكل"
  useEffect(() => {
    if (month !== 'all' && !monthKeys.includes(month)) setMonth('all');
  }, [month, monthKeys]);

  const inMonth = useCallback((date) => month === 'all' || date.startsWith(month), [month]);
  const monthCharges = useMemo(() => charges.filter((c) => inMonth(c.date)), [charges, inMonth]);
  const monthSegments = useMemo(() => allSegments.filter((s) => inMonth(s.date)), [allSegments, inMonth]);

  const viewCharges = useMemo(
    () => (typeFilter === 'all' ? monthCharges : monthCharges.filter((c) => c.type === typeFilter)),
    [monthCharges, typeFilter],
  );
  const viewSegments = useMemo(
    () => (typeFilter === 'all' ? monthSegments : monthSegments.filter((s) => s.type === typeFilter)),
    [monthSegments, typeFilter],
  );

  const summary = useMemo(() => summarize(viewCharges, viewSegments), [viewCharges, viewSegments]);
  const typeData = useMemo(() => byType(monthCharges), [monthCharges]);
  const months = useMemo(() => byMonth(charges, allSegments), [charges, allSegments]);
  const lastCharge = useMemo(() => sortChrono(charges).at(-1) || null, [charges]);

  // ---- العمليات ----
  const openAdd = () => setForm({ open: true, charge: null });
  const openEdit = (c) => setForm({ open: true, charge: c });
  const closeForm = () => setForm({ open: false, charge: null });

  const saveCharge = (c) => {
    setState((s) => {
      // أول شحنة حقيقية تستبدل البيانات التجريبية
      if (s.demo && !s.charges.some((x) => x.id === c.id)) return { ...s, demo: false, charges: [c] };
      const exists = s.charges.some((x) => x.id === c.id);
      return { ...s, charges: exists ? s.charges.map((x) => (x.id === c.id ? c : x)) : [...s.charges, c] };
    });
    closeForm();
    notify('تم حفظ الشحنة ✓');
  };

  const deleteCharge = (id) => {
    setState((s) => ({ ...s, charges: s.charges.filter((x) => x.id !== id) }));
    closeForm();
    notify('تم حذف الشحنة');
  };

  const changeSettings = (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const stamp = () => todayStr();

  const exportCsv = async () => {
    try {
      await saveFile(`ev-charges-${stamp()}.csv`, chargesToCsv(charges));
      notify('تم تصدير ملف CSV');
    } catch {
      notify('تعذر تصدير الملف');
    }
  };

  const exportBackup = async () => {
    try {
      await saveFile(`ev-backup-${stamp()}.json`, makeBackup(state), 'application/json');
      notify('تم حفظ النسخة الاحتياطية');
    } catch {
      notify('تعذر حفظ النسخة');
    }
  };

  const importBackup = async (file) => {
    try {
      const data = parseBackup(await file.text());
      if (charges.length && !state.demo && !(await ask(`سيتم استبدال بياناتك الحالية بـ ${data.charges.length} شحنة من النسخة. متابعة؟`, 'استبدال'))) return;
      setState({ ...data, demo: false });
      setSettingsKey((k) => k + 1);
      notify(`تمت استعادة ${data.charges.length} شحنة`);
    } catch (e) {
      notify(e instanceof SyntaxError ? 'الملف تالف' : e.message || 'تعذر قراءة الملف');
    }
  };

  const loadDemo = async () => {
    if (charges.length && !state.demo && !(await ask('سيتم استبدال شحناتك الحالية ببيانات تجريبية. متابعة؟', 'استبدال'))) return;
    setState((s) => ({ ...s, demo: true, charges: makeDemoCharges(s.settings.capacity, s.settings) }));
    setMonth('all');
    notify('تم تحميل بيانات تجريبية');
  };

  const clearAll = async () => {
    if (!(await ask('حذف كل الشحنات نهائياً؟ لا يمكن التراجع.', 'حذف الكل'))) return;
    setState((s) => ({ ...s, demo: false, charges: [] }));
    notify('تم حذف كل الشحنات');
  };

  const startFresh = () => {
    setState((s) => ({ ...s, demo: false, charges: [] }));
    setMonth('all');
    notify('بدأت بسجل فارغ');
  };

  const resetSettings = () => {
    setState((s) => ({ ...s, settings: { ...DEFAULT_SETTINGS } }));
    setSettingsKey((k) => k + 1);
    notify('تمت استعادة الإعدادات الافتراضية');
  };

  const showFilters = tab === 'home' || tab === 'list';

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg pb-32">
      {/* الترويسة */}
      <header className="safe-top sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-home text-ink-950 shadow-glow">
              <BatteryCharging size={22} />
            </div>
            <div>
              <h1 className="text-[17px] font-extrabold leading-tight">
                {settings.carName} <span className="text-accent">{settings.carModel}</span>
              </h1>
              <p className="tabular text-[11px] text-slate-400">بطارية {num(settings.capacity, 2)} kWh · {charges.length} شحنة</p>
            </div>
          </div>
          <button className="btn-ghost !p-2.5" onClick={exportCsv} disabled={!charges.length} aria-label="تصدير CSV" title="تصدير CSV">
            <Download size={18} />
          </button>
        </div>

        {showFilters && charges.length > 0 && (
          <div className="space-y-2 px-4 pb-3">
            <div className="relative">
              <select
                className="field appearance-none pe-9 font-bold"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="فلتر الشهر"
              >
                <option value="all">كل الأشهر</option>
                {monthKeys.map((k) => (
                  <option key={k} value={k}>{monthLabel(k)}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <Segmented
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'all', label: 'الكل' },
                { value: 'home', label: 'منزلي', activeClass: 'bg-home/20 text-home' },
                { value: 'fast', label: 'سريع', activeClass: 'bg-fast/20 text-fast' },
              ]}
            />
          </div>
        )}
      </header>

      <main className="space-y-4 px-4 pt-4">
        {state.demo && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-fast/40 bg-fast/10 px-3.5 py-2.5">
            <p className="text-xs font-medium leading-relaxed text-fast">أمثلة تجريبية، وليست بياناتك. أول شحنة تضيفها تستبدلها.</p>
            <button className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs" onClick={startFresh}>ابدأ بسجل فارغ</button>
          </div>
        )}
        {tab === 'home' &&
          (charges.length === 0 ? (
            <Empty icon={BatteryCharging} title="مرحباً بك في لوحتك الذكية" hint="سجّل شحنتك الأولى أو حمّل بيانات تجريبية لمعاينة التطبيق.">
              <div className="flex flex-wrap justify-center gap-2">
                <button className="btn-primary" onClick={openAdd}><Plus size={17} /> إضافة شحنة</button>
                <button className="btn-ghost" onClick={loadDemo}>بيانات تجريبية</button>
              </div>
            </Empty>
          ) : (
            <>
              <Kpis summary={summary} currency={settings.currency} />
              <TypeCompare data={typeData} currency={settings.currency} />
              <Charts months={months} currency={settings.currency} />
            </>
          ))}

        {tab === 'list' && (
          <ChargeList charges={viewCharges} segments={viewSegments} currency={settings.currency} onEdit={openEdit} onAdd={openAdd} />
        )}

        {tab === 'calendar' && (
          <CalendarView
            key={month}
            charges={charges}
            segments={allSegments}
            currency={settings.currency}
            onEdit={openEdit}
            initialMonth={month !== 'all' ? month : monthKeys[0]}
          />
        )}

        {tab === 'trip' && <TripEstimator charges={charges} segments={allSegments} settings={settings} />}

        {tab === 'settings' && (
          <SettingsView
            key={settingsKey}
            settings={settings}
            count={charges.length}
            onChange={changeSettings}
            onReset={resetSettings}
            onExportCsv={exportCsv}
            onExportBackup={exportBackup}
            onImportBackup={importBackup}
            onDemo={loadDemo}
            onClear={clearAll}
          />
        )}
      </main>

      {/* زر الإضافة العائم */}
      {tab !== 'settings' && (
        <button
          onClick={openAdd}
          aria-label="إضافة شحنة"
          className="fixed bottom-[88px] end-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-home text-ink-950 shadow-glow transition active:scale-90"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      )}

      {/* شريط التنقل السفلي */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink-950/90 backdrop-blur-xl" aria-label="التنقل الرئيسي">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition ${active ? 'text-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon size={21} className={active ? 'drop-shadow-[0_0_8px_rgba(34,211,238,.7)]' : ''} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <ChargeForm
        open={form.open}
        onClose={closeForm}
        onSave={saveCharge}
        onDelete={deleteCharge}
        initial={form.charge}
        settings={settings}
        lastCharge={lastCharge}
      />
      {confirmNode}
      <Toast message={toast} />
    </div>
  );
}
