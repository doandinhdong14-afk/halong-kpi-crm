# NOTES – CRM KPI giáo viên (v1.4)

Ghi lại các quyết định cho chỗ đặc tả chưa rõ, những gì đã làm ở từng bước, và việc còn tồn.
Đặc tả: `docs/spec.md` (v1.4). Ghi chú của bản v1.1: `docs/notes-v1.1.md`.

## Cách làm bản v1.4 (đã duyệt 27/09/2026)
- Làm trên nhánh `v1.4`; bản v1.1 giữ nguyên trên `master`.
- Giữ hạ tầng v1.1: Next.js 16, Prisma 7, đăng nhập cookie tự làm, `src/lib/time.ts`, lớp `storage`, Postgres nhúng, khung test Vitest/Playwright, cấu hình Railway, trang `/gioi-thieu`. Toàn bộ phần nghiệp vụ viết lại theo v1.4.
- Bỏ qua mục "Thay đổi so với v1.3" của đặc tả (build mới).

## Quyết định đã duyệt

### Cần quyết (A)
| # | Vấn đề | Quyết định |
|---|---|---|
| A1 | 6.2 giấu danh sách đăng ký, task chưa gửi lên với người chốt; 6.3 lại cho báo cáo của TK/HP có các dữ liệu đó | Báo cáo làm đúng 6.3 (bảng tổng hợp, không kèm file). Giới hạn 6.2 chỉ áp cho màn hình Chốt và quyền mở file |
| A2 | Đổi chức vụ khi đang có KPI ở kỳ chưa chốt (nhiệm vụ theo vị trí cũ không còn khớp) | Kỳ đã chốt giữ nguyên (`KetQuaKy.doiTuong` lưu vị trí lúc chốt). Kỳ chưa chốt: hộp xác nhận ghi rõ dữ liệu KPI kỳ chưa chốt sẽ bị xóa; đồng ý thì xóa |
| A3 | "Chặn nút Gửi" khi thiếu người duyệt/chốt | Thiếu người duyệt **hoặc** người chốt → chặn Gửi đăng ký. Thiếu người chốt → chặn nút Gửi lên của người duyệt. Nộp minh chứng, xin thêm vẫn cho (có cảnh báo). Người mới được gán thấy ngay việc đang chờ |
| A4 | Thư viện PDF | pdfmake + font Noto Sans nhúng |

### Tự xử lý (B)
| # | Vấn đề | Quyết định |
|---|---|---|
| B5 | Bảng 10.1 dòng "gửi đăng ký lần đầu" không nhắc kỳ | Mọi thao tác ghi đều cần kỳ đã công bố và chưa chốt |
| B6 | Sửa sau khi bị từ chối mà về Nháp thì dính hạn đăng ký | Giữ trạng thái Bị từ chối trong lúc sửa (tự lưu); gửi → Chờ duyệt |
| B7 | "Kỳ hiện tại" làm kỳ sau chỉ đăng ký được đúng ngày bắt đầu | Dropdown chọn kỳ đã công bố ở Đầu kỳ, Cuối kỳ, Duyệt, Chốt, Báo cáo; mặc định kỳ hiện tại, không có thì kỳ công bố gần nhất |
| B8 | Người duyệt trả làm lại task bị trả về | Bài nộp gần nhất → Bị từ chối + nhận xét mới (nhận xét cũ vẫn trong `LichSuTask`). `nhanXetChot` = nhận xét trả về gần nhất; Chốt không có ô nhận xét |
| B9 | 12.3 cho HT "trả về" task HP, bảng 5.3 không có | HT chỉ có Chốt / Hủy duyệt với task HP đã duyệt. Nhãn: "Hiệu trưởng đã duyệt – chờ chốt"; lý do thiếu: "Đã duyệt nhưng chưa được chốt" |
| B10 | "Cũ nhất lên trước" theo mốc nào | Hàng chờ theo `KpiTask.capNhatLuc`; màn hình Chốt theo `guiChotLuc` |
| B11 | "x/y đã xem" có thể x > y | x chỉ đếm trong y người đang ở vị trí nhận. HT thấy mọi quy định đã ban hành |
| B12 | Mốc nhắc việc | Gửi khi còn ≤ N ngày, mỗi mốc 1 lần/người/kỳ (`ThongBao.maSuKien`). Deadline: người còn task bắt buộc chưa chốt. Chỉ gửi khi N > 0. Không báo cho chính người thao tác. "Kỳ đã chốt" → mọi GV, TBM, TK, HP, HT |
| B13 | Điều kiện công bố kỳ | ≥1 nhiệm vụ và đủ 4 bảng xếp loại (mỗi bảng ≥1 bậc). Nhiệm vụ không có task bắt buộc → 100%, admin thấy cảnh báo. Đã có người đăng ký/làm → khóa xóa, khóa sửa điểm, khóa đổi loại task |
| B14 | Minh chứng bắt buộc file? | ≥1 file mỗi lần nộp, tối đa 10 file; link phải http/https |
| B15 | Tên file/tiêu đề báo cáo | `BaoCao_<DonVi>_Ky<soKy>-<namHoc>_<YYYYMMDD>[_TamTinh]`; HP nhiều khoa → `CacKhoaPhuTrach`; tiêu đề "KỲ <soKy> NĂM HỌC <namHoc>" |
| B16 | Đơn vị khi đổi chức vụ | Tự gán: GV/TBM → bộ môn duy nhất, TK → khoa duy nhất, vai trò khác bỏ đơn vị. HP rời chức → khoa "chưa có hiệu phó" |
| B17 | Hạn đăng ký kỳ seed hết 23:59 ngày seed | Giữ đúng đặc tả; trước demo admin sửa ngày bắt đầu |
| B18 | Schema | Chỉnh chi tiết giữ ý nghĩa (xem đầu `prisma/schema.prisma`) |
| B19 | Cron chốt kỳ nào | Chỉ kỳ đã công bố; kỳ đã chốt khóa cả sửa ngày |

---

## Bước 1 – Khởi tạo, schema, seed, đăng nhập, menu ✅

**Đã làm**
- Schema viết lại theo 12.1 (`prisma/schema.prisma`), một migration khởi tạo mới `khoi_tao_v14` (bỏ migration v1.1). Chỉnh so với đặc tả:
  - Prisma 7 (`prisma-client`, URL ở `prisma.config.ts`); ngày kỳ `@db.Date`
  - thêm `YeuCauThemTask.kyId`, `ThongBao.maSuKien`, `KpiTask.capNhatLuc`, `KetQuaKy.doiTuong`
  - `onDelete: Restrict` ở `DangKyNhiemVu.nhiemVu`, `KpiTask.task`, `YeuCauThemTask.task`
  - unique `Ky(namHoc, soKy)`, `BacXepLoai(kyId, doiTuong, ten)`; thêm index
- Seed theo 12.4: 1 khoa (hiệu phó phụ trách `hp.tranthiphuong`), 1 bộ môn, 8 tài khoản, kỳ đã công bố (bắt đầu = ngày seed, kết thúc +30 ngày), 26 nhiệm vụ (GV 10, TBM 6, TK 5, HP 5; mỗi nhiệm vụ 2–3 task bắt buộc + 1 mở rộng), 4 bảng xếp loại A1…F.
- `src/lib/roles.ts` (thêm `DOI_TUONGS`, `chucDanh`, `laDoiTuong`), `src/lib/menu.ts` đúng bảng 2.1, `NguoiDung` có thêm `khoaId`.
- Màn hình dùng chung có một đường dẫn: `/dau-ky`, `/cuoi-ky`, `/duyet`, `/chot`, `/bao-cao`, `/giay-to`, `/quy-dinh`. Tạm thời là trang giữ chỗ, mỗi trang đã chặn vai trò ở server.
- Xóa code nghiệp vụ v1.1 (`/gv/*`, `/tbm/*`, `/ht/*`, service, test cũ). Code cũ xem lại trên `master`.
- Test: E2E `e2e/buoc-01-dang-nhap.spec.ts` 16/16 (8 tài khoản đúng menu + trang chủ; chặn route sai vai trò cho GV, TBM, HP, HT, Admin; sai mật khẩu; đăng xuất). Unit test cũ (`time`, `username`, `rules`, `xep-loai`, `ky-hien-tai`) 20/20.

**Tự chọn**
- **DB mới cho v1.4:** `crm_kpi_v14` (dev) và `crm_kpi_v14_test` (test). DB `crm_kpi`, `crm_kpi_test` của v1.1 giữ nguyên, không xóa (lệnh đổi tên/xóa DB bị chặn). `scripts/dev-db.mjs`, `.env`, `.env.example`, cấu hình Vitest/Playwright đã trỏ sang DB mới. Không cần cho v1.1 nữa thì bạn tự xóa 2 DB cũ.
- Trang chủ mỗi vai trò = mục menu đầu tiên (HT → Chốt task trưởng khoa).

**Còn tồn**
- Không có.

## Bước 2 – nguoiDuyet, nguoiChot, lọc phạm vi theo đơn vị ✅

**Đã làm**
- `src/lib/kpi/chuoi.ts`: **bảng cấu hình chuỗi duyệt – chốt** duy nhất (vị trí → vai trò người duyệt, người chốt, cờ `gopDuyetChot` cho HP), `viTriDuocDuyet`, `viTriDuocChot`, `PHAM_VI_BAO_CAO`.
- `src/lib/co-cau.ts` (hàm thuần trên ảnh chụp cơ cấu):
  - `nguoiDuyet(u)`, `nguoiChot(u)`: cùng một hàm tra "người giữ vai trò R phụ trách u" (TBM cùng bộ môn, TK cùng khoa, HP của khoa, HT)
  - `lyDoThieuNguoi`, `lyDoKhongGuiDangKy` (A3: thiếu người duyệt hoặc người chốt → chặn gửi)
  - `nguoiToiDuyet(m)`, `nguoiToiChot(m)`: lọc ngược bằng chính `nguoiDuyet`/`nguoiChot` nên luôn khớp nhau
  - `phamViBaoCao(m)` (mục 6.3), `tenDonVi(u)`, `canhBaoThieuNguoi()` (cho trang Xem cấu hình)
- `src/lib/services/co-cau.ts`: `taiCoCau(tx)` tải cơ cấu hiện tại từ DB; `layCoCau()` cache theo request cho page.
- Test:
  - unit `src/lib/co-cau.test.ts` 16 test: đủ 4 vị trí; HT/Admin không có người duyệt; thiếu TBM / TK / HP / HT; `hieuPhoId` trỏ tới người không còn là HP; cảnh báo admin; dữ liệu giả 2 khoa để kiểm tra lọc đơn vị (người duyệt/chốt, người mình duyệt/chốt, phạm vi báo cáo, tên đơn vị)
  - tích hợp `tests/co-cau.int.test.ts` trên seed

**Tự chọn**
- Người chốt trên màn hình Chốt không gồm HP: HT chốt task HP ngay trên màn hình Duyệt (mục 6.1, 7.5).
- Tên đơn vị của HP là danh sách khoa phụ trách; chưa phụ trách khoa nào → "Chưa phụ trách khoa nào".

**Còn tồn**
- Không có.

## Bước 3 – Admin: Quản lý đăng nhập ✅

**Đã làm**
- `/admin/tai-khoan`: bảng Tên đăng nhập | Chức vụ | Tên người | Mật khẩu | Sửa; dưới chức vụ ghi đơn vị (bộ môn / khoa / "Phụ trách: …" với hiệu phó); tìm theo tên, lọc theo chức vụ.
- Dialog Thêm/Sửa: xem trước tên đăng nhập (sinh ở server); chức vụ Hiệu phó có ô chọn nhiều **Khoa phụ trách** (chỉ khoa chưa có hiệu phó + khoa người đó đang phụ trách, khoa của hiệu phó khác ghi rõ tên); nút Đặt lại mật khẩu; đổi tên đăng nhập thì báo tên mới.
- `src/lib/services/tai-khoan.ts`:
  - `donViTheoVaiTro` (B16): GV/TBM → bộ môn duy nhất, TK → khoa duy nhất, còn lại bỏ đơn vị
  - `kiemTraGioiHan` (2.4): 1 TBM/bộ môn, 1 TK/khoa, 1 HT; lỗi ghi rõ người đang giữ chức
  - `ganKhoaPhuTrach`: khoa đã có hiệu phó khác → chặn; cập nhật có điều kiện
  - `soKyCoKpiChuaChot`, `xoaKpiKyChuaChot` (A2)
- Server chặn: chỉ ADMIN; không tự xóa, không tự hạ chức; đổi chức vụ khi có KPI ở kỳ chưa chốt phải có `xacNhanXoaKpi` (dialog hiện cảnh báo + ô tick bắt buộc); hiệu phó rời chức → các khoa thành "chưa có hiệu phó"; xóa tài khoản xóa luôn file minh chứng trên ổ đĩa. Thêm/sửa chạy tuần tự bằng `pg_advisory_xact_lock` để hai admin không vượt giới hạn cùng lúc.
- Test:
  - tích hợp `tests/tai-khoan.int.test.ts` 10: quyền, tự hạ chức/tự xóa, gán đơn vị, 4 case phụ "cơ cấu và tài khoản" mục 15 (đổi `gv.tranthibinh` lên TBM bị chặn → hạ `tbm.phamthibich` → lên được `tbm.tranthibinh`; xóa HP → TBM/TK bị chặn gửi + admin có cảnh báo; tạo HP mới gán khoa → chạy lại; GV trùng tên → số 2), giới hạn TK/HT/HP, A2
  - E2E `e2e/buoc-03-tai-khoan.spec.ts` 6/6

**Tự chọn**
- Hiệu phó được phép không phụ trách khoa nào (nhiều hiệu phó được phép).
- Sửa mà không đổi họ tên hay chức vụ thì giữ nguyên tên đăng nhập.
- `pg_advisory_xact_lock` trả kiểu `void` mà adapter pg của Prisma không đọc được → gọi dạng `SELECT 1 FROM pg_advisory_xact_lock(...)`.

**Còn tồn**
- Không có.

## Bước 4 – Admin: Phân việc đầu kỳ (4 vị trí) ✅

**Đã làm**
- `/admin/phan-viec`: danh sách kỳ, cột "Số nhiệm vụ (GV · TBM · TK · HP)". Dialog Tạo kỳ: tên, năm học, kỳ số 1–4, ngày bắt đầu/kết thúc, **Sao chép từ kỳ trước** (chép nhiệm vụ, task, bảng xếp loại cả 4 vị trí).
- `/admin/phan-viec/[kyId]?viTri=gv|tbm|tk|hp`:
  - khối thông tin kỳ: sửa ngày, hạn đăng ký/deadline, nút **Công bố** (có xác nhận); chưa công bố được thì ghi rõ lý do
  - 4 tab vị trí **Giáo viên | Trưởng bộ môn | Trưởng khoa | Hiệu phó** (kèm số nhiệm vụ, biểu tượng cảnh báo nếu vị trí chưa có bảng xếp loại)
  - trong mỗi vị trí: tab Nhiệm vụ & task (thêm/sửa/xóa, cảnh báo nhiệm vụ chưa có task bắt buộc) và tab Bảng xếp loại (sửa cả bảng, lưu một lần)
- `src/lib/services/phan-viec.ts`: `layKyChuaChot`, `saoChepKy`, `lyDoChuaCongBoDuoc` (B13), các hàm kiểm tra khóa.
- Server chặn: chỉ ADMIN; vị trí phải là GV/TBM/TK/HP; kỳ đã chốt khóa mọi thay đổi (kể cả sửa ngày); trùng (năm học, kỳ số); ngày kết thúc ≥ ngày bắt đầu; công bố cần ≥1 nhiệm vụ và đủ 4 bảng xếp loại; kỳ đã công bố không xóa hết bậc của một vị trí; tên/ngưỡng bậc không trùng trong một vị trí; nhiệm vụ đã có người đăng ký (mọi trạng thái) → không xóa, không sửa điểm; task đã có người làm/xin → không xóa, không đổi loại; nhiệm vụ đã có đăng ký Đã duyệt → không thêm task bắt buộc.
- Test: tích hợp `tests/phan-viec.int.test.ts` 8; E2E `e2e/buoc-04-phan-viec.spec.ts` 4/4.

**Tự chọn**
- Chỉ sửa được ngày của kỳ; tên, năm học, kỳ số cố định sau khi tạo.
- Công bố là một chiều. Nút "Chốt kỳ ngay" làm ở bước 8.

**Sự cố trong bước**
- Trong lúc làm bước 4, `.gitignore` bị một tiến trình bên ngoài ghi đè bằng mẫu chung (mất các dòng `/.devdb`, `/.next`, `/src/generated`…), khiến commit bước 4 lần đầu dính ~3.700 file rác (DB dev, cache build; không có `.env`). Đã làm lại commit bước 4 (commit chưa push) và khôi phục `.gitignore` gốc, giữ thêm các dòng mới (`dist/`, `__pycache__/`, `.venv/`). Không file nào trên đĩa bị xóa.

**Còn tồn**
- Không có.

## Bước 5 – Luồng KPI chung: Đầu kỳ + màn hình Duyệt tab Đăng ký ✅

**Đã làm**
- `src/lib/rules.ts` viết lại chung cho mọi cấp (bảng 10.1 + B5, B6).
- `src/lib/services/dang-ky.ts` (một bộ code cho GV, TBM, TK, HP):
  - `chonNhiemVu`: chỉ nhiệm vụ đúng vị trí mình; tạo Nháp, khóa dòng `DangKy` (`FOR UPDATE`) rồi kiểm tra luật
  - `guiDangKy`: ≥1 nhiệm vụ; A3 (thiếu người duyệt hoặc người chốt → chặn); tính điểm/xếp loại theo bảng đúng vị trí; báo người duyệt
  - `duyetDangKy` / `tuChoiDangKy`: chỉ người duyệt theo `nguoiDuyet()` (khác → 404); tính lại điểm/xếp loại; duyệt thì giao task bắt buộc (Chưa làm); từ chối bắt buộc nhận xét
- `/dau-ky?kyId=`: một trang cho 4 vị trí; nhãn nút "Gửi lên <chức danh người duyệt>" lấy từ bảng cấu hình chuỗi; banner thiếu người (A3) và khóa nút Gửi; dropdown chọn kỳ (B7, `src/lib/services/ky.ts`).
- Màn hình Duyệt dùng chung `/duyet?kyId=&tab=tong-quan|hang-cho`:
  - tiêu đề theo menu ("Duyệt giáo viên", "Duyệt trưởng bộ môn", "Duyệt trưởng khoa", "Duyệt & chốt hiệu phó")
  - ô đếm (đăng ký chờ duyệt, task chờ duyệt, đã duyệt chưa gửi lên/chưa chốt, chờ chốt, bị trả về, xin thêm chờ duyệt); với HT → HP ẩn các ô/cột không dùng (Chờ chốt, Bị trả về) và "Chưa gửi lên" đổi thành "Chưa chốt"
  - bảng người (`src/lib/services/duyet.ts`): chỉ người mà mình là người duyệt
- `/duyet/[nguoiId]?kyId=&tab=dang-ky|task|xin-them`: người không thuộc phạm vi duyệt → 404. Tab Đăng ký: nhiệm vụ đã chọn, điểm, xếp loại → Duyệt / Từ chối (bắt buộc nhận xét).
- `src/lib/thong-bao.ts`: `guiThongBao(tx, nguoiNhan, noiDung, { link, maSuKien, tru })` (bỏ người thao tác – B12) + `LINK` các đường dẫn trong thông báo. `src/lib/validate.ts`: `NhanXetBatBuoc`, `NhanXetTuyChon`.
- Test: tích hợp `tests/dang-ky.int.test.ts` 11 (4 vị trí → đúng người duyệt, người khác/người chốt không duyệt được, giao đúng task bắt buộc, thông báo; nhiệm vụ sai vị trí; HT/Admin bị chặn; 2 case phụ về ngày; từ chối bắt buộc nhận xét; hết deadline; kỳ chốt; A3 khi khoa chưa có hiệu phó); E2E `e2e/buoc-05-dau-ky.spec.ts` 6/6.

**Tự chọn**
- Gửi lại sau khi bị từ chối thì xóa nhận xét cũ; khi duyệt, nhận xét tùy chọn.
- Người duyệt thấy tab Đăng ký "Chưa gửi danh sách đăng ký" khi người đó còn Nháp (danh sách chỉ lên người duyệt khi đã gửi).

**Còn tồn**
- Tab Hàng chờ, tab Task và minh chứng, tab Xin thêm task: bước 6.
