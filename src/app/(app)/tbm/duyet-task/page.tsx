import Link from "next/link";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { NHAN_LOAI_TASK } from "@/lib/nhan";
import { hienNgayGio } from "@/lib/time";

export default async function TrangDuyetTask() {
  const tbm = await yeuCauVaiTro("TBM");
  const baiNops = await db.baiNop.findMany({
    where: {
      trangThai: "CHO_DUYET",
      gvTask: { gv: { boMonId: tbm.boMonId ?? "__khong_co__" }, ky: { daChot: false } },
    },
    orderBy: { nopLuc: "asc" },
    include: {
      _count: { select: { files: true } },
      gvTask: {
        include: {
          gv: { select: { hoTen: true, username: true } },
          ky: { select: { ten: true } },
          task: { select: { ten: true, loai: true, nhiemVu: { select: { ten: true } } } },
        },
      },
    },
  });

  return (
    <div>
      <TrangTieuDe tieuDe="Duyệt task" moTa="Các lần nộp minh chứng đang chờ duyệt của giáo viên trong bộ môn." />
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giáo viên</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Nhiệm vụ</TableHead>
              <TableHead>Kỳ</TableHead>
              <TableHead>Số file</TableHead>
              <TableHead>Nộp lúc</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {baiNops.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Không có lần nộp nào đang chờ duyệt.
                </TableCell>
              </TableRow>
            )}
            {baiNops.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.gvTask.gv.hoTen}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.gvTask.task.loai === "BAT_BUOC" ? "default" : "outline"}>
                      {NHAN_LOAI_TASK[b.gvTask.task.loai]}
                    </Badge>
                    {b.gvTask.task.ten}
                  </div>
                </TableCell>
                <TableCell>{b.gvTask.task.nhiemVu.ten}</TableCell>
                <TableCell>{b.gvTask.ky.ten}</TableCell>
                <TableCell>{b._count.files}</TableCell>
                <TableCell>{hienNgayGio(b.nopLuc)}</TableCell>
                <TableCell>
                  <Link href={`/tbm/duyet-task/${b.id}`} className="text-sm font-medium text-primary hover:underline">
                    Xem
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
