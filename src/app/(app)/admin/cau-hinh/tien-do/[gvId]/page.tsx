import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { BieuDoTienDo } from "@/components/chung/bieu-do-tien-do";
import { LichSuNop } from "@/components/chung/lich-su-nop";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { NHAN_LOAI_TASK, NHAN_TASK } from "@/lib/nhan";
import { layLichSuNop } from "@/lib/services/lich-su-nop";
import { thongKeTienDo } from "@/lib/tien-do";

/** Admin xem tiến độ task + minh chứng của một GV (chỉ xem, mở/tải file). */
export default async function TrangTienDoGv(props: PageProps<"/admin/cau-hinh/tien-do/[gvId]">) {
  await yeuCauVaiTro("ADMIN");
  const { gvId } = await props.params;
  const sp = await props.searchParams;
  const kyId = typeof sp.kyId === "string" ? sp.kyId : "";
  const [gv, ky] = await Promise.all([
    db.user.findUnique({ where: { id: gvId }, select: { hoTen: true, username: true } }),
    db.ky.findUnique({ where: { id: kyId } }),
  ]);
  if (!gv || !ky) notFound();

  const gvTasks = await db.gvTask.findMany({
    where: { gvId, kyId },
    include: { task: { include: { nhiemVu: { select: { ten: true, thuTu: true } } } } },
  });
  gvTasks.sort((a, b) => a.task.nhiemVu.thuTu - b.task.nhiemVu.thuTu || a.task.thuTu - b.task.thuTu);
  const lichSu = new Map(await Promise.all(gvTasks.map(async (g) => [g.id, await layLichSuNop(g.id)] as const)));
  const tk = thongKeTienDo(gvTasks.map((g) => ({ loai: g.task.loai, trangThai: g.trangThai })));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/cau-hinh?tab=tien-do&kyId=${kyId}`} className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="size-4" /> Tiến độ & minh chứng
        </Link>
        <TrangTieuDe tieuDe={`Tiến độ của ${gv.hoTen}`} moTa={`${gv.username} · ${ky.ten} · chỉ xem`} />
      </div>
      <Card>
        <CardContent>
          <BieuDoTienDo tk={tk} />
        </CardContent>
      </Card>
      {gvTasks.map((g) => (
        <Card key={g.id} data-task={g.task.ten}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Badge variant={g.task.loai === "BAT_BUOC" ? "default" : "outline"}>{NHAN_LOAI_TASK[g.task.loai]}</Badge>
              {g.task.ten}
              <span className="text-sm font-normal text-muted-foreground">– {g.task.nhiemVu.ten}</span>
            </CardTitle>
            <BadgeTrangThai trangThai={g.trangThai} nhan={NHAN_TASK[g.trangThai]} />
          </CardHeader>
          <CardContent>
            <LichSuNop baiNops={lichSu.get(g.id) ?? []} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
