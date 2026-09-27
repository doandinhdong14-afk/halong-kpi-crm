"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

// Giao diện chuông hoàn thiện ở bước 8.
export function ChuongThongBao() {
  return (
    <Button variant="ghost" size="icon" aria-label="Thông báo">
      <Bell className="size-5" />
    </Button>
  );
}
