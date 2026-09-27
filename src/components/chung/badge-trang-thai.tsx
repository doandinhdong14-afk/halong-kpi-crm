import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAU: Record<string, string> = {
  NHAP: "bg-muted text-muted-foreground",
  CHUA_LAM: "bg-muted text-muted-foreground",
  CHO_DUYET: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  TU_CHOI: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  DA_DUYET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
};

export function BadgeTrangThai({ trangThai, nhan, className }: { trangThai: string; nhan: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", MAU[trangThai], className)} data-trang-thai={trangThai}>
      {nhan}
    </Badge>
  );
}
