// التخزين المحلي (localStorage) + النسخ الاحتياطي JSON

const KEY = 'ev-dashboard:v1';

export const DEFAULT_SETTINGS = {
  carName: 'BYD',
  carModel: 'Yuan Plus',
  capacity: 60.48, // kWh
  currency: 'د.أ',
  homePrice: 0.1, // لكل kWh — عدّله حسب تعرفتك
  fastPrice: 0.25,
  defaultEfficiency: 16, // kWh/100km حتى تتوفر قراءات عداد كافية
};

export const uid = () =>
  (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** تنظيف سجل شحنة قادم من ملف خارجي */
export function sanitizeCharge(r) {
  if (!r || typeof r !== 'object') return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null;
  const time = /^\d{2}:\d{2}$/.test(r.time) ? r.time : '00:00';
  const socBefore = toNum(r.socBefore);
  const socAfter = toNum(r.socAfter);
  const energyKwh = toNum(r.energyKwh);
  if (!date || socBefore == null || socAfter == null || energyKwh == null) return null;
  return {
    id: String(r.id || uid()),
    date,
    time,
    socBefore,
    socAfter,
    energyKwh,
    energyManual: !!r.energyManual,
    capacity: toNum(r.capacity),
    pricePerKwh: toNum(r.pricePerKwh) ?? 0,
    totalCost: toNum(r.totalCost) ?? 0,
    type: r.type === 'fast' ? 'fast' : 'home',
    odometer: toNum(r.odometer),
    note: String(r.note || '').slice(0, 200),
    createdAt: toNum(r.createdAt) || Date.now(),
  };
}

function sanitizeSettings(s) {
  const out = { ...DEFAULT_SETTINGS };
  if (!s || typeof s !== 'object') return out;
  for (const k of ['carName', 'carModel', 'currency']) {
    if (typeof s[k] === 'string') out[k] = s[k].slice(0, 40);
  }
  for (const k of ['capacity', 'homePrice', 'fastPrice', 'defaultEfficiency']) {
    const n = toNum(s[k]);
    if (n != null && n >= 0) out[k] = n;
  }
  if (!(out.capacity > 0)) out.capacity = DEFAULT_SETTINGS.capacity;
  return out;
}

export function loadState() {
  const fresh = { settings: { ...DEFAULT_SETTINGS }, charges: [], demo: false, fresh: true };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw);
    return {
      settings: sanitizeSettings(p.settings),
      charges: (Array.isArray(p.charges) ? p.charges : []).map(sanitizeCharge).filter(Boolean),
      demo: !!p.demo,
      fresh: false,
    };
  } catch {
    return fresh;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* التخزين ممتلئ أو غير متاح */
  }
}

export function makeBackup(state) {
  return JSON.stringify(
    { app: 'ev-dashboard', version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2,
  );
}

/** يقرأ نسخة احتياطية ويُرجع {settings, charges} أو يرمي خطأ */
export function parseBackup(text) {
  const p = JSON.parse(text);
  if (!p || p.app !== 'ev-dashboard' || !Array.isArray(p.charges)) {
    throw new Error('الملف ليس نسخة احتياطية صالحة لهذا التطبيق');
  }
  return {
    settings: sanitizeSettings(p.settings),
    charges: p.charges.map(sanitizeCharge).filter(Boolean),
  };
}
