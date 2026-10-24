import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const TYPE_META = {
  home: { label: 'منزلي AC', short: 'منزلي', color: '#2ef2a0', text: 'text-home', bg: 'bg-home/15', ring: 'ring-home/40' },
  fast: { label: 'سريع DC', short: 'سريع', color: '#ff9a3c', text: 'text-fast', bg: 'bg-fast/15', ring: 'ring-fast/40' },
};

export function TypeBadge({ type }) {
  const m = TYPE_META[type === 'fast' ? 'fast' : 'home'];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${m.bg} ${m.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

/** نافذة سفلية (Bottom Sheet) */
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="safe-bottom relative flex max-h-[92vh] w-full max-w-lg animate-sheet flex-col rounded-t-3xl border border-white/10 bg-ink-800 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

export function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div className={`grid gap-1 rounded-xl border border-white/10 bg-ink-900 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-2 py-2 text-sm font-bold transition ${
              active ? (o.activeClass || 'bg-accent/20 text-accent') : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ icon: Icon, title, hint, children }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      {Icon && <Icon size={34} className="text-accent/70" />}
      <p className="text-base font-bold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <div className="animate-toast rounded-full border border-white/10 bg-ink-700 px-4 py-2 text-sm font-bold shadow-glow">{message}</div>
    </div>
  );
}
