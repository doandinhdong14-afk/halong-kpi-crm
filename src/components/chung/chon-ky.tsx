"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Dropdown chọn kỳ, đổi ?kyId= trên URL. */
export function ChonKy({ kys, kyId }: { kys: { id: string; ten: string; nhanPhu?: string }[]; kyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Select value={kyId} onValueChange={(v) => router.push(`${pathname}?kyId=${v}`)}>
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
