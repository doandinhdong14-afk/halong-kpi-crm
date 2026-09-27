# CRM chấm KPI giáo viên – ĐH Hạ Long

> **Phiên bản:** v1.4 – 27/09/2026
> **Mục tiêu bản này:** demo chạy trọn **1 luồng** (1 khoa, 1 bộ môn, 3 giáo viên) với **đủ 6 vai trò**: Admin, Giáo viên, Trưởng bộ môn, Trưởng khoa, Hiệu phó, Hiệu trưởng.

---

## 0. Hướng dẫn cho Claude Code

1. Đọc hết file trước khi code. Làm theo **thứ tự build ở mục 13**, xong mỗi bước chạy thử được mới sang bước sau.
2. **Mọi kiểm tra quyền và hạn thời gian phải làm ở server** (API/server action), không chỉ ẩn nút ở giao diện.
3. Không làm những gì ghi ở **mục 14 – Ngoài phạm vi**.
4. Toàn bộ giao diện **tiếng Việt**. Múi giờ **Asia/Ho_Chi_Minh**.
5. Chỗ nào file này không nói rõ: chọn cách đơn giản nhất, ghi lại vào `NOTES.md`.
6. **Viết theo kiểu dùng chung:** luồng KPI, màn hình Duyệt, màn hình Chốt, Xuất báo cáo là **một bộ code** chạy cho mọi cấp, chỉ khác tham số (ai duyệt, ai chốt, phạm vi). Không copy code riêng cho từng vai trò.
7. Nếu đã build theo bản cũ: đọc mục **"Thay đổi so với v1.3"** để sửa, không làm lại từ đầu.

### Thay đổi so với v1.3
- **Chuỗi duyệt – chốt 4 cấp** (mục 3.2). Mỗi cấp làm KPI của mình, duyệt cấp ngay dưới, chốt cấp dưới 2 bậc.
  - Task của **TBM** không còn "trưởng khoa duyệt là chốt luôn": giờ **TK duyệt → HP chốt**.
- **Trưởng khoa, Hiệu phó** thành vai trò đầy đủ (có KPI riêng). **Hiệu trưởng** thành vai trò đầy đủ (không làm KPI).
- Đối tượng nhiệm vụ / bảng xếp loại mở rộng thành **4 vị trí**: GV, TBM, TK, HP.
- Đổi tên trạng thái `TK_TRA_VE` → `TRA_VE`; hành động `TK_TRA_VE` → `TRA_VE`.
- Đổi tên trường `KpiTask`: `nhanXetTk` → `nhanXetChot`, `tkId` → `nguoiChotId`, `guiTkLuc` → `guiChotLuc`, `tkChotLuc` → `chotLuc`.
- Thêm `Khoa.hieuPhoId` (hiệu phó phụ trách khoa), admin gán trong form tài khoản hiệu phó.
- Mỗi bộ môn tối đa **1 TBM**, mỗi khoa tối đa **1 TK**, toàn trường tối đa **1 HT**.
- "Ban hành giấy tờ" đổi tên thành **"Ban hành quy định"**, gửi **theo vị trí** (tick vị trí, không chọn từng người). Bỏ model `VanBanNguoiNhan`, thay bằng `VanBan.viTriNhan` + `VanBanDaXem`.
- Xuất báo cáo có ở **TBM, TK, HP, HT** với phạm vi khác nhau.

---

## 1. Công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Database | PostgreSQL + Prisma |
| Đăng nhập | Auth.js (Credentials) hoặc session cookie tự làm, ưu tiên đơn giản; mật khẩu hash bcrypt |
| Giao diện | Tailwind CSS + shadcn/ui |
| Biểu đồ | Recharts (biểu đồ tròn) |
| Xuất Excel | exceljs |
| Xuất PDF | @react-pdf/renderer hoặc pdfmake, **bắt buộc nhúng font có tiếng Việt** (Noto Sans / Roboto) |
| Lưu file | Ổ đĩa server, thư mục `UPLOAD_DIR` (Railway Volume), viết qua 1 lớp `storage` để sau dễ đổi |
| Deploy | Railway (app + PostgreSQL + Volume + Cron) |

**Biến môi trường:** `DATABASE_URL`, `AUTH_SECRET`, `UPLOAD_DIR`, `CRON_SECRET`, `TZ=Asia/Ho_Chi_Minh`

---

## 2. Vai trò và tài khoản

### 2.1 Vai trò và menu
| Mã | Vai trò | Tiền tố | Menu |
|---|---|---|---|
| ADMIN | Admin | `admin.` | Quản lý đăng nhập · Phân việc đầu kỳ · Nhận chỉ thị của hiệu trưởng · Xem cấu hình |
| GV | Giáo viên | `gv.` | Đầu kỳ · Cuối kỳ · Nhận giấy tờ |
| TBM | Trưởng bộ môn | `tbm.` | Đầu kỳ · Cuối kỳ · Duyệt giáo viên · Xuất báo cáo · Nhận giấy tờ |
| TK | Trưởng khoa | `tk.` | Đầu kỳ · Cuối kỳ · Duyệt trưởng bộ môn · Chốt task giáo viên · Xuất báo cáo · Nhận giấy tờ |
| HP | Hiệu phó | `hp.` | Đầu kỳ · Cuối kỳ · Duyệt trưởng khoa · Chốt task trưởng bộ môn · Xuất báo cáo · Nhận giấy tờ |
| HT | Hiệu trưởng | `ht.` | Chốt task trưởng khoa · Duyệt & chốt hiệu phó · Ban hành quy định · Xuất báo cáo |

Header chung: tên, vai trò, chuông thông báo, đăng xuất. Mỗi tài khoản có **đúng 1 vai trò**.

### 2.2 Quy tắc tên đăng nhập
- Dạng `<tiền tố>.<họ tên không dấu, viết thường, viết liền>`. Ví dụ "Nguyễn Văn Nam", GV → `gv.nguyenvannam`.
- Bỏ dấu tiếng Việt, `đ` → `d`, bỏ khoảng trắng và ký tự đặc biệt.
- Trùng thì thêm số từ 2: `gv.nguyenvannam2`, `gv.nguyenvannam3`…
- **Đổi chức vụ thì đổi tiền tố**: `gv.nguyenvannam` lên TBM → `tbm.nguyenvannam` (kiểm tra trùng lại), hiện thông báo tên đăng nhập mới cho admin.
- Đổi họ tên thì tên đăng nhập tạo lại theo quy tắc trên.

### 2.3 Mật khẩu (tạm cho demo)
- Mọi tài khoản mới có mật khẩu mặc định **`123456`**, vẫn lưu **hash bcrypt**.
- Cột "Mật khẩu" ở trang Quản lý đăng nhập hiển thị `123456` khi `isDefaultPassword = true`.
- Admin có nút **Đặt lại mật khẩu** (về `123456`). Người dùng **không tự đổi** mật khẩu.

### 2.4 Cơ cấu tổ chức
- Seed sẵn **1 khoa + 1 bộ môn**. Không làm giao diện quản lý khoa/bộ môn.
- Gắn tài khoản vào đơn vị:

| Vai trò | Gắn vào | Cách gán ở demo |
|---|---|---|
| GV, TBM | 1 bộ môn (`boMonId`) | Tự gán vào bộ môn duy nhất |
| TK | 1 khoa (`khoaId`) | Tự gán vào khoa duy nhất |
| HP | Nhiều khoa phụ trách (`Khoa.hieuPhoId`) | Admin chọn "Khoa phụ trách" trong form tài khoản hiệu phó |
| HT, ADMIN | Toàn trường | – |

- **Giới hạn:** mỗi bộ môn tối đa **1 TBM**, mỗi khoa tối đa **1 TK** và **1 HP phụ trách**, toàn trường tối đa **1 HT**. Admin tạo/đổi chức vụ vi phạm → chặn, báo lỗi rõ (vd "Bộ môn này đã có trưởng bộ môn").
- Nhiều hiệu phó được, mỗi người phụ trách các khoa khác nhau.
- Mọi logic luôn lọc theo đơn vị để sau mở rộng nhiều khoa/bộ môn không phải sửa.

---

## 3. Khái niệm nghiệp vụ

### 3.1 Người làm KPI
**GV, TBM, TK, HP** đều làm KPI theo **một luồng chung** (mục 5). **HT không làm KPI.**

### 3.2 Chuỗi duyệt – chốt
| Người làm KPI | Người duyệt | Người chốt |
|---|---|---|
| GV | TBM cùng bộ môn | TK cùng khoa |
| TBM | TK cùng khoa | HP phụ trách khoa đó |
| TK | HP phụ trách khoa đó | HT |
| HP | HT | HT (**2 nút riêng**: Duyệt rồi Chốt, không có bước gửi lên) |

Viết 2 hàm dùng chung:
```
nguoiDuyet(u):
  GV  → user role TBM, boMonId = u.boMonId
  TBM → user role TK,  khoaId = khoa của bộ môn u
  TK  → khoa(u.khoaId).hieuPho
  HP  → user role HT
nguoiChot(u):
  GV  → user role TK,  khoaId = khoa của bộ môn u
  TBM → khoa của bộ môn u → hieuPho
  TK  → user role HT
  HP  → user role HT
```
Không tìm thấy người duyệt/chốt → hiện "Chưa có <chức danh> phụ trách, vui lòng liên hệ admin" và **chặn nút Gửi**. Trang Xem cấu hình của admin hiện cảnh báo đơn vị nào đang thiếu người.

### 3.3 Duyệt, Chốt, Treo
- **Duyệt:** người duyệt chấp nhận minh chứng. **Chưa được tính.**
- **Chốt:** người chốt xác nhận cuối cùng. **Chỉ task đã chốt mới được tính "hoàn thành".**
- **Đang treo:** đã duyệt nhưng chưa chốt.
- Phân biệt: **chốt task** (việc của người chốt) khác **chốt kỳ** (hệ thống tự khóa kỳ và tính kết quả khi hết deadline).

### 3.4 Kỳ
- 1 năm học có **4 kỳ**, mỗi kỳ có ngày bắt đầu, ngày kết thúc.
- **Hạn đăng ký** = 23:59:59 **ngày bắt đầu** kỳ.
- **Deadline** = 23:59:59 **ngày kết thúc** kỳ. **Hết deadline là mọi người đều bị khóa**, không ai nộp, duyệt, gửi, chốt được nữa.
- Kỳ có cờ **Công bố**: người làm KPI chỉ thấy kỳ đã công bố.

### 3.5 Nhiệm vụ, task, xếp loại
- **Nhiệm vụ:** Admin tạo trong từng kỳ, mỗi nhiệm vụ có **điểm** và **đối tượng** (GV / TBM / TK / HP). Mỗi vị trí chỉ thấy nhiệm vụ của vị trí mình. Không có nhiệm vụ bắt buộc.
- **Task:** đầu việc trong nhiệm vụ, Admin tạo, 2 loại:
  - **Bắt buộc:** tự giao khi danh sách đăng ký được duyệt.
  - **Mở rộng:** phải **xin thêm** mới được làm, dùng để **làm vượt**.
- **Bảng xếp loại (A1…F):** theo từng kỳ và **từng vị trí** (4 bảng). Xếp loại đăng ký = bậc cao nhất mà tổng điểm nhiệm vụ đã chọn ≥ điểm tối thiểu.
- **Minh chứng:** PDF, JPG, PNG, DOC/DOCX, XLS/XLSX, tối đa **20MB/file**, nhiều file/lần nộp, kèm ghi chú và link (không bắt buộc).
- Mọi người làm KPI **độc lập với nhau**, chọn trùng nhiệm vụ không sao.

---

## 4. Dòng thời gian một kỳ

```
Admin tạo kỳ + nhiệm vụ + task + bảng xếp loại (4 vị trí) → Công bố
        │
        ▼
[Đến hết NGÀY BẮT ĐẦU] Người làm KPI chọn nhiệm vụ → Gửi → NGƯỜI DUYỆT duyệt / từ chối
        │   (bị từ chối: được sửa và gửi lại đến hết DEADLINE)
        ▼
[Trong kỳ]
  GV / TBM / TK: nộp minh chứng → người duyệt DUYỆT / từ chối
                 → người duyệt GỬI LÊN từng task → người chốt CHỐT (mới tính) / trả về người duyệt
  HP:            nộp minh chứng → HT DUYỆT / từ chối → HT CHỐT (mới tính)
  Xin thêm task mở rộng → người duyệt duyệt → làm như task thường (cũng phải được chốt mới tính)
        │
        ▼
[Hết NGÀY KẾT THÚC] Khóa tất cả → tự chốt kỳ → tính kết quả GV, TBM, TK, HP
                    (task chưa được chốt = không tính)
```

---

## 5. Luồng KPI chung (GV, TBM, TK, HP)

Người làm KPI có 2 mục **Đầu kỳ** và **Cuối kỳ**. "Người duyệt", "người chốt" lấy theo mục 3.2.

### 5.1 Đầu kỳ – Đăng ký nhiệm vụ

**Hiển thị**
- Tên kỳ, hạn đăng ký, đồng hồ đếm ngược.
- Thẻ nhiệm vụ (đúng vị trí của mình): tên, mô tả, điểm, danh sách task (ghi rõ bắt buộc / mở rộng), ô tick chọn.
- Thanh tổng kết cố định: **số nhiệm vụ đã chọn – tổng điểm – xếp loại dự kiến** (cập nhật ngay khi tick).
- Nút **"Gửi lên <chức danh người duyệt>"**.
- Banner trạng thái + nhận xét của người duyệt.

**Trạng thái danh sách đăng ký**
| Trạng thái | Người làm KPI làm được | Điều kiện thời gian |
|---|---|---|
| Nháp | Tick/bỏ tick (tự lưu), Gửi | Đến hết hạn đăng ký. Quá hạn → khóa |
| Chờ duyệt | Chỉ xem | – |
| Bị từ chối | Xem nhận xét, sửa, gửi lại | Đến hết deadline |
| Đã duyệt | Chỉ xem (khóa) | – |

**Luật**
- Phải chọn ít nhất 1 nhiệm vụ mới gửi được.
- Khi gửi: lưu `tongDiem`, `xepLoai` theo bảng xếp loại đúng vị trí.
- Danh sách đăng ký **chỉ lên người duyệt**, không lên người chốt.
- Người duyệt duyệt/từ chối **cả danh sách**, từ chối bắt buộc có nhận xét.
- Đã duyệt thì không đổi nhiệm vụ được nữa. Hệ thống tạo các task **bắt buộc** của các nhiệm vụ đã chọn (trạng thái Chưa làm).

### 5.2 Cuối kỳ – Làm task và kết quả

**Chọn kỳ:** dropdown, mặc định kỳ hiện tại; chọn kỳ cũ để xem lại (chỉ xem).

**Chưa được duyệt danh sách:** hiện "Danh sách nhiệm vụ chưa được duyệt".

**Khối tổng quan**
- **Biểu đồ tròn** các task **bắt buộc**, 5 phần: **Đã chốt** / **Đang treo** / **Chờ duyệt** / **Bị từ chối** (gồm cả bị trả về) / **Chưa làm**.
- Giữa biểu đồ: **% hoàn thành** = task bắt buộc **đã chốt** / tổng task bắt buộc.
- Dòng phụ: **"Đang treo: N task"**.
- Xếp loại đăng ký.
- Nhãn phụ **"+N task vượt"** (task mở rộng **đã chốt**), không làm biểu đồ quá 100%.
- Đếm ngược đến deadline.

**Danh sách nhiệm vụ → task** kèm trạng thái (mục 5.3).

**Chi tiết task:** tên, mô tả, khu vực tải file, ghi chú, link, **lịch sử** (các lần nộp, file, thời gian, trạng thái, nhận xét của người duyệt).

**Xin thêm task (làm vượt)**
- Liệt kê các task **mở rộng** thuộc **các nhiệm vụ đã được duyệt** của mình.
- Bấm **Xin làm** → người duyệt duyệt → task thêm vào danh sách (Chưa làm), đi đúng vòng trạng thái. Phải **được chốt** mới tính là vượt.

**Sau khi chốt kỳ – khối Kết quả**
| Kết quả | Hiển thị |
|---|---|
| Không đạt | **Không đạt – A1** + danh sách task còn thiếu, mỗi task kèm lý do (mục 5.4) |
| Đạt | **Đạt – B** |
| Vượt chỉ tiêu | **Vượt chỉ tiêu – A1** + danh sách task làm vượt (đã chốt) |

Luôn hiện cả kết quả thực hiện + xếp loại đăng ký. Không gộp, không hạ bậc. Người làm KPI chỉ thấy **kết quả cuối cùng**.

### 5.3 Trạng thái task

**Task của GV, TBM, TK** (người duyệt ≠ người chốt)

| Mã | Ý nghĩa | Được tính | Người làm KPI thấy | Người làm KPI | Người duyệt | Người chốt |
|---|---|---|---|---|---|---|
| `CHUA_LAM` | Chưa nộp | ✘ | Chưa làm | Nộp | – | Không thấy |
| `CHO_DUYET` | Chờ duyệt | ✘ | Chờ duyệt | Sửa bài nộp hiện tại | Duyệt / Từ chối | Không thấy |
| `TU_CHOI` | Người duyệt trả về | ✘ | Bị từ chối + nhận xét | Nộp lại | – | Không thấy |
| `DA_DUYET` | Đã duyệt, chưa gửi lên | ✘ **treo** | `<Người duyệt>` đã duyệt – chờ `<người chốt>` chốt | – | **Hủy duyệt** (→ `CHO_DUYET`), **Gửi lên** | Không thấy |
| `CHO_CHOT` | Đã gửi, chờ chốt | ✘ **treo** | `<Người duyệt>` đã duyệt – chờ `<người chốt>` chốt | – | Xem | **Chốt** / **Trả về** |
| `DA_CHOT` | Đã chốt | **✔** | Đã chốt – hoàn thành | – | Xem | Xem |
| `TRA_VE` | Người chốt trả về người duyệt | ✘ | `<Người chốt>` trả về – chờ `<người duyệt>` xử lý | – | Trả người làm KPI làm lại (→ `TU_CHOI`, nhập nhận xét) **hoặc** Duyệt lại (→ `DA_DUYET`) rồi gửi lại | Xem |

(Ví dụ nhãn cho GV: "Trưởng bộ môn đã duyệt – chờ trưởng khoa chốt".)

**Task của HP** (HT vừa duyệt vừa chốt, **2 nút**, không có bước gửi lên)

| Mã | Ý nghĩa | Được tính | HP làm được | HT làm được |
|---|---|---|---|---|
| `CHUA_LAM` | Chưa nộp | ✘ | Nộp | – |
| `CHO_DUYET` | Chờ HT duyệt | ✘ | Sửa bài nộp hiện tại | Duyệt / Từ chối |
| `TU_CHOI` | HT trả về | ✘ | Nộp lại | – |
| `DA_DUYET` | HT đã duyệt, chưa chốt | ✘ **treo** | – | **Chốt** / Hủy duyệt (→ `CHO_DUYET`) |
| `DA_CHOT` | HT đã chốt | **✔** | – | Xem |

**Luật**
- **Chỉ `DA_CHOT` được tính "hoàn thành"**, cho mọi người làm KPI.
- Người chốt trả về thì task quay về **người duyệt trước**. Người làm KPI chỉ thấy trạng thái. Nhận xét của người chốt **chỉ người duyệt thấy**; nếu người duyệt trả người làm KPI làm lại thì người duyệt viết nhận xét riêng.
- Người duyệt **gửi lên từng task một**, **trong kỳ**.
- Hủy duyệt chỉ được khi task ở `DA_DUYET`. Đã chốt thì không ai sửa được.
- Mọi hành động ghi vào `LichSuTask`.

### 5.4 Lý do task còn thiếu
Lấy theo trạng thái lúc chốt kỳ:
| Trạng thái | Lý do hiển thị |
|---|---|
| `CHUA_LAM` | Chưa nộp minh chứng |
| `TU_CHOI` | Bị từ chối, chưa nộp lại |
| `CHO_DUYET` | Chờ duyệt, chưa được duyệt kịp |
| `DA_DUYET` | Đã duyệt nhưng chưa gửi lên / chưa được chốt |
| `CHO_CHOT` | Chờ chốt, chưa được chốt kịp |
| `TRA_VE` | Bị cấp chốt trả về, chưa xử lý xong |

---

## 6. Màn hình dùng chung cho cấp quản lý

Viết **1 bộ component** cho mỗi màn hình, truyền tham số theo vai trò.

### 6.1 Màn hình Duyệt
Dùng cho: **TBM → GV**, **TK → TBM**, **HP → TK**, **HT → HP** (mục "Duyệt & chốt hiệu phó").
Chỉ thấy những người mà mình là **người duyệt** (mục 3.2).

**Tab Tổng quan**
- Ô đếm: danh sách đăng ký chờ duyệt, task chờ duyệt, task đã duyệt chưa gửi lên, task chờ chốt, task bị trả về, yêu cầu xin thêm chờ duyệt.
- Bảng người:

| Họ tên | Đăng ký (trạng thái, xếp loại) | % hoàn thành | Chờ duyệt | Chưa gửi lên | Chờ chốt | Bị trả về | Xin thêm chờ duyệt | |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | Xem |

- Sau khi chốt kỳ: thêm cột kết quả (Không đạt/Đạt/Vượt + xếp loại).

**Tab Hàng chờ:** tất cả task `CHO_DUYET`, `TRA_VE`, `DA_DUYET` của mọi người mình duyệt, cũ nhất lên trước, bấm vào xử lý ngay.

**Trang chi tiết 1 người**, 3 tab:
1. **Đăng ký nhiệm vụ:** các nhiệm vụ đã chọn, tổng điểm, xếp loại → **Duyệt** / **Từ chối** (bắt buộc nhận xét).
2. **Task và minh chứng:** lọc theo trạng thái. Mỗi task mở ra:
   - **Xem minh chứng:** PDF và ảnh xem ngay trên trang, Word/Excel tải về. Kèm ghi chú, link, lịch sử.
   - Nút theo mục 5.3: Duyệt / Từ chối + nhận xét, Hủy duyệt, **Gửi lên**, xử lý task bị trả về (thấy nhận xét của người chốt).
   - **Riêng HT duyệt HP:** không có "Gửi lên", thay bằng nút **Chốt** ngay trên task `DA_DUYET`.
3. **Xin thêm task:** các yêu cầu → Duyệt / Từ chối + nhận xét.

### 6.2 Màn hình Chốt
Dùng cho: **TK → task GV** ("Chốt task giáo viên"), **HP → task TBM** ("Chốt task trưởng bộ môn"), **HT → task TK** ("Chốt task trưởng khoa").
Chỉ thấy người mà mình là **người chốt**, và chỉ thấy task ở `CHO_CHOT`, `DA_CHOT`, `TRA_VE`.

- Ô đếm số task chờ chốt. Mặc định lọc `CHO_CHOT`, cũ nhất lên trước. Lọc theo người, theo đơn vị.
- Mỗi task: người làm KPI, nhiệm vụ, task, **minh chứng** (xem/tải như 6.1), nhận xét của người duyệt → **Chốt** hoặc **Trả về** (bắt buộc nhận xét).
- Chốt xong → task tính "hoàn thành" ngay.
- **Không thấy** danh sách đăng ký, task chưa được gửi lên.

### 6.3 Xuất báo cáo
Dùng cho TBM, TK, HP, HT.

**Phạm vi theo vai trò**
| Vai trò xuất | Gồm ai |
|---|---|
| TBM | GV bộ môn mình |
| TK | GV + TBM của khoa mình |
| HP | GV + TBM + TK của các khoa mình phụ trách |
| HT | GV + TBM + TK + HP toàn trường |

**Chọn:** kỳ → chức vụ (tick các chức vụ trong phạm vi) → **Tất cả** hoặc **1 người** → **Xuất Excel** / **Xuất PDF**.
- Không gồm KPI của chính người xuất. Không kèm file minh chứng.
- Xuất được **bất cứ lúc nào**. Kỳ chưa chốt: kết quả tính theo mục 10.3 tại thời điểm xuất, file ghi rõ **"TẠM TÍNH"**.

**Excel – 3 sheet**
| Sheet | Cột |
|---|---|
| Đăng ký nhiệm vụ | STT, Họ tên, Tên đăng nhập, Chức vụ, Đơn vị, Trạng thái đăng ký, Các nhiệm vụ đã chọn, Tổng điểm, Xếp loại |
| Kết quả | STT, Họ tên, Chức vụ, Đơn vị, % hoàn thành, Kết quả, Xếp loại, Task còn thiếu (kèm lý do), Số task đang treo, Task vượt, Tình trạng (Tạm tính / Đã chốt kỳ) |
| Chi tiết task | STT, Họ tên, Chức vụ, Nhiệm vụ, Task, Loại, Trạng thái, Được tính (Có/Không), Ngày nộp gần nhất, Số lần nộp, Nhận xét gần nhất của người duyệt, Nhận xét của người chốt, Ngày chốt |

Tên file: `BaoCao_<DonVi>_<Ky>_<ngay>.xlsx` (không dấu; đơn vị = tên bộ môn / khoa / "ToanTruong"). Chưa chốt thì thêm `_TamTinh`.

**PDF – A4 ngang**
```
TRƯỜNG ĐẠI HỌC HẠ LONG              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
<KHOA …>          ← TBM, TK             Độc lập – Tự do – Hạnh phúc
<BỘ MÔN …>        ← chỉ TBM
                                          Quảng Ninh, ngày … tháng … năm …

      BÁO CÁO KẾT QUẢ THỰC HIỆN NHIỆM VỤ – <KỲ> NĂM HỌC <năm học>
                          (TẠM TÍNH)   ← chỉ khi chưa chốt kỳ

   <bảng>

                                                <KHỐI CHỮ KÝ>
                                              (Ký, ghi rõ họ tên)


                                                <Họ tên người xuất>
```
| Người xuất | Khối chữ ký |
|---|---|
| TBM | TRƯỞNG BỘ MÔN |
| TK | TRƯỞNG KHOA |
| HP | KT. HIỆU TRƯỞNG / PHÓ HIỆU TRƯỞNG |
| HT | HIỆU TRƯỞNG |

- **Tất cả:** bảng Kết quả + bảng Đăng ký nhiệm vụ.
- **1 người:** thông tin người đó + nhiệm vụ đã đăng ký + chi tiết task + kết quả.
- Địa danh "Quảng Ninh" để trong 1 hằng số cấu hình.

### 6.4 Nhận giấy tờ
Dùng cho GV, TBM, TK, HP (Admin dùng bản "Nhận chỉ thị của hiệu trưởng", giống hệt).
- Danh sách quy định hiệu trưởng ban hành cho **vị trí hiện tại** của mình: tiêu đề, ngày ban hành, nhãn **Mới** nếu chưa xem.
- Mở ra: nội dung + file đính kèm (xem/tải). Lần đầu mở → ghi nhận **đã xem**.

---

## 7. Từng vai trò

### 7.1 Giáo viên
- **Đầu kỳ, Cuối kỳ:** mục 5. Người duyệt TBM, người chốt TK.
- **Nhận giấy tờ:** mục 6.4.

### 7.2 Trưởng bộ môn
- **Đầu kỳ, Cuối kỳ (KPI của mình):** mục 5, nhiệm vụ và bảng xếp loại vị trí TBM. Người duyệt TK, người chốt HP.
- **Duyệt giáo viên:** màn hình Duyệt (6.1) cho GV bộ môn mình.
- **Xuất báo cáo:** 6.3. **Nhận giấy tờ:** 6.4.

### 7.3 Trưởng khoa
- **Đầu kỳ, Cuối kỳ (KPI của mình):** mục 5, vị trí TK. Người duyệt HP, người chốt HT.
- **Duyệt trưởng bộ môn:** màn hình Duyệt (6.1) cho TBM trong khoa.
- **Chốt task giáo viên:** màn hình Chốt (6.2) cho GV trong khoa.
- **Xuất báo cáo:** 6.3. **Nhận giấy tờ:** 6.4.

### 7.4 Hiệu phó
- **Đầu kỳ, Cuối kỳ (KPI của mình):** mục 5, vị trí HP. HT vừa duyệt vừa chốt.
- **Duyệt trưởng khoa:** màn hình Duyệt (6.1) cho TK các khoa phụ trách.
- **Chốt task trưởng bộ môn:** màn hình Chốt (6.2) cho TBM các khoa phụ trách.
- **Xuất báo cáo:** 6.3. **Nhận giấy tờ:** 6.4.
- **Không** ban hành quy định.

### 7.5 Hiệu trưởng (không làm KPI)
- **Chốt task trưởng khoa:** màn hình Chốt (6.2) cho mọi TK.
- **Duyệt & chốt hiệu phó:** màn hình Duyệt (6.1) cho mọi HP, có thêm nút **Chốt** (mục 5.3, bảng task của HP).
- **Ban hành quy định:** mục 9.
- **Xuất báo cáo:** 6.3, toàn trường.

### 7.6 Admin
Mục 8.

---

## 8. Tài khoản ADMIN

### 8.1 Quản lý đăng nhập
| Tên đăng nhập | Chức vụ | Tên người | Mật khẩu | Sửa |
|---|---|---|---|---|

- Tìm kiếm theo tên, lọc theo chức vụ.
- **Thêm tài khoản:** họ tên + chức vụ (mọi cấp) → tên đăng nhập tự sinh (xem trước), mật khẩu `123456`.
  - Chức vụ **Hiệu phó**: thêm ô chọn nhiều **"Khoa phụ trách"** (chỉ hiện khoa chưa có hiệu phó).
- **Sửa:** đổi họ tên, **lên/xuống chức** (đổi tiền tố), đặt lại mật khẩu, đổi khoa phụ trách (hiệu phó).
- **Xóa:** xóa hẳn, hộp xác nhận ghi rõ *"Xóa sẽ mất toàn bộ dữ liệu KPI của tài khoản này"*. Xóa hiệu phó → các khoa phụ trách thành "chưa có hiệu phó".
- Áp dụng giới hạn ở mục 2.4 khi thêm/đổi chức vụ.
- Không cho admin tự xóa hoặc tự hạ chức chính mình.

### 8.2 Phân việc đầu kỳ
**Kỳ**
- Tạo kỳ: tên, năm học, kỳ số (1–4), ngày bắt đầu, ngày kết thúc.
- **Sao chép từ kỳ trước:** copy nhiệm vụ, task, bảng xếp loại (cả 4 vị trí).
- Nút **Công bố**. Sửa được ngày bắt đầu/kết thúc (để demo mô phỏng hết hạn).
- Nút **Chốt kỳ ngay** (demo).

**Nhiệm vụ và task**
- 4 tab: **Giáo viên** | **Trưởng bộ môn** | **Trưởng khoa** | **Hiệu phó**.
- Thêm/sửa/xóa nhiệm vụ: tên, mô tả, điểm, thứ tự.
- Trong nhiệm vụ thêm/sửa/xóa task: tên, mô tả, loại (Bắt buộc/Mở rộng), thứ tự.
- **Không cho xóa** nhiệm vụ/task đã có người đăng ký hoặc đang làm. Sửa chữ thì được.

**Bảng xếp loại:** 4 bảng theo vị trí, mỗi bảng gồm các bậc (tên bậc + điểm tối thiểu).

### 8.3 Nhận chỉ thị của hiệu trưởng
Giống 6.4, hiện các quy định hiệu trưởng ban hành có tick vị trí **Admin**. Chỉ đọc.

### 8.4 Xem cấu hình (chỉ xem)
Các tab, **không sửa được bài đã nộp**:
- Kỳ và bảng xếp loại (4 vị trí)
- Tài khoản + cơ cấu (khoa, bộ môn, ai là TBM/TK/HP phụ trách) + **cảnh báo đơn vị thiếu người duyệt/chốt**
- Đăng ký nhiệm vụ của từng người
- Tiến độ task và minh chứng (mở xem/tải file)
- Kết quả các kỳ
- Quy định đã ban hành + ai đã xem

---

## 9. Ban hành quy định (Hiệu trưởng)

**Tạo quy định**
- Tiêu đề, nội dung, file đính kèm (cùng giới hạn file như minh chứng).
- **Tick vị trí nhận:** ☐ Giáo viên ☐ Trưởng bộ môn ☐ Trưởng khoa ☐ Hiệu phó ☐ Admin (có "Chọn tất cả").
- Không chọn từng người: tick vị trí nào thì **mọi tài khoản ở vị trí đó** nhận.
- Bấm **Ban hành**.

**Luật**
- Người nhận tính theo **chức vụ hiện tại** mỗi lần xem, nên **người được thêm vào vị trí đó sau này cũng thấy** các quy định đã ban hành cho vị trí đó.
- Người đổi chức vụ thì thấy quy định của vị trí mới, không còn thấy quy định chỉ dành cho vị trí cũ.
- Chỉ hiệu trưởng được ban hành.

**Đã ban hành**
- Danh sách quy định: tiêu đề, ngày, các vị trí nhận, **"x/y đã xem"** (y = số tài khoản hiện đang ở các vị trí đó).
- Bấm vào thấy ai đã xem, ai chưa, lọc theo vị trí.

---

## 10. Quy tắc tính toán và thời gian

### 10.1 Thời gian (Asia/Ho_Chi_Minh)
```
hanDangKy(ky) = cuối ngày ky.ngayBatDau (23:59:59)
deadline(ky)  = cuối ngày ky.ngayKetThuc (23:59:59)
```
| Hành động | Điều kiện |
|---|---|
| Gửi đăng ký lần đầu | trạng thái Nháp và now ≤ hanDangKy |
| Sửa + gửi lại sau khi bị từ chối | trạng thái Bị từ chối và now ≤ deadline |
| **Mọi hành động khác** của mọi vai trò trong kỳ (duyệt đăng ký, nộp/sửa minh chứng, xin thêm, duyệt/từ chối, hủy duyệt, gửi lên, chốt, trả về) | now ≤ deadline và kỳ chưa chốt |

**Kỳ hiện tại** = kỳ đã công bố, chưa chốt, có ngày bắt đầu gần nhất ≤ hôm nay; không có thì lấy kỳ sắp tới gần nhất.

### 10.2 Xếp loại đăng ký
```
tongDiem = tổng điểm các nhiệm vụ đã chọn
xepLoai  = trong bảng xếp loại đúng vị trí,
           bậc có diemToiThieu lớn nhất mà tongDiem ≥ diemToiThieu
           (không đủ bậc nào → bậc thấp nhất)
```
Tính khi gửi và tính lại khi được duyệt.

### 10.3 Tính kết quả
**1 hàm dùng chung** `tinhKetQua(kyId, userId)` cho chốt kỳ, xuất báo cáo tạm tính và biểu đồ tròn.
```
DUOC_TINH = { DA_CHOT }
DANG_TREO = { DA_DUYET, CHO_CHOT }   // chỉ để hiển thị, KHÔNG tính

nếu không có đăng ký, hoặc đăng ký chưa Đã duyệt:
    ketQua = KHONG_DAT, xepLoai = bậc thấp nhất, phanTram = 0
    ghiChu = "Chưa có danh sách nhiệm vụ được duyệt"
ngược lại:
    batBuoc  = task bắt buộc của người này trong kỳ
    daChot   = batBuoc có trạng thái DA_CHOT
    phanTram = daChot / batBuoc * 100
    taskVuot = task mở rộng có trạng thái DA_CHOT
    soTreo   = số task (bắt buộc + mở rộng) thuộc DANG_TREO
    nếu phanTram < 100          → KHONG_DAT, taskThieu = batBuoc không phải DA_CHOT, kèm lyDo (mục 5.4)
    nếu = 100 và có taskVuot    → VUOT
    còn lại                      → DAT
    xepLoai = xepLoai của đăng ký
```

### 10.4 Chốt kỳ
Hàm `chotKy(kyId)`, chạy bởi:
- **Railway Cron** mỗi ngày 00:05 gọi `POST /api/cron/chot-ky` (header `CRON_SECRET`): chốt mọi kỳ đã quá deadline mà chưa chốt; đồng thời gửi các thông báo nhắc việc.
- Nút **Chốt kỳ ngay** của admin.

Chạy `tinhKetQua` cho **mọi GV, TBM, TK, HP**, lưu `KetQuaKy`, đặt `ky.daChot = true`, gửi thông báo. Sau khi chốt mọi thao tác trong kỳ bị khóa.

---

## 11. Thông báo (trong web)

Chuông ở header, số chưa đọc, bấm vào đi tới trang liên quan.

| Sự kiện | Người nhận |
|---|---|
| Người làm KPI gửi đăng ký / nộp task / xin thêm task | Người duyệt |
| Đăng ký, task, xin thêm được duyệt / bị từ chối | Người làm KPI |
| Người duyệt gửi task lên | Người chốt |
| Task được chốt | Người làm KPI, người duyệt |
| Người chốt trả về | Người duyệt |
| Còn 3 ngày đến hạn đăng ký, còn 7 ngày đến deadline | Người làm KPI |
| Còn 7 ngày và 2 ngày đến deadline: "Còn N task đã duyệt chưa gửi lên" (HT: "chưa chốt") | Người duyệt |
| Còn 7 ngày và 2 ngày đến deadline: "Còn N task chờ chốt" | Người chốt |
| Kỳ đã chốt | Mọi người làm KPI và cấp quản lý |
| Quy định mới | Mọi tài khoản ở vị trí được tick |

---

## 12. Dữ liệu

### 12.1 Prisma schema (được chỉnh chi tiết, giữ ý nghĩa)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  GV
  TBM
  TK
  HP
  HT
}

enum DoiTuong {
  GV
  TBM
  TK
  HP
}

enum LoaiTask {
  BAT_BUOC
  MO_RONG
}

enum TrangThaiDangKy {
  NHAP
  CHO_DUYET
  TU_CHOI
  DA_DUYET
}

enum TrangThaiTask {
  CHUA_LAM
  CHO_DUYET
  TU_CHOI
  DA_DUYET  // đã duyệt, chưa chốt (treo)
  CHO_CHOT  // đã gửi lên người chốt (treo) – không dùng cho task HP
  DA_CHOT   // được tính hoàn thành
  TRA_VE    // người chốt trả về người duyệt – không dùng cho task HP
}

enum TrangThaiDuyet {
  CHO_DUYET
  TU_CHOI
  DA_DUYET
}

enum KetQua {
  KHONG_DAT
  DAT
  VUOT
}

enum HanhDongTask {
  NOP
  SUA_BAI_NOP
  DUYET
  TU_CHOI
  HUY_DUYET
  GUI_CHOT
  CHOT
  TRA_VE
}

model Khoa {
  id         String  @id @default(cuid())
  ten        String
  hieuPhoId  String?
  hieuPho    User?   @relation("HieuPhoPhuTrach", fields: [hieuPhoId], references: [id], onDelete: SetNull)
  boMons     BoMon[]
  thanhViens User[]  @relation("ThanhVienKhoa")
}

model BoMon {
  id     String @id @default(cuid())
  ten    String
  khoaId String
  khoa   Khoa   @relation(fields: [khoaId], references: [id])
  users  User[]
}

model User {
  id                String   @id @default(cuid())
  username          String   @unique
  hoTen             String
  role              Role
  passwordHash      String
  isDefaultPassword Boolean  @default(true)
  boMonId           String?
  boMon             BoMon?   @relation(fields: [boMonId], references: [id])
  khoaId            String?
  khoa              Khoa?    @relation("ThanhVienKhoa", fields: [khoaId], references: [id])
  createdAt         DateTime @default(now())

  khoaPhuTrach Khoa[]           @relation("HieuPhoPhuTrach")
  dangKys      DangKy[]
  kpiTasks     KpiTask[]
  yeuCaus      YeuCauThemTask[]
  ketQuas      KetQuaKy[]
  vanBanDaGui  VanBan[]
  vanBanDaXem  VanBanDaXem[]
  thongBaos    ThongBao[]
}

model Ky {
  id          String   @id @default(cuid())
  ten         String
  namHoc      String
  soKy        Int
  ngayBatDau  DateTime
  ngayKetThuc DateTime
  daCongBo    Boolean  @default(false)
  daChot      Boolean  @default(false)
  createdAt   DateTime @default(now())

  nhiemVus    NhiemVu[]
  bacXepLoais BacXepLoai[]
  dangKys     DangKy[]
  kpiTasks    KpiTask[]
  ketQuas     KetQuaKy[]
}

model BacXepLoai {
  id           String   @id @default(cuid())
  kyId         String
  ky           Ky       @relation(fields: [kyId], references: [id], onDelete: Cascade)
  doiTuong     DoiTuong
  ten          String
  diemToiThieu Int
}

model NhiemVu {
  id       String          @id @default(cuid())
  kyId     String
  ky       Ky              @relation(fields: [kyId], references: [id], onDelete: Cascade)
  doiTuong DoiTuong
  ten      String
  moTa     String?
  diem     Int
  thuTu    Int             @default(0)
  tasks    Task[]
  dangKys  DangKyNhiemVu[]
}

model Task {
  id        String           @id @default(cuid())
  nhiemVuId String
  nhiemVu   NhiemVu          @relation(fields: [nhiemVuId], references: [id], onDelete: Cascade)
  ten       String
  moTa      String?
  loai      LoaiTask         @default(BAT_BUOC)
  thuTu     Int              @default(0)
  kpiTasks  KpiTask[]
  yeuCaus   YeuCauThemTask[]
}

model DangKy {
  id           String          @id @default(cuid())
  kyId         String
  ky           Ky              @relation(fields: [kyId], references: [id], onDelete: Cascade)
  userId       String
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  trangThai    TrangThaiDangKy @default(NHAP)
  tongDiem     Int             @default(0)
  xepLoai      String?
  nhanXet      String?
  nguoiDuyetId String?
  nopLuc       DateTime?
  duyetLuc     DateTime?
  nhiemVus     DangKyNhiemVu[]

  @@unique([kyId, userId])
}

model DangKyNhiemVu {
  dangKyId  String
  dangKy    DangKy  @relation(fields: [dangKyId], references: [id], onDelete: Cascade)
  nhiemVuId String
  nhiemVu   NhiemVu @relation(fields: [nhiemVuId], references: [id], onDelete: Cascade)

  @@id([dangKyId, nhiemVuId])
}

model KpiTask {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  kyId        String
  ky          Ky            @relation(fields: [kyId], references: [id], onDelete: Cascade)
  taskId      String
  task        Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  trangThai   TrangThaiTask @default(CHUA_LAM)
  nhanXetChot String?
  nguoiChotId String?
  guiChotLuc  DateTime?
  chotLuc     DateTime?
  baiNops     BaiNop[]
  lichSus     LichSuTask[]

  @@unique([userId, taskId])
}

model BaiNop {
  id           String         @id @default(cuid())
  kpiTaskId    String
  kpiTask      KpiTask        @relation(fields: [kpiTaskId], references: [id], onDelete: Cascade)
  ghiChu       String?
  link         String?
  trangThai    TrangThaiDuyet @default(CHO_DUYET)
  nhanXet      String?
  nguoiDuyetId String?
  nopLuc       DateTime       @default(now())
  duyetLuc     DateTime?
  files        FileDinhKem[]
}

model LichSuTask {
  id              String       @id @default(cuid())
  kpiTaskId       String
  kpiTask         KpiTask      @relation(fields: [kpiTaskId], references: [id], onDelete: Cascade)
  hanhDong        HanhDongTask
  nguoiThucHienId String?
  nhanXet         String?
  luc             DateTime     @default(now())
}

model FileDinhKem {
  id        String   @id @default(cuid())
  tenGoc    String
  duongDan  String
  mimeType  String
  kichThuoc Int
  baiNopId  String?
  baiNop    BaiNop?  @relation(fields: [baiNopId], references: [id], onDelete: Cascade)
  vanBanId  String?
  vanBan    VanBan?  @relation(fields: [vanBanId], references: [id], onDelete: Cascade)
  taoLuc    DateTime @default(now())
}

model YeuCauThemTask {
  id           String         @id @default(cuid())
  userId       String
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskId       String
  task         Task           @relation(fields: [taskId], references: [id], onDelete: Cascade)
  trangThai    TrangThaiDuyet @default(CHO_DUYET)
  nhanXet      String?
  nguoiDuyetId String?
  taoLuc       DateTime       @default(now())
  duyetLuc     DateTime?
}

model KetQuaKy {
  id        String   @id @default(cuid())
  kyId      String
  ky        Ky       @relation(fields: [kyId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phanTram  Float
  ketQua    KetQua
  xepLoai   String
  taskThieu Json     // [{ taskId, ten, nhiemVu, trangThai, lyDo }]
  taskVuot  Json     // [{ taskId, ten, nhiemVu }]
  soTreo    Int      @default(0)
  ghiChu    String?
  chotLuc   DateTime @default(now())

  @@unique([kyId, userId])
}

model VanBan {
  id         String        @id @default(cuid())
  tieuDe     String
  noiDung    String
  viTriNhan  Role[]        // GV, TBM, TK, HP, ADMIN
  nguoiGuiId String?
  nguoiGui   User?         @relation(fields: [nguoiGuiId], references: [id], onDelete: SetNull)
  guiLuc     DateTime      @default(now())
  files      FileDinhKem[]
  daXems     VanBanDaXem[]
}

model VanBanDaXem {
  vanBanId String
  vanBan   VanBan   @relation(fields: [vanBanId], references: [id], onDelete: Cascade)
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  daXemLuc DateTime @default(now())

  @@id([vanBanId, userId])
}

model ThongBao {
  id      String   @id @default(cuid())
  userId  String
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  noiDung String
  link    String?
  daDoc   Boolean  @default(false)
  taoLuc  DateTime @default(now())
}
```

### 12.2 Ghi chú dữ liệu
- `KpiTask.trangThai` là nguồn sự thật. `BaiNop` lưu file + ghi chú + kết quả duyệt của người duyệt cho từng lần nộp.
- Sửa minh chứng khi `CHO_DUYET` = sửa lần nộp hiện tại. Bị từ chối rồi nộp lại = tạo `BaiNop` mới.
- **Hủy duyệt:** `KpiTask` → `CHO_DUYET`, `BaiNop` gần nhất → `CHO_DUYET`.
- **Gửi lên:** `DA_DUYET` → `CHO_CHOT`, lưu `guiChotLuc`.
- **Chốt:** `CHO_CHOT` → `DA_CHOT` (task HP: `DA_DUYET` → `DA_CHOT`), lưu `nguoiChotId`, `chotLuc`.
- **Trả về:** `CHO_CHOT` → `TRA_VE`, lưu `nhanXetChot`. Người duyệt trả làm lại → `TU_CHOI`; duyệt lại → `DA_DUYET`.
- Người nhận quy định: `user.role ∈ vanBan.viTriNhan`, tính lúc xem.

**Quyền xem file** (`GET /api/files/[id]`, PDF/ảnh trả `Content-Disposition: inline`):
- Minh chứng của người X: X, người duyệt của X, **người chốt của X chỉ khi task ở `CHO_CHOT` / `DA_CHOT` / `TRA_VE`** (task HP: HT luôn xem được), Admin.
- File quy định: HT, người có vị trí được tick, Admin.

### 12.3 Ma trận quyền
| Hành động | ADMIN | GV | TBM | TK | HP | HT |
|---|---|---|---|---|---|---|
| Quản lý tài khoản, kỳ, nhiệm vụ, bảng xếp loại | ✔ | | | | | |
| Xem toàn bộ dữ liệu (chỉ xem) | ✔ | | | | | |
| Làm KPI của mình | | ✔ | ✔ | ✔ | ✔ | |
| Duyệt (đăng ký, task, xin thêm) + gửi lên | | | GV | TBM | TK | HP (+ chốt) |
| Chốt / trả về task | | | | GV | TBM | TK, HP |
| Xuất báo cáo | | | Bộ môn | Khoa | Các khoa phụ trách | Toàn trường |
| Ban hành quy định | | | | | | ✔ |
| Nhận quy định | ✔ (chỉ thị) | ✔ | ✔ | ✔ | ✔ | |
| Sửa bài đã nộp của người khác | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ |

### 12.4 Seed dữ liệu demo (mật khẩu đều `123456`)
- 1 khoa: *Khoa Công nghệ thông tin* (hiệu phó phụ trách: `hp.tranthiphuong`); 1 bộ môn: *Bộ môn Khoa học máy tính*.
- Tài khoản:
  - `admin.quantri` – Admin
  - `ht.nguyenvanhieu` – Hiệu trưởng
  - `hp.tranthiphuong` – Hiệu phó (phụ trách khoa)
  - `tk.levankhoa` – Trưởng khoa (thuộc khoa)
  - `tbm.phamthibich` – Trưởng bộ môn (thuộc bộ môn)
  - `gv.nguyenvanan`, `gv.tranthibinh`, `gv.levancuong` – Giáo viên (thuộc bộ môn)
- 1 kỳ đã công bố: *Kỳ 1 – 2026-2027*, ngày bắt đầu = ngày chạy seed, ngày kết thúc = +30 ngày.
- **Nhiệm vụ** (mỗi nhiệm vụ 2–3 task bắt buộc + 1 task mở rộng, nội dung mẫu phù hợp vị trí):
  - GV: 10 nhiệm vụ, điểm **15, 12, 12, 10, 10, 10, 8, 8, 8, 7**
  - TBM: 6 nhiệm vụ, điểm **20, 20, 15, 15, 15, 15**
  - TK: 5 nhiệm vụ, điểm **20** mỗi cái
  - HP: 5 nhiệm vụ, điểm **20** mỗi cái
- **Bảng xếp loại** 4 vị trí (mẫu, giống nhau): A1 ≥ 80, A2 ≥ 65, B ≥ 50, C ≥ 35, D ≥ 20, F ≥ 0.

*(Nhiệm vụ, điểm, bảng xếp loại thật do admin nhập sau.)*

---

## 13. Thứ tự build

| Bước | Nội dung | Xong khi |
|---|---|---|
| 1 | Khởi tạo Next.js, Prisma, schema, seed, đăng nhập, layout + menu theo vai trò (2.1), chặn route theo vai trò | Đăng nhập được 8 tài khoản seed, mỗi người thấy đúng menu |
| 2 | Hàm `nguoiDuyet`, `nguoiChot`, lọc phạm vi theo đơn vị (có unit test) | Trả đúng người cho cả 4 vị trí; báo thiếu người đúng |
| 3 | Admin: Quản lý đăng nhập (+ khoa phụ trách của HP, giới hạn 2.4) | Thêm/sửa/lên-xuống chức/đặt lại mật khẩu/xóa đúng quy tắc |
| 4 | Admin: Phân việc đầu kỳ (4 vị trí) | Tạo, sao chép, công bố kỳ; CRUD đủ |
| 5 | Luồng KPI chung – Đầu kỳ + màn hình Duyệt tab Đăng ký | Cả 4 vị trí đăng ký và được đúng người duyệt |
| 6 | Luồng KPI chung – Cuối kỳ (nộp, xin thêm, biểu đồ tròn 5 phần) + màn hình Duyệt đầy đủ (duyệt, từ chối, hủy duyệt, gửi lên, HT chốt HP) | Task đi tới `DA_DUYET` / `CHO_CHOT` cho GV, TBM, TK; HP tới `DA_CHOT` |
| 7 | Màn hình Chốt (TK, HP, HT) | Đủ vòng trạng thái mục 5.3; % chỉ tăng khi chốt |
| 8 | Chốt kỳ + kết quả (cron + nút Chốt kỳ ngay) + nhắc việc | Kịch bản mục 15 ra đúng |
| 9 | Xuất báo cáo Excel/PDF (4 cấp) | Đúng phạm vi, đúng khối chữ ký, tiếng Việt không lỗi, có "TẠM TÍNH" |
| 10 | Ban hành quy định + Nhận giấy tờ + Admin Nhận chỉ thị | Gửi đúng vị trí, người mới vào cũng thấy, đếm đúng đã xem |
| 11 | Admin Xem cấu hình + Thông báo | Các tab chỉ xem, có cảnh báo thiếu người, chuông thông báo chạy |
| 12 | Deploy Railway (app, Postgres, Volume, Cron) | Chạy được trên domain Railway |

---

## 14. Ngoài phạm vi v1.4

- 5 mục + HGT của Admin
- Giao diện quản lý khoa/bộ môn (chỉ seed sẵn)
- Kiêm nhiệm (1 người nhiều vai trò)
- Đổi mật khẩu, chính sách bảo mật mật khẩu
- Thông báo qua email/Zalo
- Xuất kèm file minh chứng
- Dashboard thống kê toàn trường (chỉ có xuất báo cáo)
- Quy ước đặt tên tài liệu

---

## 15. Kịch bản nghiệm thu

**Chuẩn bị:** dùng seed, kiểm tra kỳ đã công bố.

**Kịch bản chính**
| Người | Đăng ký | Thực hiện | Kết quả mong đợi |
|---|---|---|---|
| `gv.nguyenvanan` | 10 nhiệm vụ GV (100 điểm) | ~50% task bắt buộc: TBM duyệt → gửi → TK chốt; còn lại chưa nộp | **Không đạt – A1**, task thiếu ghi "Chưa nộp minh chứng" |
| `gv.tranthibinh` | Nhiệm vụ GV 1–3 (39 điểm) | 100% bắt buộc: TBM duyệt → gửi → TK chốt | **Đạt – C** |
| `gv.levancuong` | Nhiệm vụ GV 1–5 (59 điểm) | 100% bắt buộc + 2 mở rộng, tất cả được chốt | **Vượt chỉ tiêu – B** + 2 task vượt |
| `tbm.phamthibich` | Nhiệm vụ TBM 1–3 (55 điểm) | TK duyệt danh sách; 100% task: TK duyệt → gửi → **HP chốt** | **Đạt – B** |
| `tk.levankhoa` | Nhiệm vụ TK 1–4 (80 điểm) | HP duyệt danh sách; 100% task: HP duyệt → gửi → **HT chốt** | **Đạt – A1** |
| `hp.tranthiphuong` | Nhiệm vụ HP 1–3 (60 điểm) | HT duyệt danh sách; 100% task: **HT duyệt → HT chốt** (2 nút) | **Đạt – B** |

Cuối cùng admin bấm **Chốt kỳ ngay**, kiểm tra kết quả ở từng tài khoản và trong báo cáo.

**Case phụ – duyệt và chốt**
- [ ] Mỗi vị trí chỉ thấy nhiệm vụ của vị trí mình
- [ ] Người duyệt duyệt 1 task → người làm KPI thấy "… đã duyệt – chờ … chốt", **% không tăng**, phần "Đang treo" tăng
- [ ] Người chốt chốt → "Đã chốt – hoàn thành", **% tăng**
- [ ] Hủy duyệt được khi chưa gửi lên; đã gửi lên thì bị chặn (cả ở API)
- [ ] Người chốt không thấy task chưa được gửi lên, không mở được file minh chứng của task đó, không thấy danh sách đăng ký
- [ ] Người chốt trả về → người duyệt thấy nhận xét; người làm KPI chỉ thấy trạng thái
- [ ] Người duyệt trả làm lại → nộp lại → duyệt → gửi → chốt → hoàn thành
- [ ] HT với HP: bấm Duyệt xong task vẫn treo, bấm Chốt mới tính; HT hủy duyệt được trước khi chốt
- [ ] HP chỉ thấy TK/TBM của khoa mình phụ trách; HT không thấy task GV/TBM
- [ ] **Treo đến hết kỳ:** 100% task được duyệt nhưng chưa chốt → chốt kỳ ra **Không đạt**, lý do "Chờ chốt, chưa được chốt kịp" / "Đã duyệt nhưng chưa gửi lên / chưa được chốt"
- [ ] Task mở rộng đã duyệt nhưng chưa chốt → không tính là vượt
- [ ] Nhắc việc trước deadline đến đúng người duyệt và người chốt
- [ ] Sau deadline: không ai nộp, duyệt, gửi, chốt, trả về được

**Case phụ – cơ cấu và tài khoản**
- [ ] Đổi `gv.tranthibinh` lên TBM khi bộ môn đã có TBM → bị chặn, báo lỗi; hạ `tbm.phamthibich` xuống GV trước → lên được, tên đăng nhập thành `tbm.tranthibinh`
- [ ] Xóa hiệu phó → khoa thành "chưa có hiệu phó"; TBM và TK của khoa đó thấy thông báo thiếu người, nút Gửi bị chặn; admin thấy cảnh báo
- [ ] Tạo hiệu phó mới, gán khoa → luồng chạy lại bình thường
- [ ] Tạo GV trùng tên → tên đăng nhập có số `2`

**Case phụ – xuất báo cáo**
- [ ] TBM chỉ xuất được GV bộ môn; TK xuất GV + TBM; HP xuất GV + TBM + TK khoa phụ trách; HT xuất cả 4 vị trí
- [ ] Excel đủ 3 sheet, có cột Chức vụ, Đơn vị; % chỉ đếm task đã chốt
- [ ] PDF đúng khối chữ ký theo người xuất (HP: "KT. HIỆU TRƯỞNG / PHÓ HIỆU TRƯỞNG"), tiếng Việt không lỗi font
- [ ] Kỳ chưa chốt: ghi "TẠM TÍNH"; sau chốt thì không còn

**Case phụ – ban hành quy định**
- [ ] HT ban hành quy định tick "Giáo viên" + "Admin" → 3 GV thấy ở "Nhận giấy tờ", admin thấy ở "Nhận chỉ thị"; TBM, TK, HP không thấy
- [ ] 1 GV mở → HT thấy "1/4 đã xem"
- [ ] Admin tạo thêm 1 GV mới → GV mới thấy quy định đó; HT thấy "1/5 đã xem"
- [ ] Hiệu phó không có mục ban hành (API cũng chặn)

**Case phụ – chung**
- [ ] Sửa ngày bắt đầu kỳ về hôm qua → người chưa gửi đăng ký không gửi được nữa
- [ ] Không đăng ký → chốt kỳ ra **Không đạt – F**, ghi chú "Chưa có danh sách nhiệm vụ được duyệt"
- [ ] Bị từ chối danh sách sau ngày bắt đầu → vẫn sửa và gửi lại được (trước deadline)
- [ ] Sửa minh chứng khi Chờ duyệt → được; khi đã duyệt/chốt → bị chặn (cả ở API)
- [ ] Admin không sửa được minh chứng của ai
- [ ] File > 20MB hoặc sai định dạng → báo lỗi
- [ ] Người không có quyền mở link `/api/files/[id]` → bị chặn