import React, { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, FlaskConical, Trash2, Car } from 'lucide-react';
import { parseNum } from '../lib/format.js';

function NumField({ id, label, value, onCommit, hint, min = 0 }) {
  const [text, setText] = useState(String(value));
  const [bad, setBad] = useState(false);
  const commit = () => {
    const n = parseNum(text);
    if (n == null || n < min || (id === 's-cap' && n <= 0)) {
      setBad(true);
      return;
    }
    setBad(false);
    onCommit(n);
  };
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        className={`field tabular ${bad ? '!border-red-500/60' : ''}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
      />
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export default function SettingsView({ settings, onChange, onReset, onExportCsv, onExportBackup, onImportBackup, onDemo, onClear, count }) {
  const fileRef = useRef(null);
  const set = (k) => (e) => onChange({ [k]: e.target.value });

  return (
    <div className="space-y-4">
      <section className="card space-y-4 p-4">
        <div className="flex items-center gap-2 text-base font-extrabold"><Car size={18} className="text-accent" /> بيانات السيارة</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="s-name">الاسم / الماركة</label>
            <input id="s-name" className="field" maxLength={40} value={settings.carName} onChange={set('carName')} />
          </div>
          <div>
            <label className="label" htmlFor="s-model">الموديل</label>
            <input id="s-model" className="field" maxLength={40} value={settings.carModel} onChange={set('carModel')} />
          </div>
        </div>
        <NumField
          id="s-cap" label="سعة البطارية الإجمالية (kWh)" value={settings.capacity}
          onCommit={(n) => onChange({ capacity: n })}
          hint="تُستخدم لحساب الطاقة من نسبة الشحن. الشحنات القديمة تحتفظ بالسعة وقت تسجيلها."
        />
      </section>

      <section className="card space-y-4 p-4">
        <h3 className="text-base font-extrabold">الأسعار والتقديرات الافتراضية</h3>
        <div>
          <label className="label" htmlFor="s-cur">رمز العملة</label>
          <input id="s-cur" className="field" maxLength={10} value={settings.currency} onChange={set('currency')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="s-home" label="سعر kWh المنزلي" value={settings.homePrice} onCommit={(n) => onChange({ homePrice: n })} />
          <NumField id="s-fast" label="سعر kWh السريع" value={settings.fastPrice} onCommit={(n) => onChange({ fastPrice: n })} />
        </div>
        <NumField
          id="s-eff" label="معدل استهلاك افتراضي (kWh/100km)" value={settings.defaultEfficiency}
          onCommit={(n) => onChange({ defaultEfficiency: n })}
          hint="يُستخدم في حاسبة الرحلات حتى تتوفر قراءات عداد كافية."
        />
        <button className="btn-ghost w-full text-xs" onClick={onReset}>استعادة الإعدادات الافتراضية</button>
      </section>

      <section className="card space-y-3 p-4">
        <h3 className="text-base font-extrabold">البيانات والتصدير</h3>
        <p className="text-xs text-slate-400">بياناتك محفوظة على هذا الجهاز فقط ({count} شحنة). خذ نسخة احتياطية دورياً.</p>
        <button className="btn-primary w-full" onClick={onExportCsv} disabled={!count}><FileSpreadsheet size={17} /> تصدير السجلات CSV</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={onExportBackup}><Download size={16} /> نسخة احتياطية</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> استعادة نسخة</button>
        </div>
        <input
          ref={fileRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportBackup(f); e.target.value = ''; }}
        />
      </section>

      <section className="card space-y-3 p-4">
        <h3 className="text-base font-extrabold">أدوات</h3>
        <button className="btn-ghost w-full" onClick={onDemo}><FlaskConical size={16} /> تحميل بيانات تجريبية للمعاينة</button>
        <button className="btn-danger w-full" onClick={onClear} disabled={!count}><Trash2 size={16} /> حذف كل الشحنات</button>
      </section>
    </div>
  );
}
