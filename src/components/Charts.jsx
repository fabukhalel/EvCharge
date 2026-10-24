import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Segmented } from './ui.jsx';
import { monthShort, fix } from '../lib/format.js';

const AXIS = { fill: '#7a869e', fontSize: 11, fontFamily: 'Tajawal' };

function Tip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-700/95 px-3 py-2 text-xs shadow-xl" dir="rtl">
      <div className="mb-1 font-bold text-slate-200">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="tabular flex items-center gap-2" style={{ color: p.color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <b>{p.value == null ? '—' : fix(p.value, 2)}</b> {unit}
        </div>
      ))}
    </div>
  );
}

export default function Charts({ months, currency }) {
  const [metric, setMetric] = useState('cost');

  const data = useMemo(
    () =>
      months.map((m) => ({
        label: monthShort(m.key),
        homeCost: Number(m.homeCost.toFixed(2)),
        fastCost: Number(m.fastCost.toFixed(2)),
        homeEnergy: Number(m.homeEnergy.toFixed(1)),
        fastEnergy: Number(m.fastEnergy.toFixed(1)),
        efficiency: m.efficiency != null ? Number(m.efficiency.toFixed(2)) : null,
      })),
    [months],
  );

  const unit = metric === 'cost' ? currency : metric === 'energy' ? 'kWh' : 'kWh/100km';

  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-col gap-3">
        <h3 className="text-base font-extrabold">مقارنة الأشهر</h3>
        <Segmented
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'cost', label: 'التكلفة' },
            { value: 'energy', label: 'الاستهلاك' },
            { value: 'eff', label: 'الكفاءة' },
          ]}
        />
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">أضف شحنات لتظهر المقارنة</p>
      ) : (
        // الرسم بصيغة LTR داخلياً مع عكس المحور الأفقي ليظهر أقدم شهر يميناً
        <div dir="ltr" className="h-64 w-full" role="img" aria-label="رسم بياني لمقارنة الأشهر">
          <ResponsiveContainer width="100%" height="100%">
            {metric === 'eff' ? (
              <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="label" reversed tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis orientation="right" tick={AXIS} axisLine={false} tickLine={false} width={34} domain={['auto', 'auto']} />
                <Tooltip content={<Tip unit={unit} />} cursor={{ stroke: '#22d3ee55' }} />
                <Line
                  type="monotone" dataKey="efficiency" name="الاستهلاك" stroke="#22d3ee" strokeWidth={3}
                  dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls
                />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="label" reversed tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis orientation="right" tick={AXIS} axisLine={false} tickLine={false} width={34} />
                <Tooltip content={<Tip unit={unit} />} cursor={{ fill: '#ffffff08' }} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Tajawal' }} />
                <Bar
                  dataKey={metric === 'cost' ? 'homeCost' : 'homeEnergy'} stackId="a" name="منزلي"
                  fill="#2ef2a0" radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey={metric === 'cost' ? 'fastCost' : 'fastEnergy'} stackId="a" name="سريع"
                  fill="#ff9a3c" radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
