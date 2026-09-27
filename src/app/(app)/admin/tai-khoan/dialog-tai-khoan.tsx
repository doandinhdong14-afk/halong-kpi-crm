"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/generated/prisma/enums";
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
import { ROLES, TEN_VAI_TRO } from "@/lib/roles";
import { datLaiMatKhau, suaTaiKhoan, taoTaiKhoan, xemTruocTenDangNhap } from "./actions";

type Props =
  | { cheDo: "tao" }
  | { cheDo: "sua"; user: { id: string; username: string; hoTen: string; role: Role }; laChinhMinh: boolean };

export function DialogTaiKhoan(props: Props) {
  const [open, setOpen] = useState(false);
  const laSua = props.cheDo === "sua";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {laSua ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" /> Sửa
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" /> Thêm tài khoản
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        {open && <NoiDung {...props} dong={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function NoiDung(props: Props & { dong: () => void }) {
  const laSua = props.cheDo === "sua";
  const user = laSua ? props.user : undefined;
  const [hoTen, setHoTen] = useState(user?.hoTen ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "GV");
  const [xemTruoc, setXemTruoc] = useState<{ ten: string; loi?: string } | null>(null);
  const luu = useHanhDong();
  const matKhau = useHanhDong();

  // Xem trước tên đăng nhập (sinh ở server, đã kiểm tra trùng).
  useEffect(() => {
    let huy = false;
    const t = setTimeout(async () => {
      if (!hoTen.trim()) {
        if (!huy) setXemTruoc(null);
        return;
      }
      const r = await xemTruocTenDangNhap({ hoTen, role, userId: user?.id });
      if (huy) return;
      setXemTruoc(r.ok ? { ten: r.data } : { ten: "", loi: r.error });
    }, 250);
    return () => {
      huy = true;
      clearTimeout(t);
    };
  }, [hoTen, role, user?.id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (laSua) {
      luu.chay(() => suaTaiKhoan({ id: props.user.id, hoTen, role }), {
        thanhCong: (d) =>
          d.doiTen ? `Đã lưu. Tên đăng nhập mới: ${d.username}` : "Đã lưu thay đổi.",
        sau: (d) => {
          if (d.doiTen) toast.info(`Tên đăng nhập đã đổi từ ${props.user.username} thành ${d.username}.`, { duration: 10000 });
          props.dong();
        },
      });
    } else {
      luu.chay(() => taoTaiKhoan({ hoTen, role }), {
        thanhCong: (d) => `Đã tạo tài khoản ${d.username} (mật khẩu 123456).`,
        sau: () => props.dong(),
      });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{laSua ? `Sửa tài khoản ${props.user.username}` : "Thêm tài khoản"}</DialogTitle>
        <DialogDescription>
          Tên đăng nhập tự sinh theo chức vụ và họ tên. Đổi chức vụ hoặc họ tên sẽ đổi tên đăng nhập.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="hoTen">Họ tên</Label>
        <Input id="hoTen" value={hoTen} onChange={(e) => setHoTen(e.target.value)} autoFocus required maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="chucVu">Chức vụ</Label>
        <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={laSua && props.laChinhMinh}>
          <SelectTrigger id="chucVu" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {TEN_VAI_TRO[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {laSua && props.laChinhMinh && (
          <p className="text-xs text-muted-foreground">Không thể tự đổi chức vụ của chính mình.</p>
        )}
      </div>

      <div className="rounded-md bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Tên đăng nhập: </span>
        {xemTruoc?.loi ? (
          <span className="text-destructive">{xemTruoc.loi}</span>
        ) : (
          <span className="font-mono font-medium" data-testid="xem-truoc-username">
            {xemTruoc?.ten ?? "—"}
          </span>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {laSua ? (
          <Button
            type="button"
            variant="outline"
            disabled={matKhau.pending}
            onClick={() =>
              matKhau.chay(() => datLaiMatKhau(props.user.id), {
                thanhCong: `Đã đặt lại mật khẩu của ${props.user.username} về 123456.`,
              })
            }
          >
            Đặt lại mật khẩu
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={luu.pending || !hoTen.trim()}>
          {luu.pending ? "Đang lưu…" : "Lưu"}
        </Button>
      </DialogFooter>
    </form>
  );
}
