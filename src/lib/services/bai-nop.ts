import "server-only";
import type { NguoiDung } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { chan, LoiNghiepVu } from "@/lib/loi";
import { lyDoKhongThaoTacTask } from "@/lib/rules";
import { xoaNhieuFile } from "@/lib/storage";
import { guiThongBao, tbmCuaBoMon } from "@/lib/thong-bao";
import { layChuoi, layFile, layLink, luuFiles } from "./file-upload";

/**
 * GV nộp minh chứng cho task ở trạng thái Chưa làm hoặc Bị từ chối → tạo lần nộp mới (Chờ duyệt).
 * Form: files (≥1), ghiChu, link.
 */
export async function nopBaiMoi(gv: NguoiDung, gvTaskId: string, form: FormData) {
  const gt = await db.gvTask.findUnique({ where: { id: gvTaskId }, include: { ky: true, task: true } });
  if (!gt || gt.gvId !== gv.id) throw new LoiNghiepVu("Không tìm thấy task.", 404);
  chan(lyDoKhongThaoTacTask(gt.ky));
  if (gt.trangThai === "CHO_DUYET") {
    throw new LoiNghiepVu("Task đang chờ duyệt – hãy sửa lần nộp hiện tại thay vì nộp mới.", 409);
  }
  if (gt.trangThai === "DA_DUYET") throw new LoiNghiepVu("Task đã được duyệt, không thể nộp thêm.", 409);

  const files = layFile(form);
  if (!files.length) throw new LoiNghiepVu("Phải tải lên ít nhất 1 file minh chứng.");
  const ghiChu = layChuoi(form, "ghiChu");
  const link = layLink(form);

  const daLuu = await luuFiles(files);
  try {
    return await db.$transaction(async (tx) => {
      const ky = await tx.ky.findUniqueOrThrow({ where: { id: gt.kyId } });
      chan(lyDoKhongThaoTacTask(ky));
      const { count } = await tx.gvTask.updateMany({
        where: { id: gt.id, trangThai: { in: ["CHUA_LAM", "TU_CHOI"] } },
        data: { trangThai: "CHO_DUYET" },
      });
      if (!count) throw new LoiNghiepVu("Task vừa thay đổi trạng thái, vui lòng tải lại trang.", 409);
      const bn = await tx.baiNop.create({ data: { gvTaskId: gt.id, ghiChu, link, files: { create: daLuu } } });
      await guiThongBao(
        tx,
        await tbmCuaBoMon(tx, gv.boMonId),
        `${gv.hoTen} đã nộp minh chứng task "${gt.task.ten}".`,
        `/tbm/duyet-task/${bn.id}`,
      );
      return { baiNopId: bn.id };
    });
  } catch (e) {
    await xoaNhieuFile(daLuu.map((f) => f.duongDan));
    throw e;
  }
}

/**
 * GV sửa/thay minh chứng của lần nộp hiện tại khi còn Chờ duyệt.
 * Form: files (thêm mới), xoaFileIds (bỏ file cũ), ghiChu, link. Phải còn ≥1 file.
 */
export async function suaBaiNop(gv: NguoiDung, baiNopId: string, form: FormData) {
  const bn = await db.baiNop.findUnique({
    where: { id: baiNopId },
    include: { gvTask: { include: { ky: true } }, files: { select: { id: true, duongDan: true } } },
  });
  if (!bn || bn.gvTask.gvId !== gv.id) throw new LoiNghiepVu("Không tìm thấy lần nộp.", 404);
  chan(lyDoKhongThaoTacTask(bn.gvTask.ky));
  if (bn.trangThai === "DA_DUYET") throw new LoiNghiepVu("Minh chứng đã được duyệt, không thể sửa.", 409);
  if (bn.trangThai === "TU_CHOI") throw new LoiNghiepVu("Lần nộp đã bị từ chối – hãy nộp lại (tạo lần nộp mới).", 409);

  const xoaIds = new Set(form.getAll("xoaFileIds").filter((v): v is string => typeof v === "string"));
  const fileXoa = bn.files.filter((f) => xoaIds.has(f.id));
  const conLai = bn.files.length - fileXoa.length;
  const files = layFile(form, conLai);
  if (conLai + files.length === 0) throw new LoiNghiepVu("Phải còn ít nhất 1 file minh chứng.");
  const ghiChu = layChuoi(form, "ghiChu");
  const link = layLink(form);

  const daLuu = await luuFiles(files);
  try {
    await db.$transaction(async (tx) => {
      const ky = await tx.ky.findUniqueOrThrow({ where: { id: bn.gvTask.kyId } });
      chan(lyDoKhongThaoTacTask(ky));
      // Cập nhật có điều kiện: nếu TBM vừa duyệt/từ chối thì không sửa được nữa.
      const { count } = await tx.baiNop.updateMany({ where: { id: bn.id, trangThai: "CHO_DUYET" }, data: { ghiChu, link } });
      if (!count) throw new LoiNghiepVu("Lần nộp vừa được trưởng bộ môn xử lý, không thể sửa.", 409);
      if (fileXoa.length) await tx.fileDinhKem.deleteMany({ where: { id: { in: fileXoa.map((f) => f.id) }, baiNopId: bn.id } });
      if (daLuu.length) await tx.fileDinhKem.createMany({ data: daLuu.map((f) => ({ ...f, baiNopId: bn.id })) });
    });
  } catch (e) {
    await xoaNhieuFile(daLuu.map((f) => f.duongDan));
    throw e;
  }
  await xoaNhieuFile(fileXoa.map((f) => f.duongDan));
  return { baiNopId: bn.id };
}
