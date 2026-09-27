import { execSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";
import "dotenv/config";
import pg from "pg";

/** Chạy SQL trực tiếp (chỉnh dữ liệu cho kịch bản test). */
export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return (await c.query(text, params)).rows as T[];
  } finally {
    await c.end();
  }
}

/** Dọn sạch DB test (chỉ localhost, tên kết thúc _test), áp migration, seed lại. */
export async function resetDb() {
  const url = new URL(process.env.DATABASE_URL!);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) {
    throw new Error('resetDb chỉ chạy trên DB test cục bộ: ' + url.hostname + url.pathname);
  }
  execSync('npx prisma migrate deploy', { stdio: 'ignore' });
  const bang = await sql<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
  );
  await sql('TRUNCATE ' + bang.map((b) => '"' + b.tablename + '"').join(', ') + ' CASCADE');
  execSync('npx tsx prisma/seed.ts', { stdio: 'ignore' });
}

export async function dangNhap(page: Page, username: string, matKhau = "123456") {
  await page.context().clearCookies();
  await page.goto("/dang-nhap");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu").fill(matKhau);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/dang-nhap/);
}

/** Danh sách nhãn menu bên trái. */
export async function menu(page: Page): Promise<string[]> {
  return page.locator("aside nav a").allInnerTexts();
}
