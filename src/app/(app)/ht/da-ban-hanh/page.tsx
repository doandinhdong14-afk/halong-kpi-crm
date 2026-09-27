import Link from "next/link";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { hienNgayGio } from "@/lib/time";

export default async function TrangDaBanHanh() {
  const ht = await yeuCauVaiTro("HT");
  const vanBans = await db.vanBan.findMany({
    where: { nguoiGuiId: ht.id },
    orderBy: { guiLuc: "desc" },
    include: { nguoiNhans: { select: { daXemLuc: true } }, _count: { select: { files: true } } },
  });
  return (
    <div>
      <TrangTieuDe tieuDe="Đã ban hành" moTa="Giấy tờ đã gửi và tình trạng đã xem." />
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Ngày gửi</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Đã xem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vanBans.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Chưa ban hành giấy tờ nào.
                </TableCell>
              </TableRow>
            )}
            {vanBans.map((vb) => {
              const daXem = vb.nguoiNhans.filter((n) => n.daXemLuc).length;
              return (
                <TableRow key={vb.id} data-van-ban={vb.tieuDe}>
                  <TableCell>
                    <Link href={`/ht/da-ban-hanh/${vb.id}`} className="font-medium text-primary hover:underline">
                      {vb.tieuDe}
                    </Link>
                  </TableCell>
                  <TableCell>{hienNgayGio(vb.guiLuc)}</TableCell>
                  <TableCell>{vb._count.files || "—"}</TableCell>
                  <TableCell>
                    <Link href={`/ht/da-ban-hanh/${vb.id}`} className="hover:underline" data-testid="da-xem">
                      {daXem}/{vb.nguoiNhans.length} đã xem
                    </Link>
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
