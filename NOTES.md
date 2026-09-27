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

## Bước 4 – GV Đầu kỳ + TBM Duyệt đăng ký ✅

**Đã làm**
- Thư viện nghiệp vụ:
  - `src/lib/rules.ts`: bảng 9.1 + A1/A2; mỗi hàm trả lý do chặn, dùng chung cho server và giao diện
  - `src/lib/xep-loai.ts`
  - `src/lib/ky-hien-tai.ts`
  - `src/lib/thong-bao.ts`: `guiThongBao`, `tbmCuaBoMon`
  - `src/lib/nhan.ts`: nhãn trạng thái
- `/gv/dau-ky?kyId=`:
  - dropdown chọn kỳ (A4)
  - hiện hạn đăng ký/deadline, đồng hồ đếm ngược (tới hạn đăng ký; khi Bị từ chối thì tới deadline)
  - thẻ nhiệm vụ (điểm, task bắt buộc/mở rộng), tick để tự lưu
  - thanh tổng kết cố định: số nhiệm vụ, tổng điểm, xếp loại dự kiến
  - banner trạng thái kèm nhận xét TBM; nút Gửi có xác nhận
- `/tbm/duyet-dang-ky`: bảng Chờ duyệt + bảng Đã xử lý. `/tbm/duyet-dang-ky/[id]`: xem nhiệm vụ đã chọn, điểm, xếp loại; nút Duyệt (nhận xét tùy chọn) / Từ chối (bắt buộc nhận xét).
- Duyệt: tính lại điểm và xếp loại (mục 9.2), giao GvTask cho mọi task bắt buộc (Chưa làm), thông báo GV. Từ chối: thông báo GV. GV gửi: thông báo các TBM cùng bộ môn.
- Server chặn:
  - vai trò; TBM chỉ xử lý GV cùng bộ môn (khác bộ môn → 404)
  - luật thời gian theo 9.1 + A1 (kỳ chưa công bố hoặc đã chốt → chặn)
  - chuyển trạng thái bằng `updateMany where trangThai`; tick khóa dòng `DangKy` bằng `SELECT … FOR UPDATE`
- Test:
  - unit: `rules`, `xep-loai`, `ky-hien-tai` (tổng 20)
  - tích hợp `tests/dang-ky.int.test.ts`: 7/7 (gồm case phụ "ngày bắt đầu = hôm qua", "từ chối sau ngày bắt đầu vẫn gửi lại", hết deadline, kỳ chốt, TBM khác bộ môn)
  - E2E `e2e/buoc-4-dang-ky.spec.ts`: 5/5

**Tự chọn**
- Gửi lại sau khi bị từ chối thì xóa nhận xét cũ; khi duyệt, TBM ghi nhận xét tùy chọn.
- TBM thấy danh sách Chờ duyệt của mọi kỳ chưa chốt (có cột Kỳ), không cần chọn kỳ.
- Nút Gửi khóa trong lúc còn thao tác tick chưa lưu xong.

**Còn tồn / ghi chú kỹ thuật**
- Cảnh báo `pg` "client.query() when the client is already executing a query" đến từ bên trong Prisma 7 (query interpreter chạy song song trong transaction), không phải code dự án; vô hại với `pg` 8. Không nâng `pg` lên 9 cho tới khi Prisma sửa.

## Bước 5 – GV Cuối kỳ + TBM Duyệt task + Xin thêm task ✅

**Đã làm**
- `/gv/cuoi-ky?kyId=`:
  - chọn kỳ (kỳ cũ để xem lại)
  - chưa được duyệt thì hiện "Danh sách nhiệm vụ chưa được trưởng bộ môn duyệt"
  - khối tổng quan: biểu đồ tròn Recharts 4 phần (Đã duyệt/Chờ duyệt/Bị từ chối/Chưa làm) chỉ tính task bắt buộc, % ở giữa, xếp loại đăng ký, nhãn "+N task vượt", đếm ngược deadline
  - danh sách nhiệm vụ → task (cả task mở rộng đã được giao)
  - khu "Xin thêm task" (Xin làm / Đang chờ duyệt / Bị từ chối + Xin lại / Đã được giao)
- `/gv/cuoi-ky/task/[id]`:
  - form nộp minh chứng (Chưa làm / Bị từ chối → tạo lần nộp mới)
  - form sửa/thay minh chứng của lần nộp hiện tại (Chờ duyệt: bỏ file cũ, thêm file, sửa ghi chú/link)
  - Đã duyệt → khóa
  - lịch sử các lần nộp: file, thời gian, trạng thái, nhận xét và người duyệt
- Upload qua Route Handler:
  - `POST /api/gv-task/[id]/bai-nop`, `PATCH /api/bai-nop/[id]` (logic ở `src/lib/services/bai-nop.ts`)
  - kiểm tra đuôi file + 20MB + tối đa 10 file ở server (trình duyệt kiểm tra sớm); chặn request quá lớn theo Content-Length
  - lỗi DB → xóa file vừa ghi; bỏ file khi sửa → xóa file trên ổ đĩa
- `GET /api/files/[id]`:
  - quyền minh chứng: GV chủ, TBM cùng bộ môn, Admin
  - quyền giấy tờ (dùng ở bước 7): người gửi, người nhận, Admin
  - PDF/ảnh xem trực tiếp, loại khác và `?tai=1` thì tải về
  - header `nosniff`, `no-store`
- TBM:
  - `/tbm/duyet-task` + `/[baiNopId]` (xem file, ghi chú, link, lịch sử; Duyệt/Từ chối). Duyệt/từ chối đồng bộ `GvTask.trangThai`.
  - `/tbm/duyet-xin-them` (duyệt thì tạo GvTask mở rộng ở trạng thái Chưa làm)
- Thông báo: GV nộp / xin thêm → TBM; duyệt/từ chối task, yêu cầu → GV.
- Test:
  - unit `tien-do` 4
  - tích hợp: `bai-nop.int.test.ts` 7 (luật file, sửa khi Chờ duyệt, nộp lại tạo lần mới, Đã duyệt bị chặn, quyền tải file, xin thêm, hết deadline/kỳ chốt), `quyen-api.int.test.ts` 3 (Admin/TBM gọi API nộp/sửa → 403, chưa đăng nhập → 401)
  - E2E `e2e/buoc-5-cuoi-ky.spec.ts` 7/7

**Tự chọn**
- Tối đa 10 file mỗi lần nộp (B8). Sửa lần nộp hiện tại giữ nguyên thời điểm nộp ban đầu.
- Biểu đồ và nhãn "+N task vượt" chỉ đếm task mở rộng Đã duyệt; biểu đồ không vượt 100%.
- Phần trăm làm tròn 2 chữ số, hiển thị kiểu Việt (vd "14,3%").

**Còn tồn**
- Khối "Kết quả" sau khi chốt kỳ làm ở bước 6.

## Bước 6 – Chốt kỳ + kết quả ✅

**Đã làm**
- `src/lib/ket-qua.ts`: hàm thuần `tinhKetQuaGv` theo mục 9.3.
- `src/lib/services/chot-ky.ts`:
  - `chotKy(kyId)`: một transaction (timeout 120s); đặt `daChot` có điều kiện nên chạy hai lần không nhân đôi
  - tính cho mọi tài khoản đang là GV, upsert `KetQuaKy` (taskThieu/taskVuot lưu dạng JSON `{ten, nhiemVu}`)
  - thông báo cho GV và TBM
  - `chotCacKyQuaHan()`: chốt các kỳ đã công bố và quá deadline
- `POST /api/cron/chot-ky`:
  - header `Authorization: Bearer <CRON_SECRET>`, so sánh timing-safe; sai → 401
  - chốt kỳ quá hạn + gửi nhắc hạn (nhắc hạn hoàn thiện ở bước 8)
- Admin: nút **Chốt kỳ ngay** (có xác nhận) trên trang chi tiết kỳ; action `chotKyNgay`.
- GV `/gv/cuoi-ky`: khối Kết quả hiện cả kết quả thực hiện và xếp loại đăng ký, % hoàn thành, task còn thiếu (Không đạt) hoặc task đã làm vượt (Vượt chỉ tiêu). GV không có danh sách được duyệt → "Không đạt – F" + ghi chú. Sau chốt ẩn khu Xin thêm task.
- TBM `/tbm/ket-qua?kyId=` (mặc định kỳ đã chốt gần nhất): bảng kết quả từng GV (kết quả, xếp loại, %, task thiếu/vượt). Component `BangKetQua` dùng lại cho admin ở bước 8.
- Sửa nhỏ: các nút Công bố/Chốt tách khỏi form sửa ngày (tránh submit nhầm).
- Test:
  - unit `ket-qua` 6 (3 kịch bản mục 14, không đăng ký → F, Chờ duyệt tính chưa xong)
  - tích hợp `kich-ban-14.int.test.ts` 6: toàn bộ kịch bản mục 14 qua action thật → Không đạt – A1 (11 task thiếu), Đạt – C, Vượt chỉ tiêu – B (2 task vượt). Có thêm case phụ: GV không đăng ký → F + ghi chú, task Chờ duyệt khi chốt → thiếu, cron sai secret → 401, chưa quá hạn không chốt, chạy lại không chốt lại, sau chốt mọi thao tác bị chặn
  - E2E `buoc-6-kich-ban-14.spec.ts` 8/8: **toàn bộ kịch bản mục 14 qua giao diện** (đăng ký, duyệt, nộp ~60 minh chứng, xin thêm, Chốt kỳ ngay), kiểm tra kết quả ở GV, TBM, Admin

**Tự chọn**
- Chốt kỳ tính cho mọi tài khoản đang có vai trò GV (chỉ có 1 bộ môn). GV tạo sau khi chốt không có kết quả ("Kỳ đã chốt nhưng không có kết quả…").
- Thông báo "kỳ đã chốt" gửi cho mọi TBM.

**Còn tồn**
- Nhắc hạn 3 ngày / 7 ngày làm ở bước 8 (endpoint cron đã gọi sẵn `guiNhacHan`).
