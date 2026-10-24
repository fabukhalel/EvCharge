import React from 'react';
import { Zap, Wallet, Route, Gauge, Coins, BatteryCharging } from 'lucide-react';
import { num, fix } from '../lib/format.js';

function Tile({ icon: Icon, label, value, unit, sub, color }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <Icon size={15} style={{ color }} />
        {label}
      </div>
      <div className="tabular flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold leading-none">{value}</span>
        <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export default function Kpis({ summary, currency }) {
  const s = summary;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Tile icon={Zap} label="إجمالي الطاقة" value={num(s.energy, 1)} unit="kWh" sub={`${s.count} شحنة`} color="#22d3ee" />
      <Tile
        icon={Wallet}
        label="إجمالي التكلفة"
        value={fix(s.cost, 2)}
        unit={currency}
        sub={s.avgPrice != null ? `متوسط ${fix(s.avgPrice, 3)} / kWh` : null}
        color="#2ef2a0"
      />
      <Tile
        icon={Route}
        label="المسافة المقطوعة"
        value={s.distance > 0 ? num(s.distance, 0) : '—'}
        unit="كم"
        sub={s.distance > 0 ? null : 'أدخل قراءة العداد مع شحنتين'}
        color="#a78bfa"
      />
      <Tile
        icon={Gauge}
        label="كفاءة الاستهلاك"
        value={s.efficiency != null ? fix(s.efficiency, 1) : '—'}
        unit="kWh/100km"
        sub={s.costPerKm != null ? null : 'تحتاج قراءات عداد'}
        color="#ff9a3c"
      />
      <div className="col-span-2">
        <Tile
          icon={Coins}
          label="تكلفة الكيلومتر الواحد"
          value={s.costPerKm != null ? fix(s.costPerKm, 3) : '—'}
          unit={`${currency} / كم`}
          sub={s.costPerKm != null ? `${fix(s.costPerKm * 100, 2)} ${currency} لكل 100 كم` : null}
          color="#f472b6"
        />
      </div>
    </div>
  );
}

export function MiniStat({ icon: Icon = BatteryCharging, label, value }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <Icon size={14} />
      {label}: <span className="font-bold text-slate-200">{value}</span>
    </div>
  );
}
