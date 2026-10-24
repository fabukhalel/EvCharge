import React from 'react';
import { Home, Zap } from 'lucide-react';
import { fix, num } from '../lib/format.js';

function Row({ type, data, currency }) {
  const isHome = type === 'home';
  const color = isHome ? '#2ef2a0' : '#ff9a3c';
  const Icon = isHome ? Home : Zap;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-900/70 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold" style={{ color }}>
          <Icon size={16} />
          {isHome ? 'شحن منزلي AC' : 'محطة سريعة DC'}
        </div>
        <span className="tabular text-xs text-slate-400">{data.count} شحنة</span>
      </div>
      <div className="tabular grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-extrabold">{fix(data.cost, 2)}</div>
          <div className="text-[11px] text-slate-500">التكلفة ({currency})</div>
        </div>
        <div>
          <div className="text-lg font-extrabold">{num(data.energy, 1)}</div>
          <div className="text-[11px] text-slate-500">الطاقة (kWh)</div>
        </div>
        <div>
          <div className="text-lg font-extrabold">{data.avgPrice != null ? fix(data.avgPrice, 3) : '—'}</div>
          <div className="text-[11px] text-slate-500">سعر kWh</div>
        </div>
      </div>
      <div className="tabular mt-3 flex justify-between text-[11px] text-slate-400">
        <span>حصة الطاقة {fix(data.energyShare, 0)}%</span>
        <span>حصة التكلفة {fix(data.costShare, 0)}%</span>
      </div>
    </div>
  );
}

export default function TypeCompare({ data, currency }) {
  const total = data.total;
  const homeW = total.energy > 0 ? data.home.energyShare : 50;
  const empty = total.count === 0;

  return (
    <section className="card p-4">
      <h3 className="mb-3 text-base font-extrabold">منزلي مقابل سريع</h3>
      {empty ? (
        <p className="py-4 text-center text-sm text-slate-500">لا توجد شحنات ضمن الفترة المحددة</p>
      ) : (
        <>
          <div className="mb-1 flex h-3 overflow-hidden rounded-full bg-ink-900" aria-hidden="true">
            <div className="bg-home transition-all" style={{ width: `${homeW}%` }} />
            <div className="bg-fast transition-all" style={{ width: `${100 - homeW}%` }} />
          </div>
          <div className="tabular mb-4 flex justify-between text-[11px] font-bold">
            <span className="text-home">منزلي {fix(data.home.energyShare, 0)}% من الطاقة</span>
            <span className="text-fast">سريع {fix(data.fast.energyShare, 0)}%</span>
          </div>
          <div className="space-y-3">
            <Row type="home" data={data.home} currency={currency} />
            <Row type="fast" data={data.fast} currency={currency} />
          </div>
          {data.fast.avgPrice != null && data.home.avgPrice != null && data.home.avgPrice > 0 && (
            <p className="mt-3 rounded-lg bg-white/[0.04] p-2.5 text-center text-xs text-slate-300">
              الشحن السريع أغلى بـ{' '}
              <b className="text-fast">{fix((data.fast.avgPrice / data.home.avgPrice - 1) * 100, 0)}%</b> من المنزلي لكل kWh
            </p>
          )}
        </>
      )}
    </section>
  );
}
