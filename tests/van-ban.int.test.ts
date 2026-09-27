import { beforeAll, describe, expect, it } from "vitest";
import { POST as banHanhApi } from "@/app/api/van-ban/route";
import { GET as taiFile } from "@/app/api/files/[id]/route";
import { danhDauDaXem } from "@/components/giay-to/actions";
import { layNguoiDung } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { LoiNghiepVu } from "@/lib/loi";
import { banHanhVanBan } from "@/lib/services/van-ban";
import { dangNhapNhu, resetDb, user } from "./helpers";

function form(o: { tieuDe?: string; noiDung?: string; ids?: string[]; files?: File[] }) {
  const fd = new FormData();
  fd.append("tieuDe", o.tieuDe ?? "Quyết định số 1");
  fd.append("noiDung", o.noiDung ?? "Nội dung quyết định");
  (o.ids ?? []).forEach((id) => fd.append("nguoiNhanIds", id));
  (o.files ?? []).forEach((f) => fd.append("files", f));
  return fd;
}

async function loi(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e.message;
    throw e;
  }
  throw new Error("Không ném lỗi");
}

beforeAll(async () => {
  await resetDb();
});

describe("Giấy tờ (bước 7)", () => {
  it("chỉ HT ban hành được", async () => {
    await dangNhapNhu("admin.quantri");
    const res = await banHanhApi(new Request("http://x", { method: "POST", body: form({}) }));
    expect(res.status).toBe(403);
  });

  it("kiểm tra dữ liệu: tiêu đề, người nhận ≥1, không gửi cho HT, file sai định dạng", async () => {
    const ht = await dangNhapNhu("ht.nguyenvanhieu");
    const gv = await user("gv.nguyenvanan");
    const me = (await layNguoiDung())!;
    expect(await loi(banHanhVanBan(me, form({ tieuDe: " ", ids: [gv.id] })))).toBe("Vui lòng nhập tiêu đề.");
    expect(await loi(banHanhVanBan(me, form({})))).toBe("Vui lòng chọn ít nhất 1 người nhận.");
    expect(await loi(banHanhVanBan(me, form({ ids: [ht.id] })))).toBe("Danh sách người nhận không hợp lệ.");
    expect(await loi(banHanhVanBan(me, form({ ids: [gv.id], files: [new File(["x"], "a.zip")] })))).toMatch(/sai định dạng/);
  });

  it("case phụ: gửi 2 GV + admin → đúng 3 người nhận; GV mở → 1/3 đã xem; quyền file", async () => {
    await dangNhapNhu("ht.nguyenvanhieu");
    const [an, binh, admin] = await Promise.all([user("gv.nguyenvanan"), user("gv.tranthibinh"), user("admin.quantri")]);
    const res = await banHanhApi(
      new Request("http://x", {
        method: "POST",
        body: form({ ids: [an.id, binh.id, admin.id], files: [new File([new Uint8Array(50)], "quyet-dinh.pdf")] }),
      }),
    );
    expect(res.status).toBe(201);
    const { vanBanId, soNguoiNhan } = await res.json();
    expect(soNguoiNhan).toBe(3);
    expect(await db.vanBanNguoiNhan.count({ where: { vanBanId } })).toBe(3);

    // Thông báo: GV → /giay-to/…, admin → /admin/chi-thi/…
    expect(await db.thongBao.findFirst({ where: { userId: an.id } })).toMatchObject({ link: `/giay-to/${vanBanId}` });
    expect(await db.thongBao.findFirst({ where: { userId: admin.id } })).toMatchObject({ link: `/admin/chi-thi/${vanBanId}` });

    await dangNhapNhu("gv.nguyenvanan");
    expect(await danhDauDaXem(vanBanId)).toEqual({ ok: true, data: { moiXem: true } });
    expect(await danhDauDaXem(vanBanId)).toEqual({ ok: true, data: { moiXem: false } }); // chỉ ghi lần đầu
    const daXem = await db.vanBanNguoiNhan.count({ where: { vanBanId, daXemLuc: { not: null } } });
    expect(daXem).toBe(1);

    // Người không nhận mở → không ghi nhận gì.
    await dangNhapNhu("gv.levancuong");
    expect(await danhDauDaXem(vanBanId)).toEqual({ ok: true, data: { moiXem: false } });

    // Quyền tải file giấy tờ: người gửi, người nhận, Admin được; người khác bị chặn.
    const f = await db.fileDinhKem.findFirstOrThrow({ where: { vanBanId } });
    const goi = () => taiFile(new Request("http://x"), { params: Promise.resolve({ id: f.id }) });
    for (const [u, ma] of [
      ["ht.nguyenvanhieu", 200],
      ["gv.tranthibinh", 200],
      ["admin.quantri", 200],
      ["gv.levancuong", 403],
      ["tbm.phamthibich", 403],
    ] as const) {
      await dangNhapNhu(u);
      expect((await goi()).status, u).toBe(ma);
    }
  });
});
