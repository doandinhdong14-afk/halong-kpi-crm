import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DanhSachFile } from "@/components/chung/danh-sach-file";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { BangNguoiNhan } from "@/components/giay-to/bang-nguoi-nhan";
import { Card, CardContent } from "@/components/ui/card";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { hienNgayGio } from "@/lib/time";

/** Admin xem giấy tờ đã ban hành + ai đã xem (chỉ xem; không tính là đã xem). */
export default async function TrangGiayToCauHinh(props: PageProps<"/admin/cau-hinh/giay-to/[id]">) {
  await yeuCauVaiTro("ADMIN");
  const { id } = await props.params;
  const vb = await db.vanBan.findUnique({
    where: { id },
    include: {
      nguoiGui: { select: { hoTen: true } },
      files: { orderBy: { taoLuc: "asc" }, select: { id: true, tenGoc: true, kichThuoc: true } },
      nguoiNhans: { include: { user: { select: { hoTen: true, username: true, role: true } } } },
    },
  });
  if (!vb) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/cau-hinh?tab=giay-to" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
        <ChevronLeft className="size-4" /> Giấy tờ đã ban hành
      </Link>
      <TrangTieuDe tieuDe={vb.tieuDe} moTa={`${vb.nguoiGui?.hoTen ?? "(tài khoản đã xóa)"} · ${hienNgayGio(vb.guiLuc)}`} />
      <Card>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap text-sm">{vb.noiDung}</div>
          <DanhSachFile files={vb.files} />
        </CardContent>
      </Card>
      <BangNguoiNhan nguoiNhans={vb.nguoiNhans} />
    </div>
  );
}
