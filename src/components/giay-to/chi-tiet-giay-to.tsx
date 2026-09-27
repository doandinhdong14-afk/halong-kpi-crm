import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DanhSachFile } from "@/components/chung/danh-sach-file";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { Card, CardContent } from "@/components/ui/card";
import type { NguoiDung } from "@/lib/auth/dal";
import { layGiayToCuaToi } from "@/lib/services/van-ban";
import { hienNgayGio } from "@/lib/time";
import { DanhDauDaXem } from "./danh-dau-da-xem";

/** Chi tiết quy định cho người nhận: nội dung + file (xem/tải). Lần đầu mở → ghi nhận đã xem. */
export async function ChiTietGiayTo({
  u,
  vanBanId,
  quayLai,
  nhanQuayLai,
}: {
  u: NguoiDung;
  vanBanId: string;
  quayLai: string;
  nhanQuayLai: string;
}) {
  const vb = await layGiayToCuaToi(u, vanBanId);
  if (!vb) notFound();

  return (
    <div className="space-y-4">
      <DanhDauDaXem vanBanId={vb.id} />
      <Link href={quayLai} className="inline-flex items-center text-sm text-muted-foreground hover:underline">
        <ChevronLeft className="size-4" /> {nhanQuayLai}
      </Link>
      <TrangTieuDe tieuDe={vb.tieuDe} moTa={`${vb.nguoiGui?.hoTen ?? "Hiệu trưởng"} · ban hành lúc ${hienNgayGio(vb.guiLuc)}`} />
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
