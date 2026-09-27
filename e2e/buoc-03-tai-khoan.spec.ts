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

test("bảng tài khoản: đủ cột, đơn vị, mật khẩu mặc định; tìm và lọc", async ({ page }) => {
  await dangNhap(page, "admin.quantri");
  await expect(page.locator("thead th")).toHaveText(["Tên đăng nhập", "Chức vụ", "Tên người", "Mật khẩu", "Sửa"]);
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await expect(dong(page, "gv.nguyenvanan")).toContainText("123456");
  await expect(dong(page, "gv.nguyenvanan").getByTestId("don-vi")).toHaveText("Bộ môn Khoa học máy tính");
  await expect(dong(page, "tk.levankhoa").getByTestId("don-vi")).toHaveText("Khoa Công nghệ thông tin");
  await expect(dong(page, "hp.tranthiphuong").getByTestId("don-vi")).toHaveText("Phụ trách: Khoa Công nghệ thông tin");

  await page.getByLabel("Tìm kiếm").fill("bình");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(dong(page, "gv.tranthibinh")).toBeVisible();
  await page.getByLabel("Tìm kiếm").fill("");
  await page.getByLabel("Lọc theo chức vụ").click();
  await page.getByRole("option", { name: "Giáo viên" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
});

test("thêm GV trùng tên → xem trước và tạo gv.nguyenvanan2", async ({ page }) => {
  await dangNhap(page, "admin.quantri");
  await page.getByRole("button", { name: "Thêm tài khoản" }).click();
  await page.getByLabel("Họ tên").fill("Nguyễn Văn An");
  await expect(page.getByTestId("xem-truoc-username")).toHaveText("gv.nguyenvanan2");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã tạo tài khoản gv.nguyenvanan2 (mật khẩu 123456).")).toBeVisible();
  await expect(dong(page, "gv.nguyenvanan2")).toBeVisible();
});

test("lên chức TBM khi bộ môn đã có TBM → báo lỗi; hạ TBM trước → lên được", async ({ page }) => {
  await dangNhap(page, "admin.quantri");
  await dong(page, "gv.tranthibinh").getByRole("button", { name: "Sửa" }).click();
  await chonChucVu(page, "Trưởng bộ môn");
  await expect(page.getByTestId("xem-truoc-username")).toHaveText("tbm.tranthibinh");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Bộ môn này đã có trưởng bộ môn (tbm.phamthibich). Hãy đổi chức vụ người đó trước.")).toBeVisible();
  await page.keyboard.press("Escape");

  await dong(page, "tbm.phamthibich").getByRole("button", { name: "Sửa" }).click();
  await chonChucVu(page, "Giáo viên");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã lưu. Tên đăng nhập mới: gv.phamthibich")).toBeVisible();

  await dong(page, "gv.tranthibinh").getByRole("button", { name: "Sửa" }).click();
  await chonChucVu(page, "Trưởng bộ môn");
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã lưu. Tên đăng nhập mới: tbm.tranthibinh")).toBeVisible();
  await expect(dong(page, "tbm.tranthibinh")).toBeVisible();
});

test("đặt lại mật khẩu về 123456", async ({ page }) => {
  await sql(`UPDATE "User" SET "isDefaultPassword" = false WHERE username = 'gv.levancuong'`);
  await dangNhap(page, "admin.quantri");
  await expect(dong(page, "gv.levancuong")).toContainText("••••••");
  await dong(page, "gv.levancuong").getByRole("button", { name: "Sửa" }).click();
  await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();
  await expect(page.getByText("Đã đặt lại mật khẩu của gv.levancuong về 123456.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dong(page, "gv.levancuong")).toContainText("123456");
});

test("xóa hiệu phó → tạo hiệu phó mới, chọn khoa phụ trách", async ({ page }) => {
  await dangNhap(page, "admin.quantri");
  await dong(page, "hp.tranthiphuong").getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Xóa sẽ mất toàn bộ dữ liệu KPI của tài khoản này.")).toBeVisible();
  await page.getByRole("button", { name: "Xóa hẳn" }).click();
  await expect(page.getByText("Đã xóa tài khoản hp.tranthiphuong.")).toBeVisible();
  await expect(dong(page, "hp.tranthiphuong")).toHaveCount(0);

  await page.getByRole("button", { name: "Thêm tài khoản" }).click();
  await page.getByLabel("Họ tên").fill("Đỗ Minh Đức");
  await chonChucVu(page, "Hiệu phó");
  await expect(page.getByTestId("xem-truoc-username")).toHaveText("hp.dominhduc");
  await page.getByLabel("Phụ trách Khoa Công nghệ thông tin").check();
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByText("Đã tạo tài khoản hp.dominhduc (mật khẩu 123456).")).toBeVisible();
  await expect(dong(page, "hp.dominhduc").getByTestId("don-vi")).toHaveText("Phụ trách: Khoa Công nghệ thông tin");

  // Khoa đã có hiệu phó → không còn trong danh sách chọn của hiệu phó khác.
  await page.getByRole("button", { name: "Thêm tài khoản" }).click();
  await chonChucVu(page, "Hiệu phó");
  await expect(page.getByTestId("khoa-phu-trach")).toContainText("Không còn khoa nào chưa có hiệu phó.");
  await expect(page.getByTestId("khoa-phu-trach")).toContainText("Khoa Công nghệ thông tin (hp.dominhduc)");
});

test("admin không tự xóa, không tự đổi chức vụ", async ({ page }) => {
  await dangNhap(page, "admin.quantri");
  await expect(dong(page, "admin.quantri").getByRole("button", { name: "Xóa" })).toBeDisabled();
  await dong(page, "admin.quantri").getByRole("button", { name: "Sửa" }).click();
  await expect(page.getByLabel("Chức vụ", { exact: true })).toBeDisabled();
});
