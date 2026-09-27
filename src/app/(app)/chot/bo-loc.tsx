"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TAT_CA = "__tat-ca__";

/** Lọc màn hình Chốt theo người, theo đơn vị (giữ các tham số khác trên URL). */
export function BoLocChot({
  nguois,
  donVis,
  nguoi,
  donVi,
}: {
  nguois: { id: string; ten: string }[];
  donVis: string[];
  nguoi: string;
  donVi: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function doi(ten: "nguoi" | "donVi", v: string) {
    const p = new URLSearchParams(sp);
    if (v === TAT_CA) p.delete(ten);
    else p.set(ten, v);
    p.delete("task");
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={nguoi || TAT_CA} onValueChange={(v) => doi("nguoi", v)}>
        <SelectTrigger className="w-64" aria-label="Lọc theo người">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TAT_CA}>Tất cả mọi người</SelectItem>
          {nguois.map((n) => (
            <SelectItem key={n.id} value={n.id}>
              {n.ten}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={donVi || TAT_CA} onValueChange={(v) => doi("donVi", v)}>
        <SelectTrigger className="w-64" aria-label="Lọc theo đơn vị">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TAT_CA}>Tất cả đơn vị</SelectItem>
          {donVis.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
