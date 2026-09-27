import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function Page() {
  await yeuCauVaiTro("ADMIN");
  return <TrangTam tieuDe="Xem cấu hình" buoc={8} />;
}
