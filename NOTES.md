# NOTES – CRM KPI giáo viên (v1.1)

Ghi lại các quyết định cho chỗ đặc tả chưa rõ, những gì đã làm ở từng bước, và việc còn tồn.
Đặc tả: `docs/spec-v1.1.md`.

## Quyết định đã duyệt (27/09/2026)

### Mâu thuẫn trong đặc tả
| # | Vấn đề | Quyết định |
|---|---|---|
| A1 | Bảng 9.1 thiếu điều kiện "kỳ chưa chốt" cho GV gửi đăng ký và TBM duyệt đăng ký | Mọi thao tác ghi đều yêu cầu **kỳ đã công bố và chưa chốt** |
| A2 | Sửa đăng ký sau khi bị từ chối mà quay về Nháp thì dính khóa hạn đăng ký | Giữ trạng thái **Bị từ chối** trong lúc sửa (vẫn tự lưu, đến hết deadline). Gửi → Chờ duyệt |
| A3 | Phần mở đầu nói TK/HP chỉ có trang giữ chỗ | Theo mục 2.1/8: có **Nhận giấy tờ** + trang "Đang phát triển" |
| A4 | "Kỳ hiện tại" không cho đăng ký kỳ sau khi kỳ trước còn chạy | Trang Đầu kỳ/Cuối kỳ có **dropdown chọn kỳ** (các kỳ đã công bố), mặc định kỳ hiện tại |
| A5 | "Sửa chữ thì được" chưa rõ | Nhiệm vụ đã có người đăng ký: khóa sửa điểm và khóa xóa. Task đã có người làm/xin: khóa đổi loại và khóa xóa. Không thêm task bắt buộc vào nhiệm vụ đã có đăng ký Đã duyệt (task mở rộng vẫn thêm được) |

### Chỗ chưa rõ
| # | Vấn đề | Quyết định |
|---|---|---|
| 6 | Nhiệm vụ không có task bắt buộc → chia cho 0 | Tính **100%**; trang admin cảnh báo |
| 7 | Bảng xếp loại rỗng | Công bố cần ≥1 nhiệm vụ và ≥1 bậc; tên bậc và ngưỡng không trùng; "bậc thấp nhất" = ngưỡng nhỏ nhất |
| 8 | Minh chứng có bắt buộc file không | Bắt buộc **≥1 file**, tối đa 10 file/lần nộp; link phải là http/https |
| 9 | Nhắc hạn gửi cho ai | Hạn đăng ký (còn ≤3 ngày): GV chưa gửi. Deadline (còn ≤7 ngày): GV còn task bắt buộc chưa Đã duyệt. Mỗi loại 1 lần/GV/kỳ (`ThongBao.maSuKien`) |
| 10 | HT gửi "mọi tài khoản" nhưng HT không nhận giấy tờ | Danh sách người nhận bỏ tài khoản HT |
| 11 | Công bố/chốt/sửa kỳ | Công bố một chiều; cron chỉ chốt kỳ đã công bố; kỳ đã chốt khóa toàn bộ (kể cả sửa ngày); không trùng (năm học, kỳ số); ngày kết thúc ≥ ngày bắt đầu |
| 12 | Sao chép kỳ | Ô tùy chọn trong form tạo kỳ, chọn bất kỳ kỳ nào; chép nhiệm vụ, task, bảng xếp loại; kỳ mới chưa công bố |
| 13 | Đổi chức vụ khi đã có dữ liệu KPI | Giữ dữ liệu; chốt kỳ chỉ tính tài khoản đang là GV. Case phụ "đổi gv.tranthibinh lên TBM" làm sau kịch bản chính |
| 14 | Sinh lại tên đăng nhập | Bỏ qua chính tài khoản đang sửa khi kiểm tra trùng; tính lại hậu tố từ đầu; họ tên bỏ dấu rỗng → báo lỗi |
| 15 | Xóa tài khoản | Xóa luôn file thật trên ổ đĩa; người duyệt đã bị xóa hiện "(tài khoản đã xóa)"; admin xóa được admin khác, không tự xóa |
| 16 | Trang Cuối kỳ khi GV không có danh sách được duyệt | Sau chốt vẫn hiện khối Kết quả "Không đạt – F" + ghi chú |
| 17 | Xin lại task mở rộng | Được xin lại sau khi bị từ chối, nếu không còn yêu cầu Chờ duyệt/Đã duyệt cho cùng task |
| 18 | TBM duyệt lúc GV đang sửa | Cập nhật có điều kiện theo trạng thái; GV sửa bài Chờ duyệt không gửi thông báo cho TBM |
| 19 | Seed: hạn đăng ký hết ngay cuối ngày seed | Giữ đúng đặc tả. Trước buổi demo: admin sửa ngày bắt đầu, hoặc `npm run db:reset` |
| 20 | Phiên bản thư viện | Bản ổn định mới nhất lúc khởi tạo (xem bước 1) |

---

## Bước 1 – Khởi tạo, đăng nhập, menu theo vai trò ✅

**Đã làm**
- Next.js 16.3 (App Router, Turbopack), TypeScript strict, Tailwind v4, shadcn/ui (radix, preset nova), Prisma 7.10, Vitest, Playwright.
- Schema theo 11.1, có chỉnh:
  - ngày kỳ lưu `@db.Date`
  - `@@unique([namHoc, soKy])`, `BacXepLoai @@unique([kyId, ten])`
  - thêm `YeuCauThemTask.kyId`
  - thêm `ThongBao.maSuKien` (`@@unique([userId, maSuKien])`)
  - `onDelete: Restrict` ở `DangKyNhiemVu.nhiemVu`, `GvTask.task`, `YeuCauThemTask.task`
  - thêm index
- Seed đúng mục 11.3. Tên đăng nhập sinh bằng chính hàm `tenGoc`, khớp danh sách đặc tả.
- Đăng nhập:
  - JWT HS256 (jose) trong cookie httpOnly `phien`
  - `src/lib/auth/dal.ts` đọc lại user từ DB mỗi request
  - `yeuCauVaiTro()` dùng cho page, `kiemTraVaiTro()` dùng cho action/API
- `src/proxy.ts`: chỉ chặn người chưa đăng nhập, bỏ qua `/api`.
- Layout: header (tên, vai trò, chuông giữ chỗ, đăng xuất) + menu theo `src/lib/menu.ts`. Có trang tạm cho mục chưa làm, `/khong-co-quyen`, `/dang-phat-trien`.
- Test: unit test `time`, `username`; E2E `e2e/buoc-1-dang-nhap.spec.ts` (8 tài khoản đăng nhập đúng menu, chặn sai vai trò, sai mật khẩu, đăng xuất): 12/12 pass.

**Tự chọn**
- Máy không có Postgres/Docker → `scripts/dev-db.mjs` chạy binary của `embedded-postgres` qua `pg_ctl` (pg_ctl tự hạ quyền khi chạy bằng Administrator).
- Prisma 7: cấu hình ở `prisma.config.ts`; client sinh vào `src/generated/prisma` (gitignore, `postinstall` tự generate); dùng `@prisma/adapter-pg`.
- `bcryptjs` (tạo hash bcrypt chuẩn, không cần build native trên Windows).
- Font Inter có subset `vietnamese`.
- E2E dùng DB riêng `crm_kpi_test` và server cổng 3100. Prisma chặn AI chạy `migrate reset`, nên test tự TRUNCATE (chỉ cho phép trên localhost và tên DB đuôi `_test`) rồi seed lại. DB dev không bị đụng.
- npm 11 có `allowScripts`: đã cho phép install script của prisma, @prisma/engines, esbuild, @embedded-postgres/windows-x64, unrs-resolver.

**Còn tồn**
- Chuông thông báo mới là nút giữ chỗ (làm ở bước 8).

## Bước 2 – Admin: Quản lý đăng nhập ✅

**Đã làm**
- `/admin/tai-khoan`:
  - bảng Tên đăng nhập | Chức vụ | Tên người | Mật khẩu | Sửa
  - tìm theo tên hoặc tên đăng nhập, lọc theo chức vụ (qua URL `?q=&chucVu=`)
- Dialog Thêm/Sửa:
  - xem trước tên đăng nhập (sinh ở server, đã kiểm tra trùng)
  - nút Đặt lại mật khẩu (về 123456)
  - khi đổi tên thì báo tên đăng nhập mới cho admin
- Xóa: hộp xác nhận ghi "Xóa sẽ mất toàn bộ dữ liệu KPI của tài khoản này". Xóa luôn file minh chứng trên ổ đĩa.
- Server chặn: chỉ ADMIN; không tự xóa; không tự bỏ vai trò ADMIN; họ tên bỏ dấu rỗng → lỗi. Lỗi trùng unique (P2002) → thông báo tiếng Việt.
- Lớp lưu file `src/lib/storage` (ổ đĩa, `UPLOAD_DIR`) làm sớm để xóa tài khoản dọn được file.
- Test:
  - E2E `e2e/buoc-2-tai-khoan.spec.ts`: 9/9
  - Test tích hợp mới `tests/*.int.test.ts` (`npm run test:int`): gọi thẳng server action trên DB test, giả lập phiên. `tai-khoan.int.test.ts`: 4/4 (GV gọi action admin bị chặn, tự hạ chức/tự xóa bị chặn, gv.tranthibinh → tbm.tranthibinh)

**Tự chọn**
- Sửa mà không đổi họ tên hay chức vụ thì giữ nguyên tên đăng nhập. Có đổi thì sinh lại từ đầu (vd `gv.nguyenvannam2` lên TBM → `tbm.nguyenvannam` nếu còn trống).
- Tự đổi họ tên của chính admin thì được (tên đăng nhập đổi theo).
- Cột Mật khẩu hiện `••••••` khi không còn mật khẩu mặc định (v1.1 chưa có trường hợp này).

**Còn tồn**
- Không có.

## Bước 3 – Admin: Phân việc đầu kỳ ✅

**Đã làm**
- `/admin/phan-viec`: danh sách kỳ (ngày, số nhiệm vụ, trạng thái). Dialog Tạo kỳ gồm: tên, năm học, kỳ số 1–4, ngày bắt đầu/kết thúc, ô **Sao chép từ kỳ trước** (mặc định là kỳ gần nhất; có thể chọn "Không sao chép").
- `/admin/phan-viec/[kyId]`:
  - sửa ngày bắt đầu/kết thúc; hiện hạn đăng ký và deadline
  - nút **Công bố** (có xác nhận)
  - tab Nhiệm vụ & task: thêm/sửa/xóa, cảnh báo nhiệm vụ chưa có task bắt buộc
  - tab Bảng xếp loại: sửa cả bảng, lưu một lần
- Service `src/lib/services/phan-viec.ts`: sao chép kỳ và các hàm kiểm tra luật khóa.
- Server chặn:
  - chỉ ADMIN
  - kỳ đã chốt → khóa mọi thay đổi
  - không trùng (năm học, kỳ số); năm học dạng `2026-2027`; ngày kết thúc ≥ ngày bắt đầu
  - Công bố cần ≥1 nhiệm vụ và ≥1 bậc; kỳ đã công bố không xóa hết bậc
  - tên/ngưỡng bậc không trùng
  - A5: nhiệm vụ đã có đăng ký → không xóa, không sửa điểm; task đã có người làm/xin → không xóa, không đổi loại; không thêm task bắt buộc (hoặc đổi sang bắt buộc) trong nhiệm vụ đã có đăng ký Đã duyệt
- Test: tích hợp `tests/phan-viec.int.test.ts` 7/7; E2E `e2e/buoc-3-phan-viec.spec.ts` 5/5.

**Tự chọn**
- "Đã có GV đăng ký" tính mọi trạng thái đăng ký, kể cả Nháp (theo nghĩa đen của đặc tả, an toàn nhất).
- Chỉ sửa được ngày của kỳ; tên/năm học/kỳ số cố định sau khi tạo (đặc tả chỉ yêu cầu sửa ngày).
- Nút "Chốt kỳ ngay" làm ở bước 6.

**Còn tồn**
- Không có.
