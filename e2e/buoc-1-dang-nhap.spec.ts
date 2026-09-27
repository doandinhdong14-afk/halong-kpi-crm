import { test, expect } from "@playwright/test";
import { dangNhap, menu, resetDb } from "./helpers";

test.beforeAll(async () => resetDb());

const TAI_KHOAN: [string, string, string[]][] = [
  ["admin.quantri", "/admin/tai-khoan", ["Quản lý đăng nhập", "Phân việc đầu kỳ", "Nhận chỉ thị của hiệu trưởng", "Xem cấu hình"]],
  ["ht.nguyenvanhieu", "/ht/ban-hanh", ["Ban hành giấy tờ", "Đã ban hành"]],
  ["hp.tranthiphuong", "/giay-to", ["Nhận giấy tờ", "Đang phát triển"]],
  ["tk.levankhoa", "/giay-to", ["Nhận giấy tờ", "Đang phát triển"]],
  ["tbm.phamthibich", "/tbm/duyet-dang-ky", ["Duyệt đăng ký", "Duyệt task", "Duyệt xin thêm task", "Kết quả kỳ", "Nhận giấy tờ"]],
  ["gv.nguyenvanan", "/gv/dau-ky", ["Đầu kỳ", "Cuối kỳ", "Nhận giấy tờ"]],
  ["gv.tranthibinh", "/gv/dau-ky", ["Đầu kỳ", "Cuối kỳ", "Nhận giấy tờ"]],
  ["gv.levancuong", "/gv/dau-ky", ["Đầu kỳ", "Cuối kỳ", "Nhận giấy tờ"]],
];

for (const [username, home, items] of TAI_KHOAN) {
  test(`${username} đăng nhập, thấy đúng menu`, async ({ page }) => {
    await dangNhap(page, username);
    await expect(page).toHaveURL(home);
    expect(await menu(page)).toEqual(items);
    await expect(page.locator("header")).toContainText(username);
  });
}

test("chưa đăng nhập → chuyển về trang đăng nhập", async ({ page }) => {
  await page.goto("/admin/tai-khoan");
  await expect(page).toHaveURL(/\/dang-nhap$/);
});

test("sai mật khẩu → báo lỗi tiếng Việt", async ({ page }) => {
  await page.goto("/dang-nhap");
  await page.getByLabel("Tên đăng nhập").fill("gv.nguyenvanan");
  await page.getByLabel("Mật khẩu").fill("sai");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByText("Tên đăng nhập hoặc mật khẩu không đúng.")).toBeVisible();
});

test("GV mở trang của admin/TBM → bị chặn", async ({ page }) => {
  await dangNhap(page, "gv.nguyenvanan");
  for (const url of ["/admin/tai-khoan", "/tbm/duyet-dang-ky", "/ht/ban-hanh", "/dang-phat-trien"]) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/khong-co-quyen$/);
  }
});

test("đăng xuất", async ({ page }) => {
  await dangNhap(page, "tbm.phamthibich");
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await page.goto("/tbm/duyet-dang-ky");
  await expect(page).toHaveURL(/\/dang-nhap$/);
});
