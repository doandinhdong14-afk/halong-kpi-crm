import { test, expect, type Page } from "@playwright/test";
import { dangNhap, resetDb } from "./helpers";

test.beforeAll(async () => resetDb());

async function chon(page: Page, nhan: string, option: string) {
  await page.getByRole("dialog").getByLabel(nhan, { exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test.describe.serial("Admin – Phân việc đầu kỳ", () => {
  test.beforeEach(async ({ page }) => {
    await dangNhap(page, "admin.quantri");
    await page.goto("/admin/phan-viec");
  });

  test("danh sách kỳ có kỳ seed đã công bố", async ({ page }) => {
    const dong = page.getByRole("row", { name: /Kỳ 1 – 2026-2027/ });
    await expect(dong).toContainText("Đã công bố");
    await expect(dong).toContainText("10");
  });

  test("tạo kỳ 2 sao chép từ kỳ 1 → đủ 10 nhiệm vụ, bảng xếp loại; công bố", async ({ page }) => {
    await page.getByRole("button", { name: "Tạo kỳ" }).click();
    await page.getByLabel("Tên kỳ").fill("Kỳ 2 – 2026-2027");
    await page.getByLabel("Năm học").fill("2026-2027");
    await chon(page, "Kỳ số", "Kỳ 2");
    await page.getByLabel("Ngày bắt đầu").fill("2026-12-01");
    await page.getByLabel("Ngày kết thúc").fill("2027-02-28");
    // Mặc định sao chép từ kỳ gần nhất (Kỳ 1).
    await expect(page.getByLabel("Sao chép từ kỳ trước")).toContainText("Kỳ 1 – 2026-2027");
    await page.getByRole("dialog").getByRole("button", { name: "Tạo kỳ" }).click();

    await expect(page).toHaveURL(/\/admin\/phan-viec\/.+/);
    await expect(page.getByRole("heading", { name: "Kỳ 2 – 2026-2027" })).toBeVisible();
    await expect(page.getByText("Chưa công bố")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Nhiệm vụ & task (10)" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Bảng xếp loại (6)" })).toBeVisible();
    await expect(page.getByText("tổng điểm tất cả nhiệm vụ: 100")).toBeVisible();

    await page.getByRole("button", { name: "Công bố" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Công bố" }).click();
    await expect(page.getByText("Đã công bố kỳ.")).toBeVisible();
    await expect(page.getByText("Đã công bố", { exact: true })).toBeVisible();
  });

  test("CRUD nhiệm vụ và task", async ({ page }) => {
    await page.getByRole("link", { name: "Kỳ 2 – 2026-2027" }).click();
    await page.getByRole("button", { name: "Thêm nhiệm vụ" }).click();
    await page.getByRole("dialog").getByLabel("Tên nhiệm vụ").fill("Nhiệm vụ thử");
    await page.getByRole("dialog").getByLabel("Điểm").fill("5");
    await page.getByRole("button", { name: "Lưu" }).click();
    const the = page.locator('[data-nhiem-vu="Nhiệm vụ thử"]');
    await expect(the).toContainText("5 điểm");
    await expect(the).toContainText("Chưa có task bắt buộc");

    await the.getByRole("button", { name: "Thêm task" }).click();
    await page.getByRole("dialog").getByLabel("Tên task").fill("Task bắt buộc thử");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(the.locator('[data-task="Task bắt buộc thử"]')).toContainText("Bắt buộc");
    await expect(the).not.toContainText("Chưa có task bắt buộc");

    await the.getByRole("button", { name: "Sửa task Task bắt buộc thử" }).click();
    await chon(page, "Loại", "Mở rộng");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(the.locator('[data-task="Task bắt buộc thử"]')).toContainText("Mở rộng");

    await the.getByRole("button", { name: "Sửa" }).first().click();
    await page.getByRole("dialog").getByLabel("Tên nhiệm vụ").fill("Nhiệm vụ thử (đã sửa)");
    await page.getByRole("button", { name: "Lưu" }).click();
    const theMoi = page.locator('[data-nhiem-vu="Nhiệm vụ thử (đã sửa)"]');
    await expect(theMoi).toBeVisible();

    await theMoi.getByRole("button", { name: "Xóa" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Xóa" }).click();
    await expect(theMoi).toHaveCount(0);
  });

  test("sửa bảng xếp loại", async ({ page }) => {
    await page.getByRole("link", { name: "Kỳ 2 – 2026-2027" }).click();
    await page.getByRole("tab", { name: /Bảng xếp loại/ }).click();
    await page.getByRole("button", { name: "Thêm bậc" }).click();
    await page.getByLabel("Tên bậc 7").fill("A0");
    await page.getByLabel("Điểm tối thiểu 7").fill("95");
    await page.getByRole("button", { name: "Lưu bảng xếp loại" }).click();
    await expect(page.getByText("Đã lưu bảng xếp loại.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("tab", { name: "Bảng xếp loại (7)" })).toBeVisible();

    // Trùng ngưỡng → báo lỗi từ server.
    await page.getByRole("tab", { name: /Bảng xếp loại/ }).click();
    await page.getByLabel("Điểm tối thiểu 1").fill("80");
    await page.getByRole("button", { name: "Lưu bảng xếp loại" }).click();
    await expect(page.getByText("Điểm tối thiểu của các bậc bị trùng.")).toBeVisible();
  });

  test("sửa ngày kỳ", async ({ page }) => {
    await page.getByRole("link", { name: "Kỳ 2 – 2026-2027" }).click();
    await page.getByLabel("Ngày kết thúc").fill("2027-03-15");
    await page.getByRole("button", { name: "Lưu ngày" }).click();
    await expect(page.getByText("Đã lưu ngày của kỳ.")).toBeVisible();
    await expect(page.getByText("23:59 15/03/2027")).toBeVisible();
  });
});
