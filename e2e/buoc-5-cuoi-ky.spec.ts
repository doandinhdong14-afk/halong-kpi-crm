import { test, expect, type Page } from "@playwright/test";
import { dangNhap, resetDb, sql } from "./helpers";

test.beforeAll(async () => resetDb());

const PDF = (name: string, size = 2048) => ({ name, mimeType: "application/pdf", buffer: Buffer.alloc(size, 1) });

async function dangKyVaDuyet(page: Page, username: string, nhiemVus: string[]) {
  await dangNhap(page, username);
  for (const nv of nhiemVus) await page.getByRole("checkbox", { name: `Chọn ${nv}` }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Gửi lên trưởng bộ môn" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Gửi" }).click();
  await expect(page.getByTestId("banner-trang-thai")).toContainText("Chờ duyệt");

  await dangNhap(page, "tbm.phamthibich");
  await page.getByRole("row", { name: new RegExp(username) }).getByRole("link", { name: "Xem" }).click();
  await page.getByRole("button", { name: "Duyệt" }).click();
  await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
  await expect(page.getByText("Đã duyệt danh sách.")).toBeVisible();
}

async function moTask(page: Page, tenTask: string) {
  await page.goto("/gv/cuoi-ky");
  await page.locator(`[data-task="${tenTask}"]`).getByRole("link").click();
  await expect(page.getByRole("heading", { name: tenTask })).toBeVisible();
}

test.describe.serial("GV Cuối kỳ + TBM Duyệt task + Xin thêm task", () => {
  test("chưa được duyệt → thông báo", async ({ page }) => {
    await dangNhap(page, "gv.tranthibinh");
    await page.goto("/gv/cuoi-ky");
    await expect(page.getByTestId("chua-duyet")).toContainText("Danh sách nhiệm vụ chưa được trưởng bộ môn duyệt");
  });

  test("sau khi duyệt: biểu đồ tròn 0%, 7 task bắt buộc Chưa làm, xếp loại C", async ({ page }) => {
    await dangKyVaDuyet(page, "gv.tranthibinh", ["Biên soạn bài giảng", "Hướng dẫn sinh viên NCKH", "Công bố bài báo khoa học"]);
    await dangNhap(page, "gv.tranthibinh");
    await page.goto("/gv/cuoi-ky");
    await expect(page.getByTestId("phan-tram")).toHaveText("0%");
    await expect(page.locator('[data-phan="chuaLam"]')).toContainText("7");
    await expect(page.getByTestId("xep-loai-dang-ky")).toHaveText("C");
    await expect(page.getByTestId("dem-nguoc")).toContainText("Còn lại đến deadline");
    await expect(page.locator("[data-nhiem-vu]")).toHaveCount(3);
  });

  test("file sai định dạng / quá 20MB → báo lỗi", async ({ page }) => {
    await dangNhap(page, "gv.tranthibinh");
    await moTask(page, "Soạn slide bài giảng");
    await page.getByLabel("File minh chứng").setInputFiles({ name: "virus.exe", mimeType: "application/octet-stream", buffer: Buffer.alloc(10) });
    await page.getByRole("button", { name: "Gửi minh chứng" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("sai định dạng");

    await page.getByRole("button", { name: "Bỏ chọn virus.exe" }).click();
    await page.getByLabel("File minh chứng").setInputFiles(PDF("to.pdf", 20 * 1024 * 1024 + 10));
    await page.getByRole("button", { name: "Gửi minh chứng" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("vượt quá 20MB");
  });

  test("nộp → Chờ duyệt; sửa minh chứng khi Chờ duyệt", async ({ page }) => {
    await dangNhap(page, "gv.tranthibinh");
    await moTask(page, "Soạn slide bài giảng");
    await page.getByLabel("File minh chứng").setInputFiles([PDF("slide-chuong-1.pdf"), PDF("slide-chuong-2.pdf")]);
    await page.getByLabel("Ghi chú (không bắt buộc)").fill("Slide 2 chương đầu");
    await page.getByRole("button", { name: "Gửi minh chứng" }).click();
    await expect(page.getByText("Đã nộp minh chứng, chờ trưởng bộ môn duyệt.")).toBeVisible();
    await expect(page.getByText("Sửa / thay minh chứng của lần nộp hiện tại", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Bỏ slide-chuong-2.pdf" }).click();
    await page.getByLabel("Thêm file").setInputFiles(PDF("slide-chuong-2-sua.pdf"));
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đã cập nhật minh chứng.")).toBeVisible();
    const lanNop = page.locator('[data-lan-nop="1"]');
    await expect(lanNop.locator("[data-file]")).toHaveText([/slide-chuong-1.pdf/, /slide-chuong-2-sua.pdf/]);

    await page.goto("/gv/cuoi-ky");
    await expect(page.locator('[data-phan="choDuyet"]')).toContainText("1");
  });

  test("link file: GV khác bị chặn", async ({ page }) => {
    const [f] = await sql<{ id: string }>(`SELECT id FROM "FileDinhKem" LIMIT 1`);
    await dangNhap(page, "gv.tranthibinh");
    expect((await page.request.get(`/api/files/${f.id}`)).status()).toBe(200);
    await dangNhap(page, "gv.nguyenvanan");
    expect((await page.request.get(`/api/files/${f.id}`)).status()).toBe(403);
  });

  test("TBM từ chối kèm nhận xét → GV nộp lại → TBM duyệt; lịch sử 2 lần", async ({ page }) => {
    await dangNhap(page, "tbm.phamthibich");
    await page.goto("/tbm/duyet-task");
    await page.getByRole("row", { name: /Soạn slide bài giảng/ }).getByRole("link", { name: "Xem" }).click();
    await expect(page.locator("[data-file]")).toHaveCount(2);
    await page.getByRole("button", { name: "Từ chối" }).click();
    await page.getByLabel("Nhận xét").fill("Thiếu slide chương 3");
    await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
    await expect(page.getByText("Đã từ chối minh chứng.")).toBeVisible();

    await dangNhap(page, "gv.tranthibinh");
    await moTask(page, "Soạn slide bài giảng");
    await expect(page.getByTestId("lich-su-nop")).toContainText("Thiếu slide chương 3");
    await expect(page.getByText("Nộp lại minh chứng", { exact: true })).toBeVisible();
    await page.getByLabel("File minh chứng").setInputFiles(PDF("slide-day-du.pdf"));
    await page.getByRole("button", { name: "Gửi minh chứng" }).click();
    await expect(page.locator("[data-lan-nop]")).toHaveCount(2);

    await dangNhap(page, "tbm.phamthibich");
    await page.goto("/tbm/duyet-task");
    await page.getByRole("row", { name: /Soạn slide bài giảng/ }).getByRole("link", { name: "Xem" }).click();
    await page.getByRole("button", { name: "Duyệt" }).click();
    await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
    await expect(page.getByText("Đã duyệt minh chứng.")).toBeVisible();

    await dangNhap(page, "gv.tranthibinh");
    await moTask(page, "Soạn slide bài giảng");
    await expect(page.getByText("Task đã được duyệt và khóa.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Gửi minh chứng" })).toHaveCount(0);
    await page.goto("/gv/cuoi-ky");
    await expect(page.getByTestId("phan-tram")).toHaveText("14,3%"); // 1/7
    await expect(page.locator('[data-phan="daDuyet"]')).toContainText("1");
  });

  test("xin thêm task mở rộng → TBM duyệt → task vào danh sách", async ({ page }) => {
    await dangNhap(page, "gv.tranthibinh");
    await page.goto("/gv/cuoi-ky");
    const dong = page.locator('[data-xin-them="Số hóa bài giảng lên hệ thống LMS"]');
    await dong.getByRole("button", { name: "Xin làm" }).click();
    await expect(dong).toContainText("Đang chờ duyệt");

    await dangNhap(page, "tbm.phamthibich");
    await page.goto("/tbm/duyet-xin-them");
    await page.locator('[data-yeu-cau="Trần Thị Bình – Số hóa bài giảng lên hệ thống LMS"]').getByRole("button", { name: "Duyệt" }).click();
    await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
    await expect(page.getByText("Đã duyệt. Task được thêm vào danh sách của giáo viên.")).toBeVisible();

    await dangNhap(page, "gv.tranthibinh");
    await page.goto("/gv/cuoi-ky");
    await expect(page.locator('[data-xin-them="Số hóa bài giảng lên hệ thống LMS"]')).toContainText("Đã được giao");
    await expect(page.locator('[data-task="Số hóa bài giảng lên hệ thống LMS"]')).toContainText("Chưa làm");
    // Task mở rộng không làm biểu đồ thay đổi tổng.
    await expect(page.getByText("Tổng 7 task bắt buộc")).toBeVisible();
  });
});
