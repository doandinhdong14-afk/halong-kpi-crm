import "server-only";
import { cookies } from "next/headers";
import { TEN_COOKIE, THOI_HAN_GIAY, docToken, kyToken } from "./jwt";

export async function taoPhien(userId: string) {
  const token = await kyToken(userId);
  (await cookies()).set(TEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THOI_HAN_GIAY,
  });
}

export async function xoaPhien() {
  (await cookies()).delete(TEN_COOKIE);
}

export async function userIdTuPhien(): Promise<string | null> {
  return docToken((await cookies()).get(TEN_COOKIE)?.value);
}
