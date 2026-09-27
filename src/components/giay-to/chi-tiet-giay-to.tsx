import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DanhSachFile } from "@/components/chung/danh-sach-file";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { hienNgayGio } from "@/lib/time";
import { DanhDauDaXem } from "./danh-dau-da-xem";

/** Chi tiết giấy tờ cho người nhận: nội dung + file. Lần đầu mở → ghi nhận đã xem. */
export async function ChiTietGiayTo({
  userId,
  vanBanId,
  quayLai,
  nhanQuayLai,
}: {
  userId: string;
  vanBanId: string;
  quayLai: string;
  nhanQuayLai: string;
}) {
  const nhan = await db.vanBanNguoiNhan.findUnique({
    where: { vanBanId_userId: { vanBanId, userId } },
    include: {
      vanBan: {
        include: {
          nguoiGui: { select: { hoTen: true } },
          files: { orderBy: { taoLuc: "asc" }, select: { id: true, tenGoc: true, kichThuoc: true } },
        },
      },
    },
  });
  if (!nhan) notFound();
  const vb = nhan.vanBan;

  return (
    <div className="space-y-4">
      <DanhDauDaXem vanBanId={vb.id} />
      <Link href={quayLai} className="inline-flex items-center text-sm text-muted-foreground hover:underline">
        <ChevronLeft className="size-4" /> {nhanQuayLai}
      </Link>
      <TrangTieuDe tieuDe={vb.tieuDe} moTa={`${vb.nguoiGui?.hoTen ?? "Hiệu trưởng"} · gửi lúc ${hienNgayGio(vb.guiLuc)}`} />
      <Card>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="noi-dung">
            {vb.noiDung}
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">File đính kèm</div>
            <DanhSachFile files={vb.files} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
