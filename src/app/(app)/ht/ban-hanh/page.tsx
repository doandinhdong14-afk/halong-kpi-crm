import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { FormBanHanh } from "./form-ban-hanh";

export default async function TrangBanHanh() {
  await yeuCauVaiTro("HT");
  // Người nhận: mọi tài khoản trừ Hiệu trưởng.
  const users = await db.user.findMany({
    where: { role: { not: "HT" } },
    orderBy: [{ role: "asc" }, { hoTen: "asc" }],
    select: { id: true, hoTen: true, username: true, role: true },
  });
  return (
    <div>
      <TrangTieuDe tieuDe="Ban hành giấy tờ" moTa="Soạn giấy tờ, chọn người nhận rồi gửi." />
      <FormBanHanh users={users} />
    </div>
  );
}
