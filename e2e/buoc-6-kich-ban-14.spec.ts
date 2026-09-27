// Kịch bản nghiệm thu mục 14, chạy hoàn toàn qua giao diện.
// SQL chỉ dùng để ĐỌC id (chọn task cần mở), không ghi dữ liệu nghiệp vụ.
import { test, expect, type Page } from "@playwright/test";
import { dangNhap, resetDb, sql } from "./helpers";

test.beforeAll(async () => resetDb());
test.describe.configure({ timeout: 300_000 });

const NHIEM_VU = [
  "Biên soạn bài giảng",
  "Hướng dẫn sinh viên NCKH",
  "Công bố bài báo khoa học",
  "Biên soạn giáo trình, tài liệu tham khảo",
  "Đổi mới phương pháp giảng dạy",
  "Tham gia hội thảo chuyên môn",
  "Cố vấn học tập",
  "Coi thi, chấm thi",
  "Bồi dưỡng chuyên môn",
  "Công tác phục vụ cộng đồng",
];

async function dangKyVaDuyet(page: Page, username: string, soNhiemVu: number[]) {
  await dangNhap(page, username);
  for (const i of soNhiemVu) await page.getByRole("checkbox", { name: `Chọn ${NHIEM_VU[i - 1]}` }).click();
  await expect(page.getByRole("button", { name: "Gửi lên trưởng bộ môn" })).toBeEnabled();
  await page.getByRole("button", { name: "Gửi lên trưởng bộ môn" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Gửi" }).click();
  await expect(page.getByTestId("banner-trang-thai")).toContainText("Chờ duyệt");

  await dangNhap(page, "tbm.phamthibich");
  await page.getByRole("row", { name: new RegExp(username) }).getByRole("link", { name: "Xem" }).click();
  await page.getByRole("button", { name: "Duyệt" }).click();
  await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
  await expect(page.getByText("Đã duyệt danh sách.")).toBeVisible();
}

async function gvTaskIds(username: string, loai: "BAT_BUOC" | "MO_RONG") {
  const rows = await sql<{ id: string }>(
    `SELECT g.id FROM "GvTask" g
       JOIN "User" u ON u.id = g."gvId"
       JOIN "Task" t ON t.id = g."taskId"
       JOIN "NhiemVu" n ON n.id = t."nhiemVuId"
     WHERE u.username = $1 AND t.loai = $2
     ORDER BY n."thuTu", t."thuTu"`,
    [username, loai],
  );
  return rows.map((r) => r.id);
}

async function nopMinhChung(page: Page, gvTaskIds: string[]) {
  for (const id of gvTaskIds) {
    await page.goto(`/gv/cuoi-ky/task/${id}`);
    await page.getByLabel("File minh chứng").setInputFiles({ name: "minh-chung.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(1024, 1) });
    await page.getByRole("button", { name: "Gửi minh chứng" }).click();
    await expect(page.getByText("Sửa / thay minh chứng của lần nộp hiện tại", { exact: true })).toBeVisible();
  }
}

async function tbmDuyetTatCa(page: Page, username: string) {
  await dangNhap(page, "tbm.phamthibich");
  const ids = await sql<{ id: string }>(
    `SELECT b.id FROM "BaiNop" b JOIN "GvTask" g ON g.id = b."gvTaskId" JOIN "User" u ON u.id = g."gvId"
     WHERE u.username = $1 AND b."trangThai" = 'CHO_DUYET'`,
    [username],
  );
  for (const { id } of ids) {
    await page.goto(`/tbm/duyet-task/${id}`);
    await page.getByRole("button", { name: "Duyệt" }).click();
    await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
    await expect(page.getByText("Đã duyệt minh chứng.")).toBeVisible();
  }
  return ids.length;
}

test.describe.serial("Kịch bản nghiệm thu mục 14", () => {
  test("chuẩn bị: admin thấy kỳ đã công bố", async ({ page }) => {
    await dangNhap(page, "admin.quantri");
    await page.goto("/admin/phan-viec");
    await expect(page.getByRole("row", { name: /Kỳ 1 – 2026-2027/ })).toContainText("Đã công bố");
  });

  test("gv.nguyenvanan: chọn cả 10 nhiệm vụ (100 điểm), TBM duyệt ~50% task bắt buộc", async ({ page }) => {
    await dangKyVaDuyet(page, "gv.nguyenvanan", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const ids = await gvTaskIds("gv.nguyenvanan", "BAT_BUOC");
    expect(ids).toHaveLength(22);
    await dangNhap(page, "gv.nguyenvanan");
    await nopMinhChung(page, ids.slice(0, 11));
    expect(await tbmDuyetTatCa(page, "gv.nguyenvanan")).toBe(11);
  });

  test("gv.tranthibinh: nhiệm vụ 1, 2, 3 (39 điểm), TBM duyệt 100% task bắt buộc", async ({ page }) => {
    await dangKyVaDuyet(page, "gv.tranthibinh", [1, 2, 3]);
    const ids = await gvTaskIds("gv.tranthibinh", "BAT_BUOC");
    await dangNhap(page, "gv.tranthibinh");
    await nopMinhChung(page, ids);
    expect(await tbmDuyetTatCa(page, "gv.tranthibinh")).toBe(7);
  });

  test("gv.levancuong: nhiệm vụ 1–5 (59 điểm), 100% + xin 2 task mở rộng, được duyệt, làm xong", async ({ page }) => {
    await dangKyVaDuyet(page, "gv.levancuong", [1, 2, 3, 4, 5]);
    await dangNhap(page, "gv.levancuong");
    await nopMinhChung(page, await gvTaskIds("gv.levancuong", "BAT_BUOC"));

    await page.goto("/gv/cuoi-ky");
    for (const ten of ["Số hóa bài giảng lên hệ thống LMS", "Nhóm sinh viên đạt giải cấp trường"]) {
      const dong = page.locator(`[data-xin-them="${ten}"]`);
      await dong.getByRole("button", { name: "Xin làm" }).click();
      await expect(dong).toContainText("Đang chờ duyệt");
    }
    await dangNhap(page, "tbm.phamthibich");
    await page.goto("/tbm/duyet-xin-them");
    for (let i = 0; i < 2; i++) {
      await page.locator("[data-yeu-cau]").first().getByRole("button", { name: "Duyệt" }).click();
      await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await expect(page.locator("[data-yeu-cau]")).toHaveCount(0);

    await dangNhap(page, "gv.levancuong");
    await nopMinhChung(page, await gvTaskIds("gv.levancuong", "MO_RONG"));
    expect(await tbmDuyetTatCa(page, "gv.levancuong")).toBe(13); // 11 bắt buộc + 2 mở rộng

    await dangNhap(page, "gv.levancuong");
    await page.goto("/gv/cuoi-ky");
    await expect(page.getByTestId("phan-tram")).toHaveText("100%");
    await expect(page.getByTestId("task-vuot")).toHaveText("+2 task vượt");
  });

  test("admin bấm Chốt kỳ ngay", async ({ page }) => {
    await dangNhap(page, "admin.quantri");
    await page.goto("/admin/phan-viec");
    await page.getByRole("link", { name: "Kỳ 1 – 2026-2027" }).click();
    await page.getByRole("button", { name: "Chốt kỳ ngay" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Chốt kỳ" }).click();
    await expect(page.getByText("Đã chốt kỳ, tính kết quả cho 3 giáo viên.")).toBeVisible();
    await expect(page.getByText("Đã chốt", { exact: true })).toBeVisible();
  });

  test("GV thấy đúng kết quả", async ({ page }) => {
    await dangNhap(page, "gv.nguyenvanan");
    await page.goto("/gv/cuoi-ky");
    await expect(page.getByTestId("ket-qua-tieu-de")).toHaveText("Không đạt – A1");
    await expect(page.getByTestId("task-thieu").locator("li")).toHaveCount(11);

    await dangNhap(page, "gv.tranthibinh");
    await page.goto("/gv/cuoi-ky");
    await expect(page.getByTestId("ket-qua-tieu-de")).toHaveText("Đạt – C");

    await dangNhap(page, "gv.levancuong");
    await page.goto("/gv/cuoi-ky");
    await expect(page.getByTestId("ket-qua-tieu-de")).toHaveText("Vượt chỉ tiêu – B");
    await expect(page.getByTestId("task-vuot-list").locator("li")).toHaveCount(2);
    // Sau chốt: không còn nút nộp / xin thêm.
    await expect(page.getByRole("button", { name: "Xin làm" })).toHaveCount(0);
  });

  test("TBM thấy bảng kết quả kỳ", async ({ page }) => {
    await dangNhap(page, "tbm.phamthibich");
    await page.goto("/tbm/ket-qua");
    await expect(page.locator('[data-gv="gv.nguyenvanan"]')).toContainText("Không đạt");
    await expect(page.locator('[data-gv="gv.nguyenvanan"]')).toContainText("A1");
    await expect(page.locator('[data-gv="gv.nguyenvanan"]')).toContainText("50%");
    await expect(page.locator('[data-gv="gv.nguyenvanan"]')).toContainText("11 task");
    await expect(page.locator('[data-gv="gv.tranthibinh"]')).toContainText("Đạt");
    await expect(page.locator('[data-gv="gv.tranthibinh"]')).toContainText("C");
    await expect(page.locator('[data-gv="gv.levancuong"]')).toContainText("Vượt chỉ tiêu");
    await expect(page.locator('[data-gv="gv.levancuong"]')).toContainText("B");
  });

  test("sau khi chốt: TBM không còn gì để duyệt, GV không nộp được", async ({ page }) => {
    await dangNhap(page, "gv.nguyenvanan");
    const [id] = await gvTaskIds("gv.nguyenvanan", "BAT_BUOC").then((ids) => ids.slice(11));
    await page.goto(`/gv/cuoi-ky/task/${id}`);
    await expect(page.getByText("Kỳ đã chốt, không thể thao tác.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Gửi minh chứng" })).toHaveCount(0);
  });
});
