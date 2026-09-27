import { beforeAll, describe, expect, it } from "vitest";
import { GET as taiFile } from "@/app/api/files/[id]/route";
import { chonNhiemVu, guiDangKy } from "@/app/(app)/gv/dau-ky/actions";
import { xinThemTask } from "@/app/(app)/gv/cuoi-ky/actions";
import { duyetDangKy } from "@/app/(app)/tbm/duyet-dang-ky/actions";
import { duyetBaiNop, tuChoiBaiNop } from "@/app/(app)/tbm/duyet-task/actions";
import { duyetYeuCau, tuChoiYeuCau } from "@/app/(app)/tbm/duyet-xin-them/actions";
import { layNguoiDung } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { LoiNghiepVu } from "@/lib/loi";
import { nopBaiMoi, suaBaiNop } from "@/lib/services/bai-nop";
import { chuoiThanhNgay, congNgay, homNayVN } from "@/lib/time";
import { dangNhapNhu, resetDb, user } from "./helpers";

let kyId: string;

function pdf(ten = "minh-chung.pdf", kichThuoc = 1000) {
  return new File([new Uint8Array(kichThuoc)], ten, { type: "application/pdf" });
}

function form(opts: { files?: File[]; ghiChu?: string; link?: string; xoa?: string[] } = {}) {
  const fd = new FormData();
  (opts.files ?? []).forEach((f) => fd.append("files", f));
  (opts.xoa ?? []).forEach((id) => fd.append("xoaFileIds", id));
  fd.append("ghiChu", opts.ghiChu ?? "");
  fd.append("link", opts.link ?? "");
  return fd;
}

async function gvHienTai() {
  return (await layNguoiDung())!;
}

async function loi(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e.message;
    throw e;
  }
  throw new Error("Không ném lỗi");
}

async function gvTask(username: string, tenTask: string) {
  const u = await user(username);
  return db.gvTask.findFirstOrThrow({ where: { gvId: u.id, kyId, task: { ten: tenTask } } });
}

beforeAll(async () => {
  await resetDb();
  const ky = await db.ky.findFirstOrThrow({ include: { nhiemVus: true } });
  kyId = ky.id;
  // gv.tranthibinh đăng ký nhiệm vụ 1, 2, 3 và được duyệt.
  await dangNhapNhu("gv.tranthibinh");
  for (const nv of ky.nhiemVus.filter((n) => n.thuTu <= 3)) await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: true });
  await guiDangKy(kyId);
  await dangNhapNhu("tbm.phamthibich");
  const dk = await db.dangKy.findFirstOrThrow({ where: { kyId, trangThai: "CHO_DUYET" } });
  expect((await duyetDangKy({ dangKyId: dk.id })).ok).toBe(true);
});

describe("Nộp minh chứng + TBM duyệt task (bước 5)", () => {
  it("luật file: bắt buộc ≥1 file, sai định dạng, quá 20MB, link sai", async () => {
    await dangNhapNhu("gv.tranthibinh");
    const gv = await gvHienTai();
    const gt = await gvTask("gv.tranthibinh", "Soạn slide bài giảng");
    expect(await loi(nopBaiMoi(gv, gt.id, form()))).toBe("Phải tải lên ít nhất 1 file minh chứng.");
    expect(await loi(nopBaiMoi(gv, gt.id, form({ files: [pdf("virus.exe")] })))).toMatch(/sai định dạng/);
    expect(await loi(nopBaiMoi(gv, gt.id, form({ files: [pdf("to.pdf", 20 * 1024 * 1024 + 1)] })))).toMatch(/vượt quá 20MB/);
    expect(await loi(nopBaiMoi(gv, gt.id, form({ files: [pdf()], link: "javascript:alert(1)" })))).toMatch(/Link/);
    expect((await db.gvTask.findUniqueOrThrow({ where: { id: gt.id } })).trangThai).toBe("CHUA_LAM");
  });

  it("nộp → Chờ duyệt; sửa lần nộp hiện tại khi Chờ duyệt; TBM nhận thông báo", async () => {
    await dangNhapNhu("gv.tranthibinh");
    const gv = await gvHienTai();
    const gt = await gvTask("gv.tranthibinh", "Soạn slide bài giảng");
    const { baiNopId } = await nopBaiMoi(gv, gt.id, form({ files: [pdf("slide.pdf"), pdf("anh.png")], ghiChu: "Bản 1" }));
    expect((await db.gvTask.findUniqueOrThrow({ where: { id: gt.id } })).trangThai).toBe("CHO_DUYET");
    const tbm = await user("tbm.phamthibich");
    expect(await db.thongBao.count({ where: { userId: tbm.id, link: `/tbm/duyet-task/${baiNopId}` } })).toBe(1);

    // Đang chờ duyệt thì không nộp mới được.
    expect(await loi(nopBaiMoi(gv, gt.id, form({ files: [pdf()] })))).toMatch(/đang chờ duyệt/);

    const bn = await db.baiNop.findUniqueOrThrow({ where: { id: baiNopId }, include: { files: true } });
    const anh = bn.files.find((f) => f.tenGoc === "anh.png")!;
    await suaBaiNop(gv, baiNopId, form({ files: [pdf("slide-v2.docx")], xoa: [anh.id], ghiChu: "Bản 2", link: "https://example.com/slide" }));
    const sau = await db.baiNop.findUniqueOrThrow({ where: { id: baiNopId }, include: { files: true } });
    expect(sau.files.map((f) => f.tenGoc).sort()).toEqual(["slide-v2.docx", "slide.pdf"]);
    expect(sau).toMatchObject({ ghiChu: "Bản 2", link: "https://example.com/slide" });
    expect(await db.baiNop.count({ where: { gvTaskId: gt.id } })).toBe(1);

    const tatCa = sau.files.map((f) => f.id);
    expect(await loi(suaBaiNop(gv, baiNopId, form({ xoa: tatCa })))).toBe("Phải còn ít nhất 1 file minh chứng.");
  });

  it("quyền tải file: GV chủ, TBM cùng bộ môn, Admin được; GV khác, HT bị chặn", async () => {
    const gt = await gvTask("gv.tranthibinh", "Soạn slide bài giảng");
    const f = await db.fileDinhKem.findFirstOrThrow({ where: { baiNop: { gvTaskId: gt.id } } });
    const goi = () => taiFile(new Request(`http://x/api/files/${f.id}`), { params: Promise.resolve({ id: f.id }) });
    for (const [u, ma] of [
      ["gv.tranthibinh", 200],
      ["tbm.phamthibich", 200],
      ["admin.quantri", 200],
      ["gv.nguyenvanan", 403],
      ["ht.nguyenvanhieu", 403],
    ] as const) {
      await dangNhapNhu(u);
      const res = await goi();
      expect(res.status, u).toBe(ma);
      if (ma === 200) expect(res.headers.get("content-type")).toBe("application/pdf");
    }
  });

  it("TBM từ chối → GV nộp lại (lần nộp mới) → duyệt; lịch sử 2 lần; Đã duyệt thì khóa", async () => {
    const gt = await gvTask("gv.tranthibinh", "Soạn slide bài giảng");
    const bn1 = await db.baiNop.findFirstOrThrow({ where: { gvTaskId: gt.id } });

    await dangNhapNhu("tbm.phamthibich");
    expect((await tuChoiBaiNop({ baiNopId: bn1.id, nhanXet: "" })).ok).toBe(false);
    expect((await tuChoiBaiNop({ baiNopId: bn1.id, nhanXet: "Thiếu slide chương 3" })).ok).toBe(true);
    expect((await db.gvTask.findUniqueOrThrow({ where: { id: gt.id } })).trangThai).toBe("TU_CHOI");

    await dangNhapNhu("gv.tranthibinh");
    const gv = await gvHienTai();
    expect(await loi(suaBaiNop(gv, bn1.id, form({ files: [pdf()] })))).toMatch(/đã bị từ chối/);
    const { baiNopId: bn2 } = await nopBaiMoi(gv, gt.id, form({ files: [pdf("slide-day-du.pdf")] }));
    expect(await db.baiNop.count({ where: { gvTaskId: gt.id } })).toBe(2);

    await dangNhapNhu("tbm.phamthibich");
    expect((await duyetBaiNop({ baiNopId: bn2 })).ok).toBe(true);
    expect((await db.gvTask.findUniqueOrThrow({ where: { id: gt.id } })).trangThai).toBe("DA_DUYET");

    await dangNhapNhu("gv.tranthibinh");
    expect(await loi(suaBaiNop(gv, bn2, form({ files: [pdf()] })))).toBe("Minh chứng đã được duyệt, không thể sửa.");
    expect(await loi(nopBaiMoi(gv, gt.id, form({ files: [pdf()] })))).toBe("Task đã được duyệt, không thể nộp thêm.");
  });

  it("admin / GV khác không sửa được minh chứng", async () => {
    const gt = await gvTask("gv.tranthibinh", "Nộp giáo án lên bộ môn");
    await dangNhapNhu("gv.tranthibinh");
    const { baiNopId } = await nopBaiMoi(await gvHienTai(), gt.id, form({ files: [pdf()] }));
    await dangNhapNhu("gv.nguyenvanan");
    const khac = await gvHienTai();
    expect(await loi(suaBaiNop(khac, baiNopId, form({ files: [pdf()] })))).toBe("Không tìm thấy lần nộp.");
    expect(await loi(nopBaiMoi(khac, gt.id, form({ files: [pdf()] })))).toBe("Không tìm thấy task.");
    // Admin không có route/action sửa: route PATCH yêu cầu vai trò GV (kiểm tra ở tests/quyen-api.int.test.ts).
  });

  it("xin thêm task mở rộng: chỉ nhiệm vụ đã duyệt; từ chối → xin lại; duyệt → thêm vào danh sách", async () => {
    await dangNhapNhu("gv.tranthibinh");
    const moRong1 = await db.task.findFirstOrThrow({ where: { loai: "MO_RONG", nhiemVu: { kyId, thuTu: 1 } } });
    const moRong9 = await db.task.findFirstOrThrow({ where: { loai: "MO_RONG", nhiemVu: { kyId, thuTu: 9 } } });
    const batBuoc = await db.task.findFirstOrThrow({ where: { loai: "BAT_BUOC", nhiemVu: { kyId, thuTu: 1 } } });

    expect((await xinThemTask(batBuoc.id)).ok).toBe(false);
    expect(await xinThemTask(moRong9.id)).toEqual({ ok: false, error: "Chỉ xin được task mở rộng thuộc nhiệm vụ bạn đã được duyệt." });
    expect((await xinThemTask(moRong1.id)).ok).toBe(true);
    expect(await xinThemTask(moRong1.id)).toEqual({ ok: false, error: "Bạn đã xin task này, đang chờ trưởng bộ môn duyệt." });

    await dangNhapNhu("tbm.phamthibich");
    const yc1 = await db.yeuCauThemTask.findFirstOrThrow({ where: { taskId: moRong1.id } });
    expect((await tuChoiYeuCau({ yeuCauId: yc1.id, nhanXet: "Chưa cần" })).ok).toBe(true);

    await dangNhapNhu("gv.tranthibinh");
    expect((await xinThemTask(moRong1.id)).ok).toBe(true);
    await dangNhapNhu("tbm.phamthibich");
    const yc2 = await db.yeuCauThemTask.findFirstOrThrow({ where: { taskId: moRong1.id, trangThai: "CHO_DUYET" } });
    expect((await duyetYeuCau({ yeuCauId: yc2.id })).ok).toBe(true);

    const gt = await gvTask("gv.tranthibinh", moRong1.ten);
    expect(gt.trangThai).toBe("CHUA_LAM");
    await dangNhapNhu("gv.tranthibinh");
    expect(await xinThemTask(moRong1.id)).toEqual({ ok: false, error: "Task này đã có trong danh sách của bạn." });
  });

  it("hết deadline / kỳ đã chốt: không nộp, không duyệt, không xin thêm được", async () => {
    const gt = await gvTask("gv.tranthibinh", "Đăng ký đề tài với khoa");
    await dangNhapNhu("gv.tranthibinh");
    const gv = await gvHienTai();
    const { baiNopId } = await nopBaiMoi(gv, gt.id, form({ files: [pdf()] }));
    const moRong2 = await db.task.findFirstOrThrow({ where: { loai: "MO_RONG", nhiemVu: { kyId, thuTu: 2 } } });

    const h = homNayVN();
    await db.ky.update({
      where: { id: kyId },
      data: { ngayBatDau: chuoiThanhNgay(congNgay(h, -31)), ngayKetThuc: chuoiThanhNgay(congNgay(h, -1)) },
    });
    expect(await loi(suaBaiNop(gv, baiNopId, form({ files: [pdf()] })))).toBe("Đã hết deadline của kỳ.");
    expect(await xinThemTask(moRong2.id)).toEqual({ ok: false, error: "Đã hết deadline của kỳ." });
    await dangNhapNhu("tbm.phamthibich");
    expect(await duyetBaiNop({ baiNopId })).toEqual({ ok: false, error: "Đã hết deadline của kỳ." });

    await db.ky.update({
      where: { id: kyId },
      data: { ngayBatDau: chuoiThanhNgay(h), ngayKetThuc: chuoiThanhNgay(congNgay(h, 30)), daChot: true },
    });
    expect(await duyetBaiNop({ baiNopId })).toEqual({ ok: false, error: "Kỳ đã chốt, không thể thao tác." });
    await db.ky.update({ where: { id: kyId }, data: { daChot: false } });
  });
});
