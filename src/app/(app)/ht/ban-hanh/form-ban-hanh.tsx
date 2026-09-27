"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPT_FILE, hienKichThuoc, lyDoFileKhongHopLe, SO_FILE_TOI_DA } from "@/lib/files";
import { TEN_VAI_TRO } from "@/lib/roles";

type NguoiNhan = { id: string; hoTen: string; username: string; role: Role };
const TAT_CA = "tat-ca";

export function FormBanHanh({ users }: { users: NguoiNhan[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tieuDe, setTieuDe] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [chon, setChon] = useState<Set<string>>(new Set());
  const [loc, setLoc] = useState<string>(TAT_CA);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);

  const hienThi = useMemo(() => (loc === TAT_CA ? users : users.filter((u) => u.role === loc)), [users, loc]);
  const chonHetDangHien = hienThi.length > 0 && hienThi.every((u) => chon.has(u.id));
  const vaiTroCo = [...new Set(users.map((u) => u.role))];

  function doiChon(id: string, co: boolean) {
    setChon((s) => {
      const n = new Set(s);
      if (co) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  function chonTatCa(co: boolean) {
    setChon((s) => {
      const n = new Set(s);
      hienThi.forEach((u) => (co ? n.add(u.id) : n.delete(u.id)));
      return n;
    });
  }

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const loiKhac =
      (!tieuDe.trim() ? "Vui lòng nhập tiêu đề." : null) ??
      (!noiDung.trim() ? "Vui lòng nhập nội dung." : null) ??
      files.map(lyDoFileKhongHopLe).find(Boolean) ??
      (files.length > SO_FILE_TOI_DA ? `Tối đa ${SO_FILE_TOI_DA} file.` : null) ??
      (chon.size === 0 ? "Vui lòng chọn ít nhất 1 người nhận." : null);
    if (loiKhac) {
      setLoi(loiKhac);
      return;
    }
    setLoi(null);
    const fd = new FormData();
    fd.append("tieuDe", tieuDe);
    fd.append("noiDung", noiDung);
    files.forEach((f) => fd.append("files", f));
    chon.forEach((id) => fd.append("nguoiNhanIds", id));

    setDangGui(true);
    try {
      const res = await fetch("/api/van-ban", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(body.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
        return;
      }
      toast.success(`Đã gửi giấy tờ cho ${body.soNguoiNhan} người.`);
      router.push("/ht/da-ban-hanh");
    } catch {
      setLoi("Không gửi được, vui lòng kiểm tra kết nối.");
    } finally {
      setDangGui(false);
    }
  }

  return (
    <form onSubmit={gui} className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nội dung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tieuDe">Tiêu đề</Label>
            <Input id="tieuDe" value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} maxLength={300} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noiDung">Nội dung</Label>
            <Textarea id="noiDung" value={noiDung} onChange={(e) => setNoiDung(e.target.value)} rows={8} maxLength={20000} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="files">File đính kèm (không bắt buộc)</Label>
            <Input
              ref={inputRef}
              id="files"
              type="file"
              multiple
              accept={ACCEPT_FILE}
              onChange={(e) => {
                // Lấy danh sách ngay (trước khi xóa input), không đặt trong updater chạy trễ.
                const moi = Array.from(e.target.files ?? []);
                setFiles((f) => [...f, ...moi]);
                if (inputRef.current) inputRef.current.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC/DOCX, XLS/XLSX · tối đa 20MB/file.</p>
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-sm">
                <span>{f.name}</span>
                <span className="text-xs text-muted-foreground">{hienKichThuoc(f.size)}</span>
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Bỏ chọn ${f.name}`} onClick={() => setFiles((d) => d.filter((_, j) => j !== i))}>
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            Người nhận <span className="font-normal text-muted-foreground">(đã chọn {chon.size})</span>
          </CardTitle>
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="w-48" aria-label="Lọc theo chức vụ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TAT_CA}>Tất cả chức vụ</SelectItem>
              {vaiTroCo.map((r) => (
                <SelectItem key={r} value={r}>
                  {TEN_VAI_TRO[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={chonHetDangHien} onCheckedChange={(v) => chonTatCa(v === true)} aria-label="Chọn tất cả" />
                  </TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Chức vụ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hienThi.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Checkbox checked={chon.has(u.id)} onCheckedChange={(v) => doiChon(u.id, v === true)} aria-label={`Chọn ${u.username}`} />
                    </TableCell>
                    <TableCell>{u.hoTen}</TableCell>
                    <TableCell className="font-mono text-xs">{u.username}</TableCell>
                    <TableCell>{TEN_VAI_TRO[u.role]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 xl:col-span-2">
        <Button type="submit" disabled={dangGui}>
          <Send className="size-4" /> {dangGui ? "Đang gửi…" : "Gửi"}
        </Button>
        {loi && (
          <p className="text-sm text-destructive" role="alert">
            {loi}
          </p>
        )}
      </div>
    </form>
  );
}
