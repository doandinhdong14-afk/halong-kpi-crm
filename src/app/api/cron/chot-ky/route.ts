// Railway Cron gọi mỗi ngày 00:05 giờ VN (lịch UTC "5 17 * * *"):
//   POST /api/cron/chot-ky   header: Authorization: Bearer <CRON_SECRET>
// Chốt mọi kỳ đã quá deadline và gửi nhắc hạn (mục 10).
import { timingSafeEqual } from "node:crypto";
import { xuLyApi, LoiNghiepVu } from "@/lib/loi";
import { chotCacKyQuaHan } from "@/lib/services/chot-ky";
import { guiNhacHan } from "@/lib/services/nhac-han";

function dungSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const gui = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(gui);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  return xuLyApi(async () => {
    if (!dungSecret(req)) throw new LoiNghiepVu("Sai CRON_SECRET.", 401);
    const daChot = await chotCacKyQuaHan();
    const nhacHan = await guiNhacHan();
    return Response.json({ ok: true, daChot, nhacHan });
  });
}
