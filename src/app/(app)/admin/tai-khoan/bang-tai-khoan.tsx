"use client";

import { Trash2 } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHanhDong } from "@/components/chung/use-hanh-dong";
import { TEN_VAI_TRO } from "@/lib/roles";
import { xoaTaiKhoan } from "./actions";
import { DialogTaiKhoan, type KhoaChon } from "./dialog-tai-khoan";

type Dong = {
  id: string;
  username: string;
  hoTen: string;
  role: Role;
  isDefaultPassword: boolean;
  donVi: string | null;
  khoaPhuTrachIds: string[];
};

export function BangTaiKhoan({ users, adminId, khoas }: { users: Dong[]; adminId: string; khoas: KhoaChon[] }) {
  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên đăng nhập</TableHead>
            <TableHead>Chức vụ</TableHead>
            <TableHead>Tên người</TableHead>
            <TableHead>Mật khẩu</TableHead>
            <TableHead className="w-44">Sửa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Không có tài khoản nào.
              </TableCell>
            </TableRow>
          )}
          {users.map((u) => (
            <TableRow key={u.id} data-username={u.username}>
              <TableCell className="font-mono">{u.username}</TableCell>
              <TableCell>
                <div>{TEN_VAI_TRO[u.role]}</div>
                {u.donVi && <div className="text-xs text-muted-foreground" data-testid="don-vi">{u.donVi}</div>}
              </TableCell>
              <TableCell>{u.hoTen}</TableCell>
              <TableCell className="font-mono">{u.isDefaultPassword ? "123456" : "••••••"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <DialogTaiKhoan cheDo="sua" user={u} laChinhMinh={u.id === adminId} khoas={khoas} />
                  <NutXoa user={u} disabled={u.id === adminId} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NutXoa({ user, disabled }: { user: Dong; disabled: boolean }) {
  const { pending, chay } = useHanhDong();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          title={disabled ? "Không thể tự xóa tài khoản của chính mình" : undefined}
        >
          <Trash2 className="size-4" /> Xóa
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa tài khoản {user.username}?</AlertDialogTitle>
          <AlertDialogDescription>
            Xóa sẽ mất toàn bộ dữ liệu KPI của tài khoản này. Thao tác không thể hoàn tác.
            {user.role === "HP" && " Các khoa hiệu phó này phụ trách sẽ thành \"chưa có hiệu phó\"."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => chay(() => xoaTaiKhoan(user.id), { thanhCong: `Đã xóa tài khoản ${user.username}.` })}
          >
            Xóa hẳn
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
