import { beforeAll, describe, expect, it } from "vitest";
import { GET as layThongBao } from "@/app/api/thong-bao/route";
import { docTatCaThongBao, docThongBao } from "@/components/layout/thong-bao-actions";
import { chonNhiemVu, guiDangKy } from "@/app/(app)/gv/dau-ky/actions";
import { duyetDangKy } from "@/app/(app)/tbm/duyet-dang-ky/actions";
import { db } from "@/lib/db";
import { guiNhacHan } from "@/lib/services/nhac-han";
import { chuoiThanhNgay, congNgay, homNayVN } from "@/lib/time";
import { dangNhapNhu, resetDb, user } from "./helpers";

let kyId: string;

async function datNgay(batDau: number, ketThuc: number) {
  const h = homNayVN();
  await db.ky.update({
    where: { id: kyId },
    data: { ngayBatDau: chuoiThanhNgay(congNgay(h, batDau)), ngayKetThuc: chuoiThanhNgay(congNgay(h, ketThuc)) },
  });
}

beforeAll(async () => {
  await resetDb();
  kyId = (await db.ky.findFirstOrThrow()).id;
});

describe("Thông báo (bước 8)", () => {
  it("nhắc hạn đăng ký: còn ≤3 ngày, chỉ GV chưa gửi, không gửi trùng", async () => {
    // gv.tranthibinh đã gửi → không nhắc.
    await dangNhapNhu("gv.tranthibinh");
    const nv = await db.nhiemVu.findFirstOrThrow({ where: { kyId, thuTu: 1 } });
    await chonNhiemVu({ kyId, nhiemVuId: nv.id, chon: true });
    await guiDangKy(kyId);

    await datNgay(5, 40);
    expect(await guiNhacHan()).toEqual({ hanDangKy: 0, deadline: 0 }); // còn 5 ngày: chưa nhắc
    await datNgay(3, 40);
    expect(await guiNhacHan()).toEqual({ hanDangKy: 2, deadline: 0 }); // an + cuong
    expect(await guiNhacHan()).toEqual({ hanDangKy: 0, deadline: 0 }); // không gửi trùng
    const an = await user("gv.nguyenvanan");
    const tb = await db.thongBao.findFirstOrThrow({ where: { userId: an.id, maSuKien: `nhac-han-dang-ky:${kyId}` } });
    expect(tb.noiDung).toMatch(/^Còn 3 ngày đến hạn đăng ký/);
    expect(tb.link).toBe(`/gv/dau-ky?kyId=${kyId}`);
  });

  it("nhắc deadline: còn ≤7 ngày, GV còn task bắt buộc chưa Đã duyệt", async () => {
    await dangNhapNhu("tbm.phamthibich");
    const dk = await db.dangKy.findFirstOrThrow({ where: { kyId, trangThai: "CHO_DUYET" } });
    await duyetDangKy({ dangKyId: dk.id });
    await datNgay(-20, 7);
    expect(await guiNhacHan()).toEqual({ hanDangKy: 0, deadline: 1 });
    expect(await guiNhacHan()).toEqual({ hanDangKy: 0, deadline: 0 });
    const binh = await user("gv.tranthibinh");
    expect(await db.thongBao.count({ where: { userId: binh.id, maSuKien: `nhac-deadline:${kyId}` } })).toBe(1);
  });

  it("API chuông: đếm chưa đọc, chỉ của mình; đánh dấu đã đọc", async () => {
    await dangNhapNhu("gv.tranthibinh");
    const r1 = await (await layThongBao()).json();
    expect(r1.chuaDoc).toBeGreaterThanOrEqual(2); // được duyệt + nhắc deadline
    expect(r1.items.every((t: { noiDung: string }) => typeof t.noiDung === "string")).toBe(true);

    // Không đánh dấu được thông báo của người khác.
    const an = await user("gv.nguyenvanan");
    const tbAn = await db.thongBao.findFirstOrThrow({ where: { userId: an.id } });
    await docThongBao(tbAn.id);
    expect((await db.thongBao.findUniqueOrThrow({ where: { id: tbAn.id } })).daDoc).toBe(false);

    await docThongBao(r1.items[0].id);
    expect((await (await layThongBao()).json()).chuaDoc).toBe(r1.chuaDoc - 1);
    await docTatCaThongBao();
    expect((await (await layThongBao()).json()).chuaDoc).toBe(0);
  });
});
