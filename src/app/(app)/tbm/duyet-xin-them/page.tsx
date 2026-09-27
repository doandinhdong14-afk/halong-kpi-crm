import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { NHAN_DUYET } from "@/lib/nhan";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { hienNgayGio } from "@/lib/time";
import { NutDuyetYeuCau } from "./nut-duyet";

export default async function TrangDuyetXinThem() {
  const tbm = await yeuCauVaiTro("TBM");
  const boMonId = tbm.boMonId ?? "__khong_co__";
  const include = {
    gv: { select: { hoTen: true } },
    ky: true,
    task: { select: { ten: true, nhiemVu: { select: { ten: true } } } },
  } as const;
  const [choDuyet, daXuLy] = await Promise.all([
    db.yeuCauThemTask.findMany({
      where: { trangThai: "CHO_DUYET", gv: { boMonId }, ky: { daChot: false } },
      orderBy: { taoLuc: "asc" },
      include,
    }),
    db.yeuCauThemTask.findMany({
      where: { trangThai: { in: ["DA_DUYET", "TU_CHOI"] }, gv: { boMonId } },
      orderBy: { duyetLuc: "desc" },
      take: 50,
      include,
    }),
  ]);

  return (
    <div className="space-y-8">
      <TrangTieuDe tieuDe="Duyệt xin thêm task" moTa="Yêu cầu làm thêm task mở rộng (làm vượt) của giáo viên trong bộ môn." />

      <section>
        <h2 className="mb-3 font-semibold">Chờ duyệt ({choDuyet.length})</h2>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giáo viên</TableHead>
                <TableHead>Task mở rộng</TableHead>
                <TableHead>Nhiệm vụ</TableHead>
                <TableHead>Kỳ</TableHead>
                <TableHead>Xin lúc</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {choDuyet.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Không có yêu cầu nào đang chờ.
                  </TableCell>
                </TableRow>
              )}
              {choDuyet.map((y) => {
                const lyDo = lyDoKhongThaoTacTask(y.ky);
                return (
                  <TableRow key={y.id} data-yeu-cau={`${y.gv.hoTen} – ${y.task.ten}`}>
                    <TableCell className="font-medium">{y.gv.hoTen}</TableCell>
                    <TableCell>{y.task.ten}</TableCell>
                    <TableCell>{y.task.nhiemVu.ten}</TableCell>
                    <TableCell>{y.ky.ten}</TableCell>
                    <TableCell>{hienNgayGio(y.taoLuc)}</TableCell>
                    <TableCell>
                      {lyDo ? <span className="text-sm text-destructive">{lyDo}</span> : <NutDuyetYeuCau yeuCauId={y.id} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Đã xử lý</h2>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giáo viên</TableHead>
                <TableHead>Task mở rộng</TableHead>
                <TableHead>Kỳ</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead>Nhận xét</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daXuLy.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Chưa có.
                  </TableCell>
                </TableRow>
              )}
              {daXuLy.map((y) => (
                <TableRow key={y.id}>
                  <TableCell>{y.gv.hoTen}</TableCell>
                  <TableCell>{y.task.ten}</TableCell>
                  <TableCell>{y.ky.ten}</TableCell>
                  <TableCell>
                    <BadgeTrangThai trangThai={y.trangThai} nhan={NHAN_DUYET[y.trangThai]} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{y.nhanXet}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
