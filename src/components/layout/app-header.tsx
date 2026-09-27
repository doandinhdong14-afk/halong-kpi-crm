import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dangXuat } from "@/app/dang-nhap/actions";
import { TEN_VAI_TRO } from "@/lib/roles";
import type { NguoiDung } from "@/lib/auth/dal";
import { ChuongThongBao } from "./chuong-thong-bao";

export function AppHeader({ user }: { user: NguoiDung }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <div className="font-semibold">CRM KPI giáo viên – ĐH Hạ Long</div>
        <div className="flex items-center gap-3">
          <ChuongThongBao />
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{user.hoTen}</div>
            <div className="text-xs text-muted-foreground">
              {TEN_VAI_TRO[user.role]} · {user.username}
            </div>
          </div>
          <form action={dangXuat}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" /> Đăng xuất
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
