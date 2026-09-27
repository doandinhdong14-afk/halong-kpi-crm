"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NutXacNhan } from "@/components/chung/nut-xac-nhan";
import { useHanhDong } from "@/components/chung/use-hanh-dong";
import { congBoKy, suaNgayKy } from "../actions";

type Ky = { id: string; ngayBatDau: string; ngayKetThuc: string; daCongBo: boolean; daChot: boolean };

function hien(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function ThongTinKy({ ky, children }: { ky: Ky; children?: React.ReactNode }) {
  const [batDau, setBatDau] = useState(ky.ngayBatDau);
  const [ketThuc, setKetThuc] = useState(ky.ngayKetThuc);
  const luu = useHanhDong();
  const congBo = useHanhDong();
  const doi = batDau !== ky.ngayBatDau || ketThuc !== ky.ngayKetThuc;

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Trạng thái:</span>
          {ky.daChot ? (
            <Badge variant="secondary">Đã chốt</Badge>
          ) : ky.daCongBo ? (
            <Badge>Đã công bố</Badge>
          ) : (
            <Badge variant="outline">Chưa công bố</Badge>
          )}
          <span className="ml-4 text-sm text-muted-foreground">
            Hạn đăng ký: <strong className="text-foreground">23:59 {hien(ky.ngayBatDau)}</strong> · Deadline:{" "}
            <strong className="text-foreground">23:59 {hien(ky.ngayKetThuc)}</strong>
          </span>
        </div>

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            luu.chay(() => suaNgayKy({ kyId: ky.id, ngayBatDau: batDau, ngayKetThuc: ketThuc }), {
              thanhCong: "Đã lưu ngày của kỳ.",
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="ngayBatDau">Ngày bắt đầu</Label>
            <Input id="ngayBatDau" type="date" value={batDau} onChange={(e) => setBatDau(e.target.value)} disabled={ky.daChot} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ngayKetThuc">Ngày kết thúc</Label>
            <Input id="ngayKetThuc" type="date" value={ketThuc} onChange={(e) => setKetThuc(e.target.value)} disabled={ky.daChot} required />
          </div>
          <Button type="submit" variant="outline" disabled={ky.daChot || !doi || luu.pending}>
            Lưu ngày
          </Button>

          <div className="ml-auto flex gap-2">
            {!ky.daCongBo && !ky.daChot && (
              <NutXacNhan
                variant="default"
                tieuDe="Công bố kỳ này?"
                moTa="Sau khi công bố, giáo viên sẽ thấy kỳ và bắt đầu đăng ký nhiệm vụ. Không thể hủy công bố."
                nhanXacNhan="Công bố"
                disabled={congBo.pending}
                onXacNhan={() => congBo.chay(() => congBoKy(ky.id), { thanhCong: "Đã công bố kỳ." })}
              >
                <Megaphone className="size-4" /> Công bố
              </NutXacNhan>
            )}
            {children}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
