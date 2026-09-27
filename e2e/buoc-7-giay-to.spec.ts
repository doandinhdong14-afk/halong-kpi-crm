import { test, expect } from "@playwright/test";
import { dangNhap, resetDb } from "./helpers";

test.beforeAll(async () => resetDb());

test.describe.serial("Giấy tờ: HT ban hành + Nhận giấy tờ + Admin nhận chỉ thị", () => {
  test("HT: danh sách người nhận không có HT; lọc theo chức vụ, chọn tất cả", async ({ page }) => {
    await dangNhap(page, "ht.nguyenvanhieu");
    await expect(page.getByRole("checkbox", { name: "Chọn ht.nguyenvanhieu" })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: /^Chọn (admin|gv|tbm|tk|hp)\./ })).toHaveCount(7);

    await page.getByLabel("Lọc theo chức vụ").click();
    await page.getByRole("option", { name: "Giáo viên", exact: true }).click();
    await page.getByRole("checkbox", { name: "Chọn tất cả" }).click();
    await expect(page.getByText("(đã chọn 3)")).toBeVisible();
    await page.getByRole("checkbox", { name: "Chọn tất cả" }).click();
    await expect(page.getByText("(đã chọn 0)")).toBeVisible();
  });

  test("case phụ: gửi 2 GV + admin → đúng 3 người nhận", async ({ page }) => {
    await dangNhap(page, "ht.nguyenvanhieu");
    await page.getByLabel("Tiêu đề").fill("Quyết định khen thưởng");
    await page.getByLabel("Nội dung").fill("Khen thưởng giáo viên có thành tích xuất sắc.");
    await page.getByLabel("File đính kèm (không bắt buộc)").setInputFiles({
      name: "quyet-dinh.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(2048, 1),
    });
    await page.getByRole("checkbox", { name: "Chọn gv.nguyenvanan" }).click();
    await page.getByRole("checkbox", { name: "Chọn gv.tranthibinh" }).click();
    await page.getByRole("checkbox", { name: "Chọn admin.quantri" }).click();
    await page.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(page.getByText("Đã gửi giấy tờ cho 3 người.")).toBeVisible();
    await expect(page).toHaveURL("/ht/da-ban-hanh");
    await expect(page.locator('[data-van-ban="Quyết định khen thưởng"]').getByTestId("da-xem")).toHaveText("0/3 đã xem");
  });

  test("GV thấy giấy tờ Mới; mở ra → HT thấy 1/3 đã xem", async ({ page }) => {
    await dangNhap(page, "gv.nguyenvanan");
    await page.goto("/giay-to");
    const dong = page.locator('[data-giay-to="Quyết định khen thưởng"]');
    await expect(dong).toContainText("Mới");
    await dong.getByRole("link").click();
    await expect(page.getByTestId("noi-dung")).toHaveText("Khen thưởng giáo viên có thành tích xuất sắc.");
    await expect(page.locator('[data-file="quyet-dinh.pdf"]')).toBeVisible();
    await page.waitForTimeout(500);
    await page.goto("/giay-to");
    await expect(dong).not.toContainText("Mới");

    // GV khác không nhận → không thấy.
    await dangNhap(page, "gv.levancuong");
    await page.goto("/giay-to");
    await expect(page.getByText("Chưa có giấy tờ nào.")).toBeVisible();

    await dangNhap(page, "ht.nguyenvanhieu");
    await page.goto("/ht/da-ban-hanh");
    await expect(page.locator('[data-van-ban="Quyết định khen thưởng"]').getByTestId("da-xem")).toHaveText("1/3 đã xem");
    await page.getByRole("link", { name: "Quyết định khen thưởng" }).click();
    await expect(page.locator('[data-nguoi-nhan="gv.nguyenvanan"]')).toContainText("Đã xem");
    await expect(page.locator('[data-nguoi-nhan="gv.tranthibinh"]')).toContainText("Chưa xem");
    await expect(page.locator('[data-nguoi-nhan="admin.quantri"]')).toContainText("Chưa xem");
  });

  test("Admin nhận ở mục Nhận chỉ thị của hiệu trưởng (chỉ đọc)", async ({ page }) => {
    await dangNhap(page, "admin.quantri");
    await page.goto("/admin/chi-thi");
    await page.locator('[data-giay-to="Quyết định khen thưởng"]').getByRole("link").click();
    await expect(page.getByTestId("noi-dung")).toBeVisible();
    await page.waitForTimeout(500);

    await dangNhap(page, "ht.nguyenvanhieu");
    await page.goto("/ht/da-ban-hanh");
    await expect(page.getByTestId("da-xem")).toHaveText("2/3 đã xem");
  });

  test("TK, HP có mục Nhận giấy tờ", async ({ page }) => {
    for (const u of ["tk.levankhoa", "hp.tranthiphuong"]) {
      await dangNhap(page, u);
      await expect(page).toHaveURL("/giay-to");
      await expect(page.getByRole("heading", { name: "Nhận giấy tờ" })).toBeVisible();
    }
  });
});
