# CLAUDE.md – CRM chấm KPI giáo viên (ĐH Hạ Long)

Đặc tả gốc: `docs/spec-v1.1.md` (v1.1). Trước mỗi bước, đọc lại các mục đặc tả liên quan.
Các quyết định cho những chỗ đặc tả chưa rõ ghi trong `NOTES.md` (dạng: vấn đề – quyết định – lý do). Khi file này và đặc tả lệch nhau thì theo đặc tả, trừ những điểm đã ghi trong `NOTES.md`.

## Phạm vi và cách làm
- Bản demo chạy 1 luồng: 1 khoa, 1 bộ môn, 3 GV. Làm đầy đủ: GV, Admin. Làm tối giản: TBM, HT. TK, HP chỉ có mục Nhận giấy tờ và trang "Đang phát triển".
- Làm lần lượt theo 9 bước ở mục 12 của đặc tả. Chỉ sang bước sau khi bước hiện tại chạy thử đạt cột "Xong khi".
- Chỗ nào đặc tả không nói rõ thì chọn cách đơn giản nhất và ghi vào `NOTES.md`.

## Stack (không tự đổi)
- Next.js (App Router) + TypeScript strict
- PostgreSQL + Prisma. Schema theo mục 11.1: được chỉnh chi tiết nhưng phải giữ ý nghĩa.
- Đăng nhập: session cookie tự làm (httpOnly, ký bằng `AUTH_SECRET`); mật khẩu hash bcrypt
- Tailwind CSS + shadcn/ui; biểu đồ tròn dùng Recharts
- File lưu trên ổ đĩa server tại `UPLOAD_DIR`, chỉ đọc/ghi qua lớp `src/lib/storage`
- Deploy trên Railway: app + PostgreSQL + Volume + Cron
- Biến môi trường: `DATABASE_URL`, `AUTH_SECRET`, `UPLOAD_DIR`, `CRON_SECRET`, `TZ=Asia/Ho_Chi_Minh`

## Quy tắc bắt buộc

### Mọi kiểm tra đều làm ở server
- Kiểm tra quyền (vai trò, cùng bộ môn, chủ sở hữu) và kiểm tra thời gian/trạng thái (hạn đăng ký, deadline, kỳ đã công bố, kỳ đã chốt) **phải làm ở server**: trong server action, route handler và page server. Ẩn hoặc khóa nút trên giao diện chỉ là lớp phụ.
- Mỗi server action / route handler / page gọi `requireRole(...)` trước khi làm việc khác. Không tin id, vai trò hay kỳ do client gửi lên: luôn tra lại DB rồi kiểm tra quyền sở hữu.
- Luật thời gian/trạng thái (bảng mục 9.1) chỉ viết ở một chỗ là `src/lib/rules.ts`. Không so sánh ngày rải rác trong component.
- Kỳ đã chốt thì chặn mọi thao tác ghi trong kỳ đó. GV chỉ thấy kỳ đã công bố.
- Chuyển trạng thái bằng cập nhật có điều kiện (`updateMany` với `where: { trangThai: ... }`) trong transaction để tránh ghi đè khi hai người thao tác cùng lúc.
- Không ai sửa được bài GV đã nộp, trừ chính GV đó khi bài còn Chờ duyệt. Admin chỉ được xem.
- File chỉ tải qua `GET /api/files/[id]` (có kiểm tra quyền). Không phục vụ `UPLOAD_DIR` dạng file tĩnh.
- Kiểm tra file ở server: chỉ nhận PDF, JPG, PNG, DOC/DOCX, XLS/XLSX; tối đa 20MB/file.

### Múi giờ Asia/Ho_Chi_Minh
- Múi giờ nghiệp vụ là Asia/Ho_Chi_Minh (UTC+7, không có giờ mùa hè).
- Mọi phép tính "hôm nay", "cuối ngày", hạn đăng ký, deadline đều đi qua `src/lib/time.ts`. Không dùng `setHours` và không dựa vào TZ của máy chủ.
- `hanDangKy` = 23:59:59 ngày bắt đầu kỳ; `deadline` = 23:59:59 ngày kết thúc kỳ (giờ Việt Nam).
- Railway Cron chạy theo giờ UTC: 00:05 giờ Việt Nam tương ứng với `5 17 * * *`.

### Giao diện tiếng Việt
- Toàn bộ chữ trên giao diện, thông báo lỗi và thông báo trong web viết bằng tiếng Việt có dấu.
- Tên model và tên trường giữ như đặc tả (`kyId`, `trangThai`…). URL viết tiếng Việt không dấu, dạng kebab-case (vd `/gv/dau-ky`).
- Menu theo vai trò khai báo trong `src/lib/menu.ts`, đúng số mục đặc tả nêu (GV có đúng 3 mục).

## Ngoài phạm vi (mục 13): KHÔNG làm
- 5 mục + HGT của Admin
- Đặc tả đầy đủ cho TBM, TK, HP, HT và các cấp duyệt phía trên TBM
- Nhiều khoa/bộ môn, giao diện quản lý khoa/bộ môn (vẫn giữ `boMonId` và lọc theo bộ môn)
- Kiêm nhiệm: mỗi tài khoản có đúng 1 vai trò
- Đổi mật khẩu, chính sách mật khẩu (chỉ có nút Admin đặt lại về `123456`)
- Thông báo qua email/Zalo (chỉ làm thông báo trong web)
- Quy ước đặt tên tài liệu

Nếu thấy luồng chỉ chạy được khi làm một mục trong danh sách trên thì dừng lại hỏi, không tự làm.

## Lệnh
- `npm run db:start` / `npm run db:stop`: Postgres nhúng cho dev (cổng 5433, dữ liệu ở `.devdb/`), tạo cả DB `crm_kpi` và `crm_kpi_test`
- `npm run dev`: chạy dev ở http://localhost:3000
- `npm run typecheck`, `npm run lint`, `npm run build`
- `npm run db:migrate`: tạo migration khi đổi schema. `npm run db:seed`: seed (chỉ khi DB trống)
- `npm run db:reset`: xóa sạch DB dev rồi seed lại. Prisma chặn AI tự chạy lệnh này; chỉ người dùng chạy.
- `npm test`: unit test (Vitest, `src/**/*.test.ts`)
- `npm run e2e`: E2E (Playwright + Chrome cài sẵn) trên DB `crm_kpi_test`, server cổng 3100. Cần `npm run build` trước.
- `npm run release`: migrate deploy + seed (bước pre-deploy trên Railway). Cấu hình deploy: `railway.json` (app), `railway.cron.json` (cron); hướng dẫn trong `NOTES.md` bước 9.

## Next.js 16
@AGENTS.md
