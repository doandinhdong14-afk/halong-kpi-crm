import { test, expect } from "@playwright/test";
import { dangNhap, resetDb } from "./helpers";

test.beforeAll(async () => resetDb());

test.describe.serial("Admin Xem cấu hình + Thông báo", () => {
  test("chuông: GV gửi đăng ký → TBM thấy số chưa đọc, bấm → tới trang duyệt", async ({ page }) => {
    await dangNhap(page, "gv.tranthibinh");
    await page.getByRole("checkbox", { name: "Chọn Biên soạn bài giảng" }).click();
    await expect(page.getByRole("button", { name: "Gửi lên trưởng bộ môn" })).toBeEnabled();
    await page.getByRole("button", { name: "Gửi lên trưởng bộ môn" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Gửi" }).click();
    await expect(page.getByTestId("banner-trang-thai")).toContainText("Chờ duyệt");

    await dangNhap(page, "tbm.phamthibich");
    await expect(page.getByTestId("so-chua-doc")).toHaveText("1");
    await page.getByRole("button", { name: "Thông báo" }).click();
    const tb = page.locator("[data-thong-bao]").first();
    await expect(tb).toContainText("Trần Thị Bình đã gửi danh sách đăng ký nhiệm vụ");
    await tb.click();
    await expect(page).toHaveURL(/\/tbm\/duyet-dang-ky\/.+/);
    await expect(page.getByTestId("so-chua-doc")).toHaveCount(0);

    // Duyệt → GV nhận thông báo.
    await page.getByRole("button", { name: "Duyệt" }).click();
    await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
    await expect(page.getByText("Đã duyệt danh sách.")).toBeVisible();
    await dangNhap(page, "gv.tranthibinh");
    await expect(page.getByTestId("so-chua-doc")).toHaveText("1");
    await page.getByRole("button", { name: "Thông báo" }).click();
    await page.locator("[data-thong-bao]").first().click();
    await expect(page).toHaveURL(/\/gv\/cuoi-ky\?kyId=/);
  });

  test("admin: 6 tab chỉ xem, không có nút sửa/xóa", async ({ page }) => {
    await dangNhap(page, "admin.quantri");
    await page.goto("/admin/cau-hinh");
    const tabs = ["Kỳ và bảng xếp loại", "Tài khoản", "Đăng ký nhiệm vụ", "Tiến độ & minh chứng", "Kết quả các kỳ", "Giấy tờ đã ban hành"];
    for (const t of tabs) {
      await page.getByRole("link", { name: t }).click();
      await expect(page.getByRole("link", { name: t })).toHaveAttribute("aria-current", "page");
      await expect(page.locator("main").getByRole("button", { name: /Sửa|Xóa|Duyệt|Lưu|Gửi|Thêm/ })).toHaveCount(0);
    }
  });

  test("admin: tab Kỳ, Đăng ký, Tiến độ hiển thị đúng dữ liệu", async ({ page }) => {
    await dangNhap(page, "admin.quantri");
    await page.goto("/admin/cau-hinh?tab=ky");
    await expect(page.getByRole("row", { name: /Kỳ 1 – 2026-2027/ })).toContainText("A1 ≥ 80");

    await page.getByRole("link", { name: "Đăng ký nhiệm vụ" }).click();
    await expect(page.locator('[data-gv="gv.tranthibinh"]')).toContainText("Đã duyệt");
    await expect(page.locator('[data-gv="gv.nguyenvanan"]')).toContainText("Chưa đăng ký");

    await page.getByRole("link", { name: "Tiến độ & minh chứng" }).click();
    await expect(page.locator('[data-gv="gv.tranthibinh"]')).toContainText("0%");
    await page.locator('[data-gv="gv.tranthibinh"]').getByRole("link", { name: "Minh chứng" }).click();
    await expect(page.getByRole("heading", { name: "Tiến độ của Trần Thị Bình" })).toBeVisible();
    await expect(page.locator("[data-task]")).toHaveCount(3);
    await expect(page.getByRole("button", { name: /Gửi|Lưu|Duyệt/ })).toHaveCount(0);

    await page.goto("/admin/cau-hinh?tab=ket-qua");
    await expect(page.getByText("Kỳ chưa chốt.")).toBeVisible();
  });

  test("GV không truy cập được Xem cấu hình", async ({ page }) => {
    await dangNhap(page, "gv.nguyenvanan");
    await page.goto("/admin/cau-hinh");
    await expect(page).toHaveURL(/khong-co-quyen/);
  });
});
