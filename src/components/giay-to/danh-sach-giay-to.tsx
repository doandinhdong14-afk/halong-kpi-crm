import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NguoiDung } from "@/lib/auth/dal";
import { dsGiayToCuaToi } from "@/lib/services/van-ban";
import { hienNgayGio } from "@/lib/time";

/** Danh sách quy định cho vị trí hiện tại (Nhận giấy tờ / Nhận chỉ thị, mục 6.4, 8.3). */
export async function DanhSachGiayTo({ u, duongDan }: { u: NguoiDung; duongDan: string }) {
  const ds = await dsGiayToCuaToi(u);
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Ngày ban hành</TableHead>
            <TableHead>File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ds.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                Chưa có quy định nào.
              </TableCell>
            </TableRow>
          )}
          {ds.map((vb) => (
            <TableRow key={vb.id} data-giay-to={vb.tieuDe}>
              <TableCell>
                <Link href={`${duongDan}/${vb.id}`} className={vb.daXem ? "text-primary hover:underline" : "font-semibold text-primary hover:underline"}>
                  {vb.tieuDe}
                </Link>
                {!vb.daXem && <Badge className="ml-2 bg-red-600 text-white">Mới</Badge>}
              </TableCell>
              <TableCell>{hienNgayGio(vb.guiLuc)}</TableCell>
              <TableCell>{vb.soFile || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
