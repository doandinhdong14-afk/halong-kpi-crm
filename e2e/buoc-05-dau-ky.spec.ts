import { test, expect, type Page } from "@playwright/test";
import { dangNhap, resetDb } from "./helpers";

test.beforeAll(async () => resetDb());

async function dangKy(page: Page, username: string, nhiemVus: string[], nutGui: string) {
  await dangNhap(page, username);
  await page.goto("/dau-ky");
  for (const nv of nhiemVus) {
    await page.getByLabel(`Chọn ${nv}`).check();
  }
  await expect(page.getByTestId("so-nhiem-vu")).toHaveText(String(nhiemVus.length));
  await page.getByRole("button", { name: nutGui }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Gửi" }).click();
  await expect(page.getByTestId("banner-trang-thai")).toContainText("Chờ duyệt");
}

async function duyet(page: Page, username: string, nguoiLam: string, tongDiem: string, xepLoai: string) {
  await dangNhap(page, username);
  await page.goto("/duyet");
  await expect(page.locator('[data-o-dem="dang-ky"]')).toContainText("1");
  await page.locator(`tr[data-nguoi="${nguoiLam}"]`).getByRole("link", { name: "Xem" }).click();
  await expect(page.getByTestId("tong-diem")).toHaveText(tongDiem);
  await expect(page.getByTestId("xep-loai")).toHaveText(xepLoai);
  await page.getByRole("button", { name: "Duyệt" }).click();
  await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
  await expect(page.getByText("Đã duyệt danh sách. Các task bắt buộc đã được giao.")).toBeVisible();
}

test("GV: chỉ thấy nhiệm vụ GV, thanh tổng kết cập nhật khi tick", async ({ page }) => {
  await dangNhap(page, "gv.nguyenvanan");
  await page.goto("/dau-ky");
  await expect(page.locator("[data-nhiem-vu]")).toHaveCount(10);
  await expect(page.locator('[data-nhiem-vu="Quản lý đào tạo của khoa"]')).toHaveCount(0);
  await page.getByLabel("Chọn Biên soạn bài giảng").check();
  await page.getByLabel("Chọn Hướng dẫn sinh viên NCKH").check();
  await expect(page.getByTestId("tong-diem")).toHaveText("27");
  await expect(page.getByTestId("xep-loai")).toHaveText("D");
  await expect(page.getByRole("button", { name: "Gửi lên trưởng bộ môn" })).toBeEnabled();
});

test("GV đăng ký → TBM duyệt", async ({ page }) => {
  await dangKy(page, "gv.tranthibinh", ["Biên soạn bài giảng", "Hướng dẫn sinh viên NCKH", "Công bố bài báo khoa học"], "Gửi lên trưởng bộ môn");
  await duyet(page, "tbm.phamthibich", "gv.tranthibinh", "39", "C");
  await dangNhap(page, "gv.tranthibinh");
  await page.goto("/dau-ky");
  await expect(page.getByTestId("banner-trang-thai")).toContainText("Đã duyệt");
});

test("TBM đăng ký → TK duyệt (TK chỉ thấy TBM trong màn hình Duyệt)", async ({ page }) => {
  await dangKy(
    page,
    "tbm.phamthibich",
    ["Quản lý chương trình đào tạo của bộ môn", "Phân công và giám sát giảng dạy", "Sinh hoạt chuyên môn bộ môn"],
    "Gửi lên trưởng khoa",
  );
  await dangNhap(page, "tk.levankhoa");
  await page.goto("/duyet");
  await expect(page.getByRole("heading", { name: "Duyệt trưởng bộ môn" })).toBeVisible();
  await expect(page.locator("tr[data-nguoi]")).toHaveCount(1);
  await duyet(page, "tk.levankhoa", "tbm.phamthibich", "55", "B");
});

test("TK đăng ký → HP duyệt; HP đăng ký → HT duyệt", async ({ page }) => {
  await dangKy(
    page,
    "tk.levankhoa",
    ["Quản lý đào tạo của khoa", "Kiểm định chất lượng chương trình", "Hợp tác doanh nghiệp", "Công tác sinh viên của khoa"],
    "Gửi lên hiệu phó",
  );
  await duyet(page, "hp.tranthiphuong", "tk.levankhoa", "80", "A1");

  await dangKy(page, "hp.tranthiphuong", ["Chỉ đạo công tác đào tạo", "Chỉ đạo nghiên cứu khoa học", "Đảm bảo chất lượng"], "Gửi lên hiệu trưởng");
  await dangNhap(page, "ht.nguyenvanhieu");
  await page.goto("/duyet");
  await expect(page.getByRole("heading", { name: "Duyệt & chốt hiệu phó" })).toBeVisible();
  await duyet(page, "ht.nguyenvanhieu", "hp.tranthiphuong", "60", "B");
});

test("từ chối bắt buộc nhận xét; người làm KPI thấy nhận xét và gửi lại được", async ({ page }) => {
  await dangKy(page, "gv.levancuong", ["Cố vấn học tập"], "Gửi lên trưởng bộ môn");
  await dangNhap(page, "tbm.phamthibich");
  await page.goto("/duyet");
  await page.locator('tr[data-nguoi="gv.levancuong"]').getByRole("link", { name: "Xem" }).click();
  await page.getByRole("button", { name: "Từ chối" }).click();
  await expect(page.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await page.getByLabel("Nhận xét").fill("Cần chọn thêm nhiệm vụ.");
  await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(page.getByText("Đã từ chối danh sách.")).toBeVisible();

  await dangNhap(page, "gv.levancuong");
  await page.goto("/dau-ky");
  await expect(page.getByTestId("nhan-xet")).toHaveText("Cần chọn thêm nhiệm vụ.");
  await expect(page.getByTestId("banner-trang-thai")).toContainText("Nhận xét của trưởng bộ môn");
  await page.getByLabel("Chọn Biên soạn bài giảng").check();
  await page.getByRole("button", { name: "Gửi lên trưởng bộ môn" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Gửi" }).click();
  await expect(page.getByTestId("banner-trang-thai")).toContainText("Chờ duyệt");
});

test("người không phải người duyệt mở trang chi tiết → 404", async ({ page }) => {
  await dangNhap(page, "tbm.phamthibich");
  await page.goto("/duyet");
  const href = await page.locator('tr[data-nguoi="gv.nguyenvanan"]').getByRole("link", { name: "Xem" }).getAttribute("href");
  await dangNhap(page, "tk.levankhoa");
  const res = await page.goto(href!);
  expect(res?.status()).toBe(404);
});
