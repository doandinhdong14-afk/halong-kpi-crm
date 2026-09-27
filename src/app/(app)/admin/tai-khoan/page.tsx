import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { BangTaiKhoan } from "./bang-tai-khoan";
import { BoLocTaiKhoan } from "./bo-loc";
import { DialogTaiKhoan } from "./dialog-tai-khoan";

export default async function TrangQuanLyDangNhap(props: PageProps<"/admin/tai-khoan">) {
  const admin = await yeuCauVaiTro("ADMIN");
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const chucVu =
    typeof sp.chucVu === "string" && (ROLES as readonly string[]).includes(sp.chucVu)
      ? (sp.chucVu as Role)
      : undefined;

  const where: Prisma.UserWhereInput = {
    ...(chucVu ? { role: chucVu } : {}),
    ...(q
      ? { OR: [{ hoTen: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }] }
      : {}),
  };
  const users = await db.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: { id: true, username: true, hoTen: true, role: true, isDefaultPassword: true },
  });

  return (
    <div>
      <TrangTieuDe tieuDe="Quản lý đăng nhập" moTa="Tài khoản mới có mật khẩu mặc định 123456.">
        <DialogTaiKhoan cheDo="tao" />
      </TrangTieuDe>
      <BoLocTaiKhoan q={q} chucVu={chucVu ?? ""} />
      <BangTaiKhoan users={users} adminId={admin.id} />
    </div>
  );
}
