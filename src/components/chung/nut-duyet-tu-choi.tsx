"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KetQuaHanhDong } from "@/lib/loi";
import { useHanhDong } from "./use-hanh-dong";

/** Cặp nút Duyệt (nhận xét tùy chọn) / Từ chối (bắt buộc nhận xét). */
export function NutDuyetTuChoi<T>({
  doiTuong,
  onDuyet,
  onTuChoi,
  thanhCongDuyet = "Đã duyệt.",
  thanhCongTuChoi = "Đã từ chối.",
  sau,
  size = "default",
}: {
  doiTuong: string;
  onDuyet: (nhanXet: string) => Promise<KetQuaHanhDong<T>>;
  onTuChoi: (nhanXet: string) => Promise<KetQuaHanhDong<unknown>>;
  thanhCongDuyet?: string;
  thanhCongTuChoi?: string;
  sau?: () => void;
  size?: "default" | "sm";
}) {
  return (
    <div className="flex gap-2">
      <DialogNhanXet
        loai="duyet"
        doiTuong={doiTuong}
        size={size}
        onGui={onDuyet}
        thanhCong={thanhCongDuyet}
        sau={sau}
      />
      <DialogNhanXet
        loai="tu-choi"
        doiTuong={doiTuong}
        size={size}
        onGui={onTuChoi}
        thanhCong={thanhCongTuChoi}
        sau={sau}
      />
    </div>
  );
}

function DialogNhanXet<T>({
  loai,
  doiTuong,
  onGui,
  thanhCong,
  sau,
  size,
}: {
  loai: "duyet" | "tu-choi";
  doiTuong: string;
  onGui: (nhanXet: string) => Promise<KetQuaHanhDong<T>>;
  thanhCong: string;
  sau?: () => void;
  size: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [nhanXet, setNhanXet] = useState("");
  const { pending, chay } = useHanhDong();
  const laDuyet = loai === "duyet";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setNhanXet("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant={laDuyet ? "default" : "destructive"} size={size}>
          {laDuyet ? <Check className="size-4" /> : <X className="size-4" />}
          {laDuyet ? "Duyệt" : "Từ chối"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            chay(() => onGui(nhanXet), {
              thanhCong,
              sau: () => {
                setOpen(false);
                sau?.();
              },
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{laDuyet ? `Duyệt ${doiTuong}` : `Từ chối ${doiTuong}`}</DialogTitle>
            <DialogDescription>
              {laDuyet ? "Có thể ghi nhận xét (không bắt buộc)." : "Bắt buộc nhập nhận xét để người làm KPI biết cần sửa gì."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`nhan-xet-${loai}`}>Nhận xét</Label>
            <Textarea
              id={`nhan-xet-${loai}`}
              value={nhanXet}
              onChange={(e) => setNhanXet(e.target.value)}
              required={!laDuyet}
              maxLength={2000}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant={laDuyet ? "default" : "destructive"} disabled={pending || (!laDuyet && !nhanXet.trim())}>
              {laDuyet ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
