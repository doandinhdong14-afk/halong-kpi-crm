import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Thư viện xuất báo cáo chạy thẳng từ node_modules (không đóng gói), đọc font ở assets/fonts.
  serverExternalPackages: ["pdfmake", "exceljs"],
};

export default nextConfig;
