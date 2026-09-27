"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES, TEN_VAI_TRO } from "@/lib/roles";

const TAT_CA = "tat-ca";

export function BoLocTaiKhoan({ q, chucVu }: { q: string; chucVu: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tuKhoa, setTuKhoa] = useState(q);

  // Tìm kiếm sau khi ngừng gõ 300ms.
  useEffect(() => {
    if (tuKhoa.trim() === q) return;
    const t = setTimeout(() => router.replace(taoUrl(pathname, tuKhoa, chucVu)), 300);
    return () => clearTimeout(t);
  }, [tuKhoa, q, chucVu, pathname, router]);

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <Input
        className="max-w-xs"
        placeholder="Tìm theo tên hoặc tên đăng nhập…"
        value={tuKhoa}
        onChange={(e) => setTuKhoa(e.target.value)}
        aria-label="Tìm kiếm"
      />
      <Select
        value={chucVu || TAT_CA}
        onValueChange={(v) => router.replace(taoUrl(pathname, tuKhoa, v === TAT_CA ? "" : v))}
      >
        <SelectTrigger className="w-48" aria-label="Lọc theo chức vụ">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TAT_CA}>Tất cả chức vụ</SelectItem>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {TEN_VAI_TRO[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function taoUrl(pathname: string, q: string, chucVu: string) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (chucVu) params.set("chucVu", chucVu);
  const s = params.toString();
  return s ? `${pathname}?${s}` : pathname;
}
