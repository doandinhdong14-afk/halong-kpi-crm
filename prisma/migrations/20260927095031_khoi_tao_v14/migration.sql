-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GV', 'TBM', 'TK', 'HP', 'HT');

-- CreateEnum
CREATE TYPE "DoiTuong" AS ENUM ('GV', 'TBM', 'TK', 'HP');

-- CreateEnum
CREATE TYPE "LoaiTask" AS ENUM ('BAT_BUOC', 'MO_RONG');

-- CreateEnum
CREATE TYPE "TrangThaiDangKy" AS ENUM ('NHAP', 'CHO_DUYET', 'TU_CHOI', 'DA_DUYET');

-- CreateEnum
CREATE TYPE "TrangThaiTask" AS ENUM ('CHUA_LAM', 'CHO_DUYET', 'TU_CHOI', 'DA_DUYET', 'CHO_CHOT', 'DA_CHOT', 'TRA_VE');

-- CreateEnum
CREATE TYPE "TrangThaiDuyet" AS ENUM ('CHO_DUYET', 'TU_CHOI', 'DA_DUYET');

-- CreateEnum
CREATE TYPE "KetQua" AS ENUM ('KHONG_DAT', 'DAT', 'VUOT');

-- CreateEnum
CREATE TYPE "HanhDongTask" AS ENUM ('NOP', 'SUA_BAI_NOP', 'DUYET', 'TU_CHOI', 'HUY_DUYET', 'GUI_CHOT', 'CHOT', 'TRA_VE');

-- CreateTable
CREATE TABLE "Khoa" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "hieuPhoId" TEXT,

    CONSTRAINT "Khoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoMon" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "khoaId" TEXT NOT NULL,

    CONSTRAINT "BoMon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isDefaultPassword" BOOLEAN NOT NULL DEFAULT true,
    "boMonId" TEXT,
    "khoaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ky" (
    "id" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "namHoc" TEXT NOT NULL,
    "soKy" INTEGER NOT NULL,
    "ngayBatDau" DATE NOT NULL,
    "ngayKetThuc" DATE NOT NULL,
    "daCongBo" BOOLEAN NOT NULL DEFAULT false,
    "daChot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ky_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacXepLoai" (
    "id" TEXT NOT NULL,
    "kyId" TEXT NOT NULL,
    "doiTuong" "DoiTuong" NOT NULL,
    "ten" TEXT NOT NULL,
    "diemToiThieu" INTEGER NOT NULL,

    CONSTRAINT "BacXepLoai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NhiemVu" (
    "id" TEXT NOT NULL,
    "kyId" TEXT NOT NULL,
    "doiTuong" "DoiTuong" NOT NULL,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,
    "diem" INTEGER NOT NULL,
    "thuTu" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NhiemVu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "nhiemVuId" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,
    "loai" "LoaiTask" NOT NULL DEFAULT 'BAT_BUOC',
    "thuTu" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DangKy" (
    "id" TEXT NOT NULL,
    "kyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trangThai" "TrangThaiDangKy" NOT NULL DEFAULT 'NHAP',
    "tongDiem" INTEGER NOT NULL DEFAULT 0,
    "xepLoai" TEXT,
    "nhanXet" TEXT,
    "nguoiDuyetId" TEXT,
    "nopLuc" TIMESTAMP(3),
    "duyetLuc" TIMESTAMP(3),

    CONSTRAINT "DangKy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DangKyNhiemVu" (
    "dangKyId" TEXT NOT NULL,
    "nhiemVuId" TEXT NOT NULL,

    CONSTRAINT "DangKyNhiemVu_pkey" PRIMARY KEY ("dangKyId","nhiemVuId")
);

-- CreateTable
CREATE TABLE "KpiTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kyId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "trangThai" "TrangThaiTask" NOT NULL DEFAULT 'CHUA_LAM',
    "nhanXetChot" TEXT,
    "nguoiChotId" TEXT,
    "guiChotLuc" TIMESTAMP(3),
    "chotLuc" TIMESTAMP(3),
    "capNhatLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaiNop" (
    "id" TEXT NOT NULL,
    "kpiTaskId" TEXT NOT NULL,
    "ghiChu" TEXT,
    "link" TEXT,
    "trangThai" "TrangThaiDuyet" NOT NULL DEFAULT 'CHO_DUYET',
    "nhanXet" TEXT,
    "nguoiDuyetId" TEXT,
    "nopLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duyetLuc" TIMESTAMP(3),

    CONSTRAINT "BaiNop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LichSuTask" (
    "id" TEXT NOT NULL,
    "kpiTaskId" TEXT NOT NULL,
    "hanhDong" "HanhDongTask" NOT NULL,
    "nguoiThucHienId" TEXT,
    "nhanXet" TEXT,
    "luc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LichSuTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileDinhKem" (
    "id" TEXT NOT NULL,
    "tenGoc" TEXT NOT NULL,
    "duongDan" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kichThuoc" INTEGER NOT NULL,
    "baiNopId" TEXT,
    "vanBanId" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileDinhKem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YeuCauThemTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kyId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "trangThai" "TrangThaiDuyet" NOT NULL DEFAULT 'CHO_DUYET',
    "nhanXet" TEXT,
    "nguoiDuyetId" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duyetLuc" TIMESTAMP(3),

    CONSTRAINT "YeuCauThemTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KetQuaKy" (
    "id" TEXT NOT NULL,
    "kyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doiTuong" "DoiTuong" NOT NULL,
    "phanTram" DOUBLE PRECISION NOT NULL,
    "ketQua" "KetQua" NOT NULL,
    "xepLoai" TEXT NOT NULL,
    "taskThieu" JSONB NOT NULL,
    "taskVuot" JSONB NOT NULL,
    "soTreo" INTEGER NOT NULL DEFAULT 0,
    "ghiChu" TEXT,
    "chotLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KetQuaKy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VanBan" (
    "id" TEXT NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "viTriNhan" "Role"[],
    "nguoiGuiId" TEXT,
    "guiLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VanBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VanBanDaXem" (
    "vanBanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "daXemLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VanBanDaXem_pkey" PRIMARY KEY ("vanBanId","userId")
);

-- CreateTable
CREATE TABLE "ThongBao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "link" TEXT,
    "daDoc" BOOLEAN NOT NULL DEFAULT false,
    "maSuKien" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThongBao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Ky_namHoc_soKy_key" ON "Ky"("namHoc", "soKy");

-- CreateIndex
CREATE UNIQUE INDEX "BacXepLoai_kyId_doiTuong_ten_key" ON "BacXepLoai"("kyId", "doiTuong", "ten");

-- CreateIndex
CREATE INDEX "NhiemVu_kyId_doiTuong_idx" ON "NhiemVu"("kyId", "doiTuong");

-- CreateIndex
CREATE INDEX "DangKy_kyId_trangThai_idx" ON "DangKy"("kyId", "trangThai");

-- CreateIndex
CREATE UNIQUE INDEX "DangKy_kyId_userId_key" ON "DangKy"("kyId", "userId");

-- CreateIndex
CREATE INDEX "KpiTask_kyId_userId_idx" ON "KpiTask"("kyId", "userId");

-- CreateIndex
CREATE INDEX "KpiTask_kyId_trangThai_idx" ON "KpiTask"("kyId", "trangThai");

-- CreateIndex
CREATE UNIQUE INDEX "KpiTask_userId_taskId_key" ON "KpiTask"("userId", "taskId");

-- CreateIndex
CREATE INDEX "BaiNop_kpiTaskId_idx" ON "BaiNop"("kpiTaskId");

-- CreateIndex
CREATE INDEX "LichSuTask_kpiTaskId_idx" ON "LichSuTask"("kpiTaskId");

-- CreateIndex
CREATE INDEX "YeuCauThemTask_kyId_trangThai_idx" ON "YeuCauThemTask"("kyId", "trangThai");

-- CreateIndex
CREATE UNIQUE INDEX "KetQuaKy_kyId_userId_key" ON "KetQuaKy"("kyId", "userId");

-- CreateIndex
CREATE INDEX "ThongBao_userId_daDoc_idx" ON "ThongBao"("userId", "daDoc");

-- CreateIndex
CREATE UNIQUE INDEX "ThongBao_userId_maSuKien_key" ON "ThongBao"("userId", "maSuKien");

-- AddForeignKey
ALTER TABLE "Khoa" ADD CONSTRAINT "Khoa_hieuPhoId_fkey" FOREIGN KEY ("hieuPhoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoMon" ADD CONSTRAINT "BoMon_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_boMonId_fkey" FOREIGN KEY ("boMonId") REFERENCES "BoMon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacXepLoai" ADD CONSTRAINT "BacXepLoai_kyId_fkey" FOREIGN KEY ("kyId") REFERENCES "Ky"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhiemVu" ADD CONSTRAINT "NhiemVu_kyId_fkey" FOREIGN KEY ("kyId") REFERENCES "Ky"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_nhiemVuId_fkey" FOREIGN KEY ("nhiemVuId") REFERENCES "NhiemVu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKy" ADD CONSTRAINT "DangKy_kyId_fkey" FOREIGN KEY ("kyId") REFERENCES "Ky"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKy" ADD CONSTRAINT "DangKy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKyNhiemVu" ADD CONSTRAINT "DangKyNhiemVu_dangKyId_fkey" FOREIGN KEY ("dangKyId") REFERENCES "DangKy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKyNhiemVu" ADD CONSTRAINT "DangKyNhiemVu_nhiemVuId_fkey" FOREIGN KEY ("nhiemVuId") REFERENCES "NhiemVu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiTask" ADD CONSTRAINT "KpiTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiTask" ADD CONSTRAINT "KpiTask_kyId_fkey" FOREIGN KEY ("kyId") REFERENCES "Ky"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiTask" ADD CONSTRAINT "KpiTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaiNop" ADD CONSTRAINT "BaiNop_kpiTaskId_fkey" FOREIGN KEY ("kpiTaskId") REFERENCES "KpiTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LichSuTask" ADD CONSTRAINT "LichSuTask_kpiTaskId_fkey" FOREIGN KEY ("kpiTaskId") REFERENCES "KpiTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileDinhKem" ADD CONSTRAINT "FileDinhKem_baiNopId_fkey" FOREIGN KEY ("baiNopId") REFERENCES "BaiNop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileDinhKem" ADD CONSTRAINT "FileDinhKem_vanBanId_fkey" FOREIGN KEY ("vanBanId") REFERENCES "VanBan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YeuCauThemTask" ADD CONSTRAINT "YeuCauThemTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YeuCauThemTask" ADD CONSTRAINT "YeuCauThemTask_kyId_fkey" FOREIGN KEY ("kyId") REFERENCES "Ky"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YeuCauThemTask" ADD CONSTRAINT "YeuCauThemTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KetQuaKy" ADD CONSTRAINT "KetQuaKy_kyId_fkey" FOREIGN KEY ("kyId") REFERENCES "Ky"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KetQuaKy" ADD CONSTRAINT "KetQuaKy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VanBan" ADD CONSTRAINT "VanBan_nguoiGuiId_fkey" FOREIGN KEY ("nguoiGuiId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VanBanDaXem" ADD CONSTRAINT "VanBanDaXem_vanBanId_fkey" FOREIGN KEY ("vanBanId") REFERENCES "VanBan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VanBanDaXem" ADD CONSTRAINT "VanBanDaXem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThongBao" ADD CONSTRAINT "ThongBao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
