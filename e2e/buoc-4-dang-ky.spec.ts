import { test, expect, type Page } from "@playwright/test";
import { dangNhap, resetDb, sql } from "./helpers";

test.beforeAll(async () => resetDb());

async function tick(page: Page, tenNhiemVu: string) {
  await page.getByRole("checkbox", { name: `Chọn ${tenNhiemVu}` }).click();
}

async function gui(page: Page) {
  await page.getByRole("button", { name: "Gửi lên trưởng bộ môn" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Gửi" }).click();
}

test.describe.serial("GV Đầu kỳ + TBM Duyệt đăng ký", () => {
  test("GV chọn nhiệm vụ: thanh tổng kết cập nhật ngay, tự lưu, gửi", async ({ page }) => {
    await dangNhap(page, "gv.tranthibinh");
    await expect(page.getByText("Kỳ 1 – 2026-2027").first()).toBeVisible();
    await expect(page.getByTestId("dem-nguoc")).toContainText("Còn lại đến hạn đăng ký");
    await expect(page.getByTestId("banner-trang-thai")).toContainText("Nháp");
    await expect(page.getByRole("button", { name: "Gửi lên trưởng bộ môn" })).toBeDisabled();

    await tick(page, "Biên soạn bài giảng");
    await tick(page, "Hướng dẫn sinh viên NCKH");
    await tick(page, "Công bố bài báo khoa học");
    await expect(page.getByTestId("so-nhiem-vu")).toHaveText("3");
    await expect(page.getByTestId("tong-diem")).toHaveText("39");
    await expect(page.getByTestId("xep-loai")).toHaveText("C");

    // Tự lưu: tải lại trang vẫn còn.
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByTestId("tong-diem")).toHaveText("39");

    await gui(page);
    await expect(page.getByText("Đã gửi danh sách (39 điểm, xếp loại C).")).toBeVisible();
    await expect(page.getByTestId("banner-trang-thai")).toContainText("Chờ duyệt");
    await expect(page.getByRole("checkbox", { name: "Chọn Biên soạn bài giảng" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Gửi lên trưởng bộ môn" })).toHaveCount(0);
  });

  test("TBM thấy danh sách chờ duyệt, từ chối kèm nhận xét", async ({ page }) => {
    await dangNhap(page, "tbm.phamthibich");
    const dong = page.getByRole("row", { name: /Trần Thị Bình/ });
    await expect(dong).toContainText("39");
    await expect(dong).toContainText("Chờ duyệt");
    await dong.getByRole("link", { name: "Xem" }).click();
    await expect(page.getByTestId("tong-diem")).toHaveText("39");
    await expect(page.getByTestId("xep-loai")).toHaveText("C");
    await expect(page.locator("[data-nhiem-vu]")).toHaveCount(3);

    await page.getByRole("button", { name: "Từ chối" }).click();
    await expect(page.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
    await page.getByLabel("Nhận xét").fill("Cần chọn thêm nhiệm vụ Coi thi, chấm thi.");
    await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
    await expect(page.getByText("Đã từ chối danh sách.")).toBeVisible();
    await expect(page.getByText("Bị từ chối").first()).toBeVisible();
  });

  test("sau ngày bắt đầu: GV bị từ chối vẫn sửa + gửi lại được", async ({ page }) => {
    // Ngày bắt đầu = hôm qua → hạn đăng ký đã qua.
    await sql(`UPDATE "Ky" SET "ngayBatDau" = "ngayBatDau" - 1`);
    await dangNhap(page, "gv.tranthibinh");
    await expect(page.getByTestId("banner-trang-thai")).toContainText("Bị từ chối");
    await expect(page.getByTestId("nhan-xet")).toHaveText("Cần chọn thêm nhiệm vụ Coi thi, chấm thi.");
    await expect(page.getByTestId("dem-nguoc")).toContainText("Còn lại đến deadline");

    await tick(page, "Coi thi, chấm thi");
    await expect(page.getByTestId("tong-diem")).toHaveText("47");
    await gui(page);
    await expect(page.getByText("Đã gửi danh sách (47 điểm, xếp loại C).")).toBeVisible();
  });

  test("GV chưa gửi, đã qua hạn đăng ký → khóa", async ({ page }) => {
    await dangNhap(page, "gv.nguyenvanan");
    await expect(page.getByTestId("banner-trang-thai")).toContainText("Đã hết hạn đăng ký");
    await expect(page.getByRole("checkbox", { name: "Chọn Biên soạn bài giảng" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Gửi lên trưởng bộ môn" })).toHaveCount(0);
  });

  test("TBM duyệt → GV thấy Đã duyệt, khóa, có task bắt buộc", async ({ page }) => {
    await dangNhap(page, "tbm.phamthibich");
    await page.getByRole("row", { name: /Trần Thị Bình/ }).getByRole("link", { name: "Xem" }).click();
    await page.getByRole("button", { name: "Duyệt" }).click();
    await page.getByRole("button", { name: "Xác nhận duyệt" }).click();
    await expect(page.getByText("Đã duyệt danh sách.")).toBeVisible();

    const soTask = await sql<{ n: string }>(
      `SELECT count(*) AS n FROM "GvTask" g JOIN "User" u ON u.id = g."gvId" WHERE u.username = 'gv.tranthibinh'`,
    );
    expect(Number(soTask[0].n)).toBe(10); // task bắt buộc: NV1 (3) + NV2 (2) + NV3 (2) + NV8 (3)

    await dangNhap(page, "gv.tranthibinh");
    await expect(page.getByTestId("banner-trang-thai")).toContainText("Đã duyệt");
    await expect(page.getByTestId("banner-trang-thai")).toContainText("C");
    await expect(page.getByRole("checkbox", { name: "Chọn Biên soạn bài giảng" })).toBeDisabled();
  });
});
