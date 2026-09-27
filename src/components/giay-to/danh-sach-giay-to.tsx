import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { hienNgayGio } from "@/lib/time";

/** Danh sách giấy tờ người dùng nhận được (Nhận giấy tờ / Nhận chỉ thị). */
export async function DanhSachGiayTo({ userId, duongDan }: { userId: string; duongDan: string }) {
  const ds = await db.vanBanNguoiNhan.findMany({
    where: { userId },
    orderBy: { vanBan: { guiLuc: "desc" } },
    include: { vanBan: { select: { id: true, tieuDe: true, guiLuc: true, _count: { select: { files: true } } } } },
  });
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead>File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ds.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                Chưa có giấy tờ nào.
              </TableCell>
            </TableRow>
          )}
          {ds.map(({ vanBan: vb, daXemLuc }) => (
            <TableRow key={vb.id} data-giay-to={vb.tieuDe}>
              <TableCell>
                <Link href={`${duongDan}/${vb.id}`} className={daXemLuc ? "text-primary hover:underline" : "font-semibold text-primary hover:underline"}>
                  {vb.tieuDe}
                </Link>
                {!daXemLuc && <Badge className="ml-2 bg-red-600 text-white">Mới</Badge>}
              </TableCell>
              <TableCell>{hienNgayGio(vb.guiLuc)}</TableCell>
              <TableCell>{vb._count.files || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
