import type { HanhDongTask } from "@/generated/prisma/enums";
import type { LichSuHienThi } from "@/lib/services/lich-su";
import { hienNgayGio } from "@/lib/time";

const TEN: Record<HanhDongTask, string> = {
  NOP: "Nộp minh chứng",
  SUA_BAI_NOP: "Sửa bài nộp",
  DUYET: "Duyệt",
  TU_CHOI: "Từ chối",
  HUY_DUYET: "Hủy duyệt",
  GUI_CHOT: "Gửi lên",
  CHOT: "Chốt",
  TRA_VE: "Trả về",
};

/** Nhật ký hành động trên task (LichSuTask). Chỉ hiện cho cấp quản lý: có nhận xét của người chốt. */
export function NhatKyTask({ ds }: { ds: LichSuHienThi[] }) {
  if (!ds.length) return <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>;
  return (
    <ol className="space-y-1.5 border-l pl-4 text-sm" data-testid="nhat-ky-task">
      {ds.map((x) => (
        <li key={x.id} data-hanh-dong={x.hanhDong}>
          <span className="text-muted-foreground">{hienNgayGio(x.luc)}</span> ·{" "}
          <strong>{TEN[x.hanhDong]}</strong> · {x.nguoi ?? "(tài khoản đã xóa)"}
          {x.nhanXet && <span className="text-muted-foreground"> – “{x.nhanXet}”</span>}
        </li>
      ))}
    </ol>
  );
}
