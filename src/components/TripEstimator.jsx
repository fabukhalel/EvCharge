import React, { useMemo, useState } from 'react';
import { Home, Zap, MapPin, Info } from 'lucide-react';
import { Segmented } from './ui.jsx';
import { estimateTrip, overallEfficiency, priceForType } from '../lib/calc.js';
import { parseNum, fix, num } from '../lib/format.js';

function Result({ label, value, unit, color, big }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-900/70 p-3 text-center">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`tabular font-extrabold ${big ? 'text-2xl' : 'text-xl'}`} style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-slate-500">{unit}</div>
    </div>
  );
}

export default function TripEstimator({ charges, segments, settings }) {
  const [distance, setDistance] = useState('');
  const [place, setPlace] = useState('home');
  const [startSoc, setStartSoc] = useState('100');
  const [effOverride, setEffOverride] = useState('');

  const actual = useMemo(() => overallEfficiency(segments), [segments]);
  const baseEff = actual ?? settings.defaultEfficiency;
  const effSource = actual != null ? 'actual' : 'default';
  const price = useMemo(
    () => priceForType(charges, place, place === 'fast' ? settings.fastPrice : settings.homePrice),
    [charges, place, settings.fastPrice, settings.homePrice],
  );

  const d = parseNum(distance);
  const ovr = parseNum(effOverride);
  const eff = ovr != null && ovr > 0 ? ovr : baseEff;
  const start = parseNum(startSoc);

  const valid = d != null && d > 0 && eff > 0;
  const r = valid
    ? estimateTrip({ distance: d, efficiency: eff, capacity: settings.capacity, price: price.value, startSoc: start != null && start >= 0 && start <= 100 ? start : null })
    : null;
  const roundTrip = valid ? estimateTrip({ distance: d * 2, efficiency: eff, capacity: settings.capacity, price: price.value, startSoc: null }) : null;
  const needsCharge = r && r.arrivalSoc != null && r.arrivalSoc < 10;

  return (
    <div className="space-y-4">
      <section className="card space-y-4 p-4">
        <div className="flex items-center gap-2 text-base font-extrabold"><MapPin size={18} className="text-accent" /> حاسبة الرحلة الذكية</div>

        <div>
          <label className="label" htmlFor="t-dist">مسافة الرحلة (كم)</label>
          <input id="t-dist" inputMode="decimal" className="field tabular text-lg font-bold" placeholder="مثال: 120" value={distance} onChange={(e) => setDistance(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {[50, 100, 200, 300].map((v) => (
              <button key={v} type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setDistance(String(v))}>{v} كم</button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">مكان الشحن</span>
          <Segmented
            value={place}
            onChange={setPlace}
            options={[
              { value: 'home', label: <span className="inline-flex items-center gap-1.5"><Home size={15} /> منزلي</span>, activeClass: 'bg-home/20 text-home' },
              { value: 'fast', label: <span className="inline-flex items-center gap-1.5"><Zap size={15} /> سريع</span>, activeClass: 'bg-fast/20 text-fast' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="t-soc">نسبة البطارية عند الانطلاق %</label>
            <input id="t-soc" inputMode="decimal" className="field tabular" value={startSoc} onChange={(e) => setStartSoc(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="t-eff">معدل الاستهلاك (kWh/100km)</label>
            <input id="t-eff" inputMode="decimal" className="field tabular" placeholder={fix(baseEff, 1)} value={effOverride} onChange={(e) => setEffOverride(e.target.value)} />
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
          <Info size={13} className="mt-0.5 shrink-0" />
          {effSource === 'actual'
            ? `يُستخدم معدلك الفعلي ${fix(actual, 1)} kWh/100km المحسوب من قراءات العداد.`
            : `لا توجد قراءات عداد كافية؛ يُستخدم المعدل الافتراضي ${fix(settings.defaultEfficiency, 1)} kWh/100km من الإعدادات.`}{' '}
          {price.source === 'history'
            ? `سعر الكيلوواط ${fix(price.value, 3)} هو متوسط ${price.n} شحنة سابقة من هذا النوع.`
            : `سعر الكيلوواط ${fix(price.value, 3)} هو السعر الافتراضي من الإعدادات.`}
        </p>
      </section>

      {r ? (
        <section className="card space-y-3 p-4">
          <h3 className="text-base font-extrabold">التقدير للرحلة</h3>
          <div className="grid grid-cols-3 gap-2.5">
            <Result label="الطاقة المطلوبة" value={fix(r.energy, 1)} unit="kWh" color="#22d3ee" />
            <Result label="نسبة البطارية" value={`${fix(r.socNeeded, 1)}%`} unit="SoC" color="#a78bfa" />
            <Result label="التكلفة المتوقعة" value={fix(r.cost, 2)} unit={settings.currency} color="#2ef2a0" big />
          </div>
          <div className="tabular grid grid-cols-2 gap-2.5 text-center text-xs text-slate-300">
            <div className="rounded-lg bg-white/[0.04] p-2.5">ذهاب وعودة: <b>{fix(roundTrip.cost, 2)} {settings.currency}</b> · {fix(roundTrip.energy, 1)} kWh</div>
            <div className="rounded-lg bg-white/[0.04] p-2.5">تكلفة الكيلومتر: <b>{fix(r.costPerKm, 3)} {settings.currency}</b></div>
          </div>
          {r.arrivalSoc != null && (
            <div className={`rounded-xl border p-3 text-center text-sm font-bold ${r.arrivalSoc < 0 ? 'border-red-500/40 bg-red-500/10 text-red-300' : needsCharge ? 'border-fast/40 bg-fast/10 text-fast' : 'border-home/30 bg-home/10 text-home'}`}>
              {r.arrivalSoc < 0
                ? `الرحلة تتجاوز شحنتك الحالية بـ ${fix(-r.arrivalSoc, 0)}% — تحتاج شحنة في الطريق`
                : needsCharge
                  ? `ستصل بنسبة ${fix(r.arrivalSoc, 0)}% فقط — يُفضّل التوقف للشحن`
                  : `ستصل بنسبة بطارية ≈ ${fix(r.arrivalSoc, 0)}%`}
            </div>
          )}
          <p className="text-center text-[11px] text-slate-500">
            المدى النظري بشحنة كاملة ≈ {num(r.fullRange, 0)} كم · التقدير يتأثر بالسرعة والطقس والتكييف
          </p>
        </section>
      ) : (
        <p className="px-2 text-center text-sm text-slate-500">أدخل مسافة الرحلة لعرض الطاقة والتكلفة المتوقعة</p>
      )}
    </div>
  );
}
