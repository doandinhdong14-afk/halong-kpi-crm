"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHanhDong } from "@/components/chung/use-hanh-dong";
import { taoKy } from "./actions";

const KHONG = "khong";

export function DialogTaoKy({ kys }: { kys: { id: string; ten: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saoChep, setSaoChep] = useState(kys[0]?.id ?? KHONG);
  const [soKy, setSoKy] = useState("1");
  const { pending, chay } = useHanhDong();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    chay(
      () =>
        taoKy({
          ten: String(f.get("ten")),
          namHoc: String(f.get("namHoc")),
          soKy,
          ngayBatDau: String(f.get("ngayBatDau")),
          ngayKetThuc: String(f.get("ngayKetThuc")),
          saoChepTuKyId: saoChep === KHONG ? undefined : saoChep,
        }),
      {
        thanhCong: "Đã tạo kỳ.",
        sau: (d) => {
          setOpen(false);
          router.push(`/admin/phan-viec/${d.id}`);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Tạo kỳ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tạo kỳ mới</DialogTitle>
            <DialogDescription>Kỳ mới ở trạng thái chưa công bố. GV chỉ thấy kỳ sau khi bấm Công bố.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ten">Tên kỳ</Label>
            <Input id="ten" name="ten" placeholder="Kỳ 1 – 2026-2027" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="namHoc">Năm học</Label>
              <Input id="namHoc" name="namHoc" placeholder="2026-2027" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soKy">Kỳ số</Label>
              <Select value={soKy} onValueChange={setSoKy}>
                <SelectTrigger id="soKy" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Kỳ {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ngayBatDau">Ngày bắt đầu</Label>
              <Input id="ngayBatDau" name="ngayBatDau" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ngayKetThuc">Ngày kết thúc</Label>
              <Input id="ngayKetThuc" name="ngayKetThuc" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="saoChep">Sao chép từ kỳ trước</Label>
            <Select value={saoChep} onValueChange={setSaoChep}>
              <SelectTrigger id="saoChep" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KHONG}>Không sao chép (kỳ trống)</SelectItem>
                {kys.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.ten}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Chép toàn bộ nhiệm vụ, task và bảng xếp loại sang kỳ mới.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang tạo…" : "Tạo kỳ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
