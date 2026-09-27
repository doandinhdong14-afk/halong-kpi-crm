import type { Role } from "@/generated/prisma/enums";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TEN_VAI_TRO } from "@/lib/roles";
import { hienNgayGio } from "@/lib/time";

type NguoiNhan = { daXemLuc: Date | null; user: { hoTen: string; username: string; role: Role } };

/** Ai đã xem, ai chưa xem một giấy tờ (HT, Admin xem cấu hình). */
export function BangNguoiNhan({ nguoiNhans }: { nguoiNhans: NguoiNhan[] }) {
  const ds = [...nguoiNhans].sort((a, b) => Number(!!b.daXemLuc) - Number(!!a.daXemLuc) || a.user.hoTen.localeCompare(b.user.hoTen));
  const daXem = ds.filter((n) => n.daXemLuc).length;
  return (
    <div>
      <h2 className="mb-2 font-semibold">
        Người nhận: <span data-testid="tong-da-xem">{daXem}/{ds.length} đã xem</span>
      </h2>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Tên đăng nhập</TableHead>
              <TableHead>Chức vụ</TableHead>
              <TableHead>Tình trạng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ds.map((n) => (
              <TableRow key={n.user.username} data-nguoi-nhan={n.user.username}>
                <TableCell>{n.user.hoTen}</TableCell>
                <TableCell className="font-mono text-xs">{n.user.username}</TableCell>
                <TableCell>{TEN_VAI_TRO[n.user.role]}</TableCell>
                <TableCell>
                  {n.daXemLuc ? (
                    <span className="text-emerald-700">Đã xem · {hienNgayGio(n.daXemLuc)}</span>
                  ) : (
                    <span className="text-muted-foreground">Chưa xem</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
