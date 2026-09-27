"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Dropdown chọn kỳ, đổi ?kyId= trên URL (giữ các tham số khác, vd ?tab=). */
export function ChonKy({ kys, kyId }: { kys: { id: string; ten: string; nhanPhu?: string }[]; kyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <Select
      value={kyId}
      onValueChange={(v) => {
        const p = new URLSearchParams(searchParams);
        p.set("kyId", v);
        router.push(`${pathname}?${p.toString()}`);
      }}
    >
      <SelectTrigger className="w-72" aria-label="Chọn kỳ">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {kys.map((k) => (
          <SelectItem key={k.id} value={k.id}>
            {k.ten}
            {k.nhanPhu ? ` (${k.nhanPhu})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
