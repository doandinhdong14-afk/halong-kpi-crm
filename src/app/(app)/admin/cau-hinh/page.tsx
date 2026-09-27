import Link from "next/link";
import { Eye } from "lucide-react";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { ChonKy } from "@/components/chung/chon-ky";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { BangKetQua } from "@/components/chung/bang-ket-qua";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { moTaThoiGianKy, trangThaiKy } from "@/lib/ky";
import { chonKy } from "@/lib/ky-hien-tai";
import { NHAN_DANG_KY } from "@/lib/nhan";
import { TEN_VAI_TRO } from "@/lib/roles";
import { hienPhanTram, thongKeTienDo } from "@/lib/tien-do";
import { hienNgayCuaThoiDiem, hienNgayGio, homNayVN } from "@/lib/time";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "ky", nhan: "Kỳ và bảng xếp loại" },
  { id: "tai-khoan", nhan: "Tài khoản" },
  { id: "dang-ky", nhan: "Đăng ký nhiệm vụ" },
  { id: "tien-do", nhan: "Tiến độ & minh chứng" },
  { id: "ket-qua", nhan: "Kết quả các kỳ" },
  { id: "giay-to", nhan: "Giấy tờ đã ban hành" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const CAN_KY: Tab[] = ["dang-ky", "tien-do", "ket-qua"];

/** Xem cấu hình (mục 6.4): mọi tab chỉ xem, không sửa được bài GV đã nộp. */
export default async function TrangXemCauHinh(props: PageProps<"/admin/cau-hinh">) {
  await yeuCauVaiTro("ADMIN");
  const sp = await props.searchParams;
  const tab: Tab = TABS.some((t) => t.id === sp.tab) ? (sp.tab as Tab) : "ky";
  const kyId = typeof sp.kyId === "string" ? sp.kyId : undefined;

  const kys = await db.ky.findMany({ orderBy: [{ ngayBatDau: "desc" }, { createdAt: "desc" }] });
  const ky = chonKy(kys, kyId, homNayVN()) ?? kys[0] ?? null;

  return (
    <div>
      <TrangTieuDe tieuDe="Xem cấu hình" moTa="Chỉ xem. Không sửa được dữ liệu hay bài giáo viên đã nộp.">
        {CAN_KY.includes(tab) && ky && (
          <ChonKy kyId={ky.id} kys={kys.map((k) => ({ id: k.id, ten: k.ten, nhanPhu: trangThaiKy(k) }))} />
        )}
      </TrangTieuDe>

      <nav className="mb-6 flex flex-wrap gap-1 border-b" aria-label="Các tab">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/cau-hinh?tab=${t.id}${ky ? `&kyId=${ky.id}` : ""}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              t.id === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={t.id === tab ? "page" : undefined}
          >
            {t.nhan}
          </Link>
        ))}
      </nav>

      {tab === "ky" && <TabKy />}
      {tab === "tai-khoan" && <TabTaiKhoan />}
      {tab === "dang-ky" && (ky ? <TabDangKy kyId={ky.id} /> : <KhongCoKy />)}
      {tab === "tien-do" && (ky ? <TabTienDo kyId={ky.id} /> : <KhongCoKy />)}
      {tab === "ket-qua" && (ky ? <TabKetQua kyId={ky.id} daChot={ky.daChot} /> : <KhongCoKy />)}
      {tab === "giay-to" && <TabGiayTo />}
    </div>
  );
}

function KhongCoKy() {
  return <p className="text-muted-foreground">Chưa có kỳ nào.</p>;
}

function BangDon({ cot, children, trong }: { cot: string[]; children: React.ReactNode; trong?: boolean }) {
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            {cot.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trong && (
            <TableRow>
              <TableCell colSpan={cot.length} className="py-8 text-center text-muted-foreground">
                Không có dữ liệu.
              </TableCell>
            </TableRow>
          )}
          {children}
        </TableBody>
      </Table>
    </div>
  );
}

async function TabKy() {
  const kys = await db.ky.findMany({
    orderBy: [{ ngayBatDau: "desc" }, { createdAt: "desc" }],
    include: { bacXepLoais: { orderBy: { diemToiThieu: "desc" } }, _count: { select: { nhiemVus: true, dangKys: true } } },
  });
  return (
    <BangDon cot={["Kỳ", "Thời gian", "Hạn đăng ký", "Deadline", "Nhiệm vụ", "Đăng ký", "Trạng thái", "Bảng xếp loại"]} trong={!kys.length}>
      {kys.map((k) => {
        const tg = moTaThoiGianKy(k);
        return (
          <TableRow key={k.id} className="align-top">
            <TableCell className="font-medium">{k.ten}</TableCell>
            <TableCell>
              {tg.batDau} – {tg.ketThuc}
            </TableCell>
            <TableCell>{tg.hanDangKy}</TableCell>
            <TableCell>{tg.deadline}</TableCell>
            <TableCell>{k._count.nhiemVus}</TableCell>
            <TableCell>{k._count.dangKys}</TableCell>
            <TableCell>
              <Badge variant="outline">{trangThaiKy(k)}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {k.bacXepLoais.map((b) => (
                  <Badge key={b.id} variant="secondary">
                    {b.ten} ≥ {b.diemToiThieu}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </BangDon>
  );
}

async function TabTaiKhoan() {
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    include: { boMon: { select: { ten: true } } },
  });
  return (
    <BangDon cot={["Tên đăng nhập", "Chức vụ", "Tên người", "Bộ môn", "Mật khẩu", "Tạo lúc"]} trong={!users.length}>
      {users.map((u) => (
        <TableRow key={u.id}>
          <TableCell className="font-mono">{u.username}</TableCell>
          <TableCell>{TEN_VAI_TRO[u.role]}</TableCell>
          <TableCell>{u.hoTen}</TableCell>
          <TableCell>{u.boMon?.ten ?? "—"}</TableCell>
          <TableCell className="font-mono">{u.isDefaultPassword ? "123456" : "••••••"}</TableCell>
          <TableCell>{hienNgayCuaThoiDiem(u.createdAt)}</TableCell>
        </TableRow>
      ))}
    </BangDon>
  );
}

async function TabDangKy({ kyId }: { kyId: string }) {
  const gvs = await db.user.findMany({
    where: { role: "GV" },
    orderBy: { hoTen: "asc" },
    include: { dangKys: { where: { kyId }, include: { _count: { select: { nhiemVus: true } } } } },
  });
  return (
    <BangDon cot={["Giáo viên", "Trạng thái", "Số nhiệm vụ", "Tổng điểm", "Xếp loại", "Gửi lúc", "Duyệt lúc", "Nhận xét TBM"]} trong={!gvs.length}>
      {gvs.map((gv) => {
        const dk = gv.dangKys[0];
        return (
          <TableRow key={gv.id} data-gv={gv.username}>
            <TableCell>
              <div className="font-medium">{gv.hoTen}</div>
              <div className="text-xs text-muted-foreground">{gv.username}</div>
            </TableCell>
            <TableCell>
              {dk ? <BadgeTrangThai trangThai={dk.trangThai} nhan={NHAN_DANG_KY[dk.trangThai]} /> : <span className="text-muted-foreground">Chưa đăng ký</span>}
            </TableCell>
            <TableCell>{dk?._count.nhiemVus ?? "—"}</TableCell>
            <TableCell>{dk && dk.trangThai !== "NHAP" ? dk.tongDiem : "—"}</TableCell>
            <TableCell>{dk?.xepLoai ?? "—"}</TableCell>
            <TableCell>{dk?.nopLuc ? hienNgayGio(dk.nopLuc) : "—"}</TableCell>
            <TableCell>{dk?.duyetLuc ? hienNgayGio(dk.duyetLuc) : "—"}</TableCell>
            <TableCell className="max-w-xs truncate">{dk?.nhanXet ?? ""}</TableCell>
          </TableRow>
        );
      })}
    </BangDon>
  );
}

async function TabTienDo({ kyId }: { kyId: string }) {
  const gvs = await db.user.findMany({
    where: { role: "GV" },
    orderBy: { hoTen: "asc" },
    include: {
      dangKys: { where: { kyId }, select: { trangThai: true, xepLoai: true } },
      gvTasks: { where: { kyId }, select: { trangThai: true, task: { select: { loai: true } } } },
    },
  });
  return (
    <BangDon cot={["Giáo viên", "Đăng ký", "% task bắt buộc", "Đã duyệt", "Chờ duyệt", "Bị từ chối", "Chưa làm", "Task vượt", ""]} trong={!gvs.length}>
      {gvs.map((gv) => {
        const dk = gv.dangKys[0];
        const tk = thongKeTienDo(gv.gvTasks.map((g) => ({ loai: g.task.loai, trangThai: g.trangThai })));
        const coTask = dk?.trangThai === "DA_DUYET";
        return (
          <TableRow key={gv.id} data-gv={gv.username}>
            <TableCell>
              <div className="font-medium">{gv.hoTen}</div>
              <div className="text-xs text-muted-foreground">{gv.username}</div>
            </TableCell>
            <TableCell>{dk ? NHAN_DANG_KY[dk.trangThai] : "Chưa đăng ký"}</TableCell>
            <TableCell className="font-semibold">{coTask ? hienPhanTram(tk.phanTram) : "—"}</TableCell>
            <TableCell>{coTask ? tk.daDuyet : "—"}</TableCell>
            <TableCell>{coTask ? tk.choDuyet : "—"}</TableCell>
            <TableCell>{coTask ? tk.tuChoi : "—"}</TableCell>
            <TableCell>{coTask ? tk.chuaLam : "—"}</TableCell>
            <TableCell>{coTask ? tk.soVuot : "—"}</TableCell>
            <TableCell>
              {coTask && (
                <Link href={`/admin/cau-hinh/tien-do/${gv.id}?kyId=${kyId}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <Eye className="size-4" /> Minh chứng
                </Link>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </BangDon>
  );
}

async function TabKetQua({ kyId, daChot }: { kyId: string; daChot: boolean }) {
  if (!daChot) return <p className="text-muted-foreground">Kỳ chưa chốt.</p>;
  const ketQuas = await db.ketQuaKy.findMany({
    where: { kyId },
    include: { gv: { select: { hoTen: true, username: true } } },
    orderBy: { gv: { hoTen: "asc" } },
  });
  return <BangKetQua ketQuas={ketQuas} />;
}

async function TabGiayTo() {
  const vbs = await db.vanBan.findMany({
    orderBy: { guiLuc: "desc" },
    include: { nguoiGui: { select: { hoTen: true } }, nguoiNhans: { select: { daXemLuc: true } }, _count: { select: { files: true } } },
  });
  return (
    <BangDon cot={["Tiêu đề", "Người gửi", "Ngày gửi", "File", "Đã xem"]} trong={!vbs.length}>
      {vbs.map((vb) => (
        <TableRow key={vb.id} data-van-ban={vb.tieuDe}>
          <TableCell>
            <Link href={`/admin/cau-hinh/giay-to/${vb.id}`} className="font-medium text-primary hover:underline">
              {vb.tieuDe}
            </Link>
          </TableCell>
          <TableCell>{vb.nguoiGui?.hoTen ?? "(tài khoản đã xóa)"}</TableCell>
          <TableCell>{hienNgayGio(vb.guiLuc)}</TableCell>
          <TableCell>{vb._count.files || "—"}</TableCell>
          <TableCell>
            {vb.nguoiNhans.filter((n) => n.daXemLuc).length}/{vb.nguoiNhans.length} đã xem
          </TableCell>
        </TableRow>
      ))}
    </BangDon>
  );
}
