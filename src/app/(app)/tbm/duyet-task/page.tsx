import { TrangTam } from "@/components/chung/trang-tam";
import { yeuCauVaiTro } from "@/lib/auth/dal";

export default async function Page() {
  await yeuCauVaiTro("TBM");
  return <TrangTam tieuDe="Duyệt task" buoc={5} />;
}
