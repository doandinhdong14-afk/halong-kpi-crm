import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { ChonKy } from "@/components/chung/chon-ky";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { trangThaiKy } from "@/lib/ky";
import { chonKy } from "@/lib/ky-hien-tai";
import { lyDoKhongSuaDangKy } from "@/lib/rules";
import { deadline, hanDangKy, hienNgayGio, homNayVN } from "@/lib/time";
import { DangKyNhiemVu } from "./dang-ky-nhiem-vu";

export default async function TrangDauKy(props: PageProps<"/gv/dau-ky">) {
  const gv = await yeuCauVaiTro("GV");
  const sp = await props.searchParams;
  const kys = await db.ky.findMany({ where: { daCongBo: true }, orderBy: { ngayBatDau: "desc" } });
  const ky = chonKy(kys, typeof sp.kyId === "string" ? sp.kyId : undefined, homNayVN());

  if (!ky) {
    return (
      <div>
        <TrangTieuDe tieuDe="Đầu kỳ – Đăng ký nhiệm vụ" />
        <p className="text-muted-foreground">Chưa có kỳ nào được công bố.</p>
      </div>
    );
  }

  const [nhiemVus, bacs, dk] = await Promise.all([
    db.nhiemVu.findMany({
      where: { kyId: ky.id },
      orderBy: [{ thuTu: "asc" }, { ten: "asc" }],
      include: { tasks: { orderBy: [{ thuTu: "asc" }, { ten: "asc" }], select: { id: true, ten: true, loai: true } } },
    }),
    db.bacXepLoai.findMany({ where: { kyId: ky.id }, orderBy: { diemToiThieu: "desc" } }),
    db.dangKy.findUnique({
      where: { kyId_gvId: { kyId: ky.id, gvId: gv.id } },
      include: { nhiemVus: { select: { nhiemVuId: true } } },
    }),
  ]);
  const lyDoKhoa = lyDoKhongSuaDangKy(ky, dk?.trangThai ?? null);

  return (
    <div className="pb-28">
      <TrangTieuDe
        tieuDe="Đầu kỳ – Đăng ký nhiệm vụ"
        moTa={
          <>
            {ky.ten} · Hạn đăng ký: <strong className="text-foreground">{hienNgayGio(hanDangKy(ky))}</strong> · Deadline:{" "}
            <strong className="text-foreground">{hienNgayGio(deadline(ky))}</strong>
          </>
        }
      >
        <ChonKy
          kyId={ky.id}
          kys={kys.map((k) => ({ id: k.id, ten: k.ten, nhanPhu: k.daChot ? trangThaiKy(k) : undefined }))}
        />
      </TrangTieuDe>

      <DangKyNhiemVu
        key={ky.id}
        kyId={ky.id}
        nhiemVus={nhiemVus.map((nv) => ({ id: nv.id, ten: nv.ten, moTa: nv.moTa, diem: nv.diem, tasks: nv.tasks }))}
        bacs={bacs.map((b) => ({ ten: b.ten, diemToiThieu: b.diemToiThieu }))}
        daChon={dk?.nhiemVus.map((x) => x.nhiemVuId) ?? []}
        dangKy={
          dk
            ? {
                trangThai: dk.trangThai,
                nhanXet: dk.nhanXet,
                tongDiem: dk.tongDiem,
                xepLoai: dk.xepLoai,
                nopLuc: dk.nopLuc ? hienNgayGio(dk.nopLuc) : null,
                duyetLuc: dk.duyetLuc ? hienNgayGio(dk.duyetLuc) : null,
              }
            : null
        }
        lyDoKhoa={lyDoKhoa}
        hanDangKy={hanDangKy(ky).toISOString()}
        deadline={deadline(ky).toISOString()}
        deadlineHienThi={hienNgayGio(deadline(ky))}
      />
    </div>
  );
}
