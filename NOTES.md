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
