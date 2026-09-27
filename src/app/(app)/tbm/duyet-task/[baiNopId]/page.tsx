import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { LichSuNop } from "@/components/chung/lich-su-nop";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { NHAN_DUYET, NHAN_LOAI_TASK } from "@/lib/nhan";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { layLichSuNop } from "@/lib/services/lich-su-nop";
import { NutDuyetBaiNop } from "./nut-duyet";

export default async function TrangChiTietBaiNop(props: PageProps<"/tbm/duyet-task/[baiNopId]">) {
  const tbm = await yeuCauVaiTro("TBM");
  const { baiNopId } = await props.params;
  const bn = await db.baiNop.findUnique({
    where: { id: baiNopId },
    include: {
      gvTask: {
        include: {
          ky: true,
          gv: { select: { hoTen: true, username: true, boMonId: true } },
          task: { include: { nhiemVu: { select: { ten: true } } } },
        },
      },
    },
  });
  if (!bn || !tbm.boMonId || bn.gvTask.gv.boMonId !== tbm.boMonId) notFound();

  const { gvTask: gt } = bn;
  const lichSu = await layLichSuNop(gt.id);
  const lyDo = bn.trangThai === "CHO_DUYET" ? lyDoKhongThaoTacTask(gt.ky) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tbm/duyet-task" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="size-4" /> Danh sách chờ duyệt
        </Link>
        <TrangTieuDe tieuDe={gt.task.ten} moTa={`${gt.gv.hoTen} (${gt.gv.username}) · ${gt.task.nhiemVu.ten} · ${gt.ky.ten}`}>
          <div className="flex items-center gap-2">
            <Badge variant={gt.task.loai === "BAT_BUOC" ? "default" : "outline"}>{NHAN_LOAI_TASK[gt.task.loai]}</Badge>
            <BadgeTrangThai trangThai={bn.trangThai} nhan={NHAN_DUYET[bn.trangThai]} className="text-sm" />
          </div>
        </TrangTieuDe>
        {gt.task.moTa && <p className="text-sm text-muted-foreground">{gt.task.moTa}</p>}
      </div>

      {bn.trangThai === "CHO_DUYET" && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">Xem file, ghi chú, link của lần nộp mới nhất bên dưới rồi duyệt hoặc từ chối.</p>
            {lyDo ? <p className="text-sm text-destructive">{lyDo}</p> : <NutDuyetBaiNop baiNopId={bn.id} />}
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Các lần nộp</h2>
        <LichSuNop baiNops={lichSu} />
      </section>
    </div>
  );
}
