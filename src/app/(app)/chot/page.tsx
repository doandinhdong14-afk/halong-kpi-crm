import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { tenMuc } from "@/lib/menu";

export default async function TrangChot() {
  const u = await yeuCauVaiTro("TK", "HP", "HT");
  return <TrangTam tieuDe={tenMuc(u.role, "/chot")} buoc={7} />;
}
