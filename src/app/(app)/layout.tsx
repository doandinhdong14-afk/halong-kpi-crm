import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { yeuCauVaiTro } from "@/lib/auth/dal";
import { MENU } from "@/lib/menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await yeuCauVaiTro();
  return (
    <>
      <AppHeader user={user} />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="border-b bg-background p-3 md:w-60 md:shrink-0 md:border-b-0 md:border-r">
          <AppSidebar menu={MENU[user.role]} />
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </>
  );
}
