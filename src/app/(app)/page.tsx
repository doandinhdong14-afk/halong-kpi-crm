import { redirect } from "next/navigation";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { trangChu } from "@/lib/menu";

export default async function TrangGoc() {
  const u = await yeuCauVaiTro();
  redirect(trangChu(u.role));
}
