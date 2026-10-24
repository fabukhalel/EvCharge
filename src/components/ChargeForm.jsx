import React, { useMemo, useState } from 'react';
import { Home, Zap, Save, Trash2 } from 'lucide-react';
import { Sheet, Segmented } from './ui.jsx';
import { energyFromSoc, round } from '../lib/calc.js';
import { parseNum, todayStr, nowTime, fix } from '../lib/format.js';
import { uid } from '../lib/storage.js';

const clean = (n, d) => (n == null ? '' : String(round(n, d)));

function initState(initial, settings, lastCharge) {
  if (initial) {
    return {
      date: initial.date,
      time: initial.time,
      type: initial.type,
      before: String(initial.socBefore),
      after: String(initial.socAfter),
      energyStr: initial.energyManual ? clean(initial.energyKwh, 2) : '',
      costMode: 'total',
      priceStr: clean(initial.pricePerKwh, 4),
      totalStr: clean(initial.totalCost, 3),
      odo: initial.odometer != null ? String(initial.odometer) : '',
      note: initial.note || '',
    };
  }
  return {
    date: todayStr(),
    time: nowTime(),
    type: 'home',
    before: '',
    after: '',
    energyStr: '',
    costMode: 'price',
    priceStr: '',
    totalStr: '',
    odo: '',
    note: '',
  };
}

export default function ChargeForm({ open, onClose, onSave, onDelete, initial, settings, lastCharge }) {
  // key على الـ Sheet يعيد تهيئة الحالة عند كل فتح
  return (
    <Sheet open={open} onClose={onClose} title={initial ? 'تعديل الشحنة' : 'إضافة شحنة'}>
      {open && (
        <Inner
          key={initial ? initial.id : 'new'}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          initial={initial}
          settings={settings}
          lastCharge={lastCharge}
        />
      )}
    </Sheet>
  );
}

function Inner({ onClose, onSave, onDelete, initial, settings, lastCharge }) {
  const [f, setF] = useState(() => initState(initial, settings, lastCharge));
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const set =(k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const capacity = initial?.capacity ?? settings.capacity;
  const defaultPrice = f.type === 'fast' ? settings.fastPrice : settings.homePrice;

  const before = parseNum(f.before);
  const after = parseNum(f.after);
  const socValid = before != null && after != null && before >= 0 && after <= 100 && after > before;

  const autoEnergy = socValid ? energyFromSoc(before, after, capacity) : null;
  const manualEnergy = parseNum(f.energyStr);
  const energy = manualEnergy != null && manualEnergy > 0 ? manualEnergy : autoEnergy;

  // التكلفة: إدخال السعر => المجموع تلقائي، أو إدخال المجموع => السعر تلقائي
  const typedPrice = parseNum(f.priceStr);
  const typedTotal = parseNum(f.totalStr);
  let price = null;
  let total = null;
  if (f.costMode === 'price') {
    price = typedPrice != null ? typedPrice : defaultPrice;
    total = energy != null && price != null ? energy * price : null;
  } else {
    total = typedTotal;
    price = energy && total != null ? total / energy : null;
  }

  const submit = (e) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setError('اختر تاريخاً صحيحاً');
    if (before == null || after == null) return setError('أدخل نسبة الشحن قبل وبعد');
    if (before < 0 || after > 100) return setError('النسبة يجب أن تكون بين 0 و 100');
    if (after <= before) return setError('نسبة الشحن بعد يجب أن تكون أكبر من قبل');
    if (energy == null || energy <= 0) return setError('تعذر احتساب الطاقة');
    if (total == null || total < 0) return setError('أدخل التكلفة');
    const odo = f.odo.trim() === '' ? null : parseNum(f.odo);
    if (f.odo.trim() !== '' && (odo == null || odo < 0)) return setError('قراءة العداد غير صحيحة');

    onSave({
      id: initial?.id || uid(),
      date: f.date,
      time: f.time || '00:00',
      socBefore: before,
      socAfter: after,
      energyKwh: round(energy, 3),
      energyManual: manualEnergy != null && manualEnergy > 0 && Math.abs(manualEnergy - autoEnergy) > 0.005,
      capacity,
      pricePerKwh: round(price ?? 0, 4),
      totalCost: round(total, 3),
      type: f.type,
      odometer: odo,
      note: f.note.trim(),
      createdAt: initial?.createdAt || Date.now(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* نوع الشاحن */}
      <div>
        <span className="label">نوع الشاحن</span>
        <Segmented
          value={f.type}
          onChange={(v) => setF((s) => ({ ...s, type: v }))}
          options={[
            { value: 'home', label: <span className="inline-flex items-center gap-1.5"><Home size={15} /> منزلي AC</span>, activeClass: 'bg-home/20 text-home' },
            { value: 'fast', label: <span className="inline-flex items-center gap-1.5"><Zap size={15} /> سريع DC</span>, activeClass: 'bg-fast/20 text-fast' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="f-date">التاريخ</label>
          <input id="f-date" type="date" className="field" value={f.date} onChange={set('date')} />
        </div>
        <div>
          <label className="label" htmlFor="f-time">الوقت</label>
          <input id="f-time" type="time" className="field" value={f.time} onChange={set('time')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="f-before">الشحن قبل (%)</label>
          <input id="f-before" inputMode="decimal" className="field tabular" placeholder="مثال: 20" value={f.before} onChange={set('before')} />
        </div>
        <div>
          <label className="label" htmlFor="f-after">الشحن بعد (%)</label>
          <input id="f-after" inputMode="decimal" className="field tabular" placeholder="مثال: 80" value={f.after} onChange={set('after')} />
        </div>
      </div>

      {/* الطاقة المحتسبة */}
      <div className="rounded-xl border border-accent/25 bg-accent/[0.06] p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">الطاقة المكتسبة (تلقائي من SoC × {fix(capacity, 2)} kWh)</span>
          <span className="tabular text-lg font-extrabold text-accent">{energy != null ? fix(energy, 2) : '—'} <span className="text-xs font-medium">kWh</span></span>
        </div>
        <label className="label mt-2" htmlFor="f-energy">تعديل يدوي (اختياري — من شاشة الشاحن مثلاً)</label>
        <input id="f-energy" inputMode="decimal" className="field tabular" placeholder="اتركه فارغاً للحساب التلقائي" value={f.energyStr} onChange={set('energyStr')} />
      </div>

      {/* التكلفة */}
      <div>
        <span className="label">إدخال التكلفة</span>
        <Segmented
          className="mb-3"
          value={f.costMode}
          onChange={(v) => setF((s) => ({ ...s, costMode: v }))}
          options={[
            { value: 'price', label: 'بسعر الكيلوواط' },
            { value: 'total', label: 'بالمبلغ الكلي' },
          ]}
        />
        {f.costMode === 'price' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="f-price">سعر kWh ({settings.currency})</label>
              <input id="f-price" inputMode="decimal" className="field tabular" placeholder={String(defaultPrice)} value={f.priceStr} onChange={set('priceStr')} />
            </div>
            <div>
              <span className="label">المبلغ الكلي (تلقائي)</span>
              <div className="field tabular flex items-center font-bold text-home">{total != null ? fix(total, 3) : '—'}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="f-total">المبلغ الكلي ({settings.currency})</label>
              <input id="f-total" inputMode="decimal" className="field tabular" placeholder="مثال: 3.5" value={f.totalStr} onChange={set('totalStr')} />
            </div>
            <div>
              <span className="label">سعر kWh (تلقائي)</span>
              <div className="field tabular flex items-center font-bold text-home">{price != null ? fix(price, 4) : '—'}</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="f-odo">قراءة العداد (كم) — اختياري</label>
        <input id="f-odo" inputMode="decimal" className="field tabular" placeholder="تُستخدم لحساب الكفاءة والمسافة" value={f.odo} onChange={set('odo')} />
      </div>

      <div>
        <label className="label" htmlFor="f-note">ملاحظات</label>
        <input id="f-note" className="field" maxLength={200} placeholder="اسم المحطة، مثلاً" value={f.note} onChange={set('note')} />
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1"><Save size={17} /> حفظ الشحنة</button>
        {initial && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => (confirmDel ? onDelete(initial.id) : setConfirmDel(true))}
            aria-label="حذف"
          >
            <Trash2 size={17} />
            {confirmDel && <span>تأكيد الحذف</span>}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
      </div>
    </form>
  );
}
