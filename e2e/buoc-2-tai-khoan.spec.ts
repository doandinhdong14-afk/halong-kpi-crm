import { test, expect, type Page } from "@playwright/test";
import { dangNhap, resetDb, sql } from "./helpers";

test.beforeAll(async () => resetDb());

function dong(page: Page, username: string) {
  return page.locator(`tr[data-username="${username}"]`);
}

async function chonChucVu(page: Page, ten: string) {
  await page.getByLabel("Chức vụ", { exact: true }).click();
  await page.getByRole("option", { name: ten, exact: true }).click();
}

test.describe.serial("Admin – Quản lý đăng nhập", () => {
  test.beforeEach(async ({ page }) => {
    await dangNhap(page, "admin.quantri");
  });

  test("bảng đúng cột, hiện 8 tài khoản seed với mật khẩu 123456", async ({ page }) => {
    await expect(page.locator("thead")).toContainText("Tên đăng nhập");
    await expect(page.locator("thead")).toContainText("Chức vụ");
    await expect(page.locator("thead")).toContainText("Tên người");
    await expect(page.locator("thead")).toContainText("Mật khẩu");
    await expect(page.locator("tbody tr")).toHaveCount(8);
    await expect(dong(page, "gv.nguyenvanan")).toContainText("123456");
  });

  test("thêm GV → xem trước và tạo tên đăng nhập, trùng tên → hậu tố 2", async ({ page }) => {
    await page.getByRole("button", { name: "Thêm tài khoản" }).click();
    await page.getByLabel("Họ tên").fill("Nguyễn Văn Nam");
    await expect(page.getByTestId("xem-truoc-username")).toHaveText("gv.nguyenvannam");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.getByText("Đã tạo tài khoản gv.nguyenvannam")).toBeVisible();
    await expect(dong(page, "gv.nguyenvannam")).toBeVisible();

    await page.getByRole("button", { name: "Thêm tài khoản" }).click();
    await page.getByLabel("Họ tên").fill("Nguyễn Văn Nam");
    await expect(page.getByTestId("xem-truoc-username")).toHaveText("gv.nguyenvannam2");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(dong(page, "gv.nguyenvannam2")).toBeVisible();
  });

  test("tạo tài khoản mọi cấp: tiền tố theo chức vụ", async ({ page }) => {
    await page.getByRole("button", { name: "Thêm tài khoản" }).click();
    await page.getByLabel("Họ tên").fill("Đỗ Thị Đào");
    await chonChucVu(page, "Trưởng khoa");
    await expect(page.getByTestId("xem-truoc-username")).toHaveText("tk.dothidao");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(dong(page, "tk.dothidao")).toContainText("Trưởng khoa");
  });

  test("lên chức GV → TBM: đổi tiền tố, đăng nhập bằng tên mới được", async ({ page }) => {
    await dong(page, "gv.nguyenvannam2").getByRole("button", { name: "Sửa" }).click();
    await chonChucVu(page, "Trưởng bộ môn");
    // gv.nguyenvannam2 → tbm.nguyenvannam (hậu tố tính lại từ đầu)
    await expect(page.getByTestId("xem-truoc-username")).toHaveText("tbm.nguyenvannam");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.getByText("Tên đăng nhập mới: tbm.nguyenvannam")).toBeVisible();
    await expect(dong(page, "tbm.nguyenvannam")).toContainText("Trưởng bộ môn");
    await expect(dong(page, "gv.nguyenvannam2")).toHaveCount(0);

    await dangNhap(page, "tbm.nguyenvannam");
    await expect(page).toHaveURL("/tbm/duyet-dang-ky");
  });

  test("đổi họ tên → sinh lại tên đăng nhập", async ({ page }) => {
    await dong(page, "gv.nguyenvannam").getByRole("button", { name: "Sửa" }).click();
    await page.getByLabel("Họ tên").fill("Nguyễn Văn Nam Anh");
    await expect(page.getByTestId("xem-truoc-username")).toHaveText("gv.nguyenvannamanh");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(dong(page, "gv.nguyenvannamanh")).toContainText("Nguyễn Văn Nam Anh");
  });

  test("đặt lại mật khẩu về 123456", async ({ page }) => {
    await sql(`UPDATE "User" SET "isDefaultPassword" = false WHERE username = 'tk.dothidao'`);
    await page.reload();
    await expect(dong(page, "tk.dothidao")).toContainText("••••••");
    await dong(page, "tk.dothidao").getByRole("button", { name: "Sửa" }).click();
    await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();
    await expect(page.getByText("Đã đặt lại mật khẩu của tk.dothidao về 123456.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dong(page, "tk.dothidao")).toContainText("123456");
  });

  test("tìm kiếm theo tên, lọc theo chức vụ", async ({ page }) => {
    await page.getByLabel("Tìm kiếm").fill("Bình");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(dong(page, "gv.tranthibinh")).toBeVisible();
    await page.getByLabel("Tìm kiếm").fill("");
    await page.getByLabel("Lọc theo chức vụ").click();
    await page.getByRole("option", { name: "Giáo viên", exact: true }).click();
    await expect(page).toHaveURL(/chucVu=GV/);
    await expect(page.locator("tbody tr")).toHaveCount(4); // 3 seed + gv.nguyenvannamanh
  });

  test("xóa có hộp xác nhận đúng câu cảnh báo", async ({ page }) => {
    await dong(page, "tk.dothidao").getByRole("button", { name: "Xóa" }).click();
    await expect(page.getByText("Xóa sẽ mất toàn bộ dữ liệu KPI của tài khoản này")).toBeVisible();
    await page.getByRole("button", { name: "Xóa hẳn" }).click();
    await expect(dong(page, "tk.dothidao")).toHaveCount(0);
  });

  test("admin không tự xóa / tự hạ chức được (server chặn: tests/tai-khoan.int.test.ts)", async ({ page }) => {
    const self = dong(page, "admin.quantri");
    await expect(self.getByRole("button", { name: "Xóa" })).toBeDisabled();
    await self.getByRole("button", { name: "Sửa" }).click();
    await expect(page.getByLabel("Chức vụ", { exact: true })).toBeDisabled();
  });
});
