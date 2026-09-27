import type { Ky } from "@/generated/prisma/client";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { NHAN_DUYET } from "@/lib/nhan";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { hienNgayGio } from "@/lib/time";
import { NutDuyetYeuCau } from "./nut-duyet-yeu-cau";

/** Tab Xin thêm task (mục 6.1): các yêu cầu → Duyệt / Từ chối + nhận xét. */
export async function TabXinThem({ ky, userId }: { ky: Ky; userId: string }) {
  const ds = await db.yeuCauThemTask.findMany({
    where: { kyId: ky.id, userId },
    orderBy: { taoLuc: "desc" },
    include: { task: { select: { ten: true, nhiemVu: { select: { ten: true } } } } },
  });
  const lyDoKhoa = lyDoKhongThaoTacTask(ky);

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task mở rộng</TableHead>
            <TableHead>Nhiệm vụ</TableHead>
            <TableHead>Xin lúc</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Nhận xét</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ds.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                Chưa có yêu cầu xin thêm task.
              </TableCell>
            </TableRow>
          )}
          {ds.map((y) => (
            <TableRow key={y.id} data-yeu-cau={y.task.ten}>
              <TableCell className="font-medium">{y.task.ten}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{y.task.nhiemVu.ten}</TableCell>
              <TableCell className="text-sm">{hienNgayGio(y.taoLuc)}</TableCell>
              <TableCell>
                <BadgeTrangThai trangThai={y.trangThai} nhan={NHAN_DUYET[y.trangThai]} laDangKy />
              </TableCell>
              <TableCell className="max-w-64 text-sm">{y.nhanXet ?? "—"}</TableCell>
              <TableCell>
                {y.trangThai === "CHO_DUYET" &&
                  (lyDoKhoa ? (
                    <span className="text-xs text-destructive">{lyDoKhoa}</span>
                  ) : (
                    <NutDuyetYeuCau yeuCauId={y.id} />
                  ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
