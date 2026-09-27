import type { Ky } from "@/generated/prisma/client";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { NHAN_DANG_KY, NHAN_LOAI_TASK } from "@/lib/nhan";
import { lyDoKhongDuyetDangKy } from "@/lib/rules";
import { deadline, hienNgayGio } from "@/lib/time";
import { NutDuyetDangKy } from "./nut-duyet-dang-ky";

/** Tab Đăng ký nhiệm vụ: các nhiệm vụ đã chọn, tổng điểm, xếp loại → Duyệt / Từ chối (bắt buộc nhận xét). */
export async function TabDangKy({ ky, userId }: { ky: Ky; userId: string }) {
  const dk = await db.dangKy.findUnique({
    where: { kyId_userId: { kyId: ky.id, userId } },
    include: {
      nhiemVus: {
        include: {
          nhiemVu: {
            include: { tasks: { orderBy: [{ thuTu: "asc" }, { ten: "asc" }], select: { id: true, ten: true, loai: true } } },
          },
        },
        orderBy: { nhiemVu: { thuTu: "asc" } },
      },
    },
  });

  if (!dk || dk.trangThai === "NHAP") {
    return (
      <p className="text-muted-foreground" data-testid="chua-gui-dang-ky">
        Chưa gửi danh sách đăng ký trong kỳ này.
      </p>
    );
  }

  const lyDo = dk.trangThai === "CHO_DUYET" ? lyDoKhongDuyetDangKy(ky) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Trạng thái</div>
            <BadgeTrangThai trangThai={dk.trangThai} nhan={NHAN_DANG_KY[dk.trangThai]} laDangKy />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Số nhiệm vụ</div>
            <div className="font-semibold">{dk.nhiemVus.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng điểm</div>
            <div className="font-semibold" data-testid="tong-diem">
              {dk.tongDiem}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Xếp loại đăng ký</div>
            <div className="font-semibold" data-testid="xep-loai">
              {dk.xepLoai}
            </div>
          </div>
          {dk.nopLuc && (
            <div>
              <div className="text-xs text-muted-foreground">Gửi lúc</div>
              <div>{hienNgayGio(dk.nopLuc)}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted-foreground">Hạn duyệt</div>
            <div>{hienNgayGio(deadline(ky))}</div>
          </div>
          {dk.nhanXet && (
            <div className="basis-full text-sm">
              <span className="text-muted-foreground">Nhận xét: </span>
              {dk.nhanXet}
            </div>
          )}
          <div className="ml-auto">
            {dk.trangThai === "CHO_DUYET" &&
              (lyDo ? <p className="text-sm text-destructive">{lyDo}</p> : <NutDuyetDangKy dangKyId={dk.id} />)}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {dk.nhiemVus.map(({ nhiemVu: nv }) => (
          <Card key={nv.id} data-nhiem-vu={nv.ten}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="text-base">{nv.ten}</CardTitle>
              <Badge variant="secondary">{nv.diem} điểm</Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {nv.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <Badge variant={t.loai === "BAT_BUOC" ? "default" : "outline"} className="w-20 justify-center">
                      {NHAN_LOAI_TASK[t.loai]}
                    </Badge>
                    {t.ten}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
