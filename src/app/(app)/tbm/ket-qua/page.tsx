import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { ChonKy } from "@/components/chung/chon-ky";
import { BangKetQua } from "@/components/chung/bang-ket-qua";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { trangThaiKy } from "@/lib/ky";
import { hienNgayGio } from "@/lib/time";

export default async function TrangKetQuaKy(props: PageProps<"/tbm/ket-qua">) {
  const tbm = await yeuCauVaiTro("TBM");
  const sp = await props.searchParams;
  const kys = await db.ky.findMany({ where: { daCongBo: true }, orderBy: { ngayBatDau: "desc" } });
  // Mặc định kỳ đã chốt gần nhất.
  const ky = kys.find((k) => k.id === sp.kyId) ?? kys.find((k) => k.daChot) ?? kys[0];

  if (!ky) {
    return (
      <div>
        <TrangTieuDe tieuDe="Kết quả kỳ" />
        <p className="text-muted-foreground">Chưa có kỳ nào.</p>
      </div>
    );
  }

  const ketQuas = ky.daChot
    ? await db.ketQuaKy.findMany({
        where: { kyId: ky.id, gv: { boMonId: tbm.boMonId ?? "__khong_co__" } },
        include: { gv: { select: { hoTen: true, username: true } } },
        orderBy: { gv: { hoTen: "asc" } },
      })
    : [];

  return (
    <div>
      <TrangTieuDe
        tieuDe="Kết quả kỳ"
        moTa={ky.daChot ? `${ky.ten} · chốt lúc ${ketQuas[0] ? hienNgayGio(ketQuas[0].chotLuc) : ""}` : ky.ten}
      >
        <ChonKy kyId={ky.id} kys={kys.map((k) => ({ id: k.id, ten: k.ten, nhanPhu: trangThaiKy(k) }))} />
      </TrangTieuDe>
      {ky.daChot ? (
        <BangKetQua ketQuas={ketQuas} />
      ) : (
        <p className="text-muted-foreground">Kỳ chưa chốt. Kết quả sẽ có sau khi hết deadline và hệ thống chốt kỳ.</p>
      )}
    </div>
  );
}
