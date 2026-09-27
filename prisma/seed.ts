// Seed dữ liệu demo (mục 11.3). Chỉ chạy trên DB trống.
// Làm lại demo từ đầu: npm run db:reset
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import type { Role } from "../src/generated/prisma/enums";
import { tenGoc } from "../src/lib/username";
import { chuoiThanhNgay, congNgay, homNayVN } from "../src/lib/time";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const TAI_KHOAN: { hoTen: string; role: Role }[] = [
  { hoTen: "Quản trị", role: "ADMIN" },
  { hoTen: "Nguyễn Văn Hiếu", role: "HT" },
  { hoTen: "Trần Thị Phương", role: "HP" },
  { hoTen: "Lê Văn Khoa", role: "TK" },
  { hoTen: "Phạm Thị Bích", role: "TBM" },
  { hoTen: "Nguyễn Văn An", role: "GV" },
  { hoTen: "Trần Thị Bình", role: "GV" },
  { hoTen: "Lê Văn Cường", role: "GV" },
];

// [tên, mô tả, điểm, task bắt buộc[], task mở rộng]
const NHIEM_VU: [string, string, number, string[], string][] = [
  ["Biên soạn bài giảng", "Biên soạn và cập nhật bài giảng các học phần được phân công.", 15,
    ["Biên soạn đề cương chi tiết học phần", "Soạn slide bài giảng", "Nộp giáo án lên bộ môn"],
    "Số hóa bài giảng lên hệ thống LMS"],
  ["Hướng dẫn sinh viên NCKH", "Hướng dẫn ít nhất một nhóm sinh viên nghiên cứu khoa học.", 12,
    ["Đăng ký đề tài với khoa", "Hướng dẫn nhóm hoàn thành báo cáo"],
    "Nhóm sinh viên đạt giải cấp trường"],
  ["Công bố bài báo khoa học", "Công bố ít nhất một bài báo trên tạp chí chuyên ngành.", 12,
    ["Nộp bản thảo bài báo", "Có quyết định chấp nhận đăng"],
    "Bài báo thuộc danh mục Scopus/ISI"],
  ["Biên soạn giáo trình, tài liệu tham khảo", "Tham gia biên soạn giáo trình hoặc tài liệu tham khảo.", 10,
    ["Nộp đề cương giáo trình", "Hoàn thành bản thảo 3 chương"],
    "Giáo trình được nghiệm thu cấp khoa"],
  ["Đổi mới phương pháp giảng dạy", "Áp dụng phương pháp giảng dạy mới trong ít nhất một học phần.", 10,
    ["Lập kế hoạch đổi mới", "Báo cáo kết quả áp dụng"],
    "Tổ chức tiết dạy mẫu"],
  ["Tham gia hội thảo chuyên môn", "Tham gia hội thảo, seminar chuyên môn của khoa/trường.", 10,
    ["Đăng ký tham dự hội thảo", "Nộp tham luận"],
    "Chủ trì một phiên hội thảo"],
  ["Cố vấn học tập", "Làm cố vấn học tập cho lớp được phân công.", 8,
    ["Họp lớp định kỳ", "Báo cáo tình hình lớp"],
    "Tư vấn sinh viên có nguy cơ thôi học"],
  ["Coi thi, chấm thi", "Hoàn thành công tác coi thi, chấm thi theo phân công.", 8,
    ["Coi thi đủ buổi được phân công", "Nộp điểm đúng hạn", "Lưu trữ bài thi"],
    "Tham gia xây dựng ngân hàng câu hỏi"],
  ["Bồi dưỡng chuyên môn", "Tham gia các khóa bồi dưỡng nâng cao chuyên môn.", 8,
    ["Tham gia khóa bồi dưỡng", "Nộp chứng nhận hoàn thành"],
    "Đạt chứng chỉ ngoại ngữ"],
  ["Công tác phục vụ cộng đồng", "Tham gia hoạt động phục vụ cộng đồng của trường.", 7,
    ["Tham gia hoạt động tình nguyện", "Báo cáo kết quả hoạt động"],
    "Tổ chức một hoạt động cộng đồng"],
];

const BAC_XEP_LOAI: [string, number][] = [
  ["A1", 80], ["A2", 65], ["B", 50], ["C", 35], ["D", 20], ["F", 0],
];

async function main() {
  if ((await db.user.count()) > 0) {
    console.log("DB đã có dữ liệu → bỏ qua seed. Muốn làm lại từ đầu: npm run db:reset");
    return;
  }

  const khoa = await db.khoa.create({ data: { ten: "Khoa Công nghệ thông tin" } });
  const boMon = await db.boMon.create({ data: { ten: "Bộ môn Khoa học máy tính", khoaId: khoa.id } });

  const passwordHash = await bcrypt.hash("123456", 10);
  for (const tk of TAI_KHOAN) {
    const username = tenGoc(tk.hoTen, tk.role)!;
    await db.user.create({
      data: { username, hoTen: tk.hoTen, role: tk.role, passwordHash, boMonId: boMon.id },
    });
    console.log(`  ${username.padEnd(20)} ${tk.hoTen}`);
  }

  const batDau = homNayVN();
  await db.ky.create({
    data: {
      ten: "Kỳ 1 – 2026-2027",
      namHoc: "2026-2027",
      soKy: 1,
      ngayBatDau: chuoiThanhNgay(batDau),
      ngayKetThuc: chuoiThanhNgay(congNgay(batDau, 30)),
      daCongBo: true,
      bacXepLoais: { create: BAC_XEP_LOAI.map(([ten, diemToiThieu]) => ({ ten, diemToiThieu })) },
      nhiemVus: {
        create: NHIEM_VU.map(([ten, moTa, diem, batBuoc, moRong], i) => ({
          ten,
          moTa,
          diem,
          thuTu: i + 1,
          tasks: {
            create: [
              ...batBuoc.map((t, j) => ({ ten: t, loai: "BAT_BUOC" as const, thuTu: j + 1 })),
              { ten: moRong, loai: "MO_RONG" as const, thuTu: batBuoc.length + 1 },
            ],
          },
        })),
      },
    },
  });

  console.log(`Seed xong: 8 tài khoản (mật khẩu 123456), Kỳ 1 – 2026-2027 bắt đầu ${batDau}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
