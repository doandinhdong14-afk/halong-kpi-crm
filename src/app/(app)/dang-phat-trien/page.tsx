import { Construction } from "lucide-react";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { TEN_VAI_TRO } from "@/lib/roles";

export default async function TrangDangPhatTrien() {
  const u = await yeuCauVaiTro("TK", "HP");
  return (
    <div>
      <TrangTieuDe tieuDe="Đang phát triển" />
      <div className="flex items-center gap-3 rounded-lg border bg-background p-6 text-muted-foreground">
        <Construction className="size-6" />
        <p>
          Các chức năng dành cho {TEN_VAI_TRO[u.role].toLowerCase()} sẽ được bổ sung ở phiên bản sau. Hiện tại bạn
          có thể xem mục <strong>Nhận giấy tờ</strong>.
        </p>
      </div>
    </div>
  );
}
