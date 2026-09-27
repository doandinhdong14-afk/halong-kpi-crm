"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHanhDong } from "@/components/chung/use-hanh-dong";
import { luuBangXepLoai } from "../actions";

type Bac = { ten: string; diemToiThieu: number | string };

export function BangXepLoai({ kyId, bacs, khoa }: { kyId: string; bacs: Bac[]; khoa: boolean }) {
  const [dong, setDong] = useState<Bac[]>(bacs);
  const { pending, chay } = useHanhDong();

  function sua(i: number, moi: Partial<Bac>) {
    setDong((d) => d.map((b, j) => (j === i ? { ...b, ...moi } : b)));
  }

  return (
    <div className="max-w-xl space-y-3">
      <p className="text-sm text-muted-foreground">
        Xếp loại đăng ký = bậc cao nhất mà tổng điểm nhiệm vụ đã chọn ≥ điểm tối thiểu. Không đủ bậc nào → bậc thấp
        nhất.
      </p>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên bậc</TableHead>
              <TableHead>Điểm tối thiểu</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dong.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Chưa có bậc nào.
                </TableCell>
              </TableRow>
            )}
            {dong.map((b, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Input
                    aria-label={`Tên bậc ${i + 1}`}
                    value={b.ten}
                    onChange={(e) => sua(i, { ten: e.target.value })}
                    disabled={khoa}
                    maxLength={20}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Điểm tối thiểu ${i + 1}`}
                    type="number"
                    min={0}
                    value={b.diemToiThieu}
                    onChange={(e) => sua(i, { diemToiThieu: e.target.value })}
                    disabled={khoa}
                  />
                </TableCell>
                <TableCell>
                  {!khoa && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Xóa bậc ${i + 1}`}
                      onClick={() => setDong((d) => d.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!khoa && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDong((d) => [...d, { ten: "", diemToiThieu: "" }])}>
            <Plus className="size-4" /> Thêm bậc
          </Button>
          <Button
            disabled={pending}
            onClick={() => chay(() => luuBangXepLoai({ kyId, bacs: dong }), { thanhCong: "Đã lưu bảng xếp loại." })}
          >
            Lưu bảng xếp loại
          </Button>
        </div>
      )}
    </div>
  );
}
