import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { LichSuNop } from "@/components/chung/lich-su-nop";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { NHAN_LOAI_TASK, NHAN_TASK } from "@/lib/nhan";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { layLichSuNop } from "@/lib/services/lich-su-nop";
import { deadline, hienNgayGio } from "@/lib/time";
import { FormNopMinhChung } from "./form-nop";

export default async function TrangChiTietTask(props: PageProps<"/gv/cuoi-ky/task/[gvTaskId]">) {
  const gv = await yeuCauVaiTro("GV");
  const { gvTaskId } = await props.params;
  const gt = await db.gvTask.findUnique({
    where: { id: gvTaskId },
    include: { ky: true, task: { include: { nhiemVu: { select: { ten: true } } } } },
  });
  if (!gt || gt.gvId !== gv.id) notFound();

  const lichSu = await layLichSuNop(gt.id);
  const lyDoKhoa = lyDoKhongThaoTacTask(gt.ky);
  const hienTai = gt.trangThai === "CHO_DUYET" ? lichSu[0] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/gv/cuoi-ky?kyId=${gt.kyId}`} className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="size-4" /> Cuối kỳ
        </Link>
        <TrangTieuDe tieuDe={gt.task.ten} moTa={`${gt.task.nhiemVu.ten} · ${gt.ky.ten} · Deadline: ${hienNgayGio(deadline(gt.ky))}`}>
          <div className="flex items-center gap-2">
            <Badge variant={gt.task.loai === "BAT_BUOC" ? "default" : "outline"}>{NHAN_LOAI_TASK[gt.task.loai]}</Badge>
            <BadgeTrangThai trangThai={gt.trangThai} nhan={NHAN_TASK[gt.trangThai]} className="text-sm" />
          </div>
        </TrangTieuDe>
        {gt.task.moTa && <p className="text-sm text-muted-foreground">{gt.task.moTa}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {gt.trangThai === "CHO_DUYET"
              ? "Sửa / thay minh chứng của lần nộp hiện tại"
              : gt.trangThai === "TU_CHOI"
                ? "Nộp lại minh chứng"
                : gt.trangThai === "DA_DUYET"
                  ? "Minh chứng đã được duyệt"
                  : "Nộp minh chứng"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gt.trangThai === "DA_DUYET" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-4" /> Task đã được duyệt và khóa.
            </p>
          ) : lyDoKhoa ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <Lock className="size-4" /> {lyDoKhoa}
            </p>
          ) : hienTai ? (
            <FormNopMinhChung
              key={hienTai.id}
              cheDo="sua"
              baiNopId={hienTai.id}
              ghiChu={hienTai.ghiChu ?? ""}
              link={hienTai.link ?? ""}
              files={hienTai.files}
            />
          ) : (
            <FormNopMinhChung cheDo="nop" gvTaskId={gt.id} />
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-semibold">Lịch sử các lần nộp</h2>
        <LichSuNop baiNops={lichSu} />
      </section>
    </div>
  );
}
