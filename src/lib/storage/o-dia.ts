import "server-only";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import type { KhoFile } from "./index";

export class KhoFileODia implements KhoFile {
  private readonly goc: string;

  constructor(thuMuc: string) {
    this.goc = resolve(thuMuc);
  }

  private duongDan(khoa: string): string {
    const p = resolve(join(this.goc, khoa));
    if (!p.startsWith(this.goc + sep)) throw new Error("Khóa file không hợp lệ");
    return p;
  }

  async luu(noiDung: Buffer, duoi: string): Promise<string> {
    const now = new Date();
    const khoa = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}${duoi}`;
    const p = this.duongDan(khoa);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, noiDung);
    return khoa;
  }

  async doc(khoa: string) {
    const p = this.duongDan(khoa);
    const { size } = await stat(p);
    const stream = Readable.toWeb(createReadStream(p)) as ReadableStream<Uint8Array>;
    return { stream, kichThuoc: size };
  }

  async xoa(khoa: string): Promise<void> {
    await rm(this.duongDan(khoa), { force: true });
  }
}
