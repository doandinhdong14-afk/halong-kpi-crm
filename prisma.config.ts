import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Không dùng env() (bắt buộc) để `prisma generate` lúc build chạy được khi chưa có DATABASE_URL
    // (vd service cron trên Railway). Lệnh migrate vẫn cần DATABASE_URL.
    url: process.env.DATABASE_URL ?? "",
  },
});
