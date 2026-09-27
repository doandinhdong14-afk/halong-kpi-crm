# CRM chấm KPI giáo viên – ĐH Hạ Long

> **Phiên bản:** v1.1 – 27/09/2026
> **Mục tiêu bản này:** demo chạy trọn **1 luồng** (1 khoa, 1 bộ môn, 3 giáo viên) cho vai trò **Giáo viên** và **Admin**. Các vai trò TBM, Hiệu trưởng chỉ dựng **bản tối giản** đủ để luồng chạy được. Trưởng khoa, Hiệu phó chỉ có trang giữ chỗ.

---

## 0. Hướng dẫn cho Claude Code

1. Đọc hết file trước khi code. Làm theo **thứ tự build ở mục 12**, xong mỗi bước thì chạy thử được mới sang bước sau.
2. **Mọi kiểm tra quyền và hạn thời gian phải làm ở server** (API/server action), không chỉ ẩn nút ở giao diện.
3. Không làm những gì ghi ở **mục 13 – Ngoài phạm vi**.
4. Toàn bộ giao diện **tiếng Việt**. Múi giờ **Asia/Ho_Chi_Minh**.
5. Chỗ nào file này không nói rõ: chọn cách đơn giản nhất, ghi lại vào `NOTES.md`.

---

## 1. Công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Database | PostgreSQL + Prisma |
| Đăng nhập | Auth.js (Credentials) hoặc session cookie tự làm, ưu tiên đơn giản; mật khẩu hash bằng bcrypt |
| Giao diện | Tailwind CSS + shadcn/ui |
| Biểu đồ | Recharts (biểu đồ tròn) |
| Lưu file | Ổ đĩa server, thư mục `UPLOAD_DIR` (Railway Volume). Viết qua 1 lớp `storage` để sau dễ đổi |
| Deploy | Railway (app + PostgreSQL + Volume + Cron) |

**Biến môi trường:** `DATABASE_URL`, `AUTH_SECRET`, `UPLOAD_DIR`, `CRON_SECRET`, `TZ=Asia/Ho_Chi_Minh`

---

## 2. Vai trò và tài khoản

### 2.1 Vai trò
| Mã | Vai trò | Tiền tố tên đăng nhập | Phạm vi v1.1 |
|---|---|---|---|
| ADMIN | Admin | `admin.` | Đầy đủ (mục 6) |
| GV | Giáo viên | `gv.` | Đầy đủ (mục 5) |
| TBM | Trưởng bộ môn | `tbm.` | Tối giản (mục 7) |
| TK | Trưởng khoa | `tk.` | Giữ chỗ + Nhận giấy tờ |
| HP | Hiệu phó | `hp.` | Giữ chỗ + Nhận giấy tờ |
| HT | Hiệu trưởng | `ht.` | Tối giản (mục 8) |

Mỗi tài khoản có **đúng 1 vai trò**. Chưa hỗ trợ kiêm nhiệm.

### 2.2 Quy tắc tên đăng nhập
- Dạng: `<tiền tố>.<họ tên không dấu, viết thường, viết liền>`
  - "Nguyễn Văn Nam", GV → `gv.nguyenvannam`
  - Bỏ dấu tiếng Việt, `đ` → `d`, bỏ khoảng trắng và ký tự đặc biệt.
- Trùng thì thêm số từ 2: `gv.nguyenvannam`, `gv.nguyenvannam2`, `gv.nguyenvannam3`…
- **Đổi chức vụ thì đổi tiền tố**: `gv.nguyenvannam` lên TBM → `tbm.nguyenvannam` (kiểm tra trùng lại). Hiện thông báo cho admin biết tên đăng nhập mới.
- Đổi họ tên thì tên đăng nhập cũng tạo lại theo quy tắc trên.

### 2.3 Mật khẩu (tạm cho demo)
- Mọi tài khoản mới có mật khẩu mặc định **`123456`**.
- Vẫn lưu **hash bcrypt** trong DB. Cột "Mật khẩu" ở trang Quản lý đăng nhập hiển thị `123456` khi `isDefaultPassword = true`.
- Admin có nút **Đặt lại mật khẩu** (về `123456`).
- Người dùng **không tự đổi** mật khẩu ở v1.1.

### 2.4 Cơ cấu tổ chức (demo)
- Seed sẵn **1 khoa + 1 bộ môn**. Mọi tài khoản mới tự gán vào bộ môn này.
- Không làm giao diện quản lý khoa/bộ môn, nhưng vẫn giữ `boMonId` trong DB để TBM chỉ thấy GV thuộc bộ môn mình (sau mở rộng nhiều bộ môn không phải sửa logic).

---

## 3. Khái niệm nghiệp vụ

- **Kỳ:** 1 năm học có **4 kỳ**. Mỗi kỳ có ngày bắt đầu, ngày kết thúc.
  - **Hạn đăng ký** = 23:59:59 **ngày bắt đầu** kỳ.
  - **Deadline** = 23:59:59 **ngày kết thúc** kỳ.
  - Kỳ có cờ **Công bố**: GV chỉ thấy kỳ đã công bố.
- **Nhiệm vụ:** do Admin tạo trong từng kỳ, **giống nhau cho mọi GV**, mỗi nhiệm vụ có **điểm** riêng. Không có nhiệm vụ bắt buộc.
- **Task:** đầu việc bên trong nhiệm vụ, do Admin tạo, có 2 loại:
  - **Bắt buộc:** tự giao cho GV khi danh sách đăng ký được duyệt.
  - **Mở rộng:** GV phải **xin thêm** mới được làm, dùng để **làm vượt**.
- **Bảng xếp loại (A1…F):** theo từng kỳ, mỗi bậc có điểm tối thiểu. Xếp loại đăng ký = bậc cao nhất mà **tổng điểm các nhiệm vụ đã chọn** ≥ điểm tối thiểu.
- **Minh chứng:** file GV nộp cho một task. Cho phép PDF, JPG, PNG, DOC/DOCX, XLS/XLSX, tối đa **20MB/file**, nhiều file/lần nộp, kèm ghi chú và link (không bắt buộc).
- Các GV **độc lập với nhau**: nhiều GV chọn trùng nhiệm vụ không sao.

---

## 4. Dòng thời gian một kỳ

```
Admin tạo kỳ + nhiệm vụ + task + bảng xếp loại → Công bố
        │
        ▼
[Trước/đến hết NGÀY BẮT ĐẦU] GV chọn nhiệm vụ → Gửi → TBM duyệt / từ chối
        │   (bị từ chối: GV được sửa và gửi lại đến hết DEADLINE)
        ▼
[Trong kỳ] GV nộp minh chứng từng task → TBM duyệt / từ chối → GV làm lại
           GV xin thêm task mở rộng → TBM duyệt → làm như task thường
        │
        ▼
[Hết NGÀY KẾT THÚC] Hệ thống tự chốt kỳ → tính kết quả → gửi lên TBM
```

---

## 5. Tài khoản GIÁO VIÊN

Menu có **đúng 3 mục**: **Đầu kỳ** | **Cuối kỳ** | **Nhận giấy tờ**.
Header: tên, vai trò, chuông thông báo, đăng xuất.

### 5.1 Đầu kỳ – Đăng ký nhiệm vụ

**Hiển thị**
- Tên kỳ, hạn đăng ký, đồng hồ đếm ngược.
- Danh sách nhiệm vụ dạng thẻ: tên, mô tả, điểm, danh sách task (ghi rõ bắt buộc / mở rộng).
- Ô tick chọn trên mỗi thẻ.
- Thanh tổng kết cố định: **số nhiệm vụ đã chọn – tổng điểm – xếp loại dự kiến** (cập nhật ngay khi tick).
- Nút **Gửi lên trưởng bộ môn**.
- Banner trạng thái + nhận xét của TBM (nếu có).

**Trạng thái danh sách đăng ký**
| Trạng thái | GV làm được gì | Điều kiện thời gian |
|---|---|---|
| Nháp | Tick/bỏ tick (tự lưu), Gửi | Đến hết hạn đăng ký. Quá hạn → khóa |
| Chờ duyệt | Chỉ xem | – |
| Bị từ chối | Xem nhận xét, sửa, gửi lại | Đến hết deadline kỳ |
| Đã duyệt | Chỉ xem (khóa) | – |

**Luật**
- Phải chọn ít nhất 1 nhiệm vụ mới gửi được.
- Khi gửi: lưu `tongDiem`, `xepLoai` theo bảng xếp loại hiện tại.
- Đã duyệt thì **không đổi nhiệm vụ** được nữa.
- Khi TBM duyệt: hệ thống tạo các task **bắt buộc** của các nhiệm vụ đã chọn cho GV (trạng thái Chưa làm).

### 5.2 Cuối kỳ – Làm task và kết quả

**Chọn kỳ:** dropdown chọn kỳ, mặc định kỳ hiện tại; chọn kỳ cũ để xem lại kết quả (chỉ xem).

**Nếu danh sách chưa được duyệt:** hiện "Danh sách nhiệm vụ chưa được trưởng bộ môn duyệt".

**Khối tổng quan (trên cùng)**
- **Biểu đồ tròn** các task **bắt buộc**, 4 phần: Đã duyệt / Chờ duyệt / Bị từ chối / Chưa làm.
- Giữa biểu đồ: **% tiến độ** = task bắt buộc Đã duyệt / tổng task bắt buộc.
- Xếp loại đăng ký (vd: A1).
- Nhãn phụ: **"+N task vượt"** (task mở rộng đã duyệt), không làm biểu đồ quá 100%.
- Đếm ngược đến deadline.

**Danh sách nhiệm vụ → task**
- Mỗi nhiệm vụ đã duyệt mở ra danh sách task kèm trạng thái.

**Trạng thái task**
| Trạng thái | Ý nghĩa | GV làm được gì |
|---|---|---|
| Chưa làm | Chưa nộp | Tải minh chứng + ghi chú/link → Gửi |
| Chờ duyệt | Đã nộp, chờ TBM | Sửa/thay minh chứng của lần nộp hiện tại |
| Bị từ chối | TBM từ chối kèm nhận xét | Xem nhận xét, nộp lại (tạo lần nộp mới) |
| Đã duyệt | TBM chấp nhận | Khóa |

**Chi tiết task:** tên, mô tả, khu vực tải file, ghi chú, link, **lịch sử các lần nộp** (file, thời gian, trạng thái, nhận xét TBM).

**Xin thêm task (làm vượt)**
- Khu vực "Xin thêm task": liệt kê các task **mở rộng** thuộc **các nhiệm vụ GV đã được duyệt**.
- GV bấm **Xin làm** → yêu cầu chờ TBM duyệt.
- TBM duyệt → task được thêm vào danh sách của GV (Chưa làm), đi đúng vòng trạng thái như trên.

**Luật thời gian:** mọi thao tác nộp, sửa, xin thêm chỉ làm được **đến hết deadline** và khi kỳ chưa chốt.

**Sau khi chốt kỳ – khối Kết quả**
| Kết quả | Hiển thị |
|---|---|
| Không đạt | **Không đạt – A1** + danh sách task còn thiếu (hệ thống tự liệt kê) |
| Đạt | **Đạt – B** |
| Vượt chỉ tiêu | **Vượt chỉ tiêu – A1** + danh sách task đã làm vượt |

Luôn hiện **cả hai**: kết quả thực hiện + xếp loại đăng ký. Không gộp, không hạ bậc.
GV chỉ thấy **kết quả cuối cùng**, không thấy chi tiết duyệt của trưởng khoa, hiệu phó, hiệu trưởng.

### 5.3 Nhận giấy tờ
- Danh sách giấy tờ/quyết định hiệu trưởng gửi cho GV này: tiêu đề, ngày gửi, nhãn **Mới** nếu chưa xem.
- Mở ra: nội dung + file đính kèm (xem/tải).
- Lần đầu mở → ghi nhận **đã xem** (hiệu trưởng thấy được).

---

## 6. Tài khoản ADMIN

Menu v1.1: **Quản lý đăng nhập** | **Phân việc đầu kỳ** | **Nhận chỉ thị của hiệu trưởng** | **Xem cấu hình**
(5 mục + HGT sẽ bổ sung ở bản sau, **không làm** ở v1.1.)

### 6.1 Quản lý đăng nhập
**Bảng**
| Tên đăng nhập | Chức vụ | Tên người | Mật khẩu | Sửa |
|---|---|---|---|---|

- Tìm kiếm theo tên, lọc theo chức vụ.
- **Thêm tài khoản:** nhập họ tên + chọn chức vụ (mọi cấp) → tên đăng nhập tự sinh (xem trước trước khi lưu), mật khẩu `123456`.
- **Sửa:** đổi họ tên, **lên/xuống chức** (đổi chức vụ → đổi tiền tố tên đăng nhập), đặt lại mật khẩu.
- **Xóa:** xóa hẳn, có hộp xác nhận ghi rõ *"Xóa sẽ mất toàn bộ dữ liệu KPI của tài khoản này"*.
- Không cho admin tự xóa hoặc tự hạ chức chính mình.

### 6.2 Phân việc đầu kỳ
**Quản lý kỳ**
- Tạo kỳ: tên (vd "Kỳ 1 – 2026-2027"), năm học, kỳ số (1–4), ngày bắt đầu, ngày kết thúc.
- **Sao chép từ kỳ trước:** copy toàn bộ nhiệm vụ, task, bảng xếp loại sang kỳ mới.
- Nút **Công bố** (GV mới thấy kỳ).
- Được sửa ngày bắt đầu/kết thúc (để demo mô phỏng hết hạn).
- Nút **Chốt kỳ ngay** (demo): chạy chốt kỳ không cần chờ deadline.

**Nhiệm vụ và task**
- Thêm/sửa/xóa nhiệm vụ: tên, mô tả, điểm, thứ tự.
- Trong mỗi nhiệm vụ thêm/sửa/xóa task: tên, mô tả, loại (Bắt buộc/Mở rộng), thứ tự.
- **Không cho xóa** nhiệm vụ/task đã có GV đăng ký hoặc đang làm. Sửa chữ thì được.

**Bảng xếp loại**
- Danh sách bậc: tên bậc + điểm tối thiểu. Admin tự nhập số bậc và ngưỡng.

### 6.3 Nhận chỉ thị của hiệu trưởng
- Danh sách giấy tờ hiệu trưởng gửi có tick chọn admin. **Chỉ đọc** (xem nội dung, tải file). Ghi nhận đã xem như GV.

### 6.4 Xem cấu hình (chỉ xem)
Các tab, **không sửa được bài GV đã nộp**:
- Kỳ và bảng xếp loại
- Tài khoản
- Đăng ký nhiệm vụ của từng GV (trạng thái, tổng điểm, xếp loại)
- Tiến độ task và minh chứng của từng GV (mở xem/tải file)
- Kết quả các kỳ
- Giấy tờ đã ban hành + ai đã xem

---

## 7. Tài khoản TRƯỞNG BỘ MÔN (tối giản)

Chỉ thấy GV thuộc bộ môn của mình.

- **Duyệt đăng ký:** danh sách GV có đăng ký Chờ duyệt → xem các nhiệm vụ đã chọn, tổng điểm, xếp loại → **Duyệt** hoặc **Từ chối** (bắt buộc nhập nhận xét khi từ chối). Duyệt/từ chối **cả danh sách**.
- **Duyệt task:** danh sách lần nộp Chờ duyệt → xem file, ghi chú, link → **Duyệt** / **Từ chối** + nhận xét.
- **Duyệt xin thêm task:** danh sách yêu cầu → Duyệt / Từ chối + nhận xét.
- **Kết quả kỳ:** sau khi chốt, bảng kết quả từng GV (kết quả, xếp loại, %, task thiếu/vượt).
- **Nhận giấy tờ:** như GV.
- Luật thời gian: mọi thao tác duyệt chỉ làm được **đến hết deadline** kỳ. Hết deadline mà còn Chờ duyệt → không duyệt được nữa (tính là chưa xong).

---

## 8. Tài khoản HIỆU TRƯỞNG (tối giản)

- **Ban hành giấy tờ:** tiêu đề, nội dung, file đính kèm (cùng giới hạn file như minh chứng) → danh sách **mọi tài khoản** có ô tick, lọc theo chức vụ, "Chọn tất cả" → **Gửi**.
  - Người nhận là GV/TBM/TK/HP → vào mục **Nhận giấy tờ**.
  - Người nhận là Admin → vào mục **Nhận chỉ thị của hiệu trưởng**.
- **Đã ban hành:** danh sách giấy tờ đã gửi, mỗi cái có **"x/y đã xem"**, bấm vào thấy ai đã xem, ai chưa.

**Trưởng khoa, Hiệu phó:** chỉ có mục **Nhận giấy tờ** + trang "Đang phát triển".

---

## 9. Quy tắc tính toán và thời gian

### 9.1 Thời gian (múi giờ Asia/Ho_Chi_Minh)
```
hanDangKy(ky) = cuối ngày ky.ngayBatDau (23:59:59)
deadline(ky)  = cuối ngày ky.ngayKetThuc (23:59:59)
```
| Hành động | Điều kiện |
|---|---|
| GV gửi đăng ký lần đầu | trạng thái Nháp và now ≤ hanDangKy |
| GV sửa + gửi lại sau khi bị từ chối | trạng thái Bị từ chối và now ≤ deadline |
| TBM duyệt/từ chối đăng ký | now ≤ deadline |
| GV nộp/sửa minh chứng, xin thêm task | now ≤ deadline và kỳ chưa chốt |
| TBM duyệt task, duyệt xin thêm | now ≤ deadline và kỳ chưa chốt |

**Kỳ hiện tại** = kỳ đã công bố, chưa chốt, có ngày bắt đầu gần nhất ≤ hôm nay; nếu không có thì lấy kỳ sắp tới gần nhất.

### 9.2 Xếp loại đăng ký
```
tongDiem = tổng điểm các nhiệm vụ đã chọn
xepLoai  = bậc có diemToiThieu lớn nhất mà tongDiem ≥ diemToiThieu
           (không đủ bậc nào → bậc thấp nhất)
```
Tính lại khi GV gửi và khi TBM duyệt.

### 9.3 Chốt kỳ và kết quả
Hàm `chotKy(kyId)`, chạy bởi:
- **Railway Cron** mỗi ngày lúc 00:05 gọi `POST /api/cron/chot-ky` (header `CRON_SECRET`): chốt mọi kỳ đã quá deadline mà chưa chốt.
- Nút **Chốt kỳ ngay** của admin.

Với **mỗi tài khoản GV**:
```
nếu không có đăng ký, hoặc đăng ký chưa ở trạng thái Đã duyệt:
    ketQua = KHONG_DAT, xepLoai = bậc thấp nhất, phanTram = 0
    ghi chú: "Chưa có danh sách nhiệm vụ được duyệt"
ngược lại:
    batBuoc  = task bắt buộc của GV trong kỳ
    daDuyet  = batBuoc có trạng thái Đã duyệt
    phanTram = daDuyet / batBuoc * 100
    taskVuot = task mở rộng của GV có trạng thái Đã duyệt
    nếu phanTram < 100  → KHONG_DAT, taskThieu = batBuoc chưa Đã duyệt
    nếu = 100 và có taskVuot → VUOT
    còn lại → DAT
    xepLoai = xepLoai của đăng ký
```
Lưu vào `KetQuaKy`, đặt `ky.daChot = true`, gửi thông báo cho GV và TBM. Sau khi chốt, mọi thao tác trong kỳ đó bị khóa.

---

## 10. Thông báo (trong web)

Chuông ở header, số chưa đọc, bấm vào đi tới trang liên quan.

| Sự kiện | Người nhận |
|---|---|
| GV gửi đăng ký / nộp task / xin thêm task | TBM |
| Đăng ký được duyệt / bị từ chối | GV |
| Task được duyệt / bị từ chối | GV |
| Yêu cầu xin thêm được duyệt / bị từ chối | GV |
| Còn 3 ngày đến hạn đăng ký, còn 7 ngày đến deadline (chạy cùng cron) | GV |
| Kỳ đã chốt, có kết quả | GV, TBM |
| Có giấy tờ mới | Người được tick |

---

## 11. Dữ liệu

### 11.1 Prisma schema (Claude Code được chỉnh chi tiết, giữ ý nghĩa)

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
  DA_DUYET
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

model Khoa {
  id     String  @id @default(cuid())
  ten    String
  boMons BoMon[]
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
  createdAt         DateTime @default(now())

  dangKys     DangKy[]
  gvTasks     GvTask[]
  yeuCaus     YeuCauThemTask[]
  ketQuas     KetQuaKy[]
  vanBanDaGui VanBan[]
  vanBanNhan  VanBanNguoiNhan[]
  thongBaos   ThongBao[]
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
  gvTasks     GvTask[]
  ketQuas     KetQuaKy[]
}

model BacXepLoai {
  id           String @id @default(cuid())
  kyId         String
  ky           Ky     @relation(fields: [kyId], references: [id], onDelete: Cascade)
  ten          String
  diemToiThieu Int
}

model NhiemVu {
  id      String          @id @default(cuid())
  kyId    String
  ky      Ky              @relation(fields: [kyId], references: [id], onDelete: Cascade)
  ten     String
  moTa    String?
  diem    Int
  thuTu   Int             @default(0)
  tasks   Task[]
  dangKys DangKyNhiemVu[]
}

model Task {
  id        String           @id @default(cuid())
  nhiemVuId String
  nhiemVu   NhiemVu          @relation(fields: [nhiemVuId], references: [id], onDelete: Cascade)
  ten       String
  moTa      String?
  loai      LoaiTask         @default(BAT_BUOC)
  thuTu     Int              @default(0)
  gvTasks   GvTask[]
  yeuCaus   YeuCauThemTask[]
}

model DangKy {
  id           String          @id @default(cuid())
  kyId         String
  ky           Ky              @relation(fields: [kyId], references: [id], onDelete: Cascade)
  gvId         String
  gv           User            @relation(fields: [gvId], references: [id], onDelete: Cascade)
  trangThai    TrangThaiDangKy @default(NHAP)
  tongDiem     Int             @default(0)
  xepLoai      String?
  nhanXet      String?
  nguoiDuyetId String?
  nopLuc       DateTime?
  duyetLuc     DateTime?
  nhiemVus     DangKyNhiemVu[]

  @@unique([kyId, gvId])
}

model DangKyNhiemVu {
  dangKyId  String
  dangKy    DangKy  @relation(fields: [dangKyId], references: [id], onDelete: Cascade)
  nhiemVuId String
  nhiemVu   NhiemVu @relation(fields: [nhiemVuId], references: [id], onDelete: Cascade)

  @@id([dangKyId, nhiemVuId])
}

model GvTask {
  id        String        @id @default(cuid())
  gvId      String
  gv        User          @relation(fields: [gvId], references: [id], onDelete: Cascade)
  kyId      String
  ky        Ky            @relation(fields: [kyId], references: [id], onDelete: Cascade)
  taskId    String
  task      Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  trangThai TrangThaiTask @default(CHUA_LAM)
  baiNops   BaiNop[]

  @@unique([gvId, taskId])
}

model BaiNop {
  id           String         @id @default(cuid())
  gvTaskId     String
  gvTask       GvTask         @relation(fields: [gvTaskId], references: [id], onDelete: Cascade)
  ghiChu       String?
  link         String?
  trangThai    TrangThaiDuyet @default(CHO_DUYET)
  nhanXet      String?
  nguoiDuyetId String?
  nopLuc       DateTime       @default(now())
  duyetLuc     DateTime?
  files        FileDinhKem[]
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
  gvId         String
  gv           User           @relation(fields: [gvId], references: [id], onDelete: Cascade)
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
  gvId      String
  gv        User     @relation(fields: [gvId], references: [id], onDelete: Cascade)
  phanTram  Float
  ketQua    KetQua
  xepLoai   String
  taskThieu Json
  taskVuot  Json
  ghiChu    String?
  chotLuc   DateTime @default(now())

  @@unique([kyId, gvId])
}

model VanBan {
  id         String            @id @default(cuid())
  tieuDe     String
  noiDung    String
  nguoiGuiId String?
  nguoiGui   User?             @relation(fields: [nguoiGuiId], references: [id], onDelete: SetNull)
  guiLuc     DateTime          @default(now())
  files      FileDinhKem[]
  nguoiNhans VanBanNguoiNhan[]
}

model VanBanNguoiNhan {
  vanBanId String
  vanBan   VanBan    @relation(fields: [vanBanId], references: [id], onDelete: Cascade)
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  daXemLuc DateTime?

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

**Ghi chú dữ liệu**
- Trạng thái của `GvTask` luôn đồng bộ với lần nộp mới nhất (`BaiNop`).
- GV sửa minh chứng khi Chờ duyệt = sửa lần nộp hiện tại. Bị từ chối rồi nộp lại = tạo `BaiNop` mới.
- File chỉ tải được qua route có kiểm tra quyền `GET /api/files/[id]`:
  - Minh chứng: GV chủ task, TBM cùng bộ môn, Admin.
  - Giấy tờ: người gửi, người nhận, Admin.

### 11.2 Ma trận quyền
| Hành động | ADMIN | GV | TBM | TK/HP | HT |
|---|---|---|---|---|---|
| Quản lý tài khoản | ✔ | | | | |
| Tạo kỳ, nhiệm vụ, task, bảng xếp loại | ✔ | | | | |
| Xem toàn bộ dữ liệu (chỉ xem) | ✔ | | | | |
| Đăng ký nhiệm vụ, nộp minh chứng, xin thêm task | | ✔ | | | |
| Duyệt đăng ký, task, xin thêm (bộ môn mình) | | | ✔ | | |
| Ban hành giấy tờ | | | | | ✔ |
| Nhận giấy tờ | ✔ (chỉ thị) | ✔ | ✔ | ✔ | |
| Sửa bài GV đã nộp | ✘ | | ✘ | | |

### 11.3 Seed dữ liệu demo (mật khẩu đều `123456`)
- 1 khoa: *Khoa Công nghệ thông tin*; 1 bộ môn: *Bộ môn Khoa học máy tính*.
- Tài khoản:
  - `admin.quantri` – Quản trị
  - `ht.nguyenvanhieu` – Hiệu trưởng
  - `hp.tranthiphuong` – Hiệu phó
  - `tk.levankhoa` – Trưởng khoa
  - `tbm.phamthibich` – Trưởng bộ môn
  - `gv.nguyenvanan`, `gv.tranthibinh`, `gv.levancuong` – Giáo viên
- 1 kỳ đã công bố: *Kỳ 1 – 2026-2027*, ngày bắt đầu = ngày chạy seed, ngày kết thúc = +30 ngày.
- 10 nhiệm vụ, điểm lần lượt **15, 12, 12, 10, 10, 10, 8, 8, 8, 7** (tổng 100). Mỗi nhiệm vụ 2–3 task bắt buộc + 1 task mở rộng. Nội dung mẫu (vd: "Biên soạn bài giảng", "Hướng dẫn sinh viên NCKH", "Công bố bài báo"…).
- Bảng xếp loại mẫu: **A1 ≥ 80, A2 ≥ 65, B ≥ 50, C ≥ 35, D ≥ 20, F ≥ 0**.

*(Nhiệm vụ, điểm, bảng xếp loại thật sẽ do admin nhập sau.)*

---

## 12. Thứ tự build

| Bước | Nội dung | Xong khi |
|---|---|---|
| 1 | Khởi tạo Next.js, Prisma, schema, seed, đăng nhập, layout + menu theo vai trò, chặn route theo vai trò | Đăng nhập được 8 tài khoản seed, mỗi người thấy đúng menu |
| 2 | Admin: Quản lý đăng nhập | Thêm/sửa/lên-xuống chức/đặt lại mật khẩu/xóa đúng quy tắc 2.2 |
| 3 | Admin: Phân việc đầu kỳ | Tạo kỳ, sao chép kỳ, công bố, CRUD nhiệm vụ/task/bảng xếp loại |
| 4 | GV Đầu kỳ + TBM Duyệt đăng ký | Chọn, gửi, bị từ chối, gửi lại, được duyệt; khóa đúng hạn |
| 5 | GV Cuối kỳ + TBM Duyệt task + Xin thêm task | Nộp, sửa, bị từ chối, nộp lại, duyệt; biểu đồ tròn đúng |
| 6 | Chốt kỳ + kết quả (cron + nút Chốt kỳ ngay) + TBM Kết quả kỳ | Kịch bản mục 14 ra đúng kết quả |
| 7 | HT Ban hành giấy tờ + Nhận giấy tờ (GV/TBM/TK/HP) + Admin Nhận chỉ thị | Gửi đúng người được tick, đếm đúng đã xem |
| 8 | Admin Xem cấu hình + Thông báo | Các tab chỉ xem, chuông thông báo chạy |
| 9 | Deploy Railway (app, Postgres, Volume, Cron) | Chạy được trên domain Railway |

---

## 13. Ngoài phạm vi v1.1

- 5 mục + HGT của Admin (bổ sung sau)
- Đặc tả đầy đủ TBM, Trưởng khoa, Hiệu phó, Hiệu trưởng và các cấp duyệt phía trên TBM
- Nhiều khoa/bộ môn, giao diện quản lý khoa/bộ môn
- Kiêm nhiệm (1 người nhiều vai trò)
- Đổi mật khẩu, chính sách bảo mật mật khẩu
- Thông báo qua email/Zalo
- Quy ước đặt tên tài liệu

---

## 14. Kịch bản nghiệm thu

**Chuẩn bị:** dùng seed. Đăng nhập admin, kiểm tra kỳ đã công bố.

| GV | Đăng ký | Thực hiện | Kết quả mong đợi |
|---|---|---|---|
| `gv.nguyenvanan` | Chọn cả 10 nhiệm vụ (100 điểm) | TBM duyệt ~50% task bắt buộc | **Không đạt – A1** + list task thiếu |
| `gv.tranthibinh` | Chọn nhiệm vụ 1, 2, 3 (39 điểm) | TBM duyệt 100% task bắt buộc | **Đạt – C** |
| `gv.levancuong` | Chọn nhiệm vụ 1–5 (59 điểm) | 100% bắt buộc + xin 2 task mở rộng, được duyệt, làm xong | **Vượt chỉ tiêu – B** + list 2 task vượt |

Cuối cùng admin bấm **Chốt kỳ ngay** và kiểm tra kết quả ở GV, TBM, Admin.

**Case phụ**
- [ ] Sửa ngày bắt đầu kỳ về hôm qua → GV chưa gửi đăng ký không gửi được nữa
- [ ] GV không đăng ký → chốt kỳ ra **Không đạt – F**, ghi chú "Chưa có danh sách nhiệm vụ được duyệt"
- [ ] TBM từ chối danh sách sau ngày bắt đầu → GV vẫn sửa và gửi lại được (trước deadline)
- [ ] TBM từ chối 1 task → GV thấy nhận xét → nộp lại → được duyệt; lịch sử có 2 lần nộp
- [ ] GV sửa minh chứng khi Chờ duyệt → được; khi Đã duyệt → bị chặn (cả ở API)
- [ ] Task còn Chờ duyệt khi chốt kỳ → tính chưa xong
- [ ] Sau khi chốt, mọi thao tác nộp/duyệt trong kỳ bị chặn
- [ ] Đổi `gv.tranthibinh` lên TBM → tên đăng nhập thành `tbm.tranthibinh`, đăng nhập bằng tên mới được
- [ ] Tạo GV trùng tên → tên đăng nhập có số `2`
- [ ] Admin không sửa được minh chứng của GV
- [ ] File > 20MB hoặc sai định dạng → báo lỗi
- [ ] HT gửi giấy tờ cho 2 GV + admin → đúng 3 người nhận; GV mở → HT thấy "1/3 đã xem"
- [ ] Người không có quyền mở link `/api/files/[id]` → bị chặn