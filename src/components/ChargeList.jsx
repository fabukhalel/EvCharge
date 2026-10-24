import React from 'react';
import { Battery, Gauge, StickyNote, Plus } from 'lucide-react';
import { TypeBadge, Empty } from './ui.jsx';
import { sortChrono } from '../lib/calc.js';
import { formatDate, weekdayOf, fix, num } from '../lib/format.js';

export function ChargeItem({ c, currency, eff, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(c)}
      className="card w-full p-3.5 text-start transition hover:border-accent/30 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold">
            {weekdayOf(c.date)} {formatDate(c.date)}
            <span className="tabular me-1 ms-2 text-xs font-medium text-slate-500">{c.time}</span>
          </div>
          <div className="mt-1.5"><TypeBadge type={c.type} /></div>
        </div>
        <div className="tabular text-end">
          <div className="text-lg font-extrabold text-home">{fix(c.totalCost, 2)} <span className="text-xs font-medium text-slate-500">{currency}</span></div>
          <div className="text-xs text-slate-400">{fix(c.energyKwh, 1)} kWh</div>
        </div>
      </div>
      <div className="tabular mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1"><Battery size={13} /> {num(c.socBefore, 0)}% ← {num(c.socAfter, 0)}%</span>
        {c.odometer != null && <span className="inline-flex items-center gap-1"><Gauge size={13} /> {num(c.odometer, 0)} كم</span>}
        <span>{fix(c.pricePerKwh, 3)} / kWh</span>
        {eff != null && <span className="font-bold text-fast">{fix(eff, 1)} kWh/100km</span>}
      </div>
      {c.note && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500"><StickyNote size={12} /> {c.note}</div>
      )}
    </button>
  );
}

export default function ChargeList({ charges, segments, currency, onEdit, onAdd }) {
  if (charges.length === 0) {
    return (
      <Empty icon={Battery} title="لا توجد شحنات" hint="سجّل أول شحنة لتبدأ المتابعة والتحليل.">
        <button className="btn-primary" onClick={onAdd}><Plus size={17} /> إضافة شحنة</button>
      </Empty>
    );
  }
  const effById = new Map(segments.map((s) => [s.endId, s.efficiency]));
  const list = sortChrono(charges).reverse();
  return (
    <div className="space-y-2.5">
      {list.map((c) => (
        <ChargeItem key={c.id} c={c} currency={currency} eff={effById.get(c.id) ?? null} onClick={onEdit} />
      ))}
    </div>
  );
}
