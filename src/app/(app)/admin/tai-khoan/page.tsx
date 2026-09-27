import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { BangTaiKhoan } from "./bang-tai-khoan";
import { BoLocTaiKhoan } from "./bo-loc";
import { DialogTaiKhoan, type KhoaChon } from "./dialog-tai-khoan";

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
  const [users, khoas] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        hoTen: true,
        role: true,
        isDefaultPassword: true,
        boMon: { select: { ten: true } },
        khoa: { select: { ten: true } },
        khoaPhuTrach: { select: { id: true, ten: true }, orderBy: { ten: "asc" } },
      },
    }),
    db.khoa.findMany({
      orderBy: { ten: "asc" },
      select: { id: true, ten: true, hieuPhoId: true, hieuPho: { select: { username: true } } },
    }),
  ]);
  const dsKhoa: KhoaChon[] = khoas.map((k) => ({ id: k.id, ten: k.ten, hieuPhoId: k.hieuPhoId, hieuPho: k.hieuPho?.username ?? null }));

  return (
    <div>
      <TrangTieuDe tieuDe="Quản lý đăng nhập" moTa="Tài khoản mới có mật khẩu mặc định 123456.">
        <DialogTaiKhoan cheDo="tao" khoas={dsKhoa} />
      </TrangTieuDe>
      <BoLocTaiKhoan q={q} chucVu={chucVu ?? ""} />
      <BangTaiKhoan
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          hoTen: u.hoTen,
          role: u.role,
          isDefaultPassword: u.isDefaultPassword,
          donVi:
            u.role === "HP"
              ? u.khoaPhuTrach.length
                ? `Phụ trách: ${u.khoaPhuTrach.map((k) => k.ten).join(", ")}`
                : "Chưa phụ trách khoa nào"
              : (u.boMon?.ten ?? u.khoa?.ten ?? null),
          khoaPhuTrachIds: u.khoaPhuTrach.map((k) => k.id),
        }))}
        adminId={admin.id}
        khoas={dsKhoa}
      />
    </div>
  );
}
