"use client";

import { useEffect, useState } from "react";

function dinhDang(ms: number) {
  const giay = Math.floor(ms / 1000);
  const ngay = Math.floor(giay / 86400);
  const gio = Math.floor((giay % 86400) / 3600);
  const phut = Math.floor((giay % 3600) / 60);
  const s = giay % 60;
  const hh = String(gio).padStart(2, "0");
  const mm = String(phut).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return ngay > 0 ? `${ngay} ngày ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

/** Đếm ngược tới một mốc (chỉ để hiển thị; server mới là nơi quyết định hết hạn). */
export function DemNguoc({ den, nhan }: { den: string; nhan: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);

  const conLai = now === null ? null : new Date(den).getTime() - now;
  return (
    <div className="inline-flex items-baseline gap-2 rounded-md bg-muted px-3 py-1.5 text-sm" data-testid="dem-nguoc">
      <span className="text-muted-foreground">{nhan}:</span>
      {conLai === null ? (
        <span className="font-mono">--:--:--</span>
      ) : conLai > 0 ? (
        <span className="font-mono font-semibold tabular-nums">{dinhDang(conLai)}</span>
      ) : (
        <span className="font-semibold text-destructive">Đã hết hạn</span>
      )}
    </div>
  );
}
