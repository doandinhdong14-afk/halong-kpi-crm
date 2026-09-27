import { test, expect, type Page } from "@playwright/test";
import { dangNhap, resetDb } from "./helpers";

test.beforeAll(async () => resetDb());

async function xuat(page: Page, nut: "Xuất Excel" | "Xuất PDF") {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: nut }).click()]);
  return dl;
}

test("TBM: chỉ có chức vụ Giáo viên, xuất Excel tạm tính", async ({ page }) => {
  await dangNhap(page, "tbm.phamthibich");
  await page.goto("/bao-cao");
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByLabel("Giáo viên")).toBeChecked();
  await expect(page.getByTestId("tam-tinh")).toContainText("TẠM TÍNH");
  const dl = await xuat(page, "Xuất Excel");
  expect(dl.suggestedFilename()).toMatch(/^BaoCao_BoMonKhoaHocMayTinh_Ky1-2026-2027_\d{8}_TamTinh\.xlsx$/);
});

test("HT: đủ 4 chức vụ, xuất PDF toàn trường; bỏ hết chức vụ thì không xuất được", async ({ page }) => {
  await dangNhap(page, "ht.nguyenvanhieu");
  await page.goto("/bao-cao");
  await expect(page.getByRole("checkbox")).toHaveCount(4);
  const dl = await xuat(page, "Xuất PDF");
  expect(dl.suggestedFilename()).toMatch(/^BaoCao_ToanTruong_Ky1-2026-2027_\d{8}_TamTinh\.pdf$/);
  await dl.saveAs("test-results/bao-cao-mau/ht-toan-truong.pdf");

  for (const v of ["Giáo viên", "Trưởng bộ môn", "Trưởng khoa", "Hiệu phó"]) await page.getByLabel(v).uncheck();
  await expect(page.getByText("Chọn ít nhất 1 chức vụ.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xuất PDF" })).toBeDisabled();
});

test("HP: xuất PDF 1 người", async ({ page }) => {
  await dangNhap(page, "hp.tranthiphuong");
  await page.goto("/bao-cao");
  await expect(page.getByRole("checkbox")).toHaveCount(3);
  await page.getByLabel("1 người").check();
  await page.getByLabel("Chọn người").click();
  await page.getByRole("option", { name: /Lê Văn Khoa/ }).click();
  const dl = await xuat(page, "Xuất PDF");
  expect(dl.suggestedFilename()).toMatch(/^BaoCao_KhoaCongNgheThongTin_Ky1-2026-2027_\d{8}_TamTinh\.pdf$/);
  await dl.saveAs("test-results/bao-cao-mau/hp-mot-nguoi.pdf");
});
