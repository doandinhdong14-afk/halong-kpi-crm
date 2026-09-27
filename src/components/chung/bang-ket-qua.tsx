import type { KetQuaKy } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MucTask } from "@/lib/ket-qua";
import { NHAN_KET_QUA } from "@/lib/nhan";
import { hienPhanTram } from "@/lib/tien-do";

const MAU = {
  KHONG_DAT: "bg-red-100 text-red-800",
  DAT: "bg-emerald-100 text-emerald-800",
  VUOT: "bg-sky-100 text-sky-800",
} as const;

type Dong = KetQuaKy & { gv: { hoTen: string; username: string } };

/** Bảng kết quả kỳ từng GV: kết quả, xếp loại, %, task thiếu/vượt (TBM, Admin). */
export function BangKetQua({ ketQuas }: { ketQuas: Dong[] }) {
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Giáo viên</TableHead>
            <TableHead>Kết quả</TableHead>
            <TableHead>Xếp loại đăng ký</TableHead>
            <TableHead>% task bắt buộc</TableHead>
            <TableHead>Task thiếu</TableHead>
            <TableHead>Task vượt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ketQuas.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Không có kết quả.
              </TableCell>
            </TableRow>
          )}
          {ketQuas.map((k) => {
            const thieu = k.taskThieu as MucTask[];
            const vuot = k.taskVuot as MucTask[];
            return (
              <TableRow key={k.id} data-gv={k.gv.username} className="align-top">
                <TableCell>
                  <div className="font-medium">{k.gv.hoTen}</div>
                  <div className="text-xs text-muted-foreground">{k.gv.username}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`border-transparent ${MAU[k.ketQua]}`}>
                    {NHAN_KET_QUA[k.ketQua]}
                  </Badge>
                  {k.ghiChu && <div className="mt-1 max-w-48 text-xs text-muted-foreground">{k.ghiChu}</div>}
                </TableCell>
                <TableCell className="font-semibold">{k.xepLoai}</TableCell>
                <TableCell>{hienPhanTram(k.phanTram)}</TableCell>
                <TableCell>
                  {thieu.length ? (
                    <details>
                      <summary className="cursor-pointer text-sm">{thieu.length} task</summary>
                      <ul className="mt-1 list-inside list-disc text-xs">
                        {thieu.map((t, i) => (
                          <li key={i}>
                            {t.ten} – {t.nhiemVu}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {vuot.length ? (
                    <ul className="list-inside list-disc text-xs">
                      {vuot.map((t, i) => (
                        <li key={i}>{t.ten}</li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
