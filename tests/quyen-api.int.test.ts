import { beforeAll, describe, expect, it } from "vitest";
import { PATCH as suaBaiNopApi } from "@/app/api/bai-nop/[id]/route";
import { POST as nopBaiApi } from "@/app/api/gv-task/[id]/bai-nop/route";
import { GET as taiFile } from "@/app/api/files/[id]/route";
import { phien, dangNhapNhu, resetDb } from "./helpers";

function req(method: string) {
  const fd = new FormData();
  fd.append("files", new File([new Uint8Array(10)], "a.pdf"));
  return new Request("http://x/api", { method, body: fd });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeAll(async () => {
  await resetDb();
});

describe("Route API chặn theo vai trò", () => {
  it("chưa đăng nhập → 401", async () => {
    phien.userId = null;
    expect((await nopBaiApi(req("POST"), ctx("x"))).status).toBe(401);
    expect((await suaBaiNopApi(req("PATCH"), ctx("x"))).status).toBe(401);
    expect((await taiFile(new Request("http://x"), ctx("x"))).status).toBe(401);
  });

  it("Admin / TBM gọi API nộp, sửa minh chứng → 403", async () => {
    for (const u of ["admin.quantri", "tbm.phamthibich"]) {
      await dangNhapNhu(u);
      const r1 = await suaBaiNopApi(req("PATCH"), ctx("x"));
      expect(r1.status).toBe(403);
      expect(await r1.json()).toEqual({ error: "Bạn không có quyền thực hiện thao tác này." });
      expect((await nopBaiApi(req("POST"), ctx("x"))).status).toBe(403);
    }
  });

  it("file không tồn tại → 404", async () => {
    await dangNhapNhu("admin.quantri");
    expect((await taiFile(new Request("http://x"), ctx("khong-co"))).status).toBe(404);
  });
});
