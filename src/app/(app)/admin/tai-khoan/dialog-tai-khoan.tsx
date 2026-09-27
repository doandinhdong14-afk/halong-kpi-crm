"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { datLaiMatKhau, suaTaiKhoan, taoTaiKhoan, xemTruocTaiKhoan } from "./actions";

export type KhoaChon = { id: string; ten: string; hieuPhoId: string | null; hieuPho: string | null };

type UserSua = { id: string; username: string; hoTen: string; role: Role; khoaPhuTrachIds: string[] };

type Props = { khoas: KhoaChon[] } & (
  | { cheDo: "tao" }
  | { cheDo: "sua"; user: UserSua; laChinhMinh: boolean }
);

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
      <DialogContent>{open && <NoiDung {...props} dong={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  );
}

function NoiDung(props: Props & { dong: () => void }) {
  const laSua = props.cheDo === "sua";
  const user = laSua ? props.user : undefined;
  const [hoTen, setHoTen] = useState(user?.hoTen ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "GV");
  const [khoaIds, setKhoaIds] = useState<Set<string>>(() => new Set(user?.khoaPhuTrachIds ?? []));
  const [xemTruoc, setXemTruoc] = useState<{ ten: string; soKyCoKpi: number; loi?: string } | null>(null);
  const [xacNhanXoaKpi, setXacNhanXoaKpi] = useState(false);
  const luu = useHanhDong();
  const matKhau = useHanhDong();

  // Khoa chọn được cho hiệu phó: khoa chưa có hiệu phó, hoặc khoa chính người này đang phụ trách.
  const khoaChonDuoc = props.khoas.filter((k) => !k.hieuPhoId || k.hieuPhoId === user?.id);
  const khoaCuaNguoiKhac = props.khoas.filter((k) => k.hieuPhoId && k.hieuPhoId !== user?.id);

  // Xem trước tên đăng nhập (sinh ở server, đã kiểm tra trùng) và cảnh báo dữ liệu KPI khi đổi chức vụ.
  useEffect(() => {
    let huy = false;
    const t = setTimeout(async () => {
      if (!hoTen.trim()) {
        if (!huy) setXemTruoc(null);
        return;
      }
      const r = await xemTruocTaiKhoan({ hoTen, role, userId: user?.id });
      if (huy) return;
      setXemTruoc(r.ok ? { ten: r.data.username, soKyCoKpi: r.data.soKyCoKpi } : { ten: "", soKyCoKpi: 0, loi: r.error });
    }, 250);
    return () => {
      huy = true;
      clearTimeout(t);
    };
  }, [hoTen, role, user?.id]);

  const canXacNhan = (xemTruoc?.soKyCoKpi ?? 0) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const khoaPhuTrachIds = role === "HP" ? [...khoaIds] : [];
    if (laSua) {
      luu.chay(() => suaTaiKhoan({ id: props.user.id, hoTen, role, khoaPhuTrachIds, xacNhanXoaKpi }), {
        thanhCong: (d) => (d.doiTen ? `Đã lưu. Tên đăng nhập mới: ${d.username}` : "Đã lưu thay đổi."),
        sau: (d) => {
          if (d.doiTen) toast.info(`Tên đăng nhập đã đổi từ ${props.user.username} thành ${d.username}.`, { duration: 10000 });
          props.dong();
        },
      });
    } else {
      luu.chay(() => taoTaiKhoan({ hoTen, role, khoaPhuTrachIds }), {
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
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v as Role);
            setXacNhanXoaKpi(false);
          }}
          disabled={laSua && props.laChinhMinh}
        >
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

      {role === "HP" && (
        <fieldset className="space-y-2" data-testid="khoa-phu-trach">
          <legend className="text-sm font-medium">Khoa phụ trách</legend>
          {khoaChonDuoc.length === 0 && (
            <p className="text-sm text-muted-foreground">Không còn khoa nào chưa có hiệu phó.</p>
          )}
          {khoaChonDuoc.map((k) => (
            <label key={k.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={khoaIds.has(k.id)}
                onCheckedChange={(v) =>
                  setKhoaIds((s) => {
                    const n = new Set(s);
                    if (v === true) n.add(k.id);
                    else n.delete(k.id);
                    return n;
                  })
                }
                aria-label={`Phụ trách ${k.ten}`}
              />
              {k.ten}
            </label>
          ))}
          {khoaCuaNguoiKhac.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Đã có hiệu phó: {khoaCuaNguoiKhac.map((k) => `${k.ten} (${k.hieuPho})`).join(", ")}.
            </p>
          )}
        </fieldset>
      )}

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

      {canXacNhan && (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" data-testid="canh-bao-kpi">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            Tài khoản đang có dữ liệu KPI ở {xemTruoc?.soKyCoKpi} kỳ chưa chốt (đăng ký, task, minh chứng theo vị trí cũ).
            Đổi chức vụ sẽ xóa toàn bộ dữ liệu này. Kết quả các kỳ đã chốt vẫn giữ nguyên.
          </p>
          <label className="flex items-center gap-2 font-medium">
            <Checkbox checked={xacNhanXoaKpi} onCheckedChange={(v) => setXacNhanXoaKpi(v === true)} />
            Tôi hiểu, xóa dữ liệu KPI của kỳ chưa chốt
          </label>
        </div>
      )}

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
        <Button type="submit" disabled={luu.pending || !hoTen.trim() || (canXacNhan && !xacNhanXoaKpi)}>
          {luu.pending ? "Đang lưu…" : "Lưu"}
        </Button>
      </DialogFooter>
    </form>
  );
}
