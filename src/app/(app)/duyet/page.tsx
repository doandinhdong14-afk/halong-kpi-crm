import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { tenMuc } from "@/lib/menu";

export default async function TrangDuyet() {
  const u = await yeuCauVaiTro("TBM", "TK", "HP", "HT");
  return <TrangTam tieuDe={tenMuc(u.role, "/duyet")} buoc={5} />;
}
