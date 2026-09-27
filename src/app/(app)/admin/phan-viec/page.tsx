import Link from "next/link";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { moTaThoiGianKy, trangThaiKy } from "@/lib/ky";
import { DialogTaoKy } from "./dialog-tao-ky";

export default async function TrangPhanViec() {
  await yeuCauVaiTro("ADMIN");
  const kys = await db.ky.findMany({
    orderBy: [{ ngayBatDau: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { nhiemVus: true } } },
  });

  return (
    <div>
      <TrangTieuDe tieuDe="Phân việc đầu kỳ" moTa="Tạo kỳ, nhiệm vụ, task và bảng xếp loại. GV chỉ thấy kỳ đã công bố.">
        <DialogTaoKy kys={kys.map((k) => ({ id: k.id, ten: k.ten }))} />
      </TrangTieuDe>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên kỳ</TableHead>
              <TableHead>Năm học</TableHead>
              <TableHead>Kỳ số</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead>Số nhiệm vụ</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kys.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có kỳ nào.
                </TableCell>
              </TableRow>
            )}
            {kys.map((k) => {
              const tg = moTaThoiGianKy(k);
              const tt = trangThaiKy(k);
              return (
                <TableRow key={k.id}>
                  <TableCell>
                    <Link href={`/admin/phan-viec/${k.id}`} className="font-medium text-primary hover:underline">
                      {k.ten}
                    </Link>
                  </TableCell>
                  <TableCell>{k.namHoc}</TableCell>
                  <TableCell>{k.soKy}</TableCell>
                  <TableCell>{tg.batDau}</TableCell>
                  <TableCell>{tg.ketThuc}</TableCell>
                  <TableCell>{k._count.nhiemVus}</TableCell>
                  <TableCell>
                    <Badge variant={tt === "Đã công bố" ? "default" : tt === "Đã chốt" ? "secondary" : "outline"}>{tt}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
