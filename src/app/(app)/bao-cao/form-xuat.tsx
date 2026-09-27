"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  kys: { id: string; ten: string; daChot: boolean }[];
  kyMacDinh: string;
  viTris: { id: string; ten: string }[];
  nguois: { id: string; ten: string; role: string; donVi: string }[];
};

/** Chọn: kỳ → chức vụ (tick) → Tất cả hoặc 1 người → Xuất Excel / Xuất PDF (mục 6.3). */
export function FormXuatBaoCao({ kys, kyMacDinh, viTris, nguois }: Props) {
  const [kyId, setKyId] = useState(kyMacDinh);
  const [chon, setChon] = useState<Set<string>>(() => new Set(viTris.map((v) => v.id)));
  const [pham, setPham] = useState<"tat-ca" | "mot-nguoi">("tat-ca");
  const [nguoiId, setNguoiId] = useState("");
  const [dangXuat, setDangXuat] = useState<"xlsx" | "pdf" | null>(null);

  const ky = kys.find((k) => k.id === kyId);
  const nguoiHien = useMemo(() => nguois.filter((n) => chon.has(n.role)), [nguois, chon]);
  const nguoiHopLe = nguoiHien.some((n) => n.id === nguoiId) ? nguoiId : "";
  const loi =
    chon.size === 0 ? "Chọn ít nhất 1 chức vụ." : pham === "mot-nguoi" && !nguoiHopLe ? "Chọn một người để xuất." : null;

  async function xuat(dinhDang: "xlsx" | "pdf") {
    const q = new URLSearchParams({ kyId, dinhDang });
    chon.forEach((v) => q.append("viTri", v));
    if (pham === "mot-nguoi") q.set("nguoiId", nguoiHopLe);
    setDangXuat(dinhDang);
    try {
      const res = await fetch(`/api/bao-cao?${q.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Không xuất được báo cáo, vui lòng thử lại.");
        return;
      }
      const ten = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? `BaoCao.${dinhDang}`;
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = ten;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${ten}`);
    } catch {
      toast.error("Không xuất được báo cáo, vui lòng kiểm tra kết nối.");
    } finally {
      setDangXuat(null);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="ky">Kỳ</Label>
          <Select value={kyId} onValueChange={setKyId}>
            <SelectTrigger id="ky" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kys.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.ten}
                  {k.daChot ? " (đã chốt)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {ky && !ky.daChot && (
            <p className="text-sm text-amber-700" data-testid="tam-tinh">
              Kỳ chưa chốt: kết quả tính tại thời điểm xuất, file ghi rõ &quot;TẠM TÍNH&quot;.
            </p>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Chức vụ</legend>
          <div className="flex flex-wrap gap-4">
            {viTris.map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={chon.has(v.id)}
                  onCheckedChange={(c) =>
                    setChon((s) => {
                      const n = new Set(s);
                      if (c === true) n.add(v.id);
                      else n.delete(v.id);
                      return n;
                    })
                  }
                  aria-label={v.ten}
                />
                {v.ten}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Xuất cho</legend>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="pham" checked={pham === "tat-ca"} onChange={() => setPham("tat-ca")} />
              Tất cả ({nguoiHien.length} người)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="pham" checked={pham === "mot-nguoi"} onChange={() => setPham("mot-nguoi")} />1 người
            </label>
          </div>
          {pham === "mot-nguoi" && (
            <Select value={nguoiHopLe} onValueChange={setNguoiId}>
              <SelectTrigger className="w-full" aria-label="Chọn người">
                <SelectValue placeholder="Chọn người…" />
              </SelectTrigger>
              <SelectContent>
                {nguoiHien.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.ten} – {n.donVi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </fieldset>

        {loi && <p className="text-sm text-destructive">{loi}</p>}
        <div className="flex gap-2">
          <Button onClick={() => xuat("xlsx")} disabled={!!loi || !!dangXuat}>
            <FileSpreadsheet className="size-4" /> {dangXuat === "xlsx" ? "Đang xuất…" : "Xuất Excel"}
          </Button>
          <Button variant="outline" onClick={() => xuat("pdf")} disabled={!!loi || !!dangXuat}>
            <FileText className="size-4" /> {dangXuat === "pdf" ? "Đang xuất…" : "Xuất PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
