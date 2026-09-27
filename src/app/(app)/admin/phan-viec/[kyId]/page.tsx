import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TrangTieuDe } from "@/components/chung/trang-tieu-de";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ngayThanhChuoi } from "@/lib/time";
import { BangXepLoai } from "./bang-xep-loai";
import { DanhSachNhiemVu, type NhiemVuHienThi } from "./danh-sach-nhiem-vu";
import { ThongTinKy } from "./thong-tin-ky";

export default async function TrangChiTietKy(props: PageProps<"/admin/phan-viec/[kyId]">) {
  await yeuCauVaiTro("ADMIN");
  const { kyId } = await props.params;
  const ky = await db.ky.findUnique({
    where: { id: kyId },
    include: {
      bacXepLoais: { orderBy: { diemToiThieu: "desc" } },
      nhiemVus: {
        orderBy: [{ thuTu: "asc" }, { ten: "asc" }],
        include: {
          _count: { select: { dangKys: true } },
          tasks: {
            orderBy: [{ thuTu: "asc" }, { ten: "asc" }],
            include: { _count: { select: { gvTasks: true, yeuCaus: true } } },
          },
        },
      },
    },
  });
  if (!ky) notFound();

  const duyet = await db.dangKyNhiemVu.groupBy({
    by: ["nhiemVuId"],
    where: { nhiemVu: { kyId }, dangKy: { trangThai: "DA_DUYET" } },
    _count: true,
  });
  const soDuyet = new Map(duyet.map((d) => [d.nhiemVuId, d._count]));

  const nhiemVus: NhiemVuHienThi[] = ky.nhiemVus.map((nv) => ({
    id: nv.id,
    ten: nv.ten,
    moTa: nv.moTa,
    diem: nv.diem,
    thuTu: nv.thuTu,
    soDangKy: nv._count.dangKys,
    soDangKyDuyet: soDuyet.get(nv.id) ?? 0,
    tasks: nv.tasks.map((t) => ({
      id: t.id,
      ten: t.ten,
      moTa: t.moTa,
      loai: t.loai,
      thuTu: t.thuTu,
      daCoNguoiLam: t._count.gvTasks + t._count.yeuCaus > 0,
    })),
  }));
  const tongDiem = ky.nhiemVus.reduce((s, nv) => s + nv.diem, 0);

  return (
    <div>
      <Link href="/admin/phan-viec" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:underline">
        <ChevronLeft className="size-4" /> Danh sách kỳ
      </Link>
      <TrangTieuDe tieuDe={ky.ten} moTa={`Năm học ${ky.namHoc} · Kỳ ${ky.soKy}`} />

      <ThongTinKy
        ky={{
          id: ky.id,
          ngayBatDau: ngayThanhChuoi(ky.ngayBatDau),
          ngayKetThuc: ngayThanhChuoi(ky.ngayKetThuc),
          daCongBo: ky.daCongBo,
          daChot: ky.daChot,
        }}
      />

      <Tabs defaultValue="nhiem-vu" className="mt-6">
        <TabsList>
          <TabsTrigger value="nhiem-vu">Nhiệm vụ &amp; task ({ky.nhiemVus.length})</TabsTrigger>
          <TabsTrigger value="xep-loai">Bảng xếp loại ({ky.bacXepLoais.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="nhiem-vu" className="mt-4">
          <DanhSachNhiemVu kyId={ky.id} nhiemVus={nhiemVus} tongDiem={tongDiem} khoa={ky.daChot} />
        </TabsContent>
        <TabsContent value="xep-loai" className="mt-4">
          <BangXepLoai
            kyId={ky.id}
            bacs={ky.bacXepLoais.map((b) => ({ ten: b.ten, diemToiThieu: b.diemToiThieu }))}
            khoa={ky.daChot}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
