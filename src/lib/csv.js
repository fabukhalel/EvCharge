import { Capacitor } from '@capacitor/core';
import { sortChrono } from './calc.js';

const HEADERS = [
  'التاريخ', 'الوقت', 'نوع الشاحن', 'نسبة الشحن قبل %', 'نسبة الشحن بعد %',
  'الطاقة kWh', 'سعر الكيلوواط', 'التكلفة الإجمالية', 'قراءة العداد km', 'ملاحظات',
];

const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function chargesToCsv(charges) {
  const rows = sortChrono(charges).map((c) => [
    c.date,
    c.time,
    c.type === 'fast' ? 'سريع DC' : 'منزلي AC',
    c.socBefore,
    c.socAfter,
    Number(c.energyKwh.toFixed(2)),
    Number((c.pricePerKwh ?? 0).toFixed(4)),
    Number((c.totalCost ?? 0).toFixed(3)),
    c.odometer ?? '',
    c.note ?? '',
  ]);
  // BOM ضروري ليفتح Excel الملف بترميز UTF-8 ويعرض العربية صحيحة
  return `﻿${[HEADERS, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')}`;
}

/** حفظ ملف: تنزيل في المتصفح، أو مشاركة/حفظ عبر Capacitor داخل تطبيق أندرويد */
export async function saveFile(filename, text, mime = 'text/csv;charset=utf-8') {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, url: res.uri, dialogTitle: 'حفظ أو مشاركة الملف' });
    return;
  }
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
