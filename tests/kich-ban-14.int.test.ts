// Kịch bản nghiệm thu mục 14, chạy qua đúng các server action / service mà giao diện gọi.
import { beforeAll, describe, expect, it } from "vitest";
import { chotKyNgay } from "@/app/(app)/admin/phan-viec/actions";
import { chonNhiemVu, guiDangKy } from "@/app/(app)/gv/dau-ky/actions";
import { xinThemTask } from "@/app/(app)/gv/cuoi-ky/actions";
import { duyetDangKy } from "@/app/(app)/tbm/duyet-dang-ky/actions";
import { duyetBaiNop } from "@/app/(app)/tbm/duyet-task/actions";
import { duyetYeuCau } from "@/app/(app)/tbm/duyet-xin-them/actions";
import { POST as cronChotKy } from "@/app/api/cron/chot-ky/route";
import { layNguoiDung } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { nopBaiMoi } from "@/lib/services/bai-nop";
import { chuoiThanhNgay, congNgay, homNayVN } from "@/lib/time";
import { dangNhapNhu, resetDb, user } from "./helpers";

let kyId: string;

function formPdf() {
  const fd = new FormData();
  fd.append("files", new File([new Uint8Array(100)], "mc.pdf"));
  return fd;
}

async function dangKy(username: string, thuTus: number[]) {
  await dangNhapNhu(username);
  const nvs = await db.nhiemVu.findMany({ where: { kyId, thuTu: { in: thuTus } } });
  for (const nv of nvs) expect((await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: true })).ok).toBe(true);
  const r = await guiDangKy(kyId);
  expect(r.ok).toBe(true);
  await dangNhapNhu("tbm.phamthibich");
  const u = await user(username);
  const dk = await db.dangKy.findUniqueOrThrow({ where: { kyId_gvId: { kyId, gvId: u.id } } });
  expect((await duyetDangKy({ dangKyId: dk.id })).ok).toBe(true);
}

/** GV nộp minh chứng cho n task (theo thứ tự), TBM duyệt những task đó. */
async function lamVaDuyet(username: string, loai: "BAT_BUOC" | "MO_RONG", n?: number) {
  const u = await user(username);
  const tasks = await db.gvTask.findMany({
    where: { gvId: u.id, kyId, task: { loai } },
    include: { task: { include: { nhiemVu: true } } },
  });
  tasks.sort((a, b) => a.task.nhiemVu.thuTu - b.task.nhiemVu.thuTu || a.task.thuTu - b.task.thuTu);
  const chon = tasks.slice(0, n ?? tasks.length);
  await dangNhapNhu(username);
  const gv = (await layNguoiDung())!;
  const baiNops = [];
  for (const t of chon) baiNops.push((await nopBaiMoi(gv, t.id, formPdf())).baiNopId);
  await dangNhapNhu("tbm.phamthibich");
  for (const id of baiNops) expect((await duyetBaiNop({ baiNopId: id })).ok).toBe(true);
  return tasks.length;
}

async function ketQua(username: string) {
  const u = await user(username);
  return db.ketQuaKy.findUniqueOrThrow({ where: { kyId_gvId: { kyId, gvId: u.id } } });
}

beforeAll(async () => {
  await resetDb();
  kyId = (await db.ky.findFirstOrThrow()).id;
});

describe("Kịch bản nghiệm thu mục 14", () => {
  it("gv.nguyenvanan: chọn cả 10 nhiệm vụ, TBM duyệt ~50% task bắt buộc", async () => {
    await dangKy("gv.nguyenvanan", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const u = await user("gv.nguyenvanan");
    const tong = await db.gvTask.count({ where: { gvId: u.id, kyId } });
    expect(tong).toBe(22);
    await lamVaDuyet("gv.nguyenvanan", "BAT_BUOC", 11);
  });

  it("gv.tranthibinh: nhiệm vụ 1, 2, 3 (39 điểm), TBM duyệt 100% task bắt buộc", async () => {
    await dangKy("gv.tranthibinh", [1, 2, 3]);
    expect(await lamVaDuyet("gv.tranthibinh", "BAT_BUOC")).toBe(7);
  });

  it("gv.levancuong: nhiệm vụ 1–5 (59 điểm), 100% bắt buộc + xin 2 task mở rộng, được duyệt, làm xong", async () => {
    await dangKy("gv.levancuong", [1, 2, 3, 4, 5]);
    await lamVaDuyet("gv.levancuong", "BAT_BUOC");
    await dangNhapNhu("gv.levancuong");
    const moRong = await db.task.findMany({ where: { loai: "MO_RONG", nhiemVu: { kyId, thuTu: { in: [1, 2] } } } });
    for (const t of moRong) expect((await xinThemTask(t.id)).ok).toBe(true);
    await dangNhapNhu("tbm.phamthibich");
    for (const yc of await db.yeuCauThemTask.findMany({ where: { kyId } })) {
      expect((await duyetYeuCau({ yeuCauId: yc.id })).ok).toBe(true);
    }
    await lamVaDuyet("gv.levancuong", "MO_RONG");
  });

  it("admin bấm Chốt kỳ ngay → đúng kết quả mong đợi", async () => {
    await dangNhapNhu("tbm.phamthibich");
    expect((await chotKyNgay(kyId)).ok).toBe(false); // chỉ admin
    await dangNhapNhu("admin.quantri");
    const r = await chotKyNgay(kyId);
    expect(r).toEqual({ ok: true, data: { soGv: 3 } });

    const an = await ketQua("gv.nguyenvanan");
    expect(an).toMatchObject({ ketQua: "KHONG_DAT", xepLoai: "A1", phanTram: 50 });
    expect(an.taskThieu).toHaveLength(11);

    expect(await ketQua("gv.tranthibinh")).toMatchObject({ ketQua: "DAT", xepLoai: "C", phanTram: 100, taskThieu: [] });

    const cuong = await ketQua("gv.levancuong");
    expect(cuong).toMatchObject({ ketQua: "VUOT", xepLoai: "B", phanTram: 100 });
    expect(cuong.taskVuot).toEqual([
      { ten: "Số hóa bài giảng lên hệ thống LMS", nhiemVu: "Biên soạn bài giảng" },
      { ten: "Nhóm sinh viên đạt giải cấp trường", nhiemVu: "Hướng dẫn sinh viên NCKH" },
    ]);

    // Thông báo cho GV và TBM.
    const tbm = await user("tbm.phamthibich");
    expect(await db.thongBao.count({ where: { userId: tbm.id, noiDung: { contains: "đã chốt" } } })).toBe(1);
    const an2 = await user("gv.nguyenvanan");
    expect(await db.thongBao.count({ where: { userId: an2.id, noiDung: { contains: "Không đạt – A1" } } })).toBe(1);

    expect(await chotKyNgay(kyId)).toEqual({ ok: false, error: "Kỳ đã chốt." });
  });

  it("sau khi chốt, mọi thao tác nộp/duyệt trong kỳ bị chặn", async () => {
    const u = await user("gv.nguyenvanan");
    const conLai = await db.gvTask.findFirstOrThrow({ where: { gvId: u.id, kyId, trangThai: "CHUA_LAM" } });
    await dangNhapNhu("gv.nguyenvanan");
    await expect(nopBaiMoi((await layNguoiDung())!, conLai.id, formPdf())).rejects.toThrow("Kỳ đã chốt, không thể thao tác.");
    const moRong = await db.task.findFirstOrThrow({ where: { loai: "MO_RONG", nhiemVu: { kyId, thuTu: 3 } } });
    expect(await xinThemTask(moRong.id)).toEqual({ ok: false, error: "Kỳ đã chốt, không thể thao tác." });
  });
});

describe("Case phụ + cron", () => {
  it("GV không đăng ký → Không đạt – F, ghi chú; task Chờ duyệt khi chốt → tính chưa xong", async () => {
    // Kỳ 2: tạo trực tiếp, đã công bố, sao bảng xếp loại.
    const ky1 = await db.ky.findUniqueOrThrow({ where: { id: kyId }, include: { bacXepLoais: true, nhiemVus: { include: { tasks: true } } } });
    const h = homNayVN();
    const ky2 = await db.ky.create({
      data: {
        ten: "Kỳ 2 – 2026-2027",
        namHoc: "2026-2027",
        soKy: 2,
        ngayBatDau: chuoiThanhNgay(h),
        ngayKetThuc: chuoiThanhNgay(congNgay(h, 10)),
        daCongBo: true,
        bacXepLoais: { create: ky1.bacXepLoais.map((b) => ({ ten: b.ten, diemToiThieu: b.diemToiThieu })) },
        nhiemVus: {
          create: [{ ten: "NV A", diem: 50, tasks: { create: [{ ten: "Task A", loai: "BAT_BUOC" }] } }],
        },
      },
      include: { nhiemVus: true },
    });
    const kyCu = kyId;
    kyId = ky2.id;
    await dangKy("gv.tranthibinh", [0]); // NV A có thuTu mặc định 0
    const u = await user("gv.tranthibinh");
    const gt = await db.gvTask.findFirstOrThrow({ where: { gvId: u.id, kyId } });
    await dangNhapNhu("gv.tranthibinh");
    await nopBaiMoi((await layNguoiDung())!, gt.id, formPdf()); // để Chờ duyệt

    // Cron: chưa quá deadline → không chốt; sai secret → 401.
    const goi = (secret: string) =>
      cronChotKy(new Request("http://x/api/cron/chot-ky", { method: "POST", headers: { authorization: `Bearer ${secret}` } }));
    expect((await goi("sai")).status).toBe(401);
    expect((await (await goi("test-cron-secret")).json()).daChot).toEqual([]);

    // Quá deadline → cron chốt.
    await db.ky.update({
      where: { id: kyId },
      data: { ngayBatDau: chuoiThanhNgay(congNgay(h, -10)), ngayKetThuc: chuoiThanhNgay(congNgay(h, -1)) },
    });
    const body = await (await goi("test-cron-secret")).json();
    expect(body.daChot).toEqual([{ id: kyId, ten: "Kỳ 2 – 2026-2027", soGv: 3 }]);

    expect(await ketQua("gv.nguyenvanan")).toMatchObject({
      ketQua: "KHONG_DAT",
      xepLoai: "F",
      phanTram: 0,
      ghiChu: "Chưa có danh sách nhiệm vụ được duyệt",
    });
    expect(await ketQua("gv.tranthibinh")).toMatchObject({
      ketQua: "KHONG_DAT",
      xepLoai: "B",
      phanTram: 0,
      taskThieu: [{ ten: "Task A", nhiemVu: "NV A" }],
    });
    // Chạy lại cron không chốt lại.
    expect((await (await goi("test-cron-secret")).json()).daChot).toEqual([]);
    kyId = kyCu;
  });
});
