import { vi } from "vitest";
import { phien } from "./helpers";

// Giả lập phiên đăng nhập: dal.ts vẫn đọc user thật từ DB theo id này.
vi.mock("@/lib/auth/session", () => ({
  userIdTuPhien: async () => phien.userId,
  taoPhien: async () => {},
  xoaPhien: async () => {},
}));

// Server action gọi refresh()/revalidatePath() → bỏ qua khi test ngoài Next.
vi.mock("next/cache", () => ({ refresh: () => {}, revalidatePath: () => {}, revalidateTag: () => {} }));
