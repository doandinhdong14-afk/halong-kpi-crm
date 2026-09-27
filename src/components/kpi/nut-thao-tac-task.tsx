"use client";

import { useState } from "react";
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
import { useHanhDong } from "@/components/chung/use-hanh-dong";
import type { NutTask } from "@/lib/kpi/nut-task";
import { thaoTacTask } from "./actions";

const NGUY_HIEM = new Set<NutTask["hanhDong"]>(["TU_CHOI", "TRA_VE", "TRA_LAM_LAI", "HUY_DUYET"]);

/** Các nút thao tác của người duyệt / người chốt trên một task (danh sách nút do server tính theo máy trạng thái). */
export function NutThaoTacTask({ kpiTaskId, nuts }: { kpiTaskId: string; nuts: NutTask[] }) {
  if (!nuts.length) return null;
  return (
    <div className="flex flex-wrap gap-2" data-testid="nut-thao-tac">
      {nuts.map((n) => (
        <DialogThaoTac key={n.hanhDong} kpiTaskId={kpiTaskId} nut={n} />
      ))}
    </div>
  );
}

function DialogThaoTac({ kpiTaskId, nut }: { kpiTaskId: string; nut: NutTask }) {
  const [open, setOpen] = useState(false);
  const [nhanXet, setNhanXet] = useState("");
  const { pending, chay } = useHanhDong();
  const nguyHiem = NGUY_HIEM.has(nut.hanhDong);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setNhanXet("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant={nguyHiem ? "outline" : "default"} size="sm">
          {nut.nhan}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            chay(() => thaoTacTask({ kpiTaskId, hanhDong: nut.hanhDong, nhanXet }), {
              thanhCong: `Đã ${nut.nhan.toLowerCase()}.`,
              sau: () => setOpen(false),
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{nut.nhan}?</DialogTitle>
            <DialogDescription>{nut.moTa}</DialogDescription>
          </DialogHeader>
          {nut.choPhepNhanXet && (
            <div className="space-y-2">
              <Label htmlFor={`nx-${nut.hanhDong}`}>Nhận xét{nut.canNhanXet ? " (bắt buộc)" : " (không bắt buộc)"}</Label>
              <Textarea
                id={`nx-${nut.hanhDong}`}
                value={nhanXet}
                onChange={(e) => setNhanXet(e.target.value)}
                required={nut.canNhanXet}
                maxLength={2000}
                autoFocus
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="submit"
              variant={nguyHiem ? "destructive" : "default"}
              disabled={pending || (nut.canNhanXet && !nhanXet.trim())}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
