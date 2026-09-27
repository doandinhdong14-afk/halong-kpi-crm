import Link from "next/link";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { NHAN_DANG_KY } from "@/lib/nhan";
import { hienNgayGio } from "@/lib/time";

export default async function TrangDuyetDangKy() {
  const tbm = await yeuCauVaiTro("TBM");
  const boMonId = tbm.boMonId ?? "__khong_co__";

  const [choDuyet, daXuLy] = await Promise.all([
    db.dangKy.findMany({
      where: { trangThai: "CHO_DUYET", gv: { boMonId }, ky: { daChot: false } },
      orderBy: { nopLuc: "asc" },
      include: { gv: { select: { hoTen: true, username: true } }, ky: { select: { ten: true } }, _count: { select: { nhiemVus: true } } },
    }),
    db.dangKy.findMany({
      where: { trangThai: { in: ["DA_DUYET", "TU_CHOI"] }, gv: { boMonId } },
      orderBy: { duyetLuc: "desc" },
      take: 50,
      include: { gv: { select: { hoTen: true, username: true } }, ky: { select: { ten: true } }, _count: { select: { nhiemVus: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <TrangTieuDe tieuDe="Duyệt đăng ký" moTa="Duyệt hoặc từ chối cả danh sách nhiệm vụ giáo viên trong bộ môn đã gửi." />

      <section>
        <h2 className="mb-3 font-semibold">Chờ duyệt ({choDuyet.length})</h2>
        <BangDangKy
          rows={choDuyet.map((d) => ({
            id: d.id,
            gv: `${d.gv.hoTen} (${d.gv.username})`,
            ky: d.ky.ten,
            soNv: d._count.nhiemVus,
            tongDiem: d.tongDiem,
            xepLoai: d.xepLoai,
            thoiGian: d.nopLuc ? hienNgayGio(d.nopLuc) : "",
            trangThai: d.trangThai,
          }))}
          cotThoiGian="Gửi lúc"
          trong="Không có danh sách nào đang chờ duyệt."
        />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Đã xử lý</h2>
        <BangDangKy
          rows={daXuLy.map((d) => ({
            id: d.id,
            gv: `${d.gv.hoTen} (${d.gv.username})`,
            ky: d.ky.ten,
            soNv: d._count.nhiemVus,
            tongDiem: d.tongDiem,
            xepLoai: d.xepLoai,
            thoiGian: d.duyetLuc ? hienNgayGio(d.duyetLuc) : "",
            trangThai: d.trangThai,
          }))}
          cotThoiGian="Xử lý lúc"
          trong="Chưa có."
        />
      </section>
    </div>
  );
}

type Dong = {
  id: string;
  gv: string;
  ky: string;
  soNv: number;
  tongDiem: number;
  xepLoai: string | null;
  thoiGian: string;
  trangThai: keyof typeof NHAN_DANG_KY;
};

function BangDangKy({ rows, cotThoiGian, trong }: { rows: Dong[]; cotThoiGian: string; trong: string }) {
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Giáo viên</TableHead>
            <TableHead>Kỳ</TableHead>
            <TableHead>Số nhiệm vụ</TableHead>
            <TableHead>Tổng điểm</TableHead>
            <TableHead>Xếp loại</TableHead>
            <TableHead>{cotThoiGian}</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                {trong}
              </TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.gv}</TableCell>
              <TableCell>{r.ky}</TableCell>
              <TableCell>{r.soNv}</TableCell>
              <TableCell>{r.tongDiem}</TableCell>
              <TableCell>{r.xepLoai}</TableCell>
              <TableCell>{r.thoiGian}</TableCell>
              <TableCell>
                <BadgeTrangThai trangThai={r.trangThai} nhan={NHAN_DANG_KY[r.trangThai]} />
              </TableCell>
              <TableCell>
                <Link href={`/tbm/duyet-dang-ky/${r.id}`} className="text-sm font-medium text-primary hover:underline">
                  Xem
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
