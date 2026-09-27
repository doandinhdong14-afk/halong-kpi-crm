import Link from "next/link";
import { Info } from "lucide-react";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { ChonKy } from "@/components/chung/chon-ky";
import { BadgeTrangThai } from "@/components/chung/badge-trang-thai";
import { BieuDoTienDo } from "@/components/chung/bieu-do-tien-do";
import { DemNguoc } from "@/components/chung/dem-nguoc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { trangThaiKy } from "@/lib/ky";
import { chonKy } from "@/lib/ky-hien-tai";
import { NHAN_LOAI_TASK, NHAN_TASK } from "@/lib/nhan";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { thongKeTienDo } from "@/lib/tien-do";
import { deadline, hienNgayGio, homNayVN } from "@/lib/time";
import { KhoiKetQua } from "./khoi-ket-qua";
import { XinThemTask, type TaskMoRong } from "./xin-them-task";

export default async function TrangCuoiKy(props: PageProps<"/gv/cuoi-ky">) {
  const gv = await yeuCauVaiTro("GV");
  const sp = await props.searchParams;
  const kys = await db.ky.findMany({ where: { daCongBo: true }, orderBy: { ngayBatDau: "desc" } });
  const ky = chonKy(kys, typeof sp.kyId === "string" ? sp.kyId : undefined, homNayVN());

  if (!ky) {
    return (
      <div>
        <TrangTieuDe tieuDe="Cuối kỳ" />
        <p className="text-muted-foreground">Chưa có kỳ nào được công bố.</p>
      </div>
    );
  }

  const [dk, gvTasks, yeuCaus, ketQua] = await Promise.all([
    db.dangKy.findUnique({
      where: { kyId_gvId: { kyId: ky.id, gvId: gv.id } },
      include: {
        nhiemVus: {
          include: {
            nhiemVu: {
              include: { tasks: { where: { loai: "MO_RONG" }, orderBy: [{ thuTu: "asc" }, { ten: "asc" }] } },
            },
          },
          orderBy: { nhiemVu: { thuTu: "asc" } },
        },
      },
    }),
    db.gvTask.findMany({
      where: { gvId: gv.id, kyId: ky.id },
      include: { task: { select: { ten: true, loai: true, thuTu: true, nhiemVuId: true } } },
    }),
    db.yeuCauThemTask.findMany({ where: { gvId: gv.id, kyId: ky.id }, orderBy: { taoLuc: "desc" } }),
    db.ketQuaKy.findUnique({ where: { kyId_gvId: { kyId: ky.id, gvId: gv.id } } }),
  ]);

  const chonKyUi = (
    <ChonKy kyId={ky.id} kys={kys.map((k) => ({ id: k.id, ten: k.ten, nhanPhu: k.daChot ? trangThaiKy(k) : undefined }))} />
  );
  const daDuyet = dk?.trangThai === "DA_DUYET";

  return (
    <div className="space-y-6">
      <TrangTieuDe
        tieuDe="Cuối kỳ"
        moTa={
          <>
            {ky.ten} · Deadline: <strong className="text-foreground">{hienNgayGio(deadline(ky))}</strong>
            {ky.daChot && " · Kỳ đã chốt"}
          </>
        }
      >
        {chonKyUi}
      </TrangTieuDe>

      {ky.daChot && <KhoiKetQua ketQua={ketQua} />}

      {!daDuyet ? (
        !ky.daChot && (
          <div className="flex items-center gap-3 rounded-lg border bg-background p-4" data-testid="chua-duyet">
            <Info className="size-5 text-muted-foreground" />
            <p>
              Danh sách nhiệm vụ chưa được trưởng bộ môn duyệt.{" "}
              <Link href={`/gv/dau-ky?kyId=${ky.id}`} className="text-primary hover:underline">
                Xem đăng ký
              </Link>
            </p>
          </div>
        )
      ) : (
        <NoiDungCuoiKy
          kyId={ky.id}
          lyDoKhoa={lyDoKhongThaoTacTask(ky)}
          deadlineIso={deadline(ky).toISOString()}
          daChot={ky.daChot}
          xepLoai={dk!.xepLoai}
          nhiemVus={dk!.nhiemVus.map((x) => x.nhiemVu)}
          gvTasks={gvTasks}
          yeuCaus={yeuCaus}
        />
      )}
    </div>
  );
}

type GvTaskDong = {
  id: string;
  trangThai: keyof typeof NHAN_TASK;
  taskId: string;
  task: { ten: string; loai: keyof typeof NHAN_LOAI_TASK; thuTu: number; nhiemVuId: string };
};

function NoiDungCuoiKy(props: {
  kyId: string;
  lyDoKhoa: string | null;
  deadlineIso: string;
  daChot: boolean;
  xepLoai: string | null;
  nhiemVus: { id: string; ten: string; diem: number; tasks: { id: string; ten: string; moTa: string | null }[] }[];
  gvTasks: GvTaskDong[];
  yeuCaus: { taskId: string; trangThai: "CHO_DUYET" | "TU_CHOI" | "DA_DUYET"; nhanXet: string | null }[];
}) {
  const tk = thongKeTienDo(props.gvTasks.map((g) => ({ loai: g.task.loai, trangThai: g.trangThai })));
  const coGvTask = new Set(props.gvTasks.map((g) => g.taskId));

  // Task mở rộng thuộc các nhiệm vụ đã duyệt, kèm tình trạng xin.
  const moRong: TaskMoRong[] = props.nhiemVus.flatMap((nv) =>
    nv.tasks.map((t) => {
      const ycMoiNhat = props.yeuCaus.find((y) => y.taskId === t.id);
      return {
        id: t.id,
        ten: t.ten,
        moTa: t.moTa,
        nhiemVu: nv.ten,
        tinhTrang: coGvTask.has(t.id) ? "DA_GIAO" : ycMoiNhat?.trangThai === "CHO_DUYET" ? "DANG_CHO" : ycMoiNhat?.trangThai === "TU_CHOI" ? "TU_CHOI" : "CHUA_XIN",
        nhanXet: ycMoiNhat?.trangThai === "TU_CHOI" ? ycMoiNhat.nhanXet : null,
      };
    }),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tổng quan task bắt buộc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-6">
          <BieuDoTienDo tk={tk} />
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Xếp loại đăng ký</div>
              <div className="text-3xl font-bold" data-testid="xep-loai-dang-ky">
                {props.xepLoai}
              </div>
            </div>
            {tk.soVuot > 0 && (
              <Badge className="bg-emerald-600 text-white" data-testid="task-vuot">
                +{tk.soVuot} task vượt
              </Badge>
            )}
            {!props.daChot && <DemNguoc den={props.deadlineIso} nhan="Còn lại đến deadline" />}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-semibold">Nhiệm vụ và task</h2>
        {props.nhiemVus.map((nv) => {
          const tasks = props.gvTasks
            .filter((g) => g.task.nhiemVuId === nv.id)
            .sort((a, b) => (a.task.loai === b.task.loai ? a.task.thuTu - b.task.thuTu : a.task.loai === "BAT_BUOC" ? -1 : 1));
          return (
            <Card key={nv.id} data-nhiem-vu={nv.ten}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{nv.ten}</CardTitle>
                <Badge variant="secondary">{nv.diem} điểm</Badge>
              </CardHeader>
              <CardContent>
                <ul className="divide-y rounded-md border">
                  {tasks.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" data-task={g.task.ten}>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant={g.task.loai === "BAT_BUOC" ? "default" : "outline"} className="w-20 justify-center">
                          {NHAN_LOAI_TASK[g.task.loai]}
                        </Badge>
                        <span>{g.task.ten}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <BadgeTrangThai trangThai={g.trangThai} nhan={NHAN_TASK[g.trangThai]} />
                        <Link href={`/gv/cuoi-ky/task/${g.id}`} className="text-sm font-medium text-primary hover:underline">
                          {!props.lyDoKhoa && (g.trangThai === "CHUA_LAM" || g.trangThai === "TU_CHOI") ? "Nộp minh chứng" : "Chi tiết"}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <XinThemTask tasks={moRong} lyDoKhoa={props.lyDoKhoa} />
    </>
  );
}
