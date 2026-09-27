// Service Cron trên Railway chạy script này theo lịch "5 17 * * *" (UTC) = 00:05 giờ Việt Nam.
// Gọi endpoint của app để chốt kỳ quá hạn + gửi nhắc hạn, rồi thoát.
// Biến môi trường: APP_URL (vd https://crm-kpi.up.railway.app), CRON_SECRET (giống app).
const appUrl = process.env.APP_URL?.replace(/\/$/, "");
const secret = process.env.CRON_SECRET;
if (!appUrl || !secret) {
  console.error("Thiếu APP_URL hoặc CRON_SECRET");
  process.exit(1);
}

const res = await fetch(`${appUrl}/api/cron/chot-ky`, {
  method: "POST",
  headers: { authorization: `Bearer ${secret}` },
});
const body = await res.text();
console.log(new Date().toISOString(), res.status, body);
process.exit(res.ok ? 0 : 1);
