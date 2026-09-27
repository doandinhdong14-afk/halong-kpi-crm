// Xuất báo cáo (mục 6.3), một trang cho TBM, TK, HP, HT; phạm vi theo vai trò (phamViBaoCao).
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { phamViBaoCao, tenDonVi } from "@/lib/co-cau";
import { TEN_VAI_TRO } from "@/lib/roles";
import { layCoCau } from "@/lib/services/co-cau";
import { layKyTheoUrl } from "@/lib/services/ky";
import { FormXuatBaoCao } from "./form-xuat";

const MO_TA_PHAM_VI: Record<string, string> = {
  TBM: "Giáo viên bộ môn của bạn.",
  TK: "Giáo viên và trưởng bộ môn của khoa bạn.",
  HP: "Giáo viên, trưởng bộ môn, trưởng khoa của các khoa bạn phụ trách.",
  HT: "Giáo viên, trưởng bộ môn, trưởng khoa, hiệu phó toàn trường.",
};

export default async function TrangXuatBaoCao(props: PageProps<"/bao-cao">) {
  const m = await yeuCauVaiTro("TBM", "TK", "HP", "HT");
  const { kys, ky } = await layKyTheoUrl((await props.searchParams).kyId);
  const cc = await layCoCau();
  const pv = phamViBaoCao(m, cc);

  return (
    <div className="space-y-6">
      <TrangTieuDe
        tieuDe="Xuất báo cáo"
        moTa={`Phạm vi: ${MO_TA_PHAM_VI[m.role]} Không gồm KPI của chính bạn, không kèm file minh chứng.`}
      />
      {!ky ? (
        <p className="text-muted-foreground">Chưa có kỳ nào được công bố.</p>
      ) : (
        <FormXuatBaoCao
          kys={kys.map((k) => ({ id: k.id, ten: k.ten, daChot: k.daChot }))}
          kyMacDinh={ky.id}
          viTris={pv.viTris.map((v) => ({ id: v, ten: TEN_VAI_TRO[v] }))}
          nguois={pv.nguoi.map((u) => ({ id: u.id, ten: `${u.hoTen} (${u.username})`, role: u.role, donVi: tenDonVi(u, cc) }))}
        />
      )}
    </div>
  );
}
