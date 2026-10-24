// أدوات التنسيق والتواريخ (الأرقام لاتينية والأسماء عربية شامية)

export const MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
];

export const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const WEEKDAYS_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const cache = new Map();
function nf(d, fixed) {
  const k = `${d}${fixed ? 'f' : 'v'}`;
  if (!cache.has(k)) {
    cache.set(
      k,
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: fixed ? d : 0,
        maximumFractionDigits: d,
      }),
    );
  }
  return cache.get(k);
}

const ok = (v) => typeof v === 'number' && Number.isFinite(v);

/** رقم بحد أقصى d منازل عشرية (بدون أصفار زائدة) */
export const num = (v, d = 1) => (ok(v) ? nf(d, false).format(v) : '—');
/** رقم بعدد ثابت من المنازل العشرية */
export const fix = (v, d = 1) => (ok(v) ? nf(d, true).format(v) : '—');

/** تحويل نص إدخال المستخدم إلى رقم (يدعم الأرقام العربية والفاصلة) */
export function parseNum(s) {
  if (s == null) return null;
  let t = String(s).trim();
  if (!t) return null;
  t = t
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 1776))
    .replace(/[٫,]/g, '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const pad = (n) => String(n).padStart(2, '0');

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => ymd(new Date());
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function formatDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function weekdayOf(s) {
  const [y, m, d] = s.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function monthShort(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

export const monthKeyOf = (y, mIndex) => `${y}-${pad(mIndex + 1)}`;
