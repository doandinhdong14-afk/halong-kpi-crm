import { beforeAll, describe, expect, it } from "vitest";
import { nguoiChot, nguoiDuyet, nguoiToiChot, nguoiToiDuyet } from "@/lib/co-cau";
import { taiCoCau } from "@/lib/services/co-cau";
import { resetDb } from "./helpers";

beforeAll(async () => {
  await resetDb();
});

describe("cơ cấu trên dữ liệu seed", () => {
  it("người duyệt / người chốt đúng cho cả 4 vị trí", async () => {
    const cc = await taiCoCau();
    const theo = (username: string) => cc.users.find((x) => x.username === username)!;
    const bang: [string, string, string][] = [
      ["gv.nguyenvanan", "tbm.phamthibich", "tk.levankhoa"],
      ["tbm.phamthibich", "tk.levankhoa", "hp.tranthiphuong"],
      ["tk.levankhoa", "hp.tranthiphuong", "ht.nguyenvanhieu"],
      ["hp.tranthiphuong", "ht.nguyenvanhieu", "ht.nguyenvanhieu"],
    ];
    for (const [lam, duyet, chot] of bang) {
      expect(nguoiDuyet(theo(lam), cc)?.username, lam).toBe(duyet);
      expect(nguoiChot(theo(lam), cc)?.username, lam).toBe(chot);
    }
    expect(nguoiToiDuyet(theo("tbm.phamthibich"), cc).map((x) => x.username).sort()).toEqual([
      "gv.levancuong",
      "gv.nguyenvanan",
      "gv.tranthibinh",
    ]);
    expect(nguoiToiChot(theo("tk.levankhoa"), cc)).toHaveLength(3);
    expect(nguoiToiChot(theo("ht.nguyenvanhieu"), cc).map((x) => x.username)).toEqual(["tk.levankhoa"]);
  });
});
