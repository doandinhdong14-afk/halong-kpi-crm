import { TrangTieuDe } from "./trang-tieu-de";

export function TrangTam({ tieuDe, buoc }: { tieuDe: string; buoc: number }) {
  return (
    <div>
      <TrangTieuDe tieuDe={tieuDe} />
      <p className="text-muted-foreground">Chức năng này sẽ được hoàn thiện ở bước {buoc}.</p>
    </div>
  );
}
