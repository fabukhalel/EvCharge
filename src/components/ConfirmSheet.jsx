import React, { useCallback, useRef, useState } from 'react';
import { Sheet } from './ui.jsx';

/**
 * تأكيد داخل الصفحة بدل window.confirm (الذي لا يعمل في بعض البيئات المضمّنة).
 * الاستخدام: const [ask, node] = useConfirm();  if (await ask('...')) {...}   ثم اعرض {node}
 */
export function useConfirm() {
  const [req, setReq] = useState(null);
  const resolver = useRef(null);

  const ask = useCallback(
    (message, okLabel = 'متابعة') =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setReq({ message, okLabel });
      }),
    [],
  );

  const settle = (v) => {
    const r = resolver.current;
    resolver.current = null;
    setReq(null);
    if (r) r(v);
  };

  const node = (
    <Sheet open={!!req} onClose={() => settle(false)} title="تأكيد">
      <p className="mb-5 text-sm leading-relaxed text-slate-300">{req?.message}</p>
      <div className="flex gap-2">
        <button className="btn-danger flex-1" onClick={() => settle(true)}>{req?.okLabel}</button>
        <button className="btn-ghost flex-1" onClick={() => settle(false)}>تراجع</button>
      </div>
    </Sheet>
  );

  return [ask, node];
}
