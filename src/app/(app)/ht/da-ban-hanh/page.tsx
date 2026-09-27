import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function Page() {
  await yeuCauVaiTro("HT");
  return <TrangTam tieuDe="Đã ban hành" buoc={7} />;
}
